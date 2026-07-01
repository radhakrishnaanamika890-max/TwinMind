from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.memory_agent import memory_agent
from memory.memory_store import memory_store
from memory.token_store import get_provider_token
import os
import json
from datetime import datetime, timezone

router = APIRouter()

class MemorySearchRequest(BaseModel):
    user_id: str
    query: str
    top_k: int = 5

class MemoryStoreRequest(BaseModel):
    user_id: str
    content: str
    memory_type: str = "manual"

@router.post("/search")
async def search(req: MemorySearchRequest):
    memories = await memory_agent.recall(req.user_id, req.query, req.top_k)
    return {"memories": memories, "count": len(memories)}

@router.post("/store")
async def store(req: MemoryStoreRequest):
    memory_id = await memory_agent.remember(req.user_id, req.content, req.memory_type)
    return {"memory_id": memory_id, "status": "stored"}


# ---------------- Memory list / filter / delete (Memory tab) ----------------

@router.get('/list')
async def list_memories(user_id: str, type: str = None):
    """
    Returns ALL memory entries for this user (not a similarity search — a real list),
    optionally filtered by type: preference / personal_fact / task / conversation / digest.
    Used by the Memory tab.
    """
    memories = memory_store.get_all(user_id, memory_type=type)
    return {"memories": memories, "count": len(memories)}


@router.delete('/{memory_id}')
async def delete_single_memory(memory_id: str, user_id: str):
    """
    Deletes a single memory entry by ID, scoped to user_id.
    NOTE: this route must be registered AFTER /export, /clear, /list, /search, /store
    so FastAPI doesn't try to match those paths as a memory_id.
    """
    deleted = memory_store.delete_by_id(memory_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"deleted": True, "memory_id": memory_id}


# ---------------- Privacy tab endpoints ----------------

@router.get('/export')
async def export_user_data(user_id: str):
    """
    Returns everything TwinMind has stored for this user as a single JSON blob —
    used by the 'Download my data' button in Settings > Privacy.
    """
    memories = memory_store.get_all(user_id)

    connected_providers = []
    token_file = 'user_tokens.json'
    if os.path.exists(token_file):
        with open(token_file, 'r') as f:
            all_tokens = json.load(f)
        user_entry = all_tokens.get(user_id, {})
        if isinstance(user_entry, dict) and 'token' in user_entry:
            connected_providers.append('google')
        if isinstance(user_entry, dict) and 'github' in user_entry:
            connected_providers.append('github')

    return {
        "user_id": user_id,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "connected_services": connected_providers,
        "memory_entries_count": len(memories),
        "memories": memories,
    }


@router.delete('/clear')
async def clear_user_memory(user_id: str):
    """
    Deletes all stored conversational memory for this user.
    Does NOT disconnect Google/GitHub — only clears memory entries.
    """
    deleted_count = memory_store.delete_all(user_id)
    return {"deleted": True, "entries_removed": deleted_count}


@router.get('/activity-log')
async def get_activity_log(user_id: str, limit: int = 20):
    """
    Recent memory entries shown as a simple activity feed in the Privacy tab.
    """
    memories = memory_store.get_all(user_id)
    sorted_memories = sorted(
        memories,
        key=lambda m: m.get('created_at') or 0,
        reverse=True
    )[:limit]

    return {
        "entries": [
            {
                "summary": (m.get('content') or '')[:120],
                "type": m.get('type', 'unknown'),
                "timestamp": m.get('created_at'),
            }
            for m in sorted_memories
        ]
    }