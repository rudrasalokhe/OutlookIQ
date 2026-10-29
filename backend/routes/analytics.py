"""
Guidance Analytics & KPI API Route.
Calculates aggregate accuracy metrics, bias trends, and Chart.js series data.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models.guidance import Guidance
from backend.models.company import Company
from backend.services.calculations import calculate_portfolio_kpis

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(
    company_id: Optional[str] = Query(None, alias="company_id"),
    fiscal_year: Optional[str] = Query(None, alias="fiscal_year"),
    db: Session = Depends(get_db)
):
    """Return portfolio guidance KPIs and historical analytics."""
    query = db.query(Guidance).join(Company)

    if company_id and company_id != "ALL":
        query = query.filter((Company.id == company_id.upper()) | (Company.ticker == company_id.upper()))
    if fiscal_year and fiscal_year != "ALL":
        query = query.filter(Guidance.fiscal_year == str(fiscal_year))

    records = [g.to_dict() for g in query.all()]
    kpis = calculate_portfolio_kpis(records)

    return {
        "kpis": kpis,
        "promises": records,
        "totalEvaluations": len(records),
        "coverage": {
            "companiesCount": len(set(r["companyId"] for r in records)),
            "fiscalYears": sorted(list(set(r["fiscalYear"] for r in records)))
        }
    }
