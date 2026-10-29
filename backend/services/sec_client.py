"""
SEC EDGAR and Company Facts Integration Service.
Complies strictly with SEC fair access policy, custom User-Agent, rate limiting, and local response caching.
"""

import json
import time
from pathlib import Path
from typing import Dict, Any, Optional, List
import httpx
from backend.config import settings

# Mapping of known tickers to 10-digit CIK numbers
DEFAULT_CIK_MAP = {
    "NVDA": "0001045810",
    "MSFT": "0000789019",
    "AAPL": "0000320193",
    "GOOGL": "0001652044",
    "AMZN": "0001018724"
}

class SECClient:
    def __init__(self, cache_dir: Optional[Path] = None):
        self.base_url = "https://data.sec.gov"
        self.cache_dir = cache_dir or (settings.STORAGE_DIR / "sec_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.user_agent = settings.SEC_USER_AGENT
        self.last_request_time = 0.0

    def _rate_limit(self):
        """Enforce rate limit of <= 10 requests per second."""
        elapsed = time.time() - self.last_request_time
        if elapsed < settings.SEC_REQUEST_DELAY:
            time.sleep(settings.SEC_REQUEST_DELAY - elapsed)
        self.last_request_time = time.time()

    def get_cik(self, ticker: str) -> Optional[str]:
        """Look up 10-digit CIK for a given ticker."""
        return DEFAULT_CIK_MAP.get(ticker.upper())

    async def get_company_facts(self, ticker: str, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Fetch company facts from SEC EDGAR XBRL API.
        Uses local disk caching to prevent redundant external calls.
        """
        ticker = ticker.upper()
        cache_file = self.cache_dir / f"{ticker}_facts.json"

        if not force_refresh and cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        cik = self.get_cik(ticker)
        if not cik:
            raise ValueError(f"No CIK mapped for ticker {ticker}. Manual CIK specification required.")

        url = f"{self.base_url}/api/xbrl/companyfacts/CIK{cik.zfill(10)}.json"
        headers = {
            "User-Agent": self.user_agent,
            "Accept-Encoding": "gzip, deflate",
            "Host": "data.sec.gov"
        }

        self._rate_limit()

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    with open(cache_file, "w", encoding="utf-8") as f:
                        json.dump(data, f)
                    return data
                elif response.status_code == 429:
                    raise RuntimeError("SEC rate limit exceeded. Please retry after a brief delay.")
                else:
                    raise RuntimeError(f"SEC API returned status {response.status_code}: {response.text[:200]}")
            except httpx.RequestError as e:
                # If network fails but cache exists, fallback
                if cache_file.exists():
                    with open(cache_file, "r", encoding="utf-8") as f:
                        return json.load(f)
                raise RuntimeError(f"Failed to connect to SEC EDGAR API: {e}")

    def extract_quarterly_metrics(self, company_facts: Dict[str, Any], metric_name: str = "Revenues") -> List[Dict[str, Any]]:
        """
        Parse standardized quarterly GAAP figures from SEC company facts.
        """
        results = []
        us_gaap = company_facts.get("facts", {}).get("us-gaap", {})

        # Find metric container
        metric_candidates = [metric_name, "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"]
        metric_data = None
        for candidate in metric_candidates:
            if candidate in us_gaap:
                metric_data = us_gaap[candidate]
                break

        if not metric_data:
            return results

        units = metric_data.get("units", {})
        usd_units = units.get("USD", [])

        # Filter quarterly numbers (form 10-Q or 10-K where frame is quarter)
        for item in usd_units:
            form = item.get("form")
            frame = item.get("frame")  # e.g., "CY2024Q3"
            fp = item.get("fp")        # e.g., "Q3"
            fy = item.get("fy")        # e.g., 2025
            val = item.get("val")

            if form in ("10-Q", "10-K") and fp and fy and val is not None:
                # Convert to millions for standard readability
                val_m = round(val / 1_000_000.0, 2)
                results.append({
                    "fiscal_year": str(fy),
                    "fiscal_quarter": fp,
                    "target_period": f"{fp} FY{str(fy)[-2:]}",
                    "metric": "Revenue",
                    "actual_value": val_m,
                    "unit": "$M",
                    "filed_date": item.get("filed", ""),
                    "form": form,
                    "frame": frame
                })

        return sorted(results, key=lambda x: (x["fiscal_year"], x["fiscal_quarter"]), reverse=True)

sec_client = SECClient()
