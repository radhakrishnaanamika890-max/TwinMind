from core.gemini_client import gemini
from memory.qdrant_client import search_memory

KNOWLEDGE_PROMPT = """
Answer this question using the provided documents.
If answer not found, say "I couldn't find this in your documents."

Documents:
{documents}

Question: {query}

Answer:
"""

class KnowledgeAgent:
    async def answer(self, user_id: str, query: str, context: str = "") -> str:
        docs = await search_memory(user_id, query, top_k=5)
        doc_docs = [d for d in docs if d["type"] == "document"]

        if not doc_docs:
            return await gemini.chat(query)

        doc_text = "\n\n".join([f"[{i+1}] {d['content']}" for i, d in enumerate(doc_docs)])
        prompt = KNOWLEDGE_PROMPT.format(documents=doc_text, query=query)
        return await gemini.chat(prompt)

knowledge_agent = KnowledgeAgent()