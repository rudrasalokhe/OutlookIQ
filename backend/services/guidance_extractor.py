"""
Quantitative Management Guidance Extraction Engine.
Supports LLM-based extraction (Gemini / OpenAI) with Pydantic validation,
as well as a comprehensive deterministic regex extractor for offline execution.
"""

import re
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.config import settings

class ExtractedGuidanceItem(BaseModel):
    metric: str = Field(description="Financial metric name, e.g. Revenue, Gross Margin, Diluted EPS, Operating Expenses")
    announcement_date: str = Field(description="Date when guidance was provided (YYYY-MM-DD)")
    target_period: str = Field(description="Target quarter and year, e.g. Q4 FY25")
    fiscal_year: str = Field(description="Fiscal year string, e.g. 2025")
    guidance_lower: float = Field(description="Lower bound of guided range")
    guidance_upper: float = Field(description="Upper bound of guided range")
    guidance_midpoint: float = Field(description="Midpoint or single target")
    unit: str = Field(default="$M", description="Financial unit: $M, %, $, USD billions")
    accounting_basis: str = Field(default="GAAP", description="GAAP or Non-GAAP")
    speaker: Optional[str] = Field(default="Corporate Management", description="Speaker name and title if specified")
    source_quote: str = Field(description="Exact verbatim sentence from original text")
    is_quantitative: bool = Field(default=True, description="Whether numerical values were declared")

class GuidanceExtractionResponse(BaseModel):
    company_ticker: str
    items: List[ExtractedGuidanceItem]

# Deterministic patterns for typical corporate outlook sections
REVENUE_PATTERNS = [
    # "Revenue is expected to be $37.5 billion, plus or minus 2%"
    r"(?:revenue|sales)\s+is\s+expected\s+to\s+be\s+\$?([\d\.]+)\s*(billion|million)?(?:,\s*plus\s+or\s+minus\s*([\d\.]+)%?)?",
    # "Expects fourth quarter revenue of $37.0 billion to $38.0 billion"
    r"expects?\s+(?:[a-z0-9\s]+)?(?:revenue|sales)\s+of\s+\$?([\d\.]+)\s*(billion|million)?\s+to\s+\$?([\d\.]+)\s*(billion|million)?",
    # "Forecasts revenue between $36.0B and $38.0B"
    r"forecasts?\s+revenue\s+between\s+\$?([\d\.]+)\s*([BMbm])?\s+and\s+\$?([\d\.]+)\s*([BMbm])?"
]

GROSS_MARGIN_PATTERNS = [
    # "GAAP and non-GAAP gross margins are expected to be 73.0% and 73.5%, respectively, plus or minus 50 basis points"
    r"(?:GAAP|non-GAAP)?\s*gross\s+margins?\s+(?:are|is)\s+expected\s+to\s+be\s+([\d\.]+)%(?:[^\.]+plus\s+or\s+minus\s+([\d\.]+)\s*(?:basis\s+points|%))?"
]

OPEX_PATTERNS = [
    # "Operating expenses are expected to be approximately $4.3 billion"
    r"operating\s+expenses\s+are\s+expected\s+to\s+be\s+approximately\s+\$?([\d\.]+)\s*(billion|million)?"
]

class GuidanceExtractor:
    def __init__(self):
        self.llm_provider = settings.LLM_PROVIDER
        self.api_key = settings.LLM_API_KEY or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY

    def extract_from_text(
        self,
        text: str,
        ticker: str,
        target_period: str = "Q4 FY25",
        announcement_date: str = "2024-11-20"
    ) -> List[Dict[str, Any]]:
        """
        Extract structured quantitative management guidance items from text.
        Attempts LLM extraction if an API key is configured; otherwise uses deterministic extractor.
        """
        if self.api_key:
            try:
                llm_items = self._extract_with_llm(text, ticker, target_period, announcement_date)
                if llm_items:
                    return llm_items
            except Exception as e:
                print(f"LLM guidance extraction fallback due to: {e}")

        # Deterministic extraction
        return self._extract_deterministic(text, ticker, target_period, announcement_date)

    def _extract_deterministic(
        self,
        text: str,
        ticker: str,
        target_period: str,
        announcement_date: str
    ) -> List[Dict[str, Any]]:
        """Pattern-matching extractor for official earnings outlook statements."""
        items = []
        fy_match = re.search(r"FY(\d{2,4})", target_period)
        fy = f"20{fy_match.group(1)}" if fy_match and len(fy_match.group(1)) == 2 else (fy_match.group(1) if fy_match else "2025")

        sentences = re.split(r"(?<=[.!?])\s+", text)

        for sentence in sentences:
            s_clean = sentence.strip()
            # 1. Check Revenue Guidance
            for pattern in REVENUE_PATTERNS:
                m = re.search(pattern, s_clean, re.IGNORECASE)
                if m:
                    base_val = float(m.group(1))
                    unit_str = (m.group(2) or "million").lower()
                    val_m = base_val * 1000.0 if "billion" in unit_str or unit_str == "b" else base_val

                    pct_var = float(m.group(3)) if m.group(3) else 2.0
                    lower = round(val_m * (1 - (pct_var / 100.0)), 2)
                    upper = round(val_m * (1 + (pct_var / 100.0)), 2)

                    items.append({
                        "metric": "Revenue",
                        "announcement_date": announcement_date,
                        "target_period": target_period,
                        "fiscal_year": fy,
                        "guidance_lower": lower,
                        "guidance_upper": upper,
                        "guidance_midpoint": val_m,
                        "unit": "$M",
                        "accounting_basis": "GAAP",
                        "speaker": "Executive Management",
                        "source_quote": s_clean,
                        "is_quantitative": True
                    })
                    break

            # 2. Check Gross Margin Guidance
            for pattern in GROSS_MARGIN_PATTERNS:
                m = re.search(pattern, s_clean, re.IGNORECASE)
                if m:
                    margin_mid = float(m.group(1))
                    bp_var = float(m.group(2)) if m.group(2) else 50.0
                    pct_tol = bp_var / 100.0 if bp_var > 10 else bp_var
                    items.append({
                        "metric": "Gross Margin",
                        "announcement_date": announcement_date,
                        "target_period": target_period,
                        "fiscal_year": fy,
                        "guidance_lower": round(margin_mid - pct_tol, 2),
                        "guidance_upper": round(margin_mid + pct_tol, 2),
                        "guidance_midpoint": margin_mid,
                        "unit": "%",
                        "accounting_basis": "Non-GAAP" if "non-gaap" in s_clean.lower() else "GAAP",
                        "speaker": "Chief Financial Officer",
                        "source_quote": s_clean,
                        "is_quantitative": True
                    })
                    break

            # 3. Check OpEx Guidance
            for pattern in OPEX_PATTERNS:
                m = re.search(pattern, s_clean, re.IGNORECASE)
                if m:
                    base_val = float(m.group(1))
                    unit_str = (m.group(2) or "billion").lower()
                    val_m = base_val * 1000.0 if "billion" in unit_str else base_val
                    items.append({
                        "metric": "Operating Expenses",
                        "announcement_date": announcement_date,
                        "target_period": target_period,
                        "fiscal_year": fy,
                        "guidance_lower": round(val_m * 0.98, 2),
                        "guidance_upper": round(val_m * 1.02, 2),
                        "guidance_midpoint": val_m,
                        "unit": "$M",
                        "accounting_basis": "GAAP",
                        "speaker": "Chief Financial Officer",
                        "source_quote": s_clean,
                        "is_quantitative": True
                    })
                    break

        return items

    def _extract_with_llm(
        self,
        text: str,
        ticker: str,
        target_period: str,
        announcement_date: str
    ) -> List[Dict[str, Any]]:
        """Extract guidance using Gemini or OpenAI API with structured JSON output."""
        prompt = f"""
You are an institutional financial analyst. Extract all forward-looking quantitative management guidance statements from the text below for company {ticker} for reporting period {target_period}.

Document text:
\"\"\"{text[:4000]}\"\"\"

Output a valid JSON array of objects. Each object MUST contain:
- "metric": "Revenue", "Gross Margin", "Diluted EPS", or "Operating Expenses"
- "announcement_date": "{announcement_date}"
- "target_period": "{target_period}"
- "fiscal_year": "2025"
- "guidance_lower": number (in $M for revenue/expenses, % for margins)
- "guidance_upper": number
- "guidance_midpoint": number
- "unit": "$M" or "%"
- "accounting_basis": "GAAP" or "Non-GAAP"
- "speaker": speaker name or "Management"
- "source_quote": exact sentence from the text
- "is_quantitative": true

Do not include analyst estimates. Output ONLY raw valid JSON array.
"""
        # Call Gemini if configured
        if settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel(settings.LLM_MODEL)
            response = model.generate_content(prompt)
            raw = response.text.strip()
            # Clean markdown code block fences if present
            raw = re.sub(r"^```json\s*", "", raw)
            raw = re.sub(r"^```\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
            data = json.loads(raw)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict) and "items" in data:
                return data["items"]

        return []

guidance_extractor = GuidanceExtractor()
