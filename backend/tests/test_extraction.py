"""
Unit tests for text extraction, cleaning, and guidance parsing.
"""

from backend.services.document_loader import (
    compute_sha256,
    extract_text_from_html,
    clean_financial_text,
    chunk_financial_document
)
from backend.services.guidance_extractor import guidance_extractor

def test_sha256_deduplication():
    b1 = b"NVIDIA Q3 Earnings Release Content"
    b2 = b"NVIDIA Q3 Earnings Release Content"
    b3 = b"Different Content"
    assert compute_sha256(b1) == compute_sha256(b2)
    assert compute_sha256(b1) != compute_sha256(b3)

def test_html_table_and_text_extraction():
    html_sample = """
    <html>
      <head><style>.ad { display:none; }</style></head>
      <body>
        <script>console.log('strip me');</script>
        <h2>Fourth Quarter Outlook</h2>
        <p>Revenue is expected to be $37.5 billion, plus or minus 2%.</p>
        <table>
          <tr><th>Metric</th><th>Target</th></tr>
          <tr><td>Revenue</td><td>$37.5B</td></tr>
        </table>
      </body>
    </html>
    """
    extracted = extract_text_from_html(html_sample)
    assert "console.log" not in extracted
    assert "Revenue is expected to be $37.5 billion" in extracted
    assert "[TABLE START]" in extracted
    assert "Revenue | $37.5B" in extracted

def test_financial_chunking():
    text = "Paragraph 1 with financial guidance.\n\nParagraph 2 with subsequent actual results."
    chunks = chunk_financial_document(
        text,
        metadata={"doc_id": "TEST-01", "ticker": "NVDA"},
        chunk_size=100,
        chunk_overlap=20
    )
    assert len(chunks) >= 1
    assert "chunk_id" in chunks[0]
    assert chunks[0]["metadata"]["ticker"] == "NVDA"

def test_guidance_extractor_deterministic():
    sample_text = (
        "For the fourth quarter of fiscal 2025, NVIDIA outlook is as follows: "
        "Revenue is expected to be $37.5 billion, plus or minus 2%. "
        "GAAP and non-GAAP gross margins are expected to be 73.0% and 73.5%, respectively, plus or minus 50 basis points. "
        "Operating expenses are expected to be approximately $4.8 billion."
    )
    items = guidance_extractor.extract_from_text(
        text=sample_text,
        ticker="NVDA",
        target_period="Q4 FY25",
        announcement_date="2024-11-20"
    )

    metrics = [item["metric"] for item in items]
    assert "Revenue" in metrics
    assert "Gross Margin" in metrics
    assert "Operating Expenses" in metrics

    rev = next(i for i in items if i["metric"] == "Revenue")
    assert rev["guidance_midpoint"] == 37500.0  # $37.5B -> $37,500M
    assert rev["guidance_lower"] == 36750.0      # -2%
    assert rev["guidance_upper"] == 38250.0      # +2%
    assert rev["unit"] == "$M"
