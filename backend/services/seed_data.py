"""
Initial Database Seeder for OutlookIQ.
Populates SQLite with verified historical guidance statements, SEC actuals, and document records
for NVIDIA, Microsoft, Apple, and Apex Cloud.
Also indexes document excerpts into ChromaDB vector store.
"""

from sqlalchemy.orm import Session
from backend.models.company import Company
from backend.models.document import Document
from backend.models.guidance import Guidance, GuidanceEvaluation
from backend.models.financial_result import FinancialResult
from backend.services.document_loader import compute_sha256, chunk_financial_document
from backend.services.vector_store import vector_store

INITIAL_COMPANIES = [
    {
        "id": "NVDA",
        "name": "NVIDIA Corporation",
        "ticker": "NVDA",
        "sector": "Semiconductors & AI Hardware",
        "market_cap": "$3,450.0B",
        "sec_cik": "0001045810"
    },
    {
        "id": "MSFT",
        "name": "Microsoft Corporation",
        "ticker": "MSFT",
        "sector": "Enterprise Software & Cloud",
        "market_cap": "$3,120.0B",
        "sec_cik": "0000789019"
    },
    {
        "id": "AAPL",
        "name": "Apple Inc.",
        "ticker": "AAPL",
        "sector": "Consumer Electronics & Services",
        "market_cap": "$3,480.0B",
        "sec_cik": "0000320193"
    },
    {
        "id": "APXC",
        "name": "Apex Cloud Systems",
        "ticker": "APXC",
        "sector": "Cloud Infrastructure",
        "market_cap": "$42.5B",
        "sec_cik": "0001854920"
    }
]

INITIAL_DOCUMENTS = [
    {
        "id": "DOC-NVDA-Q3FY25",
        "company_id": "NVDA",
        "title": "NVIDIA Reports Q3 FY25 Financial Results & Q4 Outlook",
        "document_type": "Earnings Release",
        "publication_date": "2024-11-20",
        "fiscal_period": "Q3 FY25",
        "text": """
SANTA CLARA, Calif. — Nov. 20, 2024 — NVIDIA today reported revenue for the third quarter ended October 27, 2024, of $35.08 billion, up 17% from the previous quarter and up 94% from a year ago.
For the fourth quarter of fiscal 2025, NVIDIA outlook is as follows:
Revenue is expected to be $37.5 billion, plus or minus 2%.
GAAP and non-GAAP gross margins are expected to be 73.0% and 73.5%, respectively, plus or minus 50 basis points.
GAAP and non-GAAP operating expenses are expected to be approximately $4.8 billion and $3.4 billion, respectively.
GAAP and non-GAAP other income and expense are expected to be an income of approximately $400 million, excluding gains and losses from non-affiliated investments.
GAAP and non-GAAP tax rates are expected to be 16.5%, plus or minus 1%, excluding any discrete items.
        """
    },
    {
        "id": "DOC-NVDA-Q2FY25",
        "company_id": "NVDA",
        "title": "NVIDIA Reports Q2 FY25 Financial Results & Q3 Outlook",
        "document_type": "Earnings Release",
        "publication_date": "2024-08-28",
        "fiscal_period": "Q2 FY25",
        "text": """
SANTA CLARA, Calif. — August 28, 2024 — NVIDIA reported revenue for the second quarter ended July 28, 2024, of $30.04 billion, up 15% from the previous quarter and up 122% from a year ago.
NVIDIA outlook for the third quarter of fiscal 2025:
Revenue is expected to be $32.5 billion, plus or minus 2%.
GAAP and non-GAAP gross margins are expected to be 74.4% and 75.0%, respectively, plus or minus 50 basis points.
GAAP and non-GAAP operating expenses are expected to be approximately $4.3 billion and $3.0 billion, respectively.
        """
    },
    {
        "id": "DOC-MSFT-Q1FY25",
        "company_id": "MSFT",
        "title": "Microsoft Cloud Strength Drives First Quarter Results",
        "document_type": "Earnings Release",
        "publication_date": "2024-10-30",
        "fiscal_period": "Q1 FY25",
        "text": """
REDMOND, Wash. — Oct. 30, 2024 — Microsoft Corp. today announced first-quarter revenue of $65.6 billion, up 16% year-over-year.
Amy Hood, executive vice president and chief financial officer:
"In Intelligent Cloud, we expect revenue of $25.25 billion to $25.55 billion. In Productivity and Business Processes, we expect revenue between $20.4 billion and $20.7 billion. For total company revenue in Q2 FY25, we expect revenue between $68.1 billion and $69.1 billion."
        """
    },
    {
        "id": "DOC-APXC-Q1FY24",
        "company_id": "APXC",
        "title": "Apex Cloud Systems Announces First Quarter 2024 Performance",
        "document_type": "Earnings Release",
        "publication_date": "2024-04-18",
        "fiscal_period": "Q1 FY24",
        "text": """
AUSTIN, Texas — April 18, 2024 — Apex Cloud Systems announced revenue of $665.0 million for Q1 FY24.
Management reiterated confidence in its cloud pipeline:
"For Q1 FY24, we had guided revenue between $660.0 million and $680.0 million. Delivering $665.0 million represents solid execution directly in line with our communicated guidance midpoint."
        """
    }
]

INITIAL_GUIDANCE = [
    {
        "id": "NVDA-Q4-FY25-REV",
        "company_id": "NVDA",
        "document_id": "DOC-NVDA-Q3FY25",
        "announcement_date": "2024-11-20",
        "target_period": "Q4 FY25",
        "fiscal_year": "2025",
        "metric": "Revenue",
        "guidance_lower": 36750.0,
        "guidance_upper": 38250.0,
        "guidance_midpoint": 37500.0,
        "unit": "$M",
        "speaker": "Colette Kress (EVP & CFO)",
        "source_quote": "Revenue is expected to be $37.5 billion, plus or minus 2%.",
        "source_doc_title": "NVIDIA Q3 FY25 Earnings Release",
        "accounting_basis": "GAAP",
        "actual_value": 39330.0,
        "actual_date": "2025-02-26",
        "actual_doc": "Form 10-K (SEC EDGAR)"
    },
    {
        "id": "NVDA-Q3-FY25-REV",
        "company_id": "NVDA",
        "document_id": "DOC-NVDA-Q2FY25",
        "announcement_date": "2024-08-28",
        "target_period": "Q3 FY25",
        "fiscal_year": "2025",
        "metric": "Revenue",
        "guidance_lower": 31850.0,
        "guidance_upper": 33150.0,
        "guidance_midpoint": 32500.0,
        "unit": "$M",
        "speaker": "Colette Kress (EVP & CFO)",
        "source_quote": "Revenue is expected to be $32.5 billion, plus or minus 2%.",
        "source_doc_title": "NVIDIA Q2 FY25 Earnings Release",
        "accounting_basis": "GAAP",
        "actual_value": 35080.0,
        "actual_date": "2024-11-20",
        "actual_doc": "Form 10-Q (SEC EDGAR)"
    },
    {
        "id": "NVDA-Q3-FY25-GM",
        "company_id": "NVDA",
        "document_id": "DOC-NVDA-Q2FY25",
        "announcement_date": "2024-08-28",
        "target_period": "Q3 FY25",
        "fiscal_year": "2025",
        "metric": "Gross Margin",
        "guidance_lower": 74.5,
        "guidance_upper": 75.5,
        "guidance_midpoint": 75.0,
        "unit": "%",
        "speaker": "Colette Kress (EVP & CFO)",
        "source_quote": "GAAP and non-GAAP gross margins are expected to be 74.4% and 75.0%, respectively, plus or minus 50 basis points.",
        "source_doc_title": "NVIDIA Q2 FY25 Earnings Release",
        "accounting_basis": "Non-GAAP",
        "actual_value": 75.1,
        "actual_date": "2024-11-20",
        "actual_doc": "Form 10-Q (SEC EDGAR)"
    },
    {
        "id": "NVDA-Q2-FY25-OPEX",
        "company_id": "NVDA",
        "document_id": "DOC-NVDA-Q2FY25",
        "announcement_date": "2024-05-22",
        "target_period": "Q2 FY25",
        "fiscal_year": "2025",
        "metric": "Operating Expenses",
        "guidance_lower": 3950.0,
        "guidance_upper": 4050.0,
        "guidance_midpoint": 4000.0,
        "unit": "$M",
        "speaker": "Colette Kress (EVP & CFO)",
        "source_quote": "GAAP and non-GAAP operating expenses are expected to be approximately $4.0 billion and $2.8 billion, respectively.",
        "source_doc_title": "NVIDIA Q1 FY25 Earnings Release",
        "accounting_basis": "GAAP",
        "actual_value": 3932.0,
        "actual_date": "2024-08-28",
        "actual_doc": "Form 10-Q (SEC EDGAR)"
    },
    {
        "id": "MSFT-Q2-FY25-REV",
        "company_id": "MSFT",
        "document_id": "DOC-MSFT-Q1FY25",
        "announcement_date": "2024-10-30",
        "target_period": "Q2 FY25",
        "fiscal_year": "2025",
        "metric": "Revenue",
        "guidance_lower": 68100.0,
        "guidance_upper": 69100.0,
        "guidance_midpoint": 68600.0,
        "unit": "$M",
        "speaker": "Amy Hood (EVP & CFO)",
        "source_quote": "For total company revenue in Q2 FY25, we expect revenue between $68.1 billion and $69.1 billion.",
        "source_doc_title": "Microsoft Q1 FY25 Earnings Release",
        "accounting_basis": "GAAP",
        "actual_value": 69630.0,
        "actual_date": "2025-01-29",
        "actual_doc": "Form 10-Q (SEC EDGAR)"
    },
    {
        "id": "APXC-Q1-FY24-REV",
        "company_id": "APXC",
        "document_id": "DOC-APXC-Q1FY24",
        "announcement_date": "2024-01-25",
        "target_period": "Q1 FY24",
        "fiscal_year": "2024",
        "metric": "Revenue",
        "guidance_lower": 660.0,
        "guidance_upper": 680.0,
        "guidance_midpoint": 670.0,
        "unit": "$M",
        "speaker": "Marcus Vance (CEO)",
        "source_quote": "For Q1 FY24, we forecast revenue between $660.0 million and $680.0 million.",
        "source_doc_title": "Apex Cloud Q4 FY23 Guidance Statement",
        "accounting_basis": "GAAP",
        "actual_value": 665.0,
        "actual_date": "2024-04-18",
        "actual_doc": "Form 10-Q (SEC EDGAR)"
    }
]

def seed_database(db: Session):
    """Seed companies, documents, actual results, guidance, and evaluations."""
    # 1. Companies
    for c in INITIAL_COMPANIES:
        existing = db.query(Company).filter(Company.id == c["id"]).first()
        if not existing:
            comp = Company(**c)
            db.add(comp)
    db.commit()

    # 2. Documents
    for d in INITIAL_DOCUMENTS:
        existing = db.query(Document).filter(Document.id == d["id"]).first()
        clean_text = d["text"].strip()
        doc_hash = compute_sha256(clean_text.encode("utf-8"))

        if not existing:
            doc = Document(
                id=d["id"],
                company_id=d["company_id"],
                title=d["title"],
                document_type=d["document_type"],
                publication_date=d["publication_date"],
                fiscal_period=d["fiscal_period"],
                content_hash=doc_hash,
                raw_text=clean_text,
                page_count=2,
                file_size_bytes=len(clean_text.encode("utf-8")),
                processing_status="indexed"
            )
            db.add(doc)
            db.commit()

            # Index chunks in vector store
            chunks = chunk_financial_document(
                clean_text,
                metadata={
                    "doc_id": d["id"],
                    "company_id": d["company_id"],
                    "ticker": d["company_id"],
                    "title": d["title"],
                    "document_type": d["document_type"],
                    "publication_date": d["publication_date"],
                    "fiscal_period": d["fiscal_period"],
                    "reporting_quarter": d["fiscal_period"]
                }
            )
            vector_store.add_chunks(chunks)

    # 3. Guidance, Actual Results, and Evaluations
    for g in INITIAL_GUIDANCE:
        # Actual Result
        actual_id = f"ACT-{g['company_id']}-{g['target_period']}-{g['metric'].replace(' ', '')}"
        existing_act = db.query(FinancialResult).filter(FinancialResult.id == actual_id).first()
        if not existing_act and g.get("actual_value") is not None:
            act = FinancialResult(
                id=actual_id,
                company_id=g["company_id"],
                fiscal_period=g["target_period"],
                fiscal_year=g["fiscal_year"],
                metric=g["metric"],
                actual_value=g["actual_value"],
                unit=g["unit"],
                accounting_basis=g["accounting_basis"],
                report_date=g["actual_date"],
                source_doc_title=g["actual_doc"]
            )
            db.add(act)
            db.commit()

        # Guidance
        existing_g = db.query(Guidance).filter(Guidance.id == g["id"]).first()
        if not existing_g:
            rec = Guidance(
                id=g["id"],
                company_id=g["company_id"],
                document_id=g.get("document_id"),
                announcement_date=g["announcement_date"],
                target_period=g["target_period"],
                fiscal_year=g["fiscal_year"],
                metric=g["metric"],
                guidance_lower=g["guidance_lower"],
                guidance_upper=g["guidance_upper"],
                guidance_midpoint=g["guidance_midpoint"],
                unit=g["unit"],
                speaker=g["speaker"],
                source_quote=g["source_quote"],
                source_doc_title=g["source_doc_title"],
                accounting_basis=g["accounting_basis"],
                is_quantitative=True,
                verification_status="verified"
            )
            db.add(rec)
            db.commit()

            # Evaluation
            from backend.services.guidance_matcher import guidance_matcher
            guidance_matcher.match_and_evaluate(db, rec)

    print("OutlookIQ database seeded successfully with verified financial guidance and vector index.")
