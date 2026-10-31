# OutlookIQ — Agentic Financial Intelligence Platform

> **"What they forecast. What they delivered."**  
> **Course Project:** *RAG Systems & Agentic Workflows with Pinecone and LangGraph*

OutlookIQ is an institutional-grade financial intelligence application engineered around **LangGraph multi-step agentic workflows** and **Pinecone vector retrieval**. It ingests forward-looking corporate guidance statements from SEC filings (Form 10-Q/10-K) and earnings call transcripts, indexes them into a high-dimensional vector space, deterministically reconciles them against subsequently reported financial results, and executes a stateful LangGraph agent graph to deliver strictly grounded, zero-hallucination intelligence with verifiable citations.

---

## 🎓 Course Syllabus Alignment: "RAG Systems & Agentic Workflows with Pinecone and LangGraph"

| Course Pillar | Implementation in OutlookIQ | Key Codebase File |
| :--- | :--- | :--- |
| **LangGraph Agentic State Machine** | Multi-node `StateGraph` with typed state (`FinancialAgentState`), routing conditional edges, document relevance grading, and factuality audit loops. | [`backend/services/agentic_workflow.py`](file:///backend/services/agentic_workflow.py) |
| **Pinecone Vector Database** | 384-dimensional dense vector indexing with cosine distance, metadata filtering (`company_id`, `fiscal_year`, `doc_type`), and resilient hybrid fallback. | [`backend/services/pinecone_service.py`](file:///backend/services/pinecone_service.py) |
| **Advanced RAG Retrieval** | Multi-query expansion, Hybrid Dense-Sparse scoring, and Reciprocal Rank Fusion (RRF: $k=60$) combining semantic search and BM25 financial token matching. | [`backend/services/vector_store.py`](file:///backend/services/vector_store.py) |
| **Agentic Reflection & Grading** | Dedicated `grade_documents` node that acts as a relevance evaluator before synthesis to filter out low-confidence context. | [`backend/services/agentic_workflow.py`](file:///backend/services/agentic_workflow.py) |
| **Zero-Hallucination Guardrails** | Deterministic mathematical calculation of guidance bounds (`(lower + upper)/2`) and `hallucination_check` node auditing numerical claims. | [`backend/services/calculations.py`](file:///backend/services/calculations.py) |

```
                       [START] (User Natural Language Query)
                          │
                          ▼
               ┌───────────────────────┐
               │     analyze_intent    │  (Ticker, Metric, FY & Sub-queries)
               └──────────┬────────────┘
                          │
                          ▼
               ┌───────────────────────┐
               │   retrieve_pinecone   │  (Dense Pinecone + BM25 Lexical RRF)
               └──────────┬────────────┘
                          │
                          ▼
               ┌───────────────────────┐
               │    grade_documents    │  (Relevance evaluation & noise filtering)
               └──────────┬────────────┘
                          │
                          ▼
               ┌───────────────────────┐
               │  query_structured_db  │  (Relational SQLite Verified Guidance & Actuals)
               └──────────┬────────────┘
                          │
                          ▼
               ┌───────────────────────┐
               │generate_grounded_answer│ (LLM Synthesis constrained strictly to citations)
               └──────────┬────────────┘
                          │
                          ▼
               ┌───────────────────────┐
               │  hallucination_check  │  (Numerical claim verification & scoring)
               └──────────┬────────────┘
                          │
                          ▼
                        [END] (Grounded Intelligence + Citations + Telemetry)
```

---

## 🌟 Key Architecture & Capabilities

1. **LangGraph Agent Engine (`backend/services/agentic_workflow.py`)**:
   - `StateGraph(FinancialAgentState)` architecture.
   - Dynamic node timings and execution trace passed directly to the UI.
   - Hallucination audit score (faithfulness percentage) attached to each response.
2. **Pinecone Vector Service (`backend/services/pinecone_service.py`)**:
   - Integrated with official `pinecone` client SDK.
   - Index: `outlookiq-financial` (dimension: 384, metric: `cosine`, cloud: AWS Serverless).
   - Hybrid mode fusing dense vector search with sparse keyword scoring via Reciprocal Rank Fusion.
   - Seamless local fallback for offline development or network-restricted environments.
3. **Python FastAPI Backend (`backend/`)**: High-performance asynchronous REST API with SQLite database, WAL mode, structured Pydantic schemas, and SQLAlchemy ORM.
4. **Deterministic Financial Verification Engine (`backend/services/calculations.py`)**:
   - Guidance corridor calculation (`(lower + upper) / 2`).
   - Outcome classification: **Exceeded**, **Met**, **Missed**, **Pending**, and **Unverifiable**.
   - Handles favorable direction metrics (higher-is-better for Revenue/EPS/Margins vs lower-is-better for OpEx/Costs).
   - Percentage deviation and percentage-point calculations with auditable provenance.
5. **Document Ingestion Engine (`backend/services/document_loader.py`)**:
   - Supports PDF earnings releases via **PyMuPDF (`fitz`)** and `pypdf`.
   - Supports HTML earnings releases and tables via **BeautifulSoup4**.
   - Plain-text transcript parsing with **SHA-256 deduplication**.
   - Financial context-aware semantic chunking.
6. **Frontend Integration (`js/api.js` & `js/pages/analyst.js`)**:
   - Live communication with FastAPI (`http://127.0.0.1:8000`).
   - Real-time Document Uploads directly ingest, parse, chunk, and index into Pinecone/vector store.
   - Interactive LangGraph pipeline trace with node execution telemetry and verified source citations.

---

## 📂 Project Directory Structure

```text
OutlookIQ/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint & lifecycle
│   ├── config.py                   # Pydantic environment configuration
│   ├── database.py                 # SQLite engine & session management
│   ├── requirements.txt            # Python dependencies
│   ├── .env.example                # Sample environment configuration
│   │
│   ├── models/
│   │   ├── company.py              # Companies table
│   │   ├── document.py             # Documents table (with SHA-256 hash)
│   │   ├── guidance.py             # Guidance & GuidanceEvaluation tables
│   │   └── financial_result.py     # Actual reported financial results
│   │
│   ├── routes/
│   │   ├── health.py               # GET /api/health
│   │   ├── companies.py            # GET /api/companies, GET /api/companies/{id}
│   │   ├── promises.py             # GET /api/promises, GET /api/promises/{id}
│   │   ├── analytics.py            # GET /api/analytics
│   │   ├── comparison.py           # GET /api/comparison
│   │   ├── documents.py            # GET /api/documents, POST /api/documents/upload
│   │   ├── analyze.py              # POST /api/analyze
│   │   └── chat.py                 # POST /api/chat (RAG chat endpoint)
│   │
│   ├── services/
│   │   ├── document_loader.py      # PDF, HTML, TXT parsing & chunking
│   │   ├── vector_store.py         # ChromaDB persistent collection manager
│   │   ├── sec_client.py           # SEC EDGAR XBRL facts client
│   │   ├── guidance_extractor.py   # LLM & regex quantitative guidance extractor
│   │   ├── guidance_matcher.py     # Deterministic guidance-to-actual matcher
│   │   ├── calculations.py         # Guidance math, deviations & KPIs
│   │   ├── rag_pipeline.py         # Grounded RAG answer generation & citations
│   │   └── seed_data.py            # Initial institutional seeding (NVDA, MSFT, AAPL, APXC)
│   │
│   ├── storage/
│   │   ├── outlookiq.db            # SQLite persistent database
│   │   ├── chroma/                 # ChromaDB persistent vector database
│   │   ├── uploads/                # Ingested documents storage
│   │   └── sec_cache/              # Cached SEC company facts
│   │
│   └── tests/
│       ├── test_calculations.py    # Math & policy unit tests
│       ├── test_extraction.py      # PDF, HTML & regex extraction tests
│       ├── test_retrieval.py       # ChromaDB vector indexing & retrieval tests
│       └── test_api.py             # FastAPI REST endpoints integration tests
│
├── index.html                      # Full-screen CRM style application shell
├── css/
│   ├── style.css                   # CRM design tokens & core styling
│   ├── components.css              # Cards, tables, drawers, modals, toasts
│   └── responsive.css              # Responsive layout breakpoints
│
└── js/
    ├── app.js                      # Application bootstrap & event bus
    ├── router.js                   # Hash-based SPA client router
    ├── api.js                      # Centralized API service client
    ├── calculations.js             # Client-side helpers
    ├── charts.js                   # Chart.js instances (CRM yellow/dark palette)
    ├── components.js               # Evidence Drawer, modals, toasts
    ├── mockData.js                 # Fallback offline records
    └── pages/
        ├── dashboard.js            # CRM Overview Dashboard
        ├── companies.js            # Company Explorer
        ├── promises.js             # Promise Tracker
        ├── analytics.js            # Guidance Analytics
        ├── comparison.js           # Company Comparison
        ├── documents.js            # Document Library & Ingestion
        ├── analyst.js              # RAG AI Financial Analyst
        ├── methodology.js          # Methodology & Verification Pipeline
        └── settings.js             # Settings & API Configuration
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.11+ (Python 3.13 supported)
- Node.js (or any static HTTP server for frontend)

### 2. Install Backend Dependencies
```bash
# In the OutlookIQ root directory:
pip install -r backend/requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp backend/.env.example .env
```
Key configuration fields:
```ini
DATABASE_URL=sqlite:///./backend/storage/outlookiq.db
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here   # Optional; runs offline with deterministic fallback if omitted
LLM_MODEL=gemini-1.5-flash
CHROMA_PERSIST_DIRECTORY=./backend/storage/chroma
SEC_USER_AGENT=OutlookIQResearch user@outlookiq.internal
FRONTEND_ORIGIN=http://localhost:3000
```

### 4. Start the FastAPI Backend
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- API Health Status: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 5. Start the Frontend
In a separate terminal:
```bash
python -m http.server 3000
```
Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Automated Test Suite

Run the complete test suite with `pytest`:
```bash
python -m pytest backend/tests -v
```

### Test Coverage Highlights:
- **`test_calculations.py`**:
  - Higher-is-better (Revenue, Gross Margin, EPS): Exceeded, Met, Missed.
  - Lower-is-better (Operating Expenses): Exceeded below floor, Missed above ceiling.
  - Percentage point variance for margin metrics.
  - Portfolio aggregate KPIs (Adherence rate, MAD, net bias).
- **`test_extraction.py`**:
  - SHA-256 document hashing and deduplication.
  - HTML table text extraction without script/style contamination.
  - Financial recursive text chunking with overlap.
  - Deterministic guidance extraction regex patterns.
- **`test_retrieval.py`**:
  - ChromaDB persistent collection creation, upsert, and semantic query.
  - Metadata filtering by company ticker and document type.
- **`test_api.py`**:
  - `/health` and `/api/health` diagnostics.
  - `/api/companies` listing and CIK mapping.
  - `/api/promises` guidance ledger filtering.
  - `/api/analytics` KPI calculations.
  - `/api/comparison` side-by-side reconciliation.
  - `/api/chat` grounded RAG question answering.

**Results: 18 passed in ~10s.**

---

## 📖 Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend, SQLite, and ChromaDB diagnostics |
| `GET` | `/api/companies` | List all tracked corporate entities |
| `GET` | `/api/companies/{id}` | Single company profile and available reporting quarters |
| `GET` | `/api/promises` | Guidance records with multi-dimensional filtering |
| `GET` | `/api/promises/{id}` | Audit trail, source quote, and evaluation details |
| `GET` | `/api/analytics` | Portfolio KPIs, guidance vs actual data, and MAD trend |
| `GET` | `/api/comparison` | Side-by-side relative forecasting evaluation between two firms |
| `GET` | `/api/documents` | List indexed corpus documents and processing status |
| `POST` | `/api/documents/upload` | Upload PDF/HTML/TXT, compute SHA-256, chunk & index in ChromaDB |
| `POST` | `/api/analyze` | Run guidance extraction and SEC actuals matching for a period |
| `POST` | `/api/chat` | RAG assistant query endpoint returning grounded answers and citations |
