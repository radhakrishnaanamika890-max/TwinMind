from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from memory.qdrant_client import init_collection
from api.routes import chat, auth, upload, memory, mcp, tasks

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_collection()
    print("TwinMind started.")
    yield
    print("TwinMind stopped.")

app = FastAPI(title="TwinMind API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "http://localhost:3000",
        "https://radiant-contentment-production-686c.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router,   prefix="/api/auth",   tags=["Auth"])
app.include_router(chat.router,   prefix="/api/chat",   tags=["Chat"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(memory.router, prefix="/api/memory", tags=["Memory"])
app.include_router(mcp.router,    prefix="/api/mcp",    tags=["MCP"])
app.include_router(tasks.router,  prefix="/api/tasks",  tags=["Tasks"])

@app.get("/")
async def root():
    return {"status": "TwinMind running", "version": "1.0.0"}

