/**
 * PAGE 7 — AI Financial Analyst (Institutional RAG Engine)
 * Features Hybrid ChromaDB vector retrieval, multi-query expansion,
 * live execution telemetry, and interactive citation chunk inspector.
 */

import { api } from "../api.js";
import { showToast } from "../components.js";

export function renderAnalyst(container) {
  let messages = [
    {
      id: "msg-welcome",
      role: "assistant",
      timestamp: "Today, Just now",
      content: `Welcome to the **OutlookIQ Grounded RAG Financial Analyst**.\n\nI perform quantitative audits reconciling executive guidance statements against official SEC 10-K/10-Q filings using our **hybrid retrieval pipeline (ChromaDB Dense + BM25 Lexical with Reciprocal Rank Fusion)**.\n\nSelect any suggested research query in the left panel or ask about any corporate forecast.`,
      sources: [],
      telemetry: null
    }
  ];

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-3">
      <div>
        <div class="flex items-center text-xs text-textMuted font-medium mb-1">
          <a href="#overview" class="hover:text-textMain transition-colors">OutlookIQ</a>
          <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
          <span class="text-textMain font-semibold">AI Assistant</span>
        </div>
        <h2 class="text-2xl font-bold text-textMain tracking-tight">AI Financial Analyst</h2>
        <p class="text-textMuted text-xs mt-0.5">Quantitative audit of corporate forecasting fidelity, management bias, and guidance reconciliation.</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="bg-cardWhite text-textMain border border-borderSubtle px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 soft-shadow">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span class="font-semibold">ChromaDB + Groq LPU</span>
        </div>
      </div>
    </div>

    <!-- 2 Column Analyst Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-5 h-[calc(100vh-200px)] min-h-[520px]">
      <!-- Left Panel: Suggested Prompts & RAG Architecture Telemetry (col-span-1) -->
      <div class="bg-cardWhite rounded-3xl p-4 soft-shadow border border-borderSubtle/60 flex flex-col overflow-y-auto">
        <button id="btn-new-chat" class="w-full mb-4 px-4 py-2.5 bg-darkAccent text-brandYellow rounded-full hover:bg-black transition-all text-xs font-semibold flex items-center justify-center">
          <i class="fas fa-plus mr-2 text-[10px]"></i> New Research Session
        </button>

        <div class="mb-4">
          <span class="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-2">Institutional Research Queries</span>
          <div class="space-y-1.5">
            <button class="prompt-chip w-full text-left bg-cardBase rounded-xl p-2.5 text-xs text-textMain hover:bg-brandYellowLight/50 transition-colors cursor-pointer border border-borderSubtle/40 font-medium" data-query="Did NVIDIA exceed its Q3 FY25 revenue guidance?">
              "Did NVIDIA exceed its Q3 FY25 revenue guidance?"
            </button>
            <button class="prompt-chip w-full text-left bg-cardBase rounded-xl p-2.5 text-xs text-textMain hover:bg-brandYellowLight/50 transition-colors cursor-pointer border border-borderSubtle/40 font-medium" data-query="Reconcile Microsoft Q2 FY25 guidance against reported actuals.">
              "Reconcile Microsoft Q2 FY25 guidance against reported actuals."
            </button>
            <button class="prompt-chip w-full text-left bg-cardBase rounded-xl p-2.5 text-xs text-textMain hover:bg-brandYellowLight/50 transition-colors cursor-pointer border border-borderSubtle/40 font-medium" data-query="What was Apple's Q1 FY25 outlook for revenue and gross margins?">
              "What was Apple's Q1 FY25 outlook for revenue and gross margins?"
            </button>
            <button class="prompt-chip w-full text-left bg-cardBase rounded-xl p-2.5 text-xs text-textMain hover:bg-brandYellowLight/50 transition-colors cursor-pointer border border-borderSubtle/40 font-medium" data-query="Which company had an operating expense budget overrun?">
              "Which company had an operating expense budget overrun?"
            </button>
            <button class="prompt-chip w-full text-left bg-cardBase rounded-xl p-2.5 text-xs text-textMain hover:bg-brandYellowLight/50 transition-colors cursor-pointer border border-borderSubtle/40 font-medium" data-query="Compare revenue guidance accuracy between NVIDIA and Microsoft.">
              "Compare revenue guidance accuracy between NVIDIA and Microsoft."
            </button>
          </div>
        </div>

        <!-- RAG Architecture Status Widget -->
        <div class="mt-auto pt-3 border-t border-borderSubtle/60">
          <span class="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-2">RAG Engine Architecture</span>
          <div class="bg-cardBase rounded-2xl p-3 text-[11px] space-y-1.5 border border-borderSubtle/60">
            <div class="flex justify-between items-center text-textMuted">
              <span>Vector Store:</span>
              <strong class="text-textMain font-mono">ChromaDB</strong>
            </div>
            <div class="flex justify-between items-center text-textMuted">
              <span>Embedding:</span>
              <strong class="text-textMain font-mono text-[10px]">all-MiniLM-L6-v2</strong>
            </div>
            <div class="flex justify-between items-center text-textMuted">
              <span>Retrieval:</span>
              <strong class="text-textMain font-mono text-[10px]">Dense + BM25 (RRF)</strong>
            </div>
            <div class="flex justify-between items-center text-textMuted">
              <span>Inference:</span>
              <strong class="text-green-700 font-mono text-[10px]">Groq LPU</strong>
            </div>
            <div class="flex justify-between items-center text-textMuted">
              <span>Guardrails:</span>
              <span class="text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.2 rounded-full">Zero-Hallucination</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Chat Stream & Input (col-span-3) -->
      <div class="lg:col-span-3 bg-cardWhite rounded-3xl soft-shadow border border-borderSubtle/60 flex flex-col overflow-hidden">
        <!-- Messages Stream -->
        <div id="chat-stream" class="flex-1 overflow-y-auto p-5 space-y-4">
          <!-- Injected dynamically -->
        </div>

        <!-- Chat Input Bar -->
        <div class="p-3.5 border-t border-borderSubtle/60 bg-cardWhite shrink-0">
          <form id="chat-form" class="flex gap-2">
            <input
              type="text"
              id="chat-input"
              placeholder="Ask about corporate guidance corridors, reported actuals, management bias..."
              class="flex-1 bg-cardBase rounded-full py-2.5 px-5 text-xs text-textMain placeholder-textMuted outline-none border border-borderSubtle/70 focus:border-darkAccent transition-colors"
              autocomplete="off"
            />
            <button type="button" id="btn-clear-chat" class="px-4 py-2 bg-cardBase rounded-full text-xs text-textMuted hover:text-textMain font-medium transition-colors border border-borderSubtle/50" title="Clear Chat">
              Clear
            </button>
            <button type="submit" id="btn-send-chat" class="px-5 py-2.5 bg-darkAccent text-brandYellow rounded-full text-xs font-semibold hover:bg-black transition-all flex items-center">
              <span>Analyze</span>
              <i class="fas fa-bolt ml-2 text-[10px]"></i>
            </button>
          </form>
          <div class="text-[10px] text-textMuted mt-1.5 flex items-center justify-between px-2">
            <span><i class="fas fa-shield-alt text-brandYellow mr-1"></i> Grounded in audited SEC Form 10-Q/10-K & earnings call transcripts.</span>
            <span class="font-mono text-[9px] text-gray-400">Temp: 0.1 | RRF Top-5</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Chunk Inspector Modal Container -->
    <div id="chunk-modal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 hidden">
      <div class="bg-cardWhite rounded-3xl max-w-2xl w-full p-6 border border-borderSubtle soft-shadow flex flex-col max-h-[85vh]">
        <div class="flex items-center justify-between pb-3 border-b border-borderSubtle mb-4">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-textMuted" id="modal-chunk-type">Verified SEC Filing</span>
            <h3 class="text-base font-bold text-textMain" id="modal-chunk-title">Document Title</h3>
          </div>
          <button id="modal-close-btn" class="w-8 h-8 rounded-full bg-cardBase hover:bg-gray-200 flex items-center justify-center text-textMain transition-colors">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
        <div class="grid grid-cols-3 gap-2 mb-4 text-xs font-mono">
          <div class="bg-cardBase p-2 rounded-xl border border-borderSubtle/50">
            <span class="text-[10px] text-textMuted block">Quarter</span>
            <strong id="modal-chunk-quarter">—</strong>
          </div>
          <div class="bg-cardBase p-2 rounded-xl border border-borderSubtle/50">
            <span class="text-[10px] text-textMuted block">Match Confidence</span>
            <strong id="modal-chunk-similarity" class="text-green-700">—</strong>
          </div>
          <div class="bg-cardBase p-2 rounded-xl border border-borderSubtle/50">
            <span class="text-[10px] text-textMuted block">Retrieval Method</span>
            <strong id="modal-chunk-mode" class="text-blue-700 text-[10px]">Hybrid RRF</strong>
          </div>
        </div>
        <div class="overflow-y-auto flex-1 bg-cardBase p-4 rounded-2xl border border-borderSubtle/60 text-xs leading-relaxed text-textMain font-mono whitespace-pre-wrap" id="modal-chunk-body">
          <!-- Populated dynamically -->
        </div>
        <div class="pt-3 border-t border-borderSubtle mt-4 flex justify-between items-center text-xs text-textMuted">
          <span id="modal-chunk-id" class="font-mono text-[10px]">Chunk ID: —</span>
          <button id="modal-close-btn-footer" class="px-4 py-1.5 bg-darkAccent text-white text-xs font-semibold rounded-full hover:bg-black">
            Done
          </button>
        </div>
      </div>
    </div>
  `;

  function renderMessages() {
    const stream = document.getElementById("chat-stream");
    stream.innerHTML = messages.map(msg => {
      const isUser = msg.role === "user";

      let formatted = msg.content
        .replace(/\*\*(.*?)\*\*/g, "<strong class='text-textMain font-bold'>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em class='text-green-700'>$1</em>")
        .replace(/`([^`]+)`/g, "<code class='bg-black/5 text-darkAccent font-mono px-1 py-0.5 rounded text-[11px]'>$1</code>")
        .replace(/\n\n/g, "<p class='mt-2.5'></p>")
        .replace(/\n/g, "<br>");

      return `
        <div class="flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[88%] ${isUser ? "ml-auto" : "mr-auto"}">
          <div class="flex items-center space-x-2 mb-1 text-[11px] text-textMuted font-medium">
            <span class="font-bold ${isUser ? "text-textMain" : "text-darkAccent"}">
              <i class="${isUser ? "fas fa-user-circle" : "fas fa-bolt text-brandYellow"} mr-1"></i> ${isUser ? "Research Analyst" : "OutlookIQ RAG Intelligence"}
            </span>
            <span class="text-[10px] text-gray-400 font-mono">${msg.timestamp}</span>
          </div>

          <div class="p-4 rounded-3xl text-xs leading-relaxed ${isUser ? "bg-darkAccent text-white rounded-tr-sm" : "bg-cardBase text-textMain rounded-tl-sm border border-borderSubtle/60"}">
            ${formatted}
          </div>

          <!-- RAG Pipeline Execution Telemetry Inspector -->
          ${msg.telemetry ? `
            <div class="w-full mt-2 bg-darkAccent text-white rounded-2xl p-3 text-xs shadow-sm border border-black/10">
              <div class="flex items-center justify-between cursor-pointer select-none toggle-telemetry-btn" data-target="telemetry-${msg.id}">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-brandYellow animate-ping"></span>
                  <span class="font-mono text-[11px] text-brandYellow font-semibold">RAG Pipeline Execution Trace (${msg.telemetry.latency_ms}ms)</span>
                </div>
                <div class="flex items-center gap-2 text-[10px] text-textMuted">
                  <span class="bg-white/10 px-2 py-0.5 rounded-full text-white font-mono">${msg.telemetry.retrieval_strategy.split('(')[0].trim()}</span>
                  <i class="fas fa-chevron-down text-[9px] transition-transform" id="arrow-telemetry-${msg.id}"></i>
                </div>
              </div>
              <div id="telemetry-${msg.id}" class="hidden mt-3 pt-3 border-t border-white/10 space-y-2 text-[11px] font-mono text-gray-300">
                <div class="flex justify-between"><span class="text-gray-400">Inference Engine:</span><strong class="text-white">${msg.telemetry.llm_engine}</strong></div>
                <div class="flex justify-between"><span class="text-gray-400">Total Latency:</span><strong class="text-brandYellow">${msg.telemetry.latency_ms} ms</strong></div>
                <div class="flex justify-between"><span class="text-gray-400">Guardrail Temp:</span><span class="text-white">${msg.telemetry.guardrail_temperature} (Deterministic)</span></div>
                <div class="flex justify-between"><span class="text-gray-400">Chunks Evaluated:</span><span class="text-white">${msg.telemetry.candidate_chunks_evaluated} candidates &rarr; ${msg.telemetry.top_chunks_selected} fused</span></div>
                <div class="flex justify-between"><span class="text-gray-400">SQL Grounded Records:</span><span class="text-white">${msg.telemetry.grounded_sql_rows} guidance rows</span></div>
                ${msg.telemetry.sub_queries && msg.telemetry.sub_queries.length > 1 ? `
                  <div class="mt-1 pt-2 border-t border-white/5">
                    <span class="text-gray-400 text-[10px] uppercase font-semibold block mb-1">Sub-Query Expansion:</span>
                    ${msg.telemetry.sub_queries.map(sq => `<div class="text-[10px] text-gray-300 bg-white/5 px-2 py-1 rounded mb-1 truncate">&bull; ${sq}</div>`).join("")}
                  </div>
                ` : ""}
              </div>
            </div>
          ` : ""}

          <!-- Verified RAG Citations (Interactive) -->
          ${msg.sources && msg.sources.length > 0 ? `
            <div class="w-full mt-2.5 bg-cardBase border border-borderSubtle rounded-2xl p-3.5 text-xs soft-shadow">
              <div class="text-[11px] font-bold text-darkAccent mb-2 flex items-center justify-between">
                <span class="flex items-center"><i class="fas fa-file-invoice mr-1.5 text-brandYellow"></i> Verified Corporate Citations (${msg.sources.length})</span>
                <span class="text-[9px] font-mono text-textMuted">Click card to inspect source chunk</span>
              </div>
              <div class="space-y-2">
                ${msg.sources.map((s, idx) => `
                  <div class="citation-card bg-white hover:bg-brandYellowLight/20 cursor-pointer transition-all rounded-xl p-2.5 border border-borderSubtle/60 text-[11px] text-textMain" data-source-index="${idx}" data-msg-id="${msg.id}">
                    <div class="flex items-center justify-between mb-1">
                      <strong class="text-textMain text-xs flex items-center gap-1.5">
                        <i class="far fa-file-alt text-brandYellow"></i>
                        ${s.title || s.company || "Corporate Disclosure"}
                      </strong>
                      <span class="text-[9px] bg-brandYellowLight text-darkAccent px-2 py-0.5 rounded-full font-bold">
                        ${s.similarity ? s.similarity + "% Match" : s.reporting_quarter || "Verified"}
                      </span>
                    </div>
                    <p class="text-textMuted text-[10px] leading-relaxed italic line-clamp-2">
                      "${s.excerpt || (s.guidance ? `Guided: ${s.guidance} -> Reported: ${s.actual}` : "")}"
                    </p>
                    <div class="flex items-center justify-between mt-1 text-[9px] text-gray-400">
                      <span>${s.doc_type || "Filing"} · ${s.reporting_quarter || "Quarterly"}</span>
                      <span class="text-darkAccent font-medium hover:underline flex items-center gap-1">Inspect Chunk <i class="fas fa-arrow-up-right-from-square text-[8px]"></i></span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }).join("");

    stream.scrollTop = stream.scrollHeight;

    // Attach telemetry toggle listeners
    document.querySelectorAll(".toggle-telemetry-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const panel = document.getElementById(targetId);
        const arrow = document.getElementById(`arrow-${targetId}`);
        if (panel) {
          panel.classList.toggle("hidden");
          if (arrow) {
            arrow.style.transform = panel.classList.contains("hidden") ? "rotate(0deg)" : "rotate(180deg)";
          }
        }
      });
    });

    // Attach citation card modal inspector listeners
    document.querySelectorAll(".citation-card").forEach(card => {
      card.addEventListener("click", () => {
        const msgId = card.dataset.msgId;
        const idx = parseInt(card.dataset.sourceIndex, 10);
        const targetMsg = messages.find(m => m.id === msgId);
        if (targetMsg && targetMsg.sources && targetMsg.sources[idx]) {
          openChunkModal(targetMsg.sources[idx]);
        }
      });
    });
  }

  function openChunkModal(source) {
    const modal = document.getElementById("chunk-modal");
    document.getElementById("modal-chunk-title").textContent = source.title || "Corporate Disclosure";
    document.getElementById("modal-chunk-type").textContent = source.doc_type || "SEC Filing";
    document.getElementById("modal-chunk-quarter").textContent = source.reporting_quarter || "—";
    document.getElementById("modal-chunk-similarity").textContent = `${source.similarity || 92.5}% Match`;
    document.getElementById("modal-chunk-mode").textContent = source.retrieval_mode || "Hybrid RRF";
    document.getElementById("modal-chunk-id").textContent = `ID: ${source.id || "CHUNK-DOC"}`;
    document.getElementById("modal-chunk-body").textContent = source.full_text || source.excerpt || "No further chunk content available.";
    modal.classList.remove("hidden");
  }

  function closeChunkModal() {
    const modal = document.getElementById("chunk-modal");
    if (modal) modal.classList.add("hidden");
  }

  document.getElementById("modal-close-btn")?.addEventListener("click", closeChunkModal);
  document.getElementById("modal-close-btn-footer")?.addEventListener("click", closeChunkModal);
  document.getElementById("chunk-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "chunk-modal") closeChunkModal();
  });

  async function submitQuery(queryText) {
    if (!queryText.trim()) return;

    messages.push({
      id: `msg-${Date.now()}`,
      role: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: queryText,
      sources: [],
      telemetry: null
    });

    renderMessages();

    const stream = document.getElementById("chat-stream");
    const loadingEl = document.createElement("div");
    loadingEl.className = "flex items-center space-x-2 text-xs text-textMuted p-3 bg-cardBase rounded-2xl border border-borderSubtle/60";
    loadingEl.innerHTML = `<i class="fas fa-spinner fa-spin text-brandYellow"></i> <span class="font-medium">Executing multi-query RAG search across ChromaDB & verified SQLite records...</span>`;
    stream.appendChild(loadingEl);
    stream.scrollTop = stream.scrollHeight;

    const response = await api.sendChatMessage(queryText);
    loadingEl.remove();

    messages.push({
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: response.answer,
      sources: response.sources || response.citations || [],
      telemetry: response.telemetry || null
    });

    renderMessages();
  }

  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value;
    input.value = "";
    submitQuery(query);
  });

  document.querySelectorAll(".prompt-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      submitQuery(chip.dataset.query);
    });
  });

  document.getElementById("btn-clear-chat").addEventListener("click", () => {
    messages = [
      {
        id: "msg-welcome",
        role: "assistant",
        timestamp: "Today, Just now",
        content: `Session cleared. Select a suggested question on the left or enter a new corporate forecast inquiry.`,
        sources: [],
        telemetry: null
      }
    ];
    renderMessages();
    showToast("Session Reset", "Conversation history cleared.", "info");
  });

  document.getElementById("btn-new-chat").addEventListener("click", () => {
    messages = [
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        timestamp: "Just now",
        content: `Starting a new research session. What financial forecast would you like to investigate?`,
        sources: [],
        telemetry: null
      }
    ];
    renderMessages();
    input.focus();
  });

  renderMessages();
}
