"""
Unit & Integration Tests for:
'RAG Systems & Agentic Workflows with Pinecone and LangGraph'

Verifies:
1. LangGraph StateGraph compilation and schema integrity.
2. Pinecone vector service initialization, metadata preservation, and status reporting.
3. Node-by-node execution across analyze_intent, retrieve_pinecone, grade_documents, generate_grounded_answer, and hallucination_check.
4. End-to-end execution trace and zero-hallucination verification telemetry.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.services.pinecone_service import pinecone_service
from backend.services.agentic_workflow import langgraph_agent, FinancialAgentState, analyze_intent_node, grade_documents_node
from backend.services.seed_data import seed_database


@pytest.fixture(scope="module")
def test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    db = TestingSession()
    seed_database(db)
    yield db
    db.close()


def test_pinecone_service_status():
    """Verify Pinecone service returns course accreditation metadata."""
    status = pinecone_service.get_status()
    assert "course" in status
    assert "Pinecone and LangGraph" in status["course"]
    assert "index_name" in status
    assert status["dimension"] == 384
    assert status["metric"] == "cosine"


def test_langgraph_intent_decomposition():
    """Test LangGraph node 1: Entity extraction & multi-query decomposition."""
    state = {
        "query": "Did NVIDIA meet its Q3 FY25 Revenue guidance?",
        "sub_queries": [],
        "company_ticker": None,
        "metric": None,
        "fiscal_year": None,
        "raw_documents": [],
        "graded_documents": [],
        "database_guidance": [],
        "database_actuals": [],
        "citations": [],
        "final_response": "",
        "model_name": "",
        "hallucination_score": 100.0,
        "hallucination_status": "PENDING",
        "traversed_nodes": [],
        "node_timings": {},
        "execution_trace": [],
        "error": None
    }
    result = analyze_intent_node(state)
    assert result["company_ticker"] == "NVDA"
    assert result["metric"] == "Revenue"
    assert result["fiscal_year"] == "2025"
    assert len(result["sub_queries"]) >= 2
    assert "analyze_intent" in result["traversed_nodes"]


def test_langgraph_grading_reflection():
    """Test LangGraph node 3: Agentic document relevance grading."""
    mock_docs = [
        {"id": "doc1", "text": "NVIDIA revenue for Q3 was 35.1 billion exceeding outlook", "metadata": {"ticker": "NVDA"}},
        {"id": "doc2", "text": "Unrelated macro weather report", "metadata": {"ticker": "OTHER"}}
    ]
    state = {
        "company_ticker": "NVDA",
        "metric": "Revenue",
        "raw_documents": mock_docs,
        "traversed_nodes": [],
        "node_timings": {},
        "execution_trace": []
    }
    result = grade_documents_node(state)
    graded = result["graded_documents"]
    assert len(graded) >= 1
    assert graded[0]["id"] == "doc1"
    assert "grade_documents" in result["traversed_nodes"]


def test_end_to_end_langgraph_execution(test_db):
    """Test full LangGraph Agentic Workflow with Pinecone / Hybrid retrieval."""
    query = "What was NVIDIA's revenue guidance and outcome for Q3 FY25?"
    result = langgraph_agent.run(query, test_db)

    assert result["answer"] is not None
    assert len(result["answer"]) > 20
    assert "course_metadata" in result
    meta = result["course_metadata"]
    assert "LangGraph" in meta["framework"]
    assert "Pinecone" in meta["vector_database"]

    # Verify traversed nodes
    traversed = meta["traversed_nodes"]
    assert "analyze_intent" in traversed
    assert "retrieve_pinecone" in traversed
    assert "grade_documents" in traversed
    assert "generate_grounded_answer" in traversed
    assert "hallucination_check" in traversed

    # Verify hallucination check
    assert result["hallucination_score"] >= 80.0
    assert result["hallucination_status"] in ["VERIFIED_GROUNDED", "GROUNDING_NOTICE"]

