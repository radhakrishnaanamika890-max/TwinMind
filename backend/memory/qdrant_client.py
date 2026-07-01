from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue, QueryRequest
)
from core.config import settings
from core.gemini_client import gemini
import uuid
import time

# In-memory mode
client = QdrantClient(":memory:")
VECTOR_SIZE = 768

def init_collection():
    existing = [c.name for c in client.get_collections().collections]
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
        )
        print(f"Collection '{settings.qdrant_collection}' created (in-memory).")

async def store_memory(user_id: str, content: str, memory_type: str, metadata: dict = {}) -> str:
    embedding = await gemini.embed(content)
    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=embedding,
        payload={
            "user_id": user_id,
            "content": content,
            "type": memory_type,
            "timestamp": time.time(),
            **metadata
        }
    )
    client.upsert(collection_name=settings.qdrant_collection, points=[point])
    return point.id

async def search_memory(user_id: str, query: str, top_k: int = 5) -> list[dict]:
    query_vector = await gemini.embed(query)
    results = client.query_points(
        collection_name=settings.qdrant_collection,
        query=query_vector,
        limit=top_k,
        query_filter=Filter(
            must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
        )
    ).points
    return [
        {"content": r.payload["content"], "type": r.payload["type"], "score": r.score}
        for r in results
    ]


def get_all_memories(user_id: str, memory_type: str = None, limit: int = 1000) -> list[dict]:
    """
    Returns every memory entry stored for this user (no vector search — just a
    filtered scroll through the collection). Optionally filter by 'type'
    (e.g. 'preference', 'personal_fact', 'task', 'conversation', 'digest').
    Used for the Memory tab list view, data export, and activity log.
    """
    must_conditions = [FieldCondition(key="user_id", match=MatchValue(value=user_id))]
    if memory_type:
        must_conditions.append(FieldCondition(key="type", match=MatchValue(value=memory_type)))

    user_filter = Filter(must=must_conditions)
    points, _next_offset = client.scroll(
        collection_name=settings.qdrant_collection,
        scroll_filter=user_filter,
        limit=limit,
        with_payload=True,
        with_vectors=False,
    )
    # Most recent first
    results = [
        {
            "id": str(p.id),
            "content": p.payload.get("content", ""),
            "type": p.payload.get("type", "unknown"),
            "created_at": p.payload.get("timestamp"),
        }
        for p in points
    ]
    results.sort(key=lambda m: m.get("created_at") or 0, reverse=True)
    return results


def delete_all_memories(user_id: str) -> int:
    """Deletes every memory entry stored for this user. Returns count removed."""
    existing = get_all_memories(user_id, limit=10000)
    count = len(existing)
    if count == 0:
        return 0
    user_filter = Filter(
        must=[FieldCondition(key="user_id", match=MatchValue(value=user_id))]
    )
    client.delete(collection_name=settings.qdrant_collection, points_selector=user_filter)
    return count


def delete_memory_by_id(memory_id: str, user_id: str) -> bool:
    """
    Deletes a single memory entry by its point ID, scoped to user_id for safety
    (so one user can't delete another user's memory by guessing an ID).
    Returns True if a matching point was found and deleted.
    """
    # Verify the point belongs to this user before deleting
    scoped_filter = Filter(
        must=[
            FieldCondition(key="user_id", match=MatchValue(value=user_id)),
        ]
    )
    points, _ = client.scroll(
        collection_name=settings.qdrant_collection,
        scroll_filter=scoped_filter,
        limit=10000,
        with_payload=False,
        with_vectors=False,
    )
    matching_ids = [str(p.id) for p in points if str(p.id) == str(memory_id)]

    if not matching_ids:
        return False

    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=matching_ids,
    )
    return True