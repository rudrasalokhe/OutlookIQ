"""
Unit tests for ChromaDB vector store indexing and semantic retrieval.
"""

from backend.services.vector_store import VectorStore

def test_vector_store_indexing_and_query(tmp_path):
    # Use isolated test directory for ChromaDB
    vs = VectorStore(persist_dir=str(tmp_path / "test_chroma"))

    test_chunks = [
        {
            "chunk_id": "TEST-NVDA-1",
            "text": "NVIDIA anticipates Q4 FY25 revenue of thirty-seven billion dollars driven by Hopper and Blackwell.",
            "metadata": {"company_id": "NVDA", "ticker": "NVDA", "fiscal_year": "2025", "document_type": "Earnings Release"}
        },
        {
            "chunk_id": "TEST-MSFT-1",
            "text": "Microsoft Azure cloud services revenue grew by thirty-three percent in the first quarter.",
            "metadata": {"company_id": "MSFT", "ticker": "MSFT", "fiscal_year": "2025", "document_type": "Earnings Release"}
        }
    ]

    added = vs.add_chunks(test_chunks)
    assert added == 2
    assert vs.count() == 2

    # Query with company filter
    nvda_res = vs.query("Blackwell AI chip revenue", n_results=2, company_id="NVDA")
    assert len(nvda_res) >= 1
    assert nvda_res[0]["metadata"]["company_id"] == "NVDA"
    assert "Hopper" in nvda_res[0]["text"]
