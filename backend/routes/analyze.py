"""
Financial Analysis & Guidance Extraction Execution Route.
Accepts company and reporting period, runs RAG extraction, links SEC actuals, and updates evaluations.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Optional, List
from backend.database import get_db
from backend.models.company import Company
from backend.models.document import Document
from backend.models.guidance import Guidance
from backend.models.financial_result import FinancialResult
from backend.services.guidance_extractor import guidance_extractor
from backend.services.guidance_matcher import guidance_matcher
from backend.services.sec_client import sec_client

router = APIRouter(prefix="/analyze", tags=["Analysis"])

class AnalyzeRequest(BaseModel):
    company: str = Field(..., description="Company ticker or ID, e.g. NVDA")
    reporting_period: str = Field(default="Q4 FY25", description="Target reporting quarter, e.g. Q4 FY25")
    fetch_sec_actuals: bool = Field(default=True, description="Whether to query SEC EDGAR for reported results")

@router.post("")
async def analyze_company_period(req: AnalyzeRequest, db: Session = Depends(get_db)):
    """
    Execute end-to-end guidance extraction and actuals matching workflow
    for a company and reporting period.
    """
    ticker = req.company.upper()
    comp = db.query(Company).filter((Company.id == ticker) | (Company.ticker == ticker)).first()
    if not comp:
        raise HTTPException(status_code=404, detail=f"Company '{ticker}' not found.")

    # 1. Fetch available indexed documents for this company
    docs = db.query(Document).filter(Document.company_id == comp.id).all()
    if not docs:
        raise HTTPException(
            status_code=400,
            detail=f"No indexed documents found for {comp.name} ({ticker}). Please upload an earnings release first."
        )

    # 2. Extract guidance from the documents
    extracted_items = []
    for doc in docs:
        if doc.raw_text:
            items = guidance_extractor.extract_from_text(
                text=doc.raw_text,
                ticker=ticker,
                target_period=req.reporting_period,
                announcement_date=doc.publication_date or "2024-11-20"
            )
            for item in items:
                item["source_doc_id"] = doc.id
                item["source_doc_title"] = doc.title
                extracted_items.append(item)

    # 3. If SEC actuals requested, attempt SEC facts retrieval
    sec_metrics_found = []
    if req.fetch_sec_actuals and comp.sec_cik:
        try:
            facts = await sec_client.get_company_facts(ticker)
            sec_metrics = sec_client.extract_quarterly_metrics(facts)
            for sm in sec_metrics:
                if sm["target_period"].lower() == req.reporting_period.lower():
                    # Persist actual result in database
                    actual_id = f"ACT-{ticker}-{sm['target_period']}-{sm['metric']}"
                    existing_act = db.query(FinancialResult).filter(FinancialResult.id == actual_id).first()
                    if not existing_act:
                        act = FinancialResult(
                            id=actual_id,
                            company_id=comp.id,
                            fiscal_period=sm["target_period"],
                            fiscal_year=sm["fiscal_year"],
                            metric=sm["metric"],
                            actual_value=sm["actual_value"],
                            unit=sm["unit"],
                            accounting_basis="GAAP",
                            report_date=sm["filed_date"],
                            source_doc_title=f"Form {sm['form']} (SEC EDGAR)"
                        )
                        db.add(act)
                        db.commit()
                    sec_metrics_found.append(sm)
        except Exception as e:
            print(f"SEC lookup note for {ticker}: {e}")

    # 4. Save and Match Guidance Records
    created_evaluations = []
    for item in extracted_items:
        g_id = f"{ticker}-{req.reporting_period.replace(' ', '')}-{item['metric'].replace(' ', '')}"
        guidance = db.query(Guidance).filter(Guidance.id == g_id).first()
        if not guidance:
            guidance = Guidance(
                id=g_id,
                company_id=comp.id,
                document_id=item.get("source_doc_id"),
                announcement_date=item["announcement_date"],
                target_period=item["target_period"],
                fiscal_year=item["fiscal_year"],
                metric=item["metric"],
                guidance_lower=item["guidance_lower"],
                guidance_upper=item["guidance_upper"],
                guidance_midpoint=item["guidance_midpoint"],
                unit=item["unit"],
                speaker=item.get("speaker", "Management"),
                source_quote=item["source_quote"],
                source_doc_title=item.get("source_doc_title"),
                accounting_basis=item.get("accounting_basis", "GAAP"),
                verification_status="verified"
            )
            db.add(guidance)
            db.commit()

        # Run deterministic matching and evaluation
        evaluation = guidance_matcher.match_and_evaluate(db, guidance)
        created_evaluations.append(guidance.to_dict())

    return {
        "status": "success",
        "company": comp.to_dict(),
        "reportingPeriod": req.reporting_period,
        "guidanceExtractedCount": len(extracted_items),
        "evaluations": created_evaluations,
        "secActualsQueried": len(sec_metrics_found)
    }
