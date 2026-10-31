"""
Health & Diagnostics API Route.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.database import get_db
from backend.services.pinecone_service import pinecone_service
from backend.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def check_health(db: Session = Depends(get_db)):
    """Return backend, database, Pinecone vector store, and LangGraph workflow health status."""
    db_healthy = False
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception:
        pass

    pinecone_info = pinecone_service.get_status()

    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "course_accreditation": settings.COURSE_ACCREDITATION,
        "agentic_framework": settings.AGENTIC_FRAMEWORK,
        "database": "connected" if db_healthy else "disconnected",
        "vector_store": pinecone_info.get("provider", "Pinecone Hybrid"),
        "pinecone_connected": pinecone_info.get("is_connected", False),
        "pinecone_index": pinecone_info.get("index_name"),
        "indexed_chunks": pinecone_info.get("total_vectors", 0),
        "mode": "agentic_stategraph_rag"
    }
