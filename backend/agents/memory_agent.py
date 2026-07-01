from memory.qdrant_client import store_memory, search_memory

class MemoryAgent:
    async def remember(self, user_id: str, content: str, memory_type: str = "conversation", metadata: dict = {}) -> str:
        return await store_memory(user_id, content, memory_type, metadata)

    async def recall(self, user_id: str, query: str, top_k: int = 5) -> list[dict]:
        return await search_memory(user_id, query, top_k)

    async def recall_as_context(self, user_id: str, query: str) -> str:
        memories = await self.recall(user_id, query)
        if not memories:
            return ""
        lines = [f"- [{m['type']}] {m['content']}" for m in memories]
        return "Relevant memories:\n" + "\n".join(lines)

memory_agent = MemoryAgent()