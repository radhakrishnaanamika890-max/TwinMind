import httpx

class GitHubMCP:
    def __init__(self, token: str):
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json"
        }
        self.base_url = "https://api.github.com"

    async def list_repos(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/user/repos", headers=self.headers)
        return [{"name": r["name"], "url": r["html_url"], "description": r.get("description", "")} for r in response.json()]

    async def list_issues(self, owner: str, repo: str) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/repos/{owner}/{repo}/issues", headers=self.headers)
        return [{"title": i["title"], "state": i["state"], "url": i["html_url"]} for i in response.json()]

    async def list_pull_requests(self, owner: str, repo: str, state: str = "open") -> list[dict]:
        """Lists pull requests for a repo. state can be 'open', 'closed', or 'all'."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/pulls",
                headers=self.headers,
                params={"state": state},
            )
        data = response.json()
        if not isinstance(data, list):
            # GitHub returns an error object (e.g. repo not found, bad credentials) instead of a list
            return []
        return [
            {
                "number": pr["number"],
                "title": pr["title"],
                "author": pr["user"]["login"] if pr.get("user") else "unknown",
                "url": pr["html_url"],
                "state": pr["state"],
                "draft": pr.get("draft", False),
                "head": pr["head"]["ref"],
                "base": pr["base"]["ref"],
            }
            for pr in data
        ]

    async def list_all_repo_prs(self, owner: str, repo: str) -> dict:
        """Convenience method: fetches both open PRs and open issues for a repo in one call.

        Note: GitHub's /issues endpoint technically also returns PRs (since PRs are a type
        of issue internally), so we filter those out here to keep 'issues' clean.
        """
        prs = await self.list_pull_requests(owner, repo, state="open")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/repos/{owner}/{repo}/issues",
                headers=self.headers,
                params={"state": "open"},
            )
        raw_issues = response.json()
        if not isinstance(raw_issues, list):
            raw_issues = []

        issues = [
            {"title": i["title"], "state": i["state"], "url": i["html_url"]}
            for i in raw_issues
            if "pull_request" not in i  # exclude PRs that GitHub also lists as issues
        ]

        return {"pull_requests": prs, "issues": issues}