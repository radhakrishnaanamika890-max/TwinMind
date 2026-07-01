from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from core.config import settings
from mcp.mcp_server import MCPServer
from memory.token_store import get_provider_token
import os, requests, urllib.parse, secrets, json

router = APIRouter()

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
]

TOKEN_FILE = 'user_tokens.json'

def load_tokens():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_tokens(tokens):
    with open(TOKEN_FILE, 'w') as f:
        json.dump(tokens, f)

user_tokens = load_tokens()
state_store = {}

@router.get('/auth/google')
async def google_auth(user_id: str):
    state = secrets.token_urlsafe(16)
    state_store[state] = user_id
    params = {
        'client_id': settings.google_client_id,
        'redirect_uri': settings.google_redirect_uri,
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'prompt': 'consent',
        'state': state,
    }
    auth_url = 'https://accounts.google.com/o/oauth2/auth?' + urllib.parse.urlencode(params)
    return {'auth_url': auth_url}

@router.get('/auth/callback')
async def google_callback(code: str, state: str):
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    user_id = state_store.pop(state, state)
    token_response = requests.post(
        'https://oauth2.googleapis.com/token',
        data={
            'code': code,
            'client_id': settings.google_client_id,
            'client_secret': settings.google_client_secret,
            'redirect_uri': settings.google_redirect_uri,
            'grant_type': 'authorization_code',
        },
    )
    token_data = token_response.json()
    if 'error' in token_data:
        return {'error': token_data}
    user_tokens[user_id] = {
        'token': token_data.get('access_token'),
        'refresh_token': token_data.get('refresh_token'),
        'token_uri': 'https://oauth2.googleapis.com/token',
        'client_id': settings.google_client_id,
        'client_secret': settings.google_client_secret,
        'scopes': SCOPES,
    }
    save_tokens(user_tokens)
    return RedirectResponse('http://localhost:3000/dashboard?connected=true')

def get_credentials(user_id: str):
    token_data = user_tokens.get(user_id)
    if not token_data:
        return None
    google_fields = {'token', 'refresh_token', 'token_uri', 'client_id', 'client_secret', 'scopes'}
    clean_data = {k: v for k, v in token_data.items() if k in google_fields}
    if 'token' not in clean_data:
        return None
    return Credentials(**clean_data)

@router.get('/gmail/messages')
async def get_gmail_messages(user_id: str, max_results: int = 10):
    creds = get_credentials(user_id)
    if not creds:
        return {'error': 'Not connected. Visit /api/mcp/auth/google?user_id=' + user_id}
    service = build('gmail', 'v1', credentials=creds)
    results = service.users().messages().list(userId='me', maxResults=max_results).execute()
    messages = []
    for msg in results.get('messages', []):
        detail = service.users().messages().get(
            userId='me', id=msg['id'], format='metadata',
            metadataHeaders=['Subject', 'From', 'Date']
        ).execute()
        headers = {h['name']: h['value'] for h in detail['payload']['headers']}
        messages.append({
            'id': msg['id'],
            'subject': headers.get('Subject', ''),
            'from': headers.get('From', ''),
            'date': headers.get('Date', ''),
            'snippet': detail.get('snippet', ''),
        })
    return {'messages': messages}

@router.get('/calendar/events')
async def get_calendar_events(user_id: str, max_results: int = 10):
    creds = get_credentials(user_id)
    if not creds:
        return {'error': 'Not connected'}
    service = build('calendar', 'v3', credentials=creds)
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    events_result = service.events().list(
        calendarId='primary', timeMin=now,
        maxResults=max_results, singleEvents=True, orderBy='startTime',
    ).execute()
    return {
        'events': [
            {
                'id': e['id'],
                'summary': e.get('summary', 'No title'),
                'start': e['start'].get('dateTime', e['start'].get('date')),
                'end': e['end'].get('dateTime', e['end'].get('date')),
                'location': e.get('location', ''),
            }
            for e in events_result.get('items', [])
        ]
    }

