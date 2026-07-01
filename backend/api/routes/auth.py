from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from core.config import settings
from memory.token_store import save_provider_token, get_provider_token, _read_all, _write_all

router = APIRouter()

profiles_db = {}
settings_db = {}

FRONTEND_URL = "https://radiant-contentment-production-686c.up.railway.app"

@router.post("/verify")
async def verify_token(req: dict):
    try:
        import firebase_admin
        from firebase_admin import auth, credentials
        if not firebase_admin._apps:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            firebase_admin.initialize_app(cred)
        decoded = auth.verify_id_token(req.get("id_token", ""))
        return {"user_id": decoded["uid"], "email": decoded.get("email", "")}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me")
async def get_me():
    return {"message": "Pass Firebase ID token to /auth/verify"}

@router.get("/profile")
async def get_profile(user_id: str = "guest"):
    return profiles_db.get(user_id, {"user_id": user_id, "name": "", "email": "", "bio": "", "avatar": ""})

@router.patch("/profile")
async def update_profile(data: dict):
    user_id = data.get("user_id", "guest")
    profiles_db[user_id] = {**profiles_db.get(user_id, {}), **data}
    return profiles_db[user_id]

@router.get("/settings")
async def get_settings(user_id: str = "guest"):
    return settings_db.get(user_id, {"user_id": user_id, "notifications": True, "language": "en", "theme": "dark", "ai_tone": "friendly", "memory_enabled": True})

@router.patch("/settings")
async def update_settings(data: dict):
    user_id = data.get("user_id", "guest")
    settings_db[user_id] = {**settings_db.get(user_id, {}), **data}
    return settings_db[user_id]

# ── GitHub OAuth ──────────────────────────────────────────────────────────────

@router.get("/github/login")
async def github_login(user_id: str):
    params = {"client_id": settings.github_client_id, "redirect_uri": settings.github_redirect_uri, "scope": "repo read:user user:email", "state": user_id}
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"https://github.com/login/oauth/authorize?{query}")

@router.get("/github/callback")
async def github_callback(code: str, state: str):
    user_id = state
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={"client_id": settings.github_client_id, "client_secret": settings.github_client_secret, "code": code, "redirect_uri": settings.github_redirect_uri},
        )
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="GitHub token exchange failed")
    save_provider_token(user_id, "github", {"access_token": access_token})
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard/settings?github=connected")

@router.get("/github/status")
async def github_status(user_id: str):
    token = get_provider_token(user_id, "github")
    return {"connected": token is not None}

@router.post("/github/disconnect")
async def github_disconnect(user_id: str):
    from memory.token_store import delete_provider_token
    delete_provider_token(user_id, "github")
    return {"connected": False}

@router.get("/github/user")
async def github_user(user_id: str):
    token_data = get_provider_token(user_id, "github")
    if not token_data:
        raise HTTPException(status_code=401, detail="GitHub not connected")
    access_token = token_data.get("access_token")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"}
            )
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="GitHub API error")
        return res.json()
    except httpx.ConnectTimeout:
        raise HTTPException(status_code=504, detail="GitHub API timeout")

@router.get("/github/repos")
async def github_repos(user_id: str):
    token_data = get_provider_token(user_id, "github")
    if not token_data:
        raise HTTPException(status_code=401, detail="GitHub not connected")
    access_token = token_data.get("access_token")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                "https://api.github.com/user/repos?sort=updated&per_page=6",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"}
            )
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="GitHub API error")
        return res.json()
    except httpx.ConnectTimeout:
        raise HTTPException(status_code=504, detail="GitHub API timeout")

# ── LinkedIn OAuth ────────────────────────────────────────────────────────────

@router.get("/linkedin/login")
async def linkedin_login(user_id: str):
    params = {"response_type": "code", "client_id": settings.linkedin_client_id, "redirect_uri": settings.linkedin_redirect_uri, "scope": "openid profile email", "state": user_id}
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"https://www.linkedin.com/oauth/v2/authorization?{query}")

@router.get("/linkedin/callback")
async def linkedin_callback(code: str, state: str):
    user_id = state
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_response = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "authorization_code", "code": code, "redirect_uri": settings.linkedin_redirect_uri, "client_id": settings.linkedin_client_id, "client_secret": settings.linkedin_client_secret},
        )
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="LinkedIn token exchange failed")
    save_provider_token(user_id, "linkedin", {"access_token": access_token})
    return RedirectResponse(url=f"{FRONTEND_URL}/dashboard/settings?linkedin=connected")

@router.get("/linkedin/status")
async def linkedin_status(user_id: str):
    token = get_provider_token(user_id, "linkedin")
    return {"connected": token is not None}

@router.post("/linkedin/disconnect")
async def linkedin_disconnect(user_id: str):
    from memory.token_store import delete_provider_token
    delete_provider_token(user_id, "linkedin")
    return {"connected": False}


@router.get("/linkedin/user")
async def linkedin_user(user_id: str):
    token_data = get_provider_token(user_id, "linkedin")
    if not token_data:
        raise HTTPException(status_code=401, detail="LinkedIn not connected")
    access_token = token_data.get("access_token")
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="LinkedIn API error")
        data = res.json()
        # LinkedIn OpenID userinfo doesn't return a profile URL —
        # build a best-effort one from the user's "sub" (LinkedIn member ID)
        data["profile_url"] = f"https://www.linkedin.com/in/{data.get('sub', '')}"
        return data
    except httpx.ConnectTimeout:
        raise HTTPException(status_code=504, detail="LinkedIn API timeout")