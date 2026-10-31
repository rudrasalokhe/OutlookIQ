"""
Integration tests for FastAPI REST API endpoints.
Tests route handlers directly with verified SessionLocal database dependency,
avoiding thread/socket portal deadlocks.
"""

import pytest
from backend.database import SessionLocal, Base, engine
from backend.services.seed_data import seed_database
from backend.models.company import Company
from backend.routes.health import check_health
from backend.routes.companies import list_companies, get_company
from backend.routes.promises import list_promises, get_promise
from backend.routes.analytics import get_analytics
from backend.routes.comparison import compare_companies
from backend.routes.chat import chat_with_rag, ChatRequest


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Company).count() == 0:
            seed_database(db)
        yield db
    finally:
        db.close()


def test_health_endpoints(db_session):
    res = check_health(db_session)
    assert res["status"] == "healthy"
    assert "mode" in res
    assert "course_accreditation" in res
    assert "Pinecone and LangGraph" in res["course_accreditation"]


def test_companies_endpoint(db_session):
    companies = list_companies(db=db_session)
    assert len(companies) >= 1
    tickers = [c["ticker"] for c in companies]
    assert "NVDA" in tickers

    nvda = get_company("NVDA", db=db_session)
    assert nvda["ticker"] == "NVDA"
    assert "sector" in nvda


def test_promises_endpoint(db_session):
    promises = list_promises(company_id="NVDA", metric=None, fiscal_year=None, outcome=None, db=db_session)
    assert len(promises) >= 1
    for p in promises:
        assert p["ticker"] == "NVDA"
        assert "guidanceMidpoint" in p

    p_id = promises[0]["id"]
    p_detail = get_promise(p_id, db=db_session)
    assert p_detail["id"] == p_id


def test_analytics_endpoint(db_session):
    data = get_analytics(company_id=None, fiscal_year=None, db=db_session)
    assert "kpis" in data
    assert "totalEvaluations" in data


def test_comparison_endpoint(db_session):
    comp = compare_companies(company_a="NVDA", company_b="MSFT", metric="Revenue", db=db_session)
    assert "companyA" in comp
    assert "companyB" in comp
    assert comp["companyA"]["ticker"] == "NVDA"
    assert comp["companyB"]["ticker"] == "MSFT"


def test_chat_rag_endpoint(db_session):
    req = ChatRequest(question="Did NVIDIA exceed its revenue guidance?")
    ans = chat_with_rag(req, db=db_session)
    assert "answer" in ans
    assert len(ans["answer"]) > 10
    assert "citations" in ans
    assert "telemetry" in ans
    telemetry = ans["telemetry"]
    assert "Pinecone and LangGraph" in telemetry["course"]
    assert "LangGraph" in telemetry["agentic_framework"]
