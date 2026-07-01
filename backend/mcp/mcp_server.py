from mcp.gmail_mcp import GmailMCP
from mcp.calendar_mcp import CalendarMCP
from mcp.drive_mcp import DriveMCP
from mcp.notion_mcp import NotionMCP
from mcp.slack_mcp import SlackMCP
from mcp.github_mcp import GitHubMCP

class MCPServer:
    def __init__(self, credentials: dict):
        google_creds = credentials.get("google", {})

        # Normalize google token shape: support both {"token": ...} and {"access_token": ...}
        if google_creds and "access_token" not in google_creds and "token" in google_creds:
            google_creds = {**google_creds, "access_token": google_creds["token"]}

        try:
            self.gmail    = GmailMCP(google_creds)    if google_creds else None
        except Exception:
            self.gmail = None
        try:
            self.calendar = CalendarMCP(google_creds) if google_creds else None
        except Exception:
            self.calendar = None
        try:
            self.drive    = DriveMCP(google_creds)    if google_creds else None
        except Exception:
            self.drive = None

        self.notion   = NotionMCP(credentials.get("notion_token", ""))   if credentials.get("notion_token")   else None
        self.slack    = SlackMCP(credentials.get("slack_token", ""))     if credentials.get("slack_token")    else None
        self.github   = GitHubMCP(credentials.get("github_token", ""))   if credentials.get("github_token")   else None

    def get_available_services(self) -> list[str]:
        services = []
        if self.gmail:    services.append("gmail")
        if self.calendar: services.append("calendar")
        if self.drive:    services.append("drive")
        if self.notion:   services.append("notion")
        if self.slack:    services.append("slack")
        if self.github:   services.append("github")
        return services
