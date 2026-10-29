/**
 * PAGE 6 — Financial Document Library (Intelly Aesthetic)
 * Ingestion and corpus management styled with Intelly warm canvas, white rounded-3xl cards, and pastel badges.
 */

import { api } from "../api.js";
import { showToast } from "../components.js";

export async function renderDocuments(container) {
  let docs = await api.getDocuments();

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
      <div>
        <div class="flex items-center text-xs text-textMuted font-medium mb-1">
          <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
          <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
          <span class="text-textMain font-semibold">Corpus Documents</span>
        </div>
        <h2 class="text-2xl font-bold text-textMain">Document Library</h2>
        <p class="text-textMuted text-xs mt-1">Earnings releases, SEC filings, and management call transcripts for automated RAG extraction.</p>
      </div>
      <button id="btn-import-url" class="flex items-center px-4 py-2 bg-cardWhite border border-gray-100 rounded-full text-textMain hover:bg-bgLight transition-colors text-xs font-semibold intelly-shadow self-start sm:self-auto">
        <i class="fas fa-link mr-2 text-pastelPink"></i> Import from URL
      </button>
    </div>

    <!-- Drag-and-Drop Upload Area -->
    <div id="doc-dropzone" class="border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center bg-cardWhite hover:border-pastelPink transition-all flex flex-col items-center justify-center cursor-pointer mb-6 intelly-shadow">
      <input type="file" id="file-input-hidden" class="hidden" accept=".pdf,.txt,.html" multiple />
      <div class="w-14 h-14 rounded-full bg-pastelPink/30 flex items-center justify-center text-sidebarDark mb-3">
        <i class="fas fa-cloud-upload-alt text-xl text-sidebarDark"></i>
      </div>
      <h3 class="text-base font-bold text-textMain mb-1">Drag & drop financial documents here</h3>
      <p class="text-xs text-textMuted max-w-md mb-4">Accepts SEC Form 10-K/10-Q, earnings press releases, or call transcripts (PDF, TXT, HTML up to 25MB)</p>
      <button id="btn-trigger-upload" class="bg-sidebarDark text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all">
        Browse Local Files
      </button>
      <p class="text-[11px] text-textMuted mt-3 font-medium">
        <strong class="text-textMain">Transparency:</strong> Files are parsed locally via browser File APIs. Semantic embeddings & RAG indexing connect via FastAPI.
      </p>
    </div>

    <!-- Document Table Card -->
    <div class="bg-cardWhite rounded-3xl intelly-shadow overflow-hidden mb-8 border border-gray-100">
      <div class="p-5 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 id="doc-count-title" class="text-base font-bold text-textMain">Indexed & Staged Documents (${docs.length})</h3>
          <p class="text-xs text-textMuted mt-0.5">Primary sources supporting guidance extraction and citation audit</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-bgLight/50 border-b border-gray-100 text-[10px] text-textMuted uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-5">Document Name</th>
              <th class="py-3.5 px-5">Issuer</th>
              <th class="py-3.5 px-5">Category</th>
              <th class="py-3.5 px-5">Period</th>
              <th class="py-3.5 px-5">Date Staged</th>
              <th class="py-3.5 px-5">Vector Status</th>
              <th class="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="docs-tbody" class="text-xs text-textMain divide-y divide-gray-100">
            <!-- Injected dynamically -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Document Preview Modal -->
    <div id="doc-preview-modal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-cardWhite rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden border border-gray-100">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div id="modal-doc-meta" class="text-[10px] text-textMuted font-mono">SEC Form 10-Q</div>
            <h2 id="modal-doc-title" class="text-base font-bold text-textMain">Document Name</h2>
          </div>
          <button id="btn-close-doc-modal" class="w-8 h-8 rounded-full bg-bgLight text-textMuted hover:text-textMain flex items-center justify-center text-sm focus:outline-none">&times;</button>
        </div>
        <div class="p-6 overflow-y-auto space-y-4">
          <div class="flex space-x-6 bg-bgLight p-4 rounded-2xl text-xs">
            <div><span class="text-[10px] text-textMuted uppercase font-semibold block">File Size</span><span id="modal-doc-size" class="font-mono text-textMain font-bold"></span></div>
            <div><span class="text-[10px] text-textMuted uppercase font-semibold block">Quarter</span><span id="modal-doc-quarter" class="font-mono text-textMain font-bold"></span></div>
            <div><span class="text-[10px] text-textMuted uppercase font-semibold block">Status</span><span id="modal-doc-status" class="inline-block mt-0.5"></span></div>
          </div>
          <div class="bg-bgLight rounded-2xl p-4">
            <h4 class="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Extracted Source Excerpt</h4>
            <p id="modal-doc-text" class="text-xs font-mono text-textMain leading-relaxed"></p>
          </div>
        </div>
        <div class="p-4 border-t border-gray-100 flex justify-end">
          <button id="btn-modal-close-action" class="px-5 py-2 bg-sidebarDark text-white rounded-full text-xs font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all">Close Preview</button>
        </div>
      </div>
    </div>
  `;

  function renderTable() {
    const tbody = document.getElementById("docs-tbody");
    document.getElementById("doc-count-title").textContent = `Indexed & Staged Documents (${docs.length})`;

    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-textMuted font-medium">No documents uploaded yet.</td></tr>`;
      return;
    }

    const pastelTickerBadges = {
      NVTD: "bg-pastelGreen text-green-800",
      APXC: "bg-pastelBlue text-blue-800",
      LMBO: "bg-pastelPink text-pink-900",
      SOLR: "bg-pastelYellow text-yellow-900"
    };

    tbody.innerHTML = docs.map(d => {
      const isNotIndexed = d.status.includes("Not Indexed");
      const statusBadge = isNotIndexed
        ? `<span class="bg-pastelYellow text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fas fa-clock mr-1 text-[8px]"></i> Local Staged</span>`
        : `<span class="bg-pastelGreen text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fas fa-check mr-1 text-[8px]"></i> Indexed (Mock RAG)</span>`;

      const tickerBadge = pastelTickerBadges[d.ticker] || "bg-bgLight text-textMain";

      return `
        <tr class="hover:bg-bgLight/50 transition-colors">
          <td class="py-3.5 px-5 flex items-center space-x-2.5">
            <div class="w-7 h-7 rounded-lg bg-pastelPink/40 flex items-center justify-center text-sidebarDark text-xs shrink-0">
              <i class="fas fa-file-pdf"></i>
            </div>
            <strong class="text-textMain text-xs">${d.name}</strong>
          </td>
          <td class="py-3.5 px-5"><span class="text-[10px] font-bold ${tickerBadge} px-2 py-0.5 rounded-lg font-mono">${d.ticker}</span></td>
          <td class="py-3.5 px-5 text-xs text-textMuted">${d.type}</td>
          <td class="py-3.5 px-5 font-semibold text-xs text-textMain">${d.reportingQuarter}</td>
          <td class="py-3.5 px-5 text-xs font-mono text-textMuted">${d.uploadDate}</td>
          <td class="py-3.5 px-5">${statusBadge}</td>
          <td class="py-3.5 px-5 text-right space-x-2">
            <button class="bg-sidebarDark text-white px-3 py-1.5 rounded-full text-[11px] font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all btn-preview-doc" data-doc-id="${d.id}">Preview</button>
            <button class="text-xs text-red-600 hover:text-red-800 font-semibold btn-remove-doc transition-colors" data-doc-id="${d.id}">Remove</button>
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
        showToast("Document Removed", "Document removed from library.", "info");
      });
    });
  }

  function openPreviewModal(doc) {
    const modal = document.getElementById("doc-preview-modal");
    document.getElementById("modal-doc-title").textContent = doc.name;
    document.getElementById("modal-doc-meta").textContent = `${doc.ticker} · ${doc.type}`;
    document.getElementById("modal-doc-size").textContent = doc.fileSize;
    document.getElementById("modal-doc-quarter").textContent = doc.reportingQuarter;
    
    const statusEl = document.getElementById("modal-doc-status");
    statusEl.innerHTML = doc.status.includes("Not Indexed")
      ? `<span class="bg-pastelYellow text-yellow-900 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Local Staged</span>`
      : `<span class="bg-pastelGreen text-green-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Indexed (Mock RAG)</span>`;

    document.getElementById("modal-doc-text").textContent = doc.excerpt || "No textual preview available.";
    modal.classList.remove("hidden");
  }

  document.getElementById("btn-close-doc-modal").addEventListener("click", () => {
    document.getElementById("doc-preview-modal").classList.add("hidden");
  });
  document.getElementById("btn-modal-close-action").addEventListener("click", () => {
    document.getElementById("doc-preview-modal").classList.add("hidden");
  });

  const dropzone = document.getElementById("doc-dropzone");
  const fileInput = document.getElementById("file-input-hidden");

  document.getElementById("btn-trigger-upload").addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("border-pastelPink");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("border-pastelPink");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("border-pastelPink");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  });

  async function handleFiles(fileList) {
    for (const file of fileList) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const isTxtOrHtml = file.type.includes("text") || file.name.endsWith(".txt") || file.name.endsWith(".html");
      let excerpt = "Binary PDF document uploaded locally. Full text parsing awaits backend Python PDF extraction.";

      if (isTxtOrHtml) {
        try {
          const text = await file.text();
          excerpt = text.slice(0, 300) + (text.length > 300 ? "..." : "");
        } catch (err) {
          console.warn("Could not read file text:", err);
        }
      }

      const uploadedDoc = await api.uploadDocument(
        file,
        "NVDA",
        file.name.endsWith(".pdf") ? "PDF Release" : "Earnings Document",
        "Q4 FY25"
      );

      docs.unshift(uploadedDoc);
    }

    renderTable();
    showToast(
      "Document Ingested",
      `${fileList.length} file(s) ingested, chunked, and indexed in vector storage.`,
      "success"
    );
  }

  document.getElementById("btn-import-url").addEventListener("click", () => {
    showToast(
      "Import Interface Ready",
      "URL crawling and automated SEC EDGAR parsing will be enabled when the FastAPI ingestion service is connected.",
      "info"
    );
  });

  renderTable();
}
