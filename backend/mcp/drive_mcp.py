from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import io

class DriveMCP:
    def __init__(self, credentials: dict):
        creds = Credentials(
            token=credentials["access_token"],
            refresh_token=credentials["refresh_token"],
            client_id=credentials["client_id"],
            client_secret=credentials["client_secret"],
            token_uri="https://oauth2.googleapis.com/token"
        )
        self.service = build("drive", "v3", credentials=creds)

    def list_files(self, max_results: int = 10) -> list[dict]:
        results = self.service.files().list(
            pageSize=max_results,
            fields="files(id, name, mimeType, modifiedTime)"
        ).execute()
        return results.get("files", [])

    def download_file(self, file_id: str) -> bytes:
        request = self.service.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        downloader = request.execute()
        return downloader