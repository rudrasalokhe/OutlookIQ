"""
Configuration management for OutlookIQ Backend & RAG Engine.
Loads environment variables safely with robust defaults.
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "OutlookIQ — Guidance Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'storage' / 'outlookiq.db').resolve().as_posix()}"

    # Storage Paths
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    CHROMA_PERSIST_DIR: str = str(BASE_DIR / "storage" / "chroma")

    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")  # "grok", "groq", "gemini", "openai", "local"
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    GROK_API_KEY: str = os.getenv("GROK_API_KEY", "")  # xAI Grok (https://api.x.ai/v1)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")  # Groq Cloud (https://api.groq.com)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "grok-beta")

    # Embeddings
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "local")  # "local", "gemini", "openai"
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

    # SEC EDGAR Integration
    SEC_USER_AGENT: str = os.getenv("SEC_USER_AGENT", "OutlookIQResearch user@outlookiq.internal")
    SEC_REQUEST_DELAY: float = 0.15  # Respect SEC rate limits (<= 10 requests per second)

    # CORS
    FRONTEND_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    class Config:
        env_file = (".env", str(BASE_DIR / ".env"))
        extra = "allow"

settings = Settings()

# Ensure storage directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)
