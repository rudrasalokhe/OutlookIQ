# OutlookIQ — AI-Powered Financial Guidance Intelligence Platform

> **"What they forecast. What they delivered."**

OutlookIQ is an institutional-grade financial intelligence application that tracks forward-looking management guidance (revenue, gross margin, EPS, operating expenses) from corporate earnings calls and SEC filings, deterministically evaluates it against subsequently reported financial results, and provides grounded, hallucination-free answers using a genuine Retrieval-Augmented Generation (RAG) pipeline.

---

## 🌟 Key Architecture & Capabilities

1. **Python FastAPI Backend (`backend/`)**: High-performance asynchronous REST API with SQLite database, WAL mode, structured Pydantic schemas, and SQLAlchemy ORM.
2. **Deterministic Financial Verification Engine (`backend/services/calculations.py`)**:
   - Guidance corridor calculation (`(lower + upper) / 2`).
   - Outcome classification: **Exceeded**, **Met**, **Missed**, **Pending**, and **Unverifiable**.
   - Handles favorable direction metrics (higher-is-better for Revenue/EPS/Margins vs lower-is-better for OpEx/Costs).
   - Percentage deviation and percentage-point calculations with auditable provenance.
3. **Genuine RAG Pipeline (`backend/services/rag_pipeline.py`)**:
   - Query intent parsing (identifies target company, metric, and fiscal year).
   - Persistent vector search with ChromaDB (`all-MiniLM-L6-v2` embeddings).
   - Strict factual grounding: Zero hallucinated numbers, dates, or citations.
   - Dual-mode synthesis: Native support for Google Gemini API (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), or local deterministic financial QA engine when running offline.
4. **Document Ingestion Engine (`backend/services/document_loader.py`)**:
   - Supports PDF earnings releases via **PyMuPDF (`fitz`)** and `pypdf`.
   - Supports HTML earnings releases and tables via **BeautifulSoup4**.
   - Plain-text transcript parsing.
   - **SHA-256 deduplication**: Guarantees identical documents are never re-indexed.
   - Financial context-aware semantic chunking.
5. **SEC EDGAR Integration (`backend/services/sec_client.py`)**:
   - Standardized XBRL Company Facts retrieval from SEC EDGAR.
   - Respects SEC fair access policies (custom User-Agent format, request throttling <= 10 req/s).
   - Local JSON caching of SEC company facts.
6. **Frontend Integration (`js/api.js`)**:
   - Live communication with FastAPI (`http://127.0.0.1:8000`).
   - Real-time Document Uploads directly ingest, parse, chunk, and index into ChromaDB.
   - AI Analyst chat connected to real vector citations and interactive guidance cards.
   - Automatic graceful fallback if backend is offline.

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
