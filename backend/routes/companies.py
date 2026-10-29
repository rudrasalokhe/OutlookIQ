"""
Companies API Route.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models.company import Company

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("", response_model=List[dict])
def list_companies(db: Session = Depends(get_db)):
    """List all tracked corporate entities."""
    companies = db.query(Company).order_by(Company.name.asc()).all()
    return [c.to_dict() for c in companies]

@router.get("/{company_id}")
def get_company(company_id: str, db: Session = Depends(get_db)):
    """Fetch details for a single company by ID or ticker."""
    company = db.query(Company).filter(
        (Company.id == company_id.upper()) | (Company.ticker == company_id.upper())
    ).first()

    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ID or ticker '{company_id}' not found.")

    res = company.to_dict()
    # Attach available quarters
    quarters = list(set([g.target_period for g in company.guidance_records]))
    res["availableQuarters"] = sorted(quarters, reverse=True)
    return res
