from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from email.mime.text import MIMEText

class GmailMCP:
    def __init__(self, credentials: dict):
        creds = Credentials(
            token=credentials["access_token"],
            refresh_token=credentials["refresh_token"],
            client_id=credentials["client_id"],
            client_secret=credentials["client_secret"],
            token_uri="https://oauth2.googleapis.com/token"
        )
        self.service = build("gmail", "v1", credentials=creds)

    def list_emails(self, max_results: int = 10) -> list[dict]:
        results = self.service.users().messages().list(
            userId="me", maxResults=max_results
        ).execute()
        messages = results.get("messages", [])
        emails = []
        for msg in messages:
            detail = self.service.users().messages().get(userId="me", id=msg["id"]).execute()
            headers = {h["name"]: h["value"] for h in detail["payload"]["headers"]}
            emails.append({
                "id": msg["id"],
                "subject": headers.get("Subject", ""),
                "from": headers.get("From", ""),
                "date": headers.get("Date", ""),
                "snippet": detail.get("snippet", "")
            })
        return emails

    def send_email(self, to: str, subject: str, body: str) -> dict:
        message = MIMEText(body)
        message["to"] = to
        message["subject"] = subject
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        return self.service.users().messages().send(
            userId="me", body={"raw": raw}
        ).execute()