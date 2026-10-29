"""
Document Ingestion & Text Processing Pipeline.
Supports PDF earnings releases, HTML announcements, SEC filings, and plain text transcripts.
Includes SHA-256 deduplication and financial table/context-aware chunking.
"""

import hashlib
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

def compute_sha256(content_bytes: bytes) -> str:
    """Compute SHA-256 checksum for document deduplication."""
    return hashlib.sha256(content_bytes).hexdigest()

def extract_text_from_pdf(file_path: Path) -> tuple[str, int]:
    """Extract text from PDF using PyMuPDF (fitz) with fallback to pypdf."""
    text_content = []
    page_count = 0

    try:
        import fitz  # PyMuPDF
        doc = fitz.open(str(file_path))
        page_count = len(doc)
        for page_idx in range(page_count):
            page = doc[page_idx]
            page_text = page.get_text("text")
            if page_text.strip():
                text_content.append(f"--- [Page {page_idx + 1}] ---\n{page_text}")
        doc.close()
    except Exception as e:
        # Fallback to pypdf
        try:
            import pypdf
            reader = pypdf.PdfReader(str(file_path))
            page_count = len(reader.pages)
            for idx, page in enumerate(reader.pages):
                extracted = page.extract_text() or ""
                if extracted.strip():
                    text_content.append(f"--- [Page {idx + 1}] ---\n{extracted}")
        except Exception as e2:
            raise ValueError(f"Failed to extract PDF text with both PyMuPDF and pypdf: {e2}")

    return "\n\n".join(text_content), max(page_count, 1)

def extract_text_from_html(html_str: str) -> str:
    """Extract clean text and tables from HTML earnings releases using BeautifulSoup."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html_str, "html.parser")

    # Remove script, style, and navigation tags
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
        tag.decompose()

    # Format table contents cleanly so rows and headers remain auditable
    for table in soup.find_all("table"):
        table_rows = []
        for tr in table.find_all("tr"):
            row_cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            if any(row_cells):
                table_rows.append(" | ".join(row_cells))
        table_text = "\n[TABLE START]\n" + "\n".join(table_rows) + "\n[TABLE END]\n"
        table.replace_with(table_text)

    text = soup.get_text(separator="\n")
    return clean_financial_text(text)

def clean_financial_text(text: str) -> str:
    """Clean extracted financial text while preserving financial numbers, units, and ranges."""
    # Normalize unicode spaces and dashes
    text = text.replace("\xa0", " ").replace("\u2013", "-").replace("\u2014", "-")
    # Replace excessive horizontal whitespace while preserving paragraph lines
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse 3+ newlines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def chunk_financial_document(
    text: str,
    metadata: Dict[str, Any],
    chunk_size: int = 700,
    chunk_overlap: int = 120
) -> List[Dict[str, Any]]:
    """
    Split text into meaningful financial chunks with preserved provenance.
    Respects paragraph and section boundaries whenever possible.
    """
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    chunk_index = 0

    for para in paragraphs:
        para_clean = para.strip()
        if not para_clean:
            continue

        if len(current_chunk) + len(para_clean) <= chunk_size:
            current_chunk = f"{current_chunk}\n\n{para_clean}" if current_chunk else para_clean
        else:
            if current_chunk:
                chunks.append({
                    "chunk_id": f"{metadata.get('doc_id', 'DOC')}-chunk-{chunk_index}",
                    "text": current_chunk.strip(),
                    "chunk_index": chunk_index,
                    "metadata": {
                        **metadata,
                        "chunk_index": chunk_index,
                    }
                })
                chunk_index += 1
                # Carry over overlap
                overlap_text = current_chunk[-chunk_overlap:] if len(current_chunk) > chunk_overlap else ""
                current_chunk = f"{overlap_text}\n\n{para_clean}".strip()
            else:
                # If a single paragraph is longer than chunk_size, split by sentences
                sentences = re.split(r"(?<=[.!?])\s+", para_clean)
                for sentence in sentences:
                    if len(current_chunk) + len(sentence) <= chunk_size:
                        current_chunk = f"{current_chunk} {sentence}".strip()
                    else:
                        if current_chunk:
                            chunks.append({
                                "chunk_id": f"{metadata.get('doc_id', 'DOC')}-chunk-{chunk_index}",
                                "text": current_chunk.strip(),
                                "chunk_index": chunk_index,
                                "metadata": {
                                    **metadata,
                                    "chunk_index": chunk_index,
                                }
                            })
                            chunk_index += 1
                        current_chunk = sentence.strip()

    if current_chunk:
        chunks.append({
            "chunk_id": f"{metadata.get('doc_id', 'DOC')}-chunk-{chunk_index}",
            "text": current_chunk.strip(),
            "chunk_index": chunk_index,
            "metadata": {
                **metadata,
                "chunk_index": chunk_index,
            }
        })

    return chunks
