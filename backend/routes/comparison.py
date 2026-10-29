"""
Company Comparison API Route.
Compares forecasting track records and actual performance between two companies.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.company import Company
from backend.models.guidance import Guidance
from backend.services.calculations import calculate_portfolio_kpis

router = APIRouter(prefix="/comparison", tags=["Comparison"])

@router.get("")
def compare_companies(
    company_a: str = Query(..., description="First company ticker or ID"),
    company_b: str = Query(..., description="Second company ticker or ID"),
    metric: str = Query("Revenue", description="Metric to compare"),
    db: Session = Depends(get_db)
):
    """Compare two companies on forecasting accuracy and guidance fulfillment."""
    compA = db.query(Company).filter(
        (Company.id == company_a.upper()) | (Company.ticker == company_a.upper())
    ).first()
    compB = db.query(Company).filter(
        (Company.id == company_b.upper()) | (Company.ticker == company_b.upper())
    ).first()

    if not compA or not compB:
        raise HTTPException(status_code=404, detail="One or both companies not found.")

    promisesA = [g.to_dict() for g in compA.guidance_records]
    promisesB = [g.to_dict() for g in compB.guidance_records]

    kpisA = calculate_portfolio_kpis(promisesA)
    kpisB = calculate_portfolio_kpis(promisesB)

    # Find common reporting quarters
    validA = [p for p in promisesA if p["metric"] == metric and p["actual"] is not None]
    validB = [p for p in promisesB if p["metric"] == metric and p["actual"] is not None]

    quartersA = set(p["targetQuarter"] for p in validA)
    common_quarters = sorted(list(set(p["targetQuarter"] for p in validB if p["targetQuarter"] in quartersA)))

    return {
        "companyA": {
            **compA.to_dict(),
            "kpis": kpisA,
            "promises": promisesA
        },
        "companyB": {
            **compB.to_dict(),
            "kpis": kpisB,
            "promises": promisesB
        },
        "metric": metric,
        "commonQuarters": common_quarters
    }
