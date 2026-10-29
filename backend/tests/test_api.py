"""
Integration tests for FastAPI REST API endpoints using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, Base, engine
from backend.services.seed_data import seed_database
from backend.models.company import Company

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Company).count() == 0:
            seed_database(db)
    finally:
        db.close()

def test_health_endpoints():
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

        api_res = client.get("/api/health")
        assert api_res.status_code == 200
        assert "mode" in api_res.json()

def test_companies_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/companies")
        assert res.status_code == 200
        companies = res.json()
        assert len(companies) >= 1
        tickers = [c["ticker"] for c in companies]
        assert "NVDA" in tickers

def test_promises_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/promises?company_id=NVDA")
        assert res.status_code == 200
        promises = res.json()
        assert len(promises) >= 1
        for p in promises:
            assert p["ticker"] == "NVDA"
            assert "guidanceMidpoint" in p

def test_analytics_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/analytics")
        assert res.status_code == 200
        data = res.json()
        assert "kpis" in data
        assert "totalEvaluations" in data

def test_comparison_endpoint():
    with TestClient(app) as client:
        res = client.get("/api/comparison?company_a=NVDA&company_b=MSFT&metric=Revenue")
        assert res.status_code == 200
        comp = res.json()
        assert "companyA" in comp
        assert "companyB" in comp
        assert comp["companyA"]["ticker"] == "NVDA"
        assert comp["companyB"]["ticker"] == "MSFT"

def test_chat_rag_endpoint():
    with TestClient(app) as client:
        res = client.post("/api/chat", json={"question": "Did NVIDIA exceed its revenue guidance?"})
        assert res.status_code == 200
        ans = res.json()
        assert "answer" in ans
        assert "citations" in ans
        assert "confidence" in ans
