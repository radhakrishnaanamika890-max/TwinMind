from api.routes.mcp import user_tokens
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timezone

MCP_USER_ID = 'test123'

def get_creds():
    token_data = user_tokens.get(MCP_USER_ID)
    if not token_data:
        return None
    return Credentials(**token_data)

def get_gmail_context() -> str:
    try:
        creds = get_creds()
        if not creds:
            return ""
        service = build('gmail', 'v1', credentials=creds)
        results = service.users().messages().list(userId='me', maxResults=5).execute()
        messages = []
        for msg in results.get('messages', []):
            detail = service.users().messages().get(
                userId='me', id=msg['id'], format='metadata',
                metadataHeaders=['Subject', 'From', 'Date']
            ).execute()
            headers = {h['name']: h['value'] for h in detail['payload']['headers']}
            messages.append('- Subject: ' + headers.get('Subject', '') + ' | From: ' + headers.get('From', '') + ' | Date: ' + headers.get('Date', ''))
        if messages:
            return 'Recent Emails:\n' + '\n'.join(messages)
    except Exception as e:
        print('Gmail error:', e)
    return ''

def get_calendar_context() -> str:
    try:
        creds = get_creds()
        if not creds:
            return ''
        service = build('calendar', 'v3', credentials=creds)
        now = datetime.now(timezone.utc).isoformat()
        events_result = service.events().list(
            calendarId='primary', timeMin=now,
            maxResults=5, singleEvents=True, orderBy='startTime',
        ).execute()
        events = []
        for e in events_result.get('items', []):
            start = e['start'].get('dateTime', e['start'].get('date'))
            events.append('- ' + e.get('summary', 'No title') + ' at ' + str(start))
        if events:
            return 'Upcoming Calendar Events:\n' + '\n'.join(events)
    except Exception as e:
        print('Calendar error:', e)
    return ''