@router.get('/drive/files')
async def get_drive_files(user_id: str, max_results: int = 10):
    creds = get_credentials(user_id)
    if not creds:
        return {'error': 'Not connected'}
    service = build('drive', 'v3', credentials=creds)
    results = service.files().list(
        pageSize=max_results,
        fields='files(id, name, mimeType, modifiedTime, webViewLink)',
        orderBy='modifiedTime desc',
    ).execute()
    return {'files': results.get('files', [])}

@router.get('/status')
async def mcp_status(user_id: str):
    connected = user_id in user_tokens
    return {'connected': connected, 'user_id': user_id}


# ---------------- GitHub (via MCPServer) ----------------

def get_mcp_server(user_id: str) -> MCPServer:
    """Builds an MCPServer instance with whatever credentials this user has connected."""
    credentials = {}

    # Existing Google token store (gmail/calendar/drive)
    google_token_data = user_tokens.get(user_id)
    if google_token_data:
        credentials['google'] = google_token_data

    # GitHub token store (from memory/token_store.py)
    github_token_data = get_provider_token(user_id, 'github')
    if github_token_data:
        credentials['github_token'] = github_token_data.get('access_token')

    return MCPServer(credentials)


@router.get('/github/repos')
async def get_github_repos(user_id: str):
    server = get_mcp_server(user_id)
    if not server.github:
        return {'error': 'GitHub not connected. Visit /api/auth/github/login?user_id=' + user_id}
    repos = await server.github.list_repos()
    return {'repos': repos}


@router.get('/github/issues')
async def get_github_issues(user_id: str, owner: str, repo: str):
    server = get_mcp_server(user_id)
    if not server.github:
        return {'error': 'GitHub not connected. Visit /api/auth/github/login?user_id=' + user_id}
    issues = await server.github.list_issues(owner, repo)
    return {'issues': issues}


@router.get('/services')
async def get_available_services(user_id: str):
    """Returns which integrations are connected for this user (used by chat/twin context building)."""
    server = get_mcp_server(user_id)
    return {'services': server.get_available_services()}

@router.get('/gmail/smart-reply')
async def get_smart_reply(user_id: str, message_id: str):
    """Generate an AI reply suggestion for a specific Gmail message."""
    creds = get_credentials(user_id)
    if not creds:
        return {'error': 'Not connected. Visit /api/mcp/auth/google?user_id=' + user_id}

    service = build('gmail', 'v1', credentials=creds)
    detail = service.users().messages().get(
        userId='me', id=message_id, format='full'
    ).execute()

    headers = {h['name']: h['value'] for h in detail['payload']['headers']}
    subject = headers.get('Subject', '')
    sender = headers.get('From', '')
    snippet = detail.get('snippet', '')

    # Extract body text (best-effort, handles simple + multipart emails)
    body = snippet
    payload = detail.get('payload', {})
    parts = payload.get('parts', [])
    if parts:
        for part in parts:
            if part.get('mimeType') == 'text/plain' and part.get('body', {}).get('data'):
                import base64
                body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                break
    elif payload.get('body', {}).get('data'):
        import base64
        body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')

    body = body[:1500]  # keep prompt small

    from agents.orchestrator import orchestrator
    prompt = (
        f"You are drafting a short, professional email reply on behalf of the user.\n\n"
        f"Original email from: {sender}\n"
        f"Subject: {subject}\n"
        f"Body:\n{body}\n\n"
        f"Write 2-3 short reply suggestions (numbered 1, 2, 3), each 1-3 sentences, "
        f"in a friendly but professional tone. Just the replies, no extra commentary."
    )

    reply = await orchestrator.handle(user_id, prompt)

    return {
        'message_id': message_id,
        'subject': subject,
        'from': sender,
        'suggestions': reply,
    }


@router.get('/github/pulls')
async def get_github_pulls(user_id: str, owner: str, repo: str, state: str = 'open'):
    server = get_mcp_server(user_id)
    if not server.github:
        return {'error': 'GitHub not connected. Visit /api/auth/github/login?user_id=' + user_id}
    prs = await server.github.list_pull_requests(owner, repo, state)
    return {'pull_requests': prs}


@router.get('/github/repo-summary')
async def get_github_repo_summary(user_id: str, owner: str, repo: str):
    """AI-summarized view of a repo's pending PRs and issues — used by chat."""
    server = get_mcp_server(user_id)
    if not server.github:
        return {'error': 'GitHub not connected. Visit /api/auth/github/login?user_id=' + user_id}

    data = await server.github.list_all_repo_prs(owner, repo)
    prs = data['pull_requests']
    issues = data['issues']

    if not prs and not issues:
        return {'summary': f'No open PRs or issues in {owner}/{repo} right now. All clear! ✅', 'pull_requests': [], 'issues': []}

    pr_lines = "\n".join(
        f"- PR #{p['number']}: \"{p['title']}\" by {p['author']} ({p['head']} → {p['base']}){' [DRAFT]' if p['draft'] else ''}"
        for p in prs
    ) or "None"
    issue_lines = "\n".join(
        f"- Issue: \"{i['title']}\" [{i['state']}]"
        for i in issues[:10]
    ) or "None"

    from agents.orchestrator import orchestrator
    prompt = (
        f"You are reviewing the repo {owner}/{repo} for the user. Here is the current state:\n\n"
        f"Open Pull Requests:\n{pr_lines}\n\n"
        f"Open Issues:\n{issue_lines}\n\n"
        f"Write a brief, friendly summary (3-5 sentences) highlighting what needs attention first, "
        f"any draft PRs, and overall repo health. Be concise and actionable."
    )
    summary = await orchestrator.handle(user_id, prompt)

    return {'summary': summary, 'pull_requests': prs, 'issues': issues}



@router.get('/search')
async def search_all(user_id: str, query: str):
    creds = get_credentials(user_id)
    if not creds:
        return {'error': 'Not connected', 'emails': [], 'events': [], 'files': []}

    query_lower = query.lower()
    results = {'emails': [], 'events': [], 'files': []}

    # Search Gmail
    try:
        service = build('gmail', 'v1', credentials=creds)
        gmail_results = service.users().messages().list(
            userId='me', q=query, maxResults=10
        ).execute()
        for msg in gmail_results.get('messages', []):
            detail = service.users().messages().get(
                userId='me', id=msg['id'], format='metadata',
                metadataHeaders=['Subject', 'From', 'Date']
            ).execute()
            headers = {h['name']: h['value'] for h in detail['payload']['headers']}
            results['emails'].append({
                'id': msg['id'],
                'subject': headers.get('Subject', ''),
                'from': headers.get('From', ''),
                'date': headers.get('Date', ''),
                'snippet': detail.get('snippet', ''),
            })
    except Exception as e:
        print('Gmail search error:', e)

    # Search Calendar
    try:
        service = build('calendar', 'v3', credentials=creds)
        from datetime import datetime, timezone, timedelta
        time_min = (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()
        time_max = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
        cal_results = service.events().list(
            calendarId='primary', timeMin=time_min, timeMax=time_max,
            q=query, maxResults=10, singleEvents=True, orderBy='startTime',
        ).execute()
        for e in cal_results.get('items', []):
            results['events'].append({
                'id': e['id'],
                'summary': e.get('summary', 'No title'),
                'start': e['start'].get('dateTime', e['start'].get('date')),
                'end': e['end'].get('dateTime', e['end'].get('date')),
                'location': e.get('location', ''),
            })
    except Exception as e:
        print('Calendar search error:', e)

    # Search Drive
    try:
        service = build('drive', 'v3', credentials=creds)
        drive_results = service.files().list(
           q=f"name contains '{query}'",
            pageSize=10,
            fields='files(id, name, mimeType, modifiedTime, webViewLink)',
            orderBy='modifiedTime desc',
        ).execute()
        results['files'] = drive_results.get('files', [])
    except Exception as e:
        print('Drive search error:', e)

    return results
