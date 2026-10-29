"""
Management Guidance database model and Evaluation model.
Captures original forward-looking statements, corridors, and evaluation outcomes.
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base

class Guidance(Base):
    __tablename__ = "guidance"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True, index=True)

    announcement_date = Column(String, nullable=False)  # ISO date string e.g. "2024-11-20"
    target_period = Column(String, nullable=False, index=True)  # e.g. "Q4 FY25"
    fiscal_year = Column(String, nullable=False, index=True)   # e.g. "2025"
    metric = Column(String, nullable=False, index=True)         # "Revenue", "Gross Margin", "Diluted EPS", "Operating Expenses"

    guidance_lower = Column(Float, nullable=False)
    guidance_upper = Column(Float, nullable=False)
    guidance_midpoint = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="$M")         # "$M", "%", "$", etc.

    speaker = Column(String, nullable=True)                     # e.g. "Colette Kress (CFO)"
    source_quote = Column(Text, nullable=False)                 # Exact quote from transcript or release
    source_doc_title = Column(String, nullable=True)
    accounting_basis = Column(String, default="GAAP")           # "GAAP" or "Non-GAAP"
    is_quantitative = Column(Boolean, default=True)
    verification_status = Column(String, default="verified")    # "verified", "pending", "unverifiable"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="guidance_records")
    source_document = relationship("Document", back_populates="guidance_records")
    evaluation = relationship("GuidanceEvaluation", back_populates="guidance", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        eval_dict = self.evaluation.to_dict() if self.evaluation else {}
        return {
            "id": self.id,
            "companyId": self.company_id,
            "companyName": self.company.name if self.company else self.company_id,
            "ticker": self.company.ticker if self.company else self.company_id,
            "metric": self.metric,
            "targetQuarter": self.target_period,
            "fiscalYear": self.fiscal_year,
            "announcementDate": self.announcement_date,
            "guidanceLower": self.guidance_lower,
            "guidanceUpper": self.guidance_upper,
            "guidanceMidpoint": self.guidance_midpoint,
            "unit": self.unit,
            "speaker": self.speaker or "Management",
            "sourceDocTitle": self.source_doc_title or (self.source_document.title if self.source_document else "Earnings Release"),
            "sourceDocId": self.document_id,
            "transcriptExcerpt": self.source_quote,
            "accountingBasis": self.accounting_basis,
            "status": "evaluated" if self.evaluation and self.evaluation.outcome != "Pending" else "pending",
            "verificationState": self.verification_status,
            # Merged evaluation fields for existing frontend compatibility:
            "actual": eval_dict.get("actualValue"),
            "outcome": eval_dict.get("outcome", "Pending"),
            "deviationPct": eval_dict.get("percentageDeviation"),
            "deviationAbs": eval_dict.get("absoluteDeviation"),
            "explanation": eval_dict.get("explanation", ""),
            "actualSourceDocTitle": eval_dict.get("actualSourceDocTitle"),
            "reportDate": eval_dict.get("reportDate")
        }


class GuidanceEvaluation(Base):
    __tablename__ = "guidance_evaluations"

    id = Column(String, primary_key=True, index=True)
    guidance_id = Column(String, ForeignKey("guidance.id"), nullable=False, unique=True, index=True)
    actual_result_id = Column(String, ForeignKey("financial_results.id"), nullable=True)

    absolute_deviation = Column(Float, nullable=True)
    percentage_deviation = Column(Float, nullable=True)
    outcome = Column(String, nullable=False, default="Pending")  # "Exceeded", "Met", "Missed", "Pending", "Unverifiable"
    explanation = Column(Text, nullable=True)
    policy_applied = Column(String, default="Standard Corridor Tolerance")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    guidance = relationship("Guidance", back_populates="evaluation")
    actual_result = relationship("FinancialResult", back_populates="evaluations")

    def to_dict(self):
        act = self.actual_result
        return {
            "id": self.id,
            "guidanceId": self.guidance_id,
            "actualResultId": self.actual_result_id,
            "actualValue": act.actual_value if act else None,
            "absoluteDeviation": self.absolute_deviation,
            "percentageDeviation": self.percentage_deviation,
            "outcome": self.outcome,
            "explanation": self.explanation,
            "policyApplied": self.policy_applied,
            "actualSourceDocTitle": act.source_doc_title if act else None,
            "reportDate": act.report_date if act else None
        }
