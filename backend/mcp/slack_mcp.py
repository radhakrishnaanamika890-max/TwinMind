import httpx

class SlackMCP:
    def __init__(self, bot_token: str):
        self.token = bot_token
        self.base_url = "https://slack.com/api"
        self.headers = {"Authorization": f"Bearer {bot_token}"}

    async def send_message(self, channel: str, text: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat.postMessage",
                headers=self.headers,
                json={"channel": channel, "text": text}
            )
        return response.json()

    async def get_messages(self, channel: str, limit: int = 10) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/conversations.history",
                headers=self.headers,
                params={"channel": channel, "limit": limit}
            )
        messages = response.json().get("messages", [])
        return [{"text": m.get("text", ""), "ts": m.get("ts", "")} for m in messages]