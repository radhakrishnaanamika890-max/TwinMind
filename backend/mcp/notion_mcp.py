import httpx

class NotionMCP:
    def __init__(self, api_key: str):
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }
        self.base_url = "https://api.notion.com/v1"

    async def search_pages(self, query: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/search",
                headers=self.headers,
                json={"query": query, "filter": {"object": "page"}}
            )
        results = response.json().get("results", [])
        return [
            {"id": r["id"], "title": r.get("properties", {}).get("title", {}).get("title", [{}])[0].get("plain_text", "")}
            for r in results
        ]

    async def create_page(self, parent_id: str, title: str, content: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/pages",
                headers=self.headers,
                json={
                    "parent": {"page_id": parent_id},
                    "properties": {"title": {"title": [{"text": {"content": title}}]}},
                    "children": [{"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": content}}]}}]
                }
            )
        return response.json()