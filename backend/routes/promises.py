"""
Guidance Promises & Ledger API Route.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models.guidance import Guidance
from backend.models.company import Company

router = APIRouter(prefix="/promises", tags=["Promises"])

@router.get("", response_model=List[dict])
def list_promises(
    company_id: Optional[str] = Query(None, alias="company_id"),
    metric: Optional[str] = Query(None),
    fiscal_year: Optional[str] = Query(None, alias="fiscal_year"),
    outcome: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    List guidance promise records with multi-dimensional filtering.
    Compatible with existing frontend fields.
    """
    query = db.query(Guidance).join(Company)

    if company_id and company_id != "ALL":
        query = query.filter((Company.id == company_id.upper()) | (Company.ticker == company_id.upper()))
    if metric and metric != "ALL":
        query = query.filter(Guidance.metric == metric)
    if fiscal_year and fiscal_year != "ALL":
        query = query.filter(Guidance.fiscal_year == str(fiscal_year))

    records = query.order_by(Guidance.announcement_date.desc()).all()
    results = [g.to_dict() for g in records]

    if outcome and outcome != "ALL":
        results = [r for r in results if r.get("outcome", "").lower() == outcome.lower()]

    return results

@router.get("/{promise_id}")
def get_promise(promise_id: str, db: Session = Depends(get_db)):
    """Retrieve full audit trail, source quote, and evaluation details for a guidance record."""
    guidance = db.query(Guidance).filter(Guidance.id == promise_id).first()
    if not guidance:
        raise HTTPException(status_code=404, detail=f"Guidance record '{promise_id}' not found.")
    return guidance.to_dict()
