from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import datetime, timedelta

class CalendarMCP:
    def __init__(self, credentials: dict):
        creds = Credentials(
            token=credentials["access_token"],
            refresh_token=credentials["refresh_token"],
            client_id=credentials["client_id"],
            client_secret=credentials["client_secret"],
            token_uri="https://oauth2.googleapis.com/token"
        )
        self.service = build("calendar", "v3", credentials=creds)

    def get_upcoming_events(self, max_results: int = 10) -> list[dict]:
        now = datetime.utcnow().isoformat() + "Z"
        events_result = self.service.events().list(
            calendarId="primary",
            timeMin=now,
            maxResults=max_results,
            singleEvents=True,
            orderBy="startTime"
        ).execute()
        events = events_result.get("items", [])
        return [
            {
                "id": e["id"],
                "title": e.get("summary", ""),
                "start": e["start"].get("dateTime", e["start"].get("date")),
                "end": e["end"].get("dateTime", e["end"].get("date")),
                "description": e.get("description", "")
            }
            for e in events
        ]

    def create_event(self, title: str, start: str, end: str, description: str = "") -> dict:
        event = {
            "summary": title,
            "description": description,
            "start": {"dateTime": start, "timeZone": "Asia/Kolkata"},
            "end": {"dateTime": end, "timeZone": "Asia/Kolkata"}
        }
        return self.service.events().insert(calendarId="primary", body=event).execute()