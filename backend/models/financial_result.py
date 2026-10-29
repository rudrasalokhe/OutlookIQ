"""
Actual Financial Result database model.
Stores audited numbers extracted from SEC filings or official earnings announcements.
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class FinancialResult(Base):
    __tablename__ = "financial_results"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    fiscal_period = Column(String, nullable=False, index=True)  # e.g., "Q3 FY25"
    fiscal_year = Column(String, nullable=False, index=True)   # e.g., "2025"
    metric = Column(String, nullable=False, index=True)         # "Revenue", "Gross Margin", "Diluted EPS", "Operating Expenses"

    actual_value = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="$M")
    accounting_basis = Column(String, default="GAAP")           # "GAAP" or "Non-GAAP"
    report_date = Column(String, nullable=False)                # ISO date string e.g. "2025-02-26"
    source_doc_title = Column(String, nullable=False)           # e.g. "Form 10-Q (SEC EDGAR)"
    filing_reference = Column(Text, nullable=True)              # e.g. "Item 1 Financial Statements - Condensed Consolidated Statements of Income"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="financial_results")
    evaluations = relationship("GuidanceEvaluation", back_populates="actual_result")

    def to_dict(self):
        return {
            "id": self.id,
            "companyId": self.company_id,
            "fiscalPeriod": self.fiscal_period,
            "fiscalYear": self.fiscal_year,
            "metric": self.metric,
            "actualValue": self.actual_value,
            "unit": self.unit,
            "accountingBasis": self.accounting_basis,
            "reportDate": self.report_date,
            "sourceDocTitle": self.source_doc_title,
            "filingReference": self.filing_reference
        }
