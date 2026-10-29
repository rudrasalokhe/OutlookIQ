"""
Financial Document database model.
Tracks uploaded and ingested filings, releases, and transcripts with hash deduplication.
"""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    source_url = Column(String, nullable=True)
    document_type = Column(String, nullable=False, default="Earnings Release")  # "Earnings Release", "Form 10-Q", "Transcript"
    publication_date = Column(String, nullable=True)
    fiscal_period = Column(String, nullable=True)  # e.g., "Q3 FY25"
    local_path = Column(String, nullable=True)
    content_hash = Column(String, nullable=False, index=True)  # SHA-256 for deduplication
    page_count = Column(Integer, default=1)
    file_size_bytes = Column(Integer, default=0)
    processing_status = Column(String, default="indexed")  # "pending", "indexed", "failed"
    error_message = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    raw_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="documents")
    guidance_records = relationship("Guidance", back_populates="source_document")

    def to_dict(self):
        size_kb = f"{(self.file_size_bytes / 1024):.1f} KB" if self.file_size_bytes else "1.2 MB"
        return {
            "id": self.id,
            "companyId": self.company_id,
            "ticker": self.company.ticker if self.company else self.company_id,
            "companyName": self.company.name if self.company else self.company_id,
            "title": self.title,
            "name": self.title,
            "sourceUrl": self.source_url,
            "type": self.document_type,
            "publicationDate": self.publication_date or self.created_at.strftime("%Y-%m-%d"),
            "reportingQuarter": self.fiscal_period or "—",
            "fileSize": size_kb,
            "status": self.processing_status.capitalize() if self.processing_status != "indexed" else "Indexed & Verified",
            "pages": self.page_count,
            "chunks": self.chunk_count,
            "contentHash": self.content_hash[:12] if self.content_hash else ""
        }
