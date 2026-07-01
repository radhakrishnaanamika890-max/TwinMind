from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from core.rag_pipeline import rag_pipeline

router = APIRouter()

@router.post("/pdf")
async def upload_pdf(user_id: str = Form(...), file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    content = await file.read()
    chunks = await rag_pipeline.ingest_pdf(user_id, content, file.filename)
    return {"filename": file.filename, "chunks_stored": chunks, "status": "success"}

@router.post("/text")
async def upload_text(user_id: str = Form(...), text: str = Form(...), source: str = Form("manual")):
    chunks = await rag_pipeline.ingest_text(user_id, text, source)
    return {"chunks_stored": chunks, "status": "success"}