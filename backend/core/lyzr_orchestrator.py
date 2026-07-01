from lyzr import LyzrAgent
from core.config import settings

class LyzrOrchestrator:
    def __init__(self):
        self.agent = LyzrAgent(api_key=settings.lyzr_api_key)

    async def run_pipeline(self, user_id: str, query: str, agents: list) -> str:
        results = []
        for agent in agents:
            result = await agent.run(user_id=user_id, query=query)
            results.append(result)
        return results[-1] if results else ""

lyzr = LyzrOrchestrator()