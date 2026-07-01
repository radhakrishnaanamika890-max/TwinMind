from core.gemini_client import gemini

async def get_embedding(text: str) -> list[float]:
    return await gemini.embed(text)

async def get_embeddings_batch(texts: list[str]) -> list[list[float]]:
    embeddings = []
    for text in texts:
        emb = await gemini.embed(text)
        embeddings.append(emb)
    return embeddings