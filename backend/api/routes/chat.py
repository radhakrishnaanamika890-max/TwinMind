from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.orchestrator import orchestrator
from typing import Optional
import uuid, time, json, os

router = APIRouter()

SESSIONS_FILE = "sessions_store.json"

def load_sessions():
    if os.path.exists(SESSIONS_FILE):
        with open(SESSIONS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_sessions(db):
    with open(SESSIONS_FILE, "w") as f:
        json.dump(db, f)

sessions_db = load_sessions()

class ChatRequest(BaseModel):
    user_id: str
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str

class SessionCreate(BaseModel):
    user_id: str
    title: Optional[str] = "New chat"

@router.get("/digest")
async def get_daily_digest(user_id: str):
    digest = await orchestrator.generate_daily_digest(user_id)
    return {"digest": digest}

@router.get("/sessions")
async def get_sessions(user_id: str):
    user_sessions = [
        s for s in sessions_db.values()
        if s["user_id"] == user_id
    ]
    user_sessions.sort(key=lambda x: x["created_at"], reverse=True)
    return {"sessions": user_sessions}

@router.post("/sessions")
async def create_session(req: SessionCreate):
    session_id = str(uuid.uuid4())
    session = {
        "id": session_id,
        "user_id": req.user_id,
        "title": req.title,
        "messages": [],
        "created_at": time.time()
    }
    sessions_db[session_id] = session
    save_sessions(sessions_db)
    return session

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    if session_id in sessions_db:
        del sessions_db[session_id]
        save_sessions(sessions_db)
    return {"status": "deleted"}

@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    session = sessions_db.get(session_id)
    if not session:
        return {"messages": []}
    return {"messages": session["messages"]}

@router.post("/stream")
async def chat_stream(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is empty")

    session_id = req.session_id or str(uuid.uuid4())

    if session_id not in sessions_db:
        sessions_db[session_id] = {
            "id": session_id,
            "user_id": req.user_id,
            "title": req.message[:30],
            "messages": [],
            "created_at": time.time()
        }

    sessions_db[session_id]["messages"].append({
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": req.message,
        "created_at": time.time()
    })
    save_sessions(sessions_db)

    async def generate():
        full_reply = ""
        try:
            # Send session_id first so frontend knows it
            yield f"data: {json.dumps({'type': 'session_id', 'session_id': session_id})}\n\n"

            reply = await orchestrator.handle(req.user_id, req.message)

            # Stream word by word
            words = reply.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                full_reply += chunk
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"
                # Small delay for streaming effect
                import asyncio
                await asyncio.sleep(0.03)

            # Save assistant reply
            sessions_db[session_id]["messages"].append({
                "id": str(uuid.uuid4()),
                "role": "assistant",
                "content": full_reply,
                "created_at": time.time()
            })
            save_sessions(sessions_db)

            yield f"data: {json.dumps({'type': 'done', 'session_id': session_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message is empty")

    session_id = req.session_id or str(uuid.uuid4())

    if session_id not in sessions_db:
        sessions_db[session_id] = {
            "id": session_id,
            "user_id": req.user_id,
            "title": req.message[:30],
            "messages": [],
            "created_at": time.time()
        }

    sessions_db[session_id]["messages"].append({
        "id": str(uuid.uuid4()),
        "role": "user",
        "content": req.message,
        "created_at": time.time()
    })

    reply = await orchestrator.handle(req.user_id, req.message)

    sessions_db[session_id]["messages"].append({
        "id": str(uuid.uuid4()),
        "role": "assistant",
        "content": reply,
        "created_at": time.time()
    })
    save_sessions(sessions_db)

    return ChatResponse(reply=reply, session_id=session_id)

