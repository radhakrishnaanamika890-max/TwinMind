from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str = "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"
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection: str = "twinmind_memory"
    google_client_id: str = "972720826866-tds1j0uggh2fssk8oaq9lbinj05q15i4.apps.googleusercontent.com"
    google_client_secret: str = "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"
    google_redirect_uri: str = "https://twinmind-production-5a79.up.railway.app/auth/callback"
    firebase_project_id: str = "twinmind-personal-digital-twin"
    firebase_credentials_path: str = "./firebase_credentials.json"
    lyzr_api_key: str = "sk-default-EXGrHJrWY4xXxVZ6ngW33Q9o3YvBTd4B"
    app_secret_key: str = "6847f9b4ab65f1719b08e90616ece93dda6d583a4d84072e5f861ab0473d68dc"
    app_env: str = "development"
    app_port: int = 8000

    github_client_id: str = "Ov23liSWxVPpABTspdKh"
    github_client_secret: str = "e4c9e71c768dbf437b0564f8dcb7d39c18c8ca79"
    github_redirect_uri: str = "https://twinmind-production-5a79.up.railway.app/api/auth/github/callback"

    linkedin_client_id: str ="8652fp8l13a7ca"
    linkedin_client_secret: str ="WPL_AP1.PH1hHbBbcsBpYjc2.TDj3Hg=="
    linkedin_redirect_uri: str = "https://twinmind-production-5a79.up.railway.app/api/auth/linkedin/callback"
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()





