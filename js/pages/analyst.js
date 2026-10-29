/**
 * PAGE 7 — AI Financial Analyst (Intelly Aesthetic)
 * Conversational research interface styled with Intelly warm canvas, white rounded-3xl cards, and pastel accents.
 */

import { api } from "../api.js";
import { showToast } from "../components.js";

export function renderAnalyst(container) {
  let messages = [
    {
      id: "msg-welcome",
      role: "assistant",
      timestamp: "Today, Just now",
      content: `Welcome to the **OutlookIQ AI Financial Analyst**. I provide evidence-backed analysis comparing historical management earnings guidance against reported SEC filings.\n\nSelect any suggested research query in the left panel or type your question below.`,
      sources: []
    }
  ];

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
      <div>
        <div class="flex items-center text-xs text-textMuted font-medium mb-1">
          <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
          <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
          <span class="text-textMain font-semibold">AI Assistant</span>
        </div>
        <h2 class="text-2xl font-bold text-textMain">AI Financial Analyst</h2>
        <p class="text-textMuted text-xs mt-1">Quantitative audit of corporate forecasting fidelity, management bias, and guidance reconciliation.</p>
      </div>
      <div class="bg-cardWhite text-textMain border border-gray-100 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 intelly-shadow self-start sm:self-auto">
        <span class="w-2 h-2 bg-pastelGreen rounded-full"></span>
        <span>RAG Knowledge Base Active</span>
      </div>
    </div>

    <!-- 2 Column Analyst Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-210px)] min-h-[500px]">
      <!-- Left Panel: Suggested Prompts & History (col-span-1) -->
      <div class="bg-cardWhite rounded-3xl p-5 intelly-shadow border border-gray-100 flex flex-col overflow-y-auto">
        <button id="btn-new-chat" class="w-full mb-5 px-4 py-2.5 bg-sidebarDark text-white rounded-full hover:bg-pastelPink hover:text-sidebarDark transition-all text-xs font-semibold flex items-center justify-center">
          <i class="fas fa-plus mr-2 text-[10px]"></i> New Research Session
        </button>

        <div class="mb-5">
          <span class="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-2.5">Suggested Prompts</span>
          <div class="space-y-2">
            <button class="prompt-chip w-full text-left bg-bgLight rounded-2xl p-3 text-xs text-textMain hover:bg-pastelPink/30 transition-colors cursor-pointer border border-transparent font-medium" data-query="Which company had the highest percentage of missed guidance?">
              "Which company had the highest percentage of missed guidance?"
            </button>
            <button class="prompt-chip w-full text-left bg-bgLight rounded-2xl p-3 text-xs text-textMain hover:bg-pastelPink/30 transition-colors cursor-pointer border border-transparent font-medium" data-query="Did management consistently exceed its revenue guidance?">
              "Did management consistently exceed its revenue guidance?"
            </button>
            <button class="prompt-chip w-full text-left bg-bgLight rounded-2xl p-3 text-xs text-textMain hover:bg-pastelPink/30 transition-colors cursor-pointer border border-transparent font-medium" data-query="Which quarter had the largest forecast deviation?">
              "Which quarter had the largest forecast deviation?"
            </button>
            <button class="prompt-chip w-full text-left bg-bgLight rounded-2xl p-3 text-xs text-textMain hover:bg-pastelPink/30 transition-colors cursor-pointer border border-transparent font-medium" data-query="Compare revenue guidance accuracy across companies.">
              "Compare revenue guidance accuracy across companies."
            </button>
          </div>
        </div>

        <div class="mt-auto pt-3 border-t border-gray-100">
          <span class="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-2">Active Session</span>
          <div class="bg-bgLight rounded-2xl p-2.5 text-xs flex items-center space-x-2 text-textMain font-semibold">
            <div class="w-2 h-2 rounded-full bg-pastelGreen"></div>
            <span class="truncate">Live Research Session</span>
          </div>
        </div>
      </div>

      <!-- Right Panel: Chat Stream & Input (col-span-3) -->
      <div class="lg:col-span-3 bg-cardWhite rounded-3xl intelly-shadow border border-gray-100 flex flex-col overflow-hidden">
        <!-- Messages Stream -->
        <div id="chat-stream" class="flex-1 overflow-y-auto p-6 space-y-5">
          <!-- Injected dynamically -->
        </div>

        <!-- Chat Input Bar -->
        <div class="p-4 border-t border-gray-100 bg-cardWhite shrink-0">
          <form id="chat-form" class="flex gap-2">
            <input
              type="text"
              id="chat-input"
              placeholder="Ask about corporate guidance deviations, management accuracy..."
              class="flex-1 bg-bgLight rounded-full py-2.5 px-5 text-xs text-textMain placeholder-textMuted outline-none border border-transparent focus:border-pastelPink transition-colors"
              autocomplete="off"
            />
            <button type="button" id="btn-clear-chat" class="px-4 py-2 bg-bgLight rounded-full text-xs text-textMuted hover:text-textMain font-medium transition-colors" title="Clear Chat">
              Clear
            </button>
            <button type="submit" id="btn-send-chat" class="px-5 py-2.5 bg-sidebarDark text-white rounded-full text-xs font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all flex items-center">
              <span>Send</span>
              <i class="fas fa-paper-plane ml-2 text-[10px]"></i>
            </button>
          </form>
          <div class="text-[10px] text-textMuted mt-2 flex items-center gap-1.5 px-2">
            <i class="fas fa-info-circle text-pastelPink"></i> OutlookIQ AI Analyst provides deterministic math and cited evidence.
          </div>
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
        .replace(/\n\n/g, "<p class='mt-2'></p>")
        .replace(/\n/g, "<br>");

      return `
        <div class="flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[85%] ${isUser ? "ml-auto" : "mr-auto"}">
          <div class="flex items-center space-x-2 mb-1.5 text-[11px] text-textMuted font-medium">
            <span class="font-bold ${isUser ? "text-textMain" : "text-sidebarDark"}">
              <i class="${isUser ? "fas fa-user-circle" : "fas fa-robot text-pastelPink"} mr-1"></i> ${isUser ? "Analyst" : "OutlookIQ Assistant"}
            </span>
            <span class="text-[10px] text-gray-400 font-mono">${msg.timestamp}</span>
          </div>

          <div class="p-4 rounded-3xl text-xs leading-relaxed ${isUser ? "bg-sidebarDark text-white rounded-tr-sm" : "bg-bgLight text-textMain rounded-tl-sm border border-gray-100"}">
            ${formatted}
          </div>

          ${msg.sources && msg.sources.length > 0 ? `
            <div class="w-full mt-2.5 bg-cardBase border border-borderSubtle rounded-2xl p-3.5 text-xs soft-shadow">
              <div class="text-[11px] font-bold text-darkAccent mb-2 flex items-center justify-between">
                <span class="flex items-center"><i class="fas fa-file-invoice mr-1.5 text-brandYellow"></i> Verified RAG Citations (${msg.sources.length})</span>
                <span class="text-[9px] font-mono text-textMuted">ChromaDB Vector Match</span>
              </div>
              <div class="space-y-2">
                ${msg.sources.map(s => `
                  <div class="bg-white rounded-xl p-2.5 border border-borderSubtle/60 text-[11px] text-textMain">
                    <div class="flex items-center justify-between mb-1">
                      <strong class="text-textMain text-xs">${s.title || s.company || "Corporate Disclosure"}</strong>
                      <span class="text-[9px] bg-brandYellowLight text-darkAccent px-1.5 py-0.5 rounded-full font-bold">
                        ${s.similarity ? s.similarity + "% Match" : s.reporting_quarter || "Verified"}
                      </span>
                    </div>
                    <p class="text-textMuted text-[10px] leading-relaxed italic">
                      "${s.excerpt || (s.guidance ? `Guided: ${s.guidance} -> Reported: ${s.actual}` : "")}"
                    </p>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }).join("");

    stream.scrollTop = stream.scrollHeight;
  }

  async function submitQuery(queryText) {
    if (!queryText.trim()) return;

    messages.push({
      id: `msg-${Date.now()}`,
      role: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: queryText,
      sources: []
    });

    renderMessages();

    const stream = document.getElementById("chat-stream");
    const loadingEl = document.createElement("div");
    loadingEl.className = "flex items-center space-x-2 text-xs text-textMuted p-3";
    loadingEl.innerHTML = `<i class="fas fa-spinner fa-spin text-pastelPink"></i> <span>Searching filings & guidance transcripts...</span>`;
    stream.appendChild(loadingEl);
    stream.scrollTop = stream.scrollHeight;

    const response = await api.sendChatMessage(queryText);
    loadingEl.remove();

    messages.push({
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: response.answer,
      sources: response.sources || []
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
        sources: []
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
        sources: []
      }
    ];
    renderMessages();
    input.focus();
  });

  renderMessages();
}
