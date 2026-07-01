from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = ""

class Memory(BaseModel):
    user_id: str
    content: str
    memory_type: str
    score: Optional[float] = 0.0

class ChatMessage(BaseModel):
    user_id: str
    message: str

class ChatReply(BaseModel):
    reply: str
    intent: Optional[str] = ""