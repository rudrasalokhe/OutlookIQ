"""
Company database model.
"""

from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, index=True)  # e.g., "NVDA" or "APXC"
    name = Column(String, nullable=False)
    ticker = Column(String, nullable=False, unique=True, index=True)
    sector = Column(String, nullable=False)
    market_cap = Column(String, default="—")
    sec_cik = Column(String, nullable=True)  # SEC Central Index Key, e.g. "0001045810" for NVIDIA
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="company", cascade="all, delete-orphan")
    guidance_records = relationship("Guidance", back_populates="company", cascade="all, delete-orphan")
    financial_results = relationship("FinancialResult", back_populates="company", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "ticker": self.ticker,
            "sector": self.sector,
            "marketCap": self.market_cap,
            "secCik": self.sec_cik,
            "guidanceCount": len(self.guidance_records) if self.guidance_records else 0,
            "coverageActive": True
        }
