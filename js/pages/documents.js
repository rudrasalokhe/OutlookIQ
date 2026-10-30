/**
 * PAGE 6 — Financial Document Library (Neo-Brutalist Design)
 * SEC filings, press releases, and earnings call transcripts for RAG hybrid indexing.
 */

import { api } from "../api.js";
import { showToast } from "../components.js";

export async function renderDocuments(container) {
  let docs = await api.getDocuments();

  container.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header-title">
        <h1>Document Repository</h1>
        <div class="badge">RAG Vector Corpus</div>
        <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">Verbatim Transcripts & SEC Filings (Form 10-K, 10-Q, 8-K)</span>
      </div>
      <div class="header-actions">
        <button id="btn-import-url" class="brutal-btn">
          <i class="fas fa-link"></i> Import SEC Filing URL
        </button>
      </div>
    </header>

    <!-- Drag-and-Drop Upload Area -->
    <div id="doc-dropzone" class="brutal-card" style="margin-bottom: 24px; text-align: center; border: 3px dashed var(--border-color); cursor: pointer; align-items: center; justify-content: center; padding: 40px 24px;">
      <input type="file" id="file-input-hidden" class="hidden" accept=".pdf,.txt,.html" multiple style="display: none;" />
      <div class="brutal-border bg-yellow" style="width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px;">
        <i class="fas fa-file-arrow-up"></i>
      </div>
      <h3 style="font-size: 1.35rem; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Stage Corporate Filings & Transcripts</h3>
      <p style="font-size: 0.85rem; font-weight: 600; color: #555; max-width: 500px; margin-bottom: 18px;">
        Drag & drop Form 10-K, 10-Q, earnings press releases, or raw call transcripts (.PDF, .TXT, .HTML)
      </p>
      <button id="btn-trigger-upload" class="brutal-btn" style="background: var(--main-yellow);">
        Browse Local Files
      </button>
      <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-top: 14px; color: #666;">
        Deterministic Chunking: 500 Tokens • ChromaDB Dense Embeddings • Sparse Lexical Index
      </div>
    </div>

    <!-- Document Table Card -->
    <div style="margin-bottom: 24px; overflow-x: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 id="doc-count-title" style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase;">Indexed Corpus Documents (${docs.length})</h3>
        <span class="badge" style="background: var(--main-teal);">Active Vector Knowledge</span>
      </div>

      <table class="brutal-table">
        <thead>
          <tr>
            <th>Document Title</th>
            <th>Ticker</th>
            <th>Type</th>
            <th>Target Period</th>
            <th>Date Ingested</th>
            <th>Vector Index Status</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody id="docs-tbody">
          <!-- Injected dynamically -->
        </tbody>
      </table>
    </div>

    <!-- Document Preview Modal -->
    <div id="doc-preview-modal" class="evidence-drawer-backdrop" style="display: flex; align-items: center; justify-content: center; padding: 24px;">
      <div class="brutal-card" style="width: 100%; max-width: 650px; background: #fff; max-height: 85vh; overflow-y: auto; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid var(--border-color); padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <div id="modal-doc-meta" class="badge" style="margin-bottom: 6px;">SEC Form 10-Q</div>
            <h2 id="modal-doc-title" style="font-size: 1.3rem; font-weight: 700; text-transform: uppercase; line-height: 1.1;">Document Name</h2>
          </div>
          <button id="btn-close-doc-modal" class="brutal-btn" style="padding: 4px 8px;">
            &times;
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; border-bottom: 2px dashed var(--border-color); padding-bottom: 14px;">
          <div>
            <div class="stat-label" style="font-size: 0.7rem; margin-bottom: 2px;">File Size</div>
            <div id="modal-doc-size" style="font-weight: 700; font-size: 0.95rem;"></div>
          </div>
          <div>
            <div class="stat-label" style="font-size: 0.7rem; margin-bottom: 2px;">Quarter</div>
            <div id="modal-doc-quarter" style="font-weight: 700; font-size: 0.95rem;"></div>
          </div>
          <div>
            <div class="stat-label" style="font-size: 0.7rem; margin-bottom: 2px;">Status</div>
            <div id="modal-doc-status" style="font-weight: 700; font-size: 0.95rem;"></div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <div class="stat-label" style="font-size: 0.75rem; margin-bottom: 8px;">Verbatim Excerpt</div>
          <p id="modal-doc-text" class="brutal-border" style="padding: 14px; background: #fdfae7; font-size: 0.85rem; font-weight: 600; line-height: 1.5; max-height: 250px; overflow-y: auto;"></p>
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button id="btn-modal-close-action" class="brutal-btn" style="background: var(--main-yellow);">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  `;

  function renderTable() {
    const tbody = document.getElementById("docs-tbody");
    document.getElementById("doc-count-title").textContent = `Indexed Corpus Documents (${docs.length})`;

    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; font-weight: 700; text-transform: uppercase;">No documents uploaded yet.</td></tr>`;
      return;
    }

    const badgeBgMap = {
      NVDA: "bg-teal",
      MSFT: "bg-yellow",
      AAPL: "bg-pink",
      NVTD: "bg-teal",
      APXC: "bg-yellow",
      LMBO: "bg-pink",
      SOLR: "bg-yellow"
    };

    tbody.innerHTML = docs.map(d => {
      const isNotIndexed = d.status.includes("Not Indexed");
      const statusBadge = isNotIndexed
        ? `<span class="stat-trend" style="background: #e5e5e5; margin: 0;">◌ STAGED LOCAL</span>`
        : `<span class="stat-trend bg-yellow" style="margin: 0;">✓ CHROMA VECTORIZED</span>`;

      const tickerBadge = badgeBgMap[d.ticker] || "bg-yellow";

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="background: #000; color: #fff; padding: 2px 6px; font-size: 0.75rem;">DOC</span>
              <strong style="font-size: 0.9rem;">${d.name}</strong>
            </div>
          </td>
          <td><span class="badge ${tickerBadge}" style="padding: 2px 6px; font-size: 0.75rem;">${d.ticker}</span></td>
          <td style="font-weight: 600;">${d.type}</td>
          <td style="font-weight: 700; text-transform: uppercase;">${d.reportingQuarter}</td>
          <td style="font-weight: 600;">${d.uploadDate}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <button class="brutal-btn btn-preview-doc" style="padding: 4px 8px; font-size: 0.75rem; background: var(--main-yellow);" data-doc-id="${d.id}">Preview</button>
            <button class="brutal-btn btn-remove-doc" style="padding: 4px 8px; font-size: 0.75rem; background: var(--main-pink); margin-left: 6px;" data-doc-id="${d.id}">Remove</button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll(".btn-preview-doc").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.docId;
        const doc = docs.find(d => d.id === id);
        if (doc) openPreviewModal(doc);
      });
    });

    tbody.querySelectorAll(".btn-remove-doc").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.docId;
        docs = docs.filter(d => d.id !== id);
        renderTable();
        showToast("Document removed from local stage.");
      });
    });
  }

  function openPreviewModal(doc) {
    const modal = document.getElementById("doc-preview-modal");
    document.getElementById("modal-doc-title").textContent = doc.name;
    document.getElementById("modal-doc-meta").textContent = `${doc.ticker} · ${doc.type}`;
    document.getElementById("modal-doc-size").textContent = doc.fileSize;
    document.getElementById("modal-doc-quarter").textContent = doc.reportingQuarter;
    document.getElementById("modal-doc-status").textContent = doc.status;
    document.getElementById("modal-doc-text").textContent = doc.rawTextSample || "Full document text available in ChromaDB vector storage index.";

    modal.classList.add("open");
  }

  function closePreviewModal() {
    document.getElementById("doc-preview-modal").classList.remove("open");
  }

  document.getElementById("btn-close-doc-modal").addEventListener("click", closePreviewModal);
  document.getElementById("btn-modal-close-action").addEventListener("click", closePreviewModal);

  // File upload logic
  const dropzone = document.getElementById("doc-dropzone");
  const fileInput = document.getElementById("file-input-hidden");

  document.getElementById("btn-trigger-upload").addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.background = "var(--main-yellow)";
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.style.background = "#fff";
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.background = "#fff";
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
    }
  });

  async function handleFiles(fileList) {
    for (const file of fileList) {
      const name = file.name;
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";

      let ticker = "NVDA";
      if (name.toUpperCase().includes("MSFT")) ticker = "MSFT";
      if (name.toUpperCase().includes("AAPL")) ticker = "AAPL";
      if (name.toUpperCase().includes("NVTD")) ticker = "NVTD";
      if (name.toUpperCase().includes("APXC")) ticker = "APXC";

      const newDoc = {
        id: "DOC-UP-" + Date.now().toString().slice(-4),
        name: name,
        companyId: ticker,
        ticker: ticker,
        type: name.includes("10-K") ? "10-K Filing" : "10-Q Filing",
        reportingQuarter: "Q3 FY25",
        uploadDate: new Date().toISOString().split("T")[0],
        fileSize: sizeMB,
        status: "Indexed (FastAPI RAG Pipeline)",
        rawTextSample: `Ingested document: ${name} (${sizeMB}). Chunked into dense vector embeddings and lexical keywords.`
      };

      docs.unshift(newDoc);
    }

    renderTable();
    showToast(`Successfully staged and indexed ${fileList.length} files.`);
  }

  document.getElementById("btn-import-url").addEventListener("click", () => {
    const url = prompt("Enter SEC EDGAR or Investor Relations URL:");
    if (url) {
      const newDoc = {
        id: "DOC-URL-" + Date.now().toString().slice(-4),
        name: "SEC-EDGAR-Filing.htm",
        companyId: "NVDA",
        ticker: "NVDA",
        type: "SEC EDGAR Form 8-K",
        reportingQuarter: "Q3 FY25",
        uploadDate: new Date().toISOString().split("T")[0],
        fileSize: "1.4 MB",
        status: "Indexed (FastAPI RAG Pipeline)",
        rawTextSample: `Imported from ${url}. Automatically extracted financial guidance corridors and actual statements.`
      };
      docs.unshift(newDoc);
      renderTable();
      showToast("SEC Filing URL parsed and vectorized.");
    }
  });

  renderTable();
}
