"""
Document Management & Upload Ingestion API Route.
Supports PDF, HTML, and text uploads with SHA-256 deduplication and ChromaDB vector indexing.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from backend.database import get_db
from backend.models.document import Document
from backend.models.company import Company
from backend.config import settings
from backend.services.document_loader import (
    compute_sha256,
    extract_text_from_pdf,
    extract_text_from_html,
    clean_financial_text,
    chunk_financial_document
)
from backend.services.vector_store import vector_store

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("", response_model=List[dict])
def list_documents(company_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List all indexed financial documents and processing states."""
    query = db.query(Document)
    if company_id and company_id != "ALL":
        query = query.filter(Document.company_id == company_id.upper())
    docs = query.order_by(Document.created_at.desc()).all()
    return [d.to_dict() for d in docs]

@router.get("/{document_id}")
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Fetch metadata and status for a specific document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")
    res = doc.to_dict()
    res["rawTextPreview"] = doc.raw_text[:500] if doc.raw_text else ""
    return res

@router.get("/{document_id}/status")
def get_document_status(document_id: str, db: Session = Depends(get_db)):
    """Check processing and indexing status for a document."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")
    return {
        "id": doc.id,
        "status": doc.processing_status,
        "chunks": doc.chunk_count,
        "errorMessage": doc.error_message
    }

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    company_id: str = Form("NVDA"),
    document_type: str = Form("Earnings Release"),
    fiscal_period: str = Form("Q4 FY25"),
    db: Session = Depends(get_db)
):
    """
    Ingest a financial document (PDF, HTML, or TXT), compute content hash,
    extract text, generate vector chunks, index into ChromaDB, and record in SQLite.
    """
    company_id = company_id.upper()
    comp = db.query(Company).filter((Company.id == company_id) | (Company.ticker == company_id)).first()
    if not comp:
        # Auto-create if not already present
        comp = Company(id=company_id, name=f"{company_id} Corporation", ticker=company_id, sector="Technology")
        db.add(comp)
        db.commit()

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Deduplication check via SHA-256
    doc_hash = compute_sha256(content)
    existing = db.query(Document).filter(Document.content_hash == doc_hash).first()
    if existing:
        return {
            "message": "Document already ingested and indexed (deduplicated by SHA-256 hash).",
            "document": existing.to_dict(),
            "isDuplicate": True
        }

    # Save to disk
    safe_filename = f"{company_id}_{int(doc_hash[:8], 16)}_{Path(file.filename).name}"
    local_path = settings.UPLOAD_DIR / safe_filename
    with open(local_path, "wb") as f:
        f.write(content)

    doc_id = f"DOC-{company_id}-{doc_hash[:8].upper()}"
    filename_lower = file.filename.lower()
    page_count = 1
    raw_text = ""

    try:
        if filename_lower.endswith(".pdf"):
            raw_text, page_count = extract_text_from_pdf(local_path)
        elif filename_lower.endswith(".html") or filename_lower.endswith(".htm"):
            raw_text = extract_text_from_html(content.decode("utf-8", errors="ignore"))
        else:
            raw_text = clean_financial_text(content.decode("utf-8", errors="ignore"))
    except Exception as e:
        doc = Document(
            id=doc_id,
            company_id=company_id,
            title=file.filename,
            document_type=document_type,
            fiscal_period=fiscal_period,
            local_path=str(local_path),
            content_hash=doc_hash,
            file_size_bytes=len(content),
            processing_status="failed",
            error_message=str(e)
        )
        db.add(doc)
        db.commit()
        raise HTTPException(status_code=422, detail=f"Text extraction failed: {e}")

    # Chunk text
    chunks = chunk_financial_document(
        raw_text,
        metadata={
            "doc_id": doc_id,
            "company_id": company_id,
            "ticker": comp.ticker,
            "title": file.filename,
            "document_type": document_type,
            "fiscal_period": fiscal_period,
            "reporting_quarter": fiscal_period
        }
    )

    # Index into ChromaDB
    indexed_count = vector_store.add_chunks(chunks)

    # Save to SQLite
    doc = Document(
        id=doc_id,
        company_id=company_id,
        title=file.filename,
        document_type=document_type,
        fiscal_period=fiscal_period,
        local_path=str(local_path),
        content_hash=doc_hash,
        page_count=page_count,
        file_size_bytes=len(content),
        processing_status="indexed",
        chunk_count=indexed_count,
        raw_text=raw_text
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "message": "Document successfully ingested, chunked, and indexed in ChromaDB.",
        "document": doc.to_dict(),
        "chunksIndexed": indexed_count,
        "isDuplicate": False
    }
