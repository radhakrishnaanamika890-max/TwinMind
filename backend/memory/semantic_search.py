from memory.qdrant_client import search_memory

async def find_relevant_memories(user_id: str, query: str, top_k: int = 5, memory_type: str = None) -> list[dict]:
    results = await search_memory(user_id, query, top_k)
    if memory_type:
        results = [r for r in results if r["type"] == memory_type]
    return results

async def find_documents(user_id: str, query: str, top_k: int = 5) -> list[dict]:
    return await find_relevant_memories(user_id, query, top_k, memory_type="document")

async def find_conversations(user_id: str, query: str, top_k: int = 5) -> list[dict]:
    return await find_relevant_memories(user_id, query, top_k, memory_type="conversation")