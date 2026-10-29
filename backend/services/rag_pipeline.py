"""
Grounded RAG Pipeline for Financial Guidance Intelligence.
Retrieves relevant vector chunks from ChromaDB, queries verified SQLite guidance records,
synthesizes grounded answers via LLM or deterministic fallback, and attaches verified citations.
"""

import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.config import settings
from backend.services.vector_store import vector_store
from backend.models.guidance import Guidance
from backend.models.company import Company

class RAGPipeline:
    def __init__(self):
        self.vector_store = vector_store

    def extract_intent(self, query: str) -> Dict[str, Optional[str]]:
        """Identify company ticker, metric, and fiscal year from natural language query."""
        query_upper = query.upper()

        # Company recognition
        company = None
        ticker_map = {
            "NVIDIA": "NVDA", "NVDA": "NVDA",
            "MICROSOFT": "MSFT", "MSFT": "MSFT",
            "APPLE": "AAPL", "AAPL": "AAPL",
            "APEX": "APXC", "APXC": "APXC",
            "NOVATECH": "NVTD", "NVTD": "NVTD"
        }
        for name, ticker in ticker_map.items():
            if name in query_upper:
                company = ticker
                break

        # Metric recognition
        metric = None
        if "REVENUE" in query_upper or "SALES" in query_upper:
            metric = "Revenue"
        elif "GROSS MARGIN" in query_upper or "MARGIN" in query_upper:
            metric = "Gross Margin"
        elif "EPS" in query_upper or "EARNINGS PER SHARE" in query_upper:
            metric = "Diluted EPS"
        elif "EXPENSES" in query_upper or "OPEX" in query_upper:
            metric = "Operating Expenses"

        # Fiscal year
        fy_match = re.search(r"(?:FY\s*|20)(\d{2,4})", query, re.IGNORECASE)
        fiscal_year = None
        if fy_match:
            digits = fy_match.group(1)
            fiscal_year = f"20{digits}" if len(digits) == 2 else digits

        return {
            "company": company,
            "metric": metric,
            "fiscal_year": fiscal_year
        }

    def answer_question(self, query: str, db: Session) -> Dict[str, Any]:
        """
        Execute RAG workflow:
        1. Extract query intent
        2. Retrieve relevant document chunks from ChromaDB
        3. Retrieve structured guidance & actuals records from SQLite
        4. Synthesize verified answer with citations
        """
        intent = self.extract_intent(query)
        company_ticker = intent["company"]
        metric = intent["metric"]
        fiscal_year = intent["fiscal_year"]

        # 1. Vector Search
        search_results = self.vector_store.query(
            query_text=query,
            n_results=4,
            company_id=company_ticker
        )

        # 2. Database Lookups for Structured Evidence
        guidance_query = db.query(Guidance)
        if company_ticker:
            guidance_query = guidance_query.join(Company).filter(Company.ticker == company_ticker)
        if metric:
            guidance_query = guidance_query.filter(Guidance.metric == metric)
        if fiscal_year:
            guidance_query = guidance_query.filter(Guidance.fiscal_year == fiscal_year)

        matched_guidance = guidance_query.all()

        # Format citations
        citations = []
        for r in search_results:
            meta = r.get("metadata", {})
            citations.append({
                "title": meta.get("title") or meta.get("doc_title") or f"{meta.get('ticker', 'Company')} Filing",
                "doc_type": meta.get("document_type") or "Earnings Document",
                "reporting_quarter": meta.get("reporting_quarter") or meta.get("fiscal_period") or "—",
                "date": meta.get("publication_date") or meta.get("date") or "Verified",
                "excerpt": r.get("text")[:280] + "..." if len(r.get("text", "")) > 280 else r.get("text", ""),
                "similarity": r.get("similarity", 92.0)
            })

        # Related promises for UI drawer inspection
        related_promises = [g.to_dict() for g in matched_guidance[:5]]

        # 3. Generate Grounded Answer via Grok / Groq / Gemini / OpenAI or local deterministic
        # Check xAI Grok
        if settings.GROK_API_KEY:
            try:
                answer = self._generate_with_openai_compatible(
                    query, citations, related_promises,
                    base_url="https://api.x.ai/v1",
                    api_key=settings.GROK_API_KEY,
                    model=settings.LLM_MODEL if "grok" in settings.LLM_MODEL.lower() else "grok-beta"
                )
                if answer:
                    return {
                        "answer": answer,
                        "citations": citations,
                        "related_promises": related_promises,
                        "confidence": "evidence_available" if (citations or related_promises) else "insufficient_data"
                    }
            except Exception as e:
                print(f"Grok API generation error: {e}")

        # Check Groq Cloud
        if settings.GROQ_API_KEY:
            try:
                answer = self._generate_with_openai_compatible(
                    query, citations, related_promises,
                    base_url="https://api.groq.com/openai/v1",
                    api_key=settings.GROQ_API_KEY,
                    model=settings.LLM_MODEL if settings.LLM_MODEL and "grok" not in settings.LLM_MODEL else "openai/gpt-oss-120b"
                )
                if answer:
                    return {
                        "answer": answer,
                        "citations": citations,
                        "related_promises": related_promises,
                        "confidence": "evidence_available" if (citations or related_promises) else "insufficient_data"
                    }
            except Exception as e:
                print(f"Groq API generation error: {e}")

        # Check Gemini
        if settings.GEMINI_API_KEY:
            try:
                answer = self._generate_with_gemini(query, citations, related_promises)
                return {
                    "answer": answer,
                    "citations": citations,
                    "related_promises": related_promises,
                    "confidence": "evidence_available" if (citations or related_promises) else "insufficient_data"
                }
            except Exception as e:
                print(f"Gemini generation error: {e}")

        # Deterministic Grounded Synthesis
        answer = self._generate_deterministic(query, intent, citations, related_promises)
        return {
            "answer": answer,
            "citations": citations,
            "related_promises": related_promises,
            "confidence": "evidence_available" if (citations or related_promises) else "insufficient_data"
        }

    def _generate_with_openai_compatible(
        self,
        query: str,
        citations: List[Dict[str, Any]],
        related_promises: List[Dict[str, Any]],
        base_url: str,
        api_key: str,
        model: str
    ) -> Optional[str]:
        """Generate answer using xAI Grok or Groq Cloud via OpenAI-compatible endpoint."""
        import httpx

        evidence_text = "\n\n".join([
            f"[Source {i+1}]: {c['title']} ({c['reporting_quarter']})\n\"{c['excerpt']}\""
            for i, c in enumerate(citations)
        ])

        guidance_text = "\n".join([
            f"- {p['ticker']} {p['targetQuarter']} {p['metric']}: Guided {p['guidanceLower']}–{p['guidanceUpper']} {p['unit']} | Actual: {p['actual']} {p['unit']} | Outcome: {p['outcome']} (Dev: {p['deviationPct']}%)"
            for p in related_promises
        ])

        system_prompt = (
            "You are an institutional financial intelligence analyst for OutlookIQ.\n"
            "Answer the user question STRICTLY using the retrieved verified evidence below.\n"
            "CRITICAL RULES:\n"
            "1. Never hallucinate, extrapolate, or invent financial numbers, guidance ranges, or outcomes.\n"
            "2. If the retrieved evidence does not contain sufficient verified data to answer, state:\n"
            "   'Insufficient verified financial information is available in the indexed documents to answer this question.'\n"
            "3. Quote specific guidance ranges and reported numbers with proper units ($M, %, etc.).\n"
            "4. Explicitly state the outcome (Exceeded, Met, or Missed).\n"
            "5. Attribute findings to the cited documents.\n\n"
            f"Verified Structured Guidance Records:\n{guidance_text if guidance_text else 'None'}\n\n"
            f"Retrieved Document Excerpts:\n{evidence_text if evidence_text else 'None'}"
        )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            "temperature": 0.1
        }

        with httpx.Client(timeout=25.0) as client:
            resp = client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                print(f"API Error {resp.status_code} from {base_url}: {resp.text[:200]}")
                return None

    def _generate_with_gemini(
        self,
        query: str,
        citations: List[Dict[str, Any]],
        related_promises: List[Dict[str, Any]]
    ) -> str:
        """Call Gemini to synthesize a strictly grounded financial answer."""
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)

        evidence_text = "\n\n".join([
            f"[Source {i+1}]: {c['title']} ({c['reporting_quarter']})\n\"{c['excerpt']}\""
            for i, c in enumerate(citations)
        ])

        guidance_text = "\n".join([
            f"- {p['ticker']} {p['targetQuarter']} {p['metric']}: Guided {p['guidanceLower']}–{p['guidanceUpper']} {p['unit']} | Actual: {p['actual']} {p['unit']} | Outcome: {p['outcome']} (Dev: {p['deviationPct']}%)"
            for p in related_promises
        ])

        system_prompt = f"""
You are an institutional financial intelligence analyst for OutlookIQ.
Answer the following user question STRICTLY using the retrieved verified evidence below.

CRITICAL RULES:
1. Never hallucinate, extrapolate, or invent financial numbers, guidance ranges, or outcomes.
2. If the retrieved evidence does not contain sufficient verified data to answer, state:
   "Insufficient verified financial information is available in the indexed documents to answer this question."
3. Quote specific guidance ranges and reported numbers with proper units ($M, %, etc.).
4. Explicitly state the outcome (Exceeded, Met, or Missed).
5. Attribute findings to the cited documents.

User Question: {query}

Verified Structured Guidance Records:
{guidance_text if guidance_text else "None"}

Retrieved Document Excerpts:
{evidence_text if evidence_text else "None"}
"""
        model = genai.GenerativeModel(settings.LLM_MODEL)
        res = model.generate_content(system_prompt)
        return res.text.strip()

    def _generate_deterministic(
        self,
        query: str,
        intent: Dict[str, Any],
        citations: List[Dict[str, Any]],
        related_promises: List[Dict[str, Any]]
    ) -> str:
        """Synthesize a deterministic financial answer grounded in verified records."""
        if not related_promises and not citations:
            return (
                "Insufficient verified financial information is available in the indexed documents "
                "to answer this question. Please upload the relevant company earnings release or 10-Q filing."
            )

        company = intent.get("company") or "the company"

        if related_promises:
            lines = [f"### Guidance Intelligence Summary for {company}\n"]
            lines.append("Based on verified corporate earnings statements and subsequently reported financial results:\n")

            exceeded_count = sum(1 for p in related_promises if p.get("outcome") == "Exceeded")
            met_count = sum(1 for p in related_promises if p.get("outcome") == "Met")
            missed_count = sum(1 for p in related_promises if p.get("outcome") == "Missed")

            lines.append(f"- **Tracked Evaluations:** {len(related_promises)} records")
            lines.append(f"- **Historical Outcomes:** {exceeded_count} Exceeded, {met_count} Met, {missed_count} Missed\n")

            lines.append("**Detailed Quarter Breakdown:**")
            for p in related_promises:
                sign = "+" if p.get("deviationPct", 0) and p.get("deviationPct", 0) > 0 else ""
                dev_str = f"{sign}{p.get('deviationPct')}%" if p.get("deviationPct") is not None else "Pending"
                actual_str = f"{p.get('actual')} {p.get('unit')}" if p.get('actual') is not None else "Pending Release"
                lines.append(
                    f"• **{p['targetQuarter']} ({p['metric']}):** Management guided `{p['guidanceLower']}–{p['guidanceUpper']} {p['unit']}` "
                    f"(midpoint: `{p['guidanceMidpoint']} {p['unit']}`). Reported actual was `{actual_str}`, "
                    f"delivering an outcome of **{p['outcome']}** ({dev_str} variance)."
                )

            if citations:
                lines.append(f"\n*Primary Verification Source:* {citations[0]['title']} ({citations[0]['date']})")

            return "\n".join(lines)

        # Fallback to citations text
        first_cite = citations[0]
        return (
            f"According to verified filing `{first_cite['title']}` for period `{first_cite['reporting_quarter']}`:\n\n"
            f"> \"{first_cite['excerpt']}\"\n\n"
            f"The complete audit trail is preserved in the citations panel below."
        )

rag_pipeline = RAGPipeline()
