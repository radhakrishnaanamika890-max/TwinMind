from core.gemini_client import gemini
from agents.memory_agent import memory_agent

EXTRACT_PROMPT = """
Analyze this message and extract:
- Tone (formal/casual/friendly)
- Writing style (short/detailed/uses-emoji)
- Frequent words or phrases
- Signature expressions

Message: {message}

Return as JSON only.
"""

TWIN_PROMPT = """
You are a digital twin of this user. Reply EXACTLY in their voice.

Personality:
{personality}

Past context:
{context}

Query: {query}

Reply as the user would — same tone, same style, same words.
"""

class PersonalityAgent:
    async def learn_style(self, user_id: str, message: str):
        prompt = EXTRACT_PROMPT.format(message=message)
        summary = await gemini.chat(prompt)
        await memory_agent.remember(user_id, summary, "personality", {"source": message[:100]})

    async def reply_as_twin(self, user_id: str, query: str) -> str:
        personality = await memory_agent.recall(user_id, "tone writing style personality", top_k=3)
        context = await memory_agent.recall(user_id, query, top_k=3)

        personality_text = "\n".join([m["content"] for m in personality]) or "No data yet."
        context_text = "\n".join([m["content"] for m in context]) or "No context yet."

        prompt = TWIN_PROMPT.format(
            personality=personality_text,
            context=context_text,
            query=query
        )
        return await gemini.chat(prompt)

personality_agent = PersonalityAgent()