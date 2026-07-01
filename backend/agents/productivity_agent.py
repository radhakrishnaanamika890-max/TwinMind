from core.gemini_client import gemini
from agents.memory_agent import memory_agent

EMAIL_PROMPT = """
Write an email reply exactly in this user's writing style.

User style & context:
{context}

Task: {query}

Write only the email body. No subject line needed.
"""

TASK_PROMPT = """
Help the user with this calendar/task request.

Context:
{context}

Request: {query}

Provide a clear, actionable response.
"""

class ProductivityAgent:
    async def draft_email(self, user_id: str, query: str, context: str = "") -> str:
        prompt = EMAIL_PROMPT.format(context=context, query=query)
        return await gemini.chat(prompt)

    async def handle_task(self, user_id: str, query: str, context: str = "") -> str:
        prompt = TASK_PROMPT.format(context=context, query=query)
        response = await gemini.chat(prompt)
        await memory_agent.remember(user_id, f"Task: {query}", "task")
        return response

productivity_agent = ProductivityAgent()