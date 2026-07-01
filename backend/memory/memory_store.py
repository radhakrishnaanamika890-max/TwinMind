from memory.qdrant_client import (
    store_memory, search_memory, get_all_memories,
    delete_all_memories, delete_memory_by_id
)

class MemoryStore:
    async def save(self, user_id: str, content: str, memory_type: str, metadata: dict = {}) -> str:
        return await store_memory(user_id, content, memory_type, metadata)

    async def retrieve(self, user_id: str, query: str, top_k: int = 5) -> list[dict]:
        return await search_memory(user_id, query, top_k)

    async def save_preference(self, user_id: str, preference: str):
        return await self.save(user_id, preference, "preference")

    async def save_fact(self, user_id: str, fact: str):
        return await self.save(user_id, fact, "personal_fact")

    async def save_task(self, user_id: str, task: str):
        return await self.save(user_id, task, "task")

    def get_all(self, user_id: str, memory_type: str = None) -> list[dict]:
        """Returns memory entries for this user, optionally filtered by type."""
        return get_all_memories(user_id, memory_type=memory_type)

    def delete_all(self, user_id: str) -> int:
        """Deletes every memory entry for this user. Returns count of entries removed."""
        return delete_all_memories(user_id)

    def delete_by_id(self, memory_id: str, user_id: str) -> bool:
        """Deletes a single memory entry, scoped to user_id. Returns True if found+deleted."""
        return delete_memory_by_id(memory_id, user_id)

memory_store = MemoryStore()