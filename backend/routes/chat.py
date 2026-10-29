"""
RAG Chat API Route.
Processes financial intelligence questions, performs vector retrieval and SQLite verification,
and returns grounded answers with authentic citations and related promise cards.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.services.rag_pipeline import rag_pipeline

router = APIRouter(prefix="/chat", tags=["AI Analyst"])

class ChatRequest(BaseModel):
    question: Optional[str] = Field(None, description="Natural language financial question")
    query: Optional[str] = Field(None, description="Alternative alias for question")
    message: Optional[str] = Field(None, description="Alternative alias for question")
    company: Optional[str] = Field(None, description="Optional company ticker constraint")
    fiscal_year: Optional[int] = Field(None, description="Optional fiscal year constraint")

class CitationItem(BaseModel):
    title: str
    doc_type: str
    reporting_quarter: str
    date: str
    excerpt: str
    similarity: float

class ChatResponse(BaseModel):
    answer: str
    citations: List[Dict[str, Any]]
    related_promises: List[Dict[str, Any]]
    confidence: str

@router.post("", response_model=ChatResponse)
def chat_with_rag(req: ChatRequest, db: Session = Depends(get_db)):
    """
    RAG Assistant endpoint.
    Retrieves verified corporate disclosures and deterministic evaluation records to produce grounded answers.
    """
    user_query = req.question or req.query or req.message or ""
    if not user_query.strip():
        return {
            "answer": "Please provide a valid financial question (e.g., 'Did NVIDIA exceed its revenue guidance in Q3 FY25?').",
            "citations": [],
            "related_promises": [],
            "confidence": "insufficient_data"
        }

    rag_result = rag_pipeline.answer_question(user_query, db)
    return rag_result
