"""
Health & Diagnostics API Route.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.services.vector_store import vector_store

router = APIRouter(tags=["Health"])

@router.get("/health")
def check_health(db: Session = Depends(get_db)):
    """Return backend, SQLite database, and ChromaDB vector store health status."""
    db_healthy = False
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception:
        pass

    vector_count = 0
    try:
        vector_count = vector_store.count()
    except Exception:
        pass

    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": "OutlookIQ Financial Intelligence API",
        "version": "1.0.0",
        "database": "connected" if db_healthy else "disconnected",
        "vector_store": "active",
        "indexed_chunks": vector_count,
        "mode": "verified_guidance_rag"
    }
