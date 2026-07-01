from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from memory.qdrant_client import store_memory
import io

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)

class RAGPipeline:
    async def ingest_pdf(self, user_id: str, file_bytes: bytes, filename: str) -> int:
        reader = PdfReader(io.BytesIO(file_bytes))
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() or ""

        if not full_text.strip():
            return 0

        chunks = text_splitter.split_text(full_text)
        for chunk in chunks:
            await store_memory(
                user_id=user_id,
                content=chunk,
                memory_type="document",
                metadata={"filename": filename}
            )
        return len(chunks)

    async def ingest_text(self, user_id: str, text: str, source: str = "manual") -> int:
        chunks = text_splitter.split_text(text)
        for chunk in chunks:
            await store_memory(
                user_id=user_id,
                content=chunk,
                memory_type="document",
                metadata={"source": source}
            )
        return len(chunks)

rag_pipeline = RAGPipeline()