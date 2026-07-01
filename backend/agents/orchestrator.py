# backend/agents/orchestrator.py
from core.gemini_client import gemini
from agents.memory_agent import memory_agent
import re

ROUTER_PROMPT = """You are an intent classifier. Given the user's message, classify it into ONE of these categories:
- gmail: user is asking about emails, inbox, messages
- calendar: user is asking about meetings, schedule, events, appointments
- digest: user is asking for a daily summary, daily digest, today's overview, or "what's on my plate today"
- github: user is asking about their GitHub repos, repositories, code, pull requests, PRs, issues, or commits
- general: anything else

Message: {query}

Reply with ONLY the category word (gmail/calendar/digest/github/general), nothing else."""

SYSTEM_PROMPT = """You are TwinMind, a personal AI assistant with access to the user's memory, Gmail, Calendar, and GitHub.
Be concise, warm, and helpful. Use the provided context naturally in your reply."""

DIGEST_SYSTEM_PROMPT = """You are TwinMind, generating a friendly morning daily digest for the user.
Combine their calendar meetings and important emails into a clear, organized summary.
Structure it as:
1. A warm greeting
2. Today's meetings (with times)
3. Important/unread emails worth attention
4. A short motivating closing line

Keep it concise, scannable, and warm. Use simple formatting (no markdown headers, just clear line breaks)."""


class Orchestrator:
    async def handle(self, user_id: str, query: str) -> str:
        intent_raw = await gemini.chat(ROUTER_PROMPT.format(query=query))
        intent = (intent_raw or "").strip().lower()

        context = await memory_agent.recall_as_context(user_id, query)
        mcp_context = ""

        if "digest" in intent:
            return await self.generate_daily_digest(user_id)
        elif "gmail" in intent:
            mcp_context = await self._fetch_gmail_context(user_id, query)
        elif "calendar" in intent:
            mcp_context = await self._fetch_calendar_context(user_id)
        elif "github" in intent:
            mcp_context = await self._fetch_github_context(user_id, query)

        full_context = f"{context}\n\n{mcp_context}".strip()
        prompt = f"Context:\n{full_context}\n\nUser: {query}" if full_context else query

        reply = await gemini.chat(prompt, system_prompt=SYSTEM_PROMPT)

        await memory_agent.remember(user_id, f"User asked: {query}\nAssistant replied: {reply}", "conversation")

        return reply

    async def generate_daily_digest(self, user_id: str) -> str:
        """Generate a combined daily digest of calendar + gmail."""
        calendar_context = await self._fetch_calendar_context(user_id)
        gmail_context = await self._fetch_gmail_context(user_id, "important emails")

        combined = f"""Today's Calendar:
{calendar_context}

Recent Emails:
{gmail_context}"""

        prompt = f"Generate today's daily digest from this data:\n\n{combined}"
        reply = await gemini.chat(prompt, system_prompt=DIGEST_SYSTEM_PROMPT)

        await memory_agent.remember(user_id, f"Daily digest generated: {reply}", "digest")

        return reply

    async def _fetch_gmail_context(self, user_id: str, query: str) -> str:
        try:
            from api.routes.mcp import get_credentials
            from googleapiclient.discovery import build

            creds = get_credentials(user_id)
            if not creds:
                return "[Gmail not connected — user needs to connect it in Settings]"

            service = build("gmail", "v1", credentials=creds)
            results = service.users().messages().list(userId="me", maxResults=5).execute()

            lines = ["Recent Gmail messages:"]
            for msg in results.get("messages", []):
                detail = service.users().messages().get(
                    userId="me", id=msg["id"], format="metadata",
                    metadataHeaders=["Subject", "From"]
                ).execute()
                headers = {h["name"]: h["value"] for h in detail["payload"]["headers"]}
                lines.append(f"- From: {headers.get('From','?')} | Subject: {headers.get('Subject','(no subject)')} | {detail.get('snippet','')[:80]}")
            return "\n".join(lines)
        except Exception as e:
            return f"[Gmail fetch failed: {e}]"

    async def _fetch_calendar_context(self, user_id: str) -> str:
        try:
            from api.routes.mcp import get_credentials
            from googleapiclient.discovery import build
            from datetime import datetime, timezone

            creds = get_credentials(user_id)
            if not creds:
                return "[Calendar not connected — user needs to connect it in Settings]"

            service = build("calendar", "v3", credentials=creds)
            now = datetime.now(timezone.utc).isoformat()
            events_result = service.events().list(
                calendarId="primary", timeMin=now, maxResults=5,
                singleEvents=True, orderBy="startTime",
            ).execute()

            lines = ["Upcoming Calendar events:"]
            for e in events_result.get("items", []):
                start = e["start"].get("dateTime", e["start"].get("date"))
                lines.append(f"- {e.get('summary','No title')} at {start}")
            return "\n".join(lines) if events_result.get("items") else "No upcoming events found."
        except Exception as e:
            return f"[Calendar fetch failed: {e}]"

    async def _fetch_github_context(self, user_id: str, query: str) -> str:
        """
        Builds GitHub context for the AI. Always includes the user's repo list.
        If the query seems to mention a specific repo name, also fetches that
        repo's open issues and pull requests for richer context.
        """
        try:
            from api.routes.mcp import get_mcp_server

            server = get_mcp_server(user_id)
            if not server.github:
                return "[GitHub not connected — user needs to connect it in Settings]"

            repos = await server.github.list_repos()
            if not repos:
                return "User has no GitHub repositories, or none could be fetched."

            lines = ["User's GitHub repositories:"]
            for r in repos[:15]:  # cap to keep prompt size reasonable
                desc = f" — {r['description']}" if r.get("description") else ""
                lines.append(f"- {r['name']}{desc} ({r['url']})")

            # Try to detect if the query mentions a specific repo by name, so we can
            # pull richer detail (issues/PRs) for that one repo instead of just the list.
            query_lower = query.lower()
            matched_repo = next(
                (r for r in repos if r["name"].lower() in query_lower),
                None
            )

            if matched_repo:
                owner = matched_repo["url"].split("github.com/")[1].split("/")[0]
                repo_name = matched_repo["name"]
                try:
                    data = await server.github.list_all_repo_prs(owner, repo_name)
                    prs = data["pull_requests"]
                    issues = data["issues"]

                    lines.append(f"\nDetails for {repo_name}:")
                    if prs:
                        lines.append("Open Pull Requests:")
                        for pr in prs[:10]:
                            draft_tag = " [DRAFT]" if pr.get("draft") else ""
                            lines.append(f"  - PR #{pr['number']}: \"{pr['title']}\" by {pr['author']}{draft_tag}")
                    else:
                        lines.append("Open Pull Requests: none")

                    if issues:
                        lines.append("Open Issues:")
                        for issue in issues[:10]:
                            lines.append(f"  - \"{issue['title']}\"")
                    else:
                        lines.append("Open Issues: none")
                except Exception as inner_e:
                    lines.append(f"[Could not fetch PR/issue details for {repo_name}: {inner_e}]")

            return "\n".join(lines)
        except Exception as e:
            return f"[GitHub fetch failed: {e}]"


orchestrator = Orchestrator()