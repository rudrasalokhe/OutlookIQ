/**
 * PAGE 9 — Application Settings (Intelly Aesthetic)
 * Preferences, appearance, and backend diagnostic styled with Intelly warm canvas, white rounded-3xl cards, and pastel accents.
 */

import { api } from "../api.js";
import { showToast } from "../components.js";

export async function renderSettings(container) {
  const currentTheme = localStorage.getItem("outlookiq_theme") || "dark";
  const isCompact = localStorage.getItem("outlookiq_compact") === "true";
  const currencyPref = localStorage.getItem("outlookiq_currency") || "USD";
  const defaultComp = localStorage.getItem("outlookiq_default_company") || "NVTD";
  const apiBase = localStorage.getItem("outlookiq_api_base") || "http://localhost:8000";
  const health = await api.checkHealth();

  container.innerHTML = `
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center text-xs text-textMuted font-medium mb-1">
        <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
        <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
        <span class="text-textMain font-semibold">Preferences</span>
      </div>
      <h2 class="text-2xl font-bold text-textMain">Application Settings</h2>
      <p class="text-textMuted text-xs mt-1">Configure user preferences, financial display standards, and RAG backend integration parameters.</p>
    </div>

    <div class="space-y-6 max-w-3xl mb-8">
      <!-- Section 1: Appearance -->
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="mb-5">
          <h3 class="text-base font-bold text-textMain">Appearance & Interface</h3>
          <p class="text-xs text-textMuted mt-0.5">Visual styling and density controls</p>
        </div>
        
        <div class="space-y-4 divide-y divide-gray-100">
          <div class="flex items-center justify-between pt-2">
            <div>
              <span class="text-xs font-bold text-textMain block">Color Theme</span>
              <span class="text-[11px] text-textMuted">Intelly modern warm canvas or dark mode.</span>
            </div>
            <div class="flex space-x-2">
              <button id="btn-theme-dark" class="px-4 py-1.5 rounded-full text-xs font-semibold ${currentTheme === "dark" ? "bg-sidebarDark text-white" : "bg-bgLight text-textMuted hover:text-textMain"} transition-all">
                <i class="fas fa-moon mr-1.5"></i> Dark
              </button>
              <button id="btn-theme-light" class="px-4 py-1.5 rounded-full text-xs font-semibold ${currentTheme === "light" ? "bg-sidebarDark text-white" : "bg-bgLight text-textMuted hover:text-textMain"} transition-all">
                <i class="fas fa-sun mr-1.5"></i> Warm
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4">
            <div>
              <span class="text-xs font-bold text-textMain block">Compact Dashboard Mode</span>
              <span class="text-[11px] text-textMuted">Condense table row heights and card paddings for high-density analysis.</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="compact-toggle" class="sr-only peer" ${isCompact ? "checked" : ""} />
              <div class="w-10 h-5 bg-bgLight border border-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sidebarDark"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Section 2: Display Preferences -->
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="mb-5">
          <h3 class="text-base font-bold text-textMain">Financial Display Preferences</h3>
          <p class="text-xs text-textMuted mt-0.5">Format standards for financial calculations</p>
        </div>

        <div class="space-y-4 divide-y divide-gray-100">
          <div class="flex items-center justify-between pt-2">
            <div>
              <span class="text-xs font-bold text-textMain block">Reporting Currency Base</span>
              <span class="text-[11px] text-textMuted">Default currency unit used across summary scorecards.</span>
            </div>
            <select id="currency-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
              <option value="USD" ${currencyPref === "USD" ? "selected" : ""}>USD ($) - US Dollar</option>
              <option value="EUR" ${currencyPref === "EUR" ? "selected" : ""}>EUR (€) - Euro</option>
              <option value="GBP" ${currencyPref === "GBP" ? "selected" : ""}>GBP (£) - British Pound</option>
            </select>
          </div>

          <div class="flex items-center justify-between pt-4">
            <div>
              <span class="text-xs font-bold text-textMain block">Default Focus Company</span>
              <span class="text-[11px] text-textMuted">Pre-selected entity on analytics initialization.</span>
            </div>
            <select id="default-company-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
              <option value="NVTD" ${defaultComp === "NVTD" ? "selected" : ""}>NovaTech Dynamics (NVTD)</option>
              <option value="APXC" ${defaultComp === "APXC" ? "selected" : ""}>Apex Cloud Systems (APXC)</option>
              <option value="LMBO" ${defaultComp === "LMBO" ? "selected" : ""}>Lumina BioSciences (LMBO)</option>
              <option value="SOLR" ${defaultComp === "SOLR" ? "selected" : ""}>Solaria Energy Systems (SOLR)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Section 3: Data Preferences -->
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="mb-5">
          <h3 class="text-base font-bold text-textMain">Local Cache & Storage</h3>
          <p class="text-xs text-textMuted mt-0.5">Manage browser cached records and local session state</p>
        </div>

        <div class="space-y-4 divide-y divide-gray-100">
          <div class="flex items-center justify-between pt-2">
            <div>
              <span class="text-xs font-bold text-textMain block">Clear Staged Uploads</span>
              <span class="text-[11px] text-textMuted">Purge documents uploaded during this local session.</span>
            </div>
            <button id="btn-clear-uploads" class="px-4 py-1.5 bg-bgLight rounded-full text-xs font-semibold text-textMain hover:bg-gray-200 transition-colors">
              Clear Uploads
            </button>
          </div>

          <div class="flex items-center justify-between pt-4">
            <div>
              <span class="text-xs font-bold text-textMain block">Factory Reset Application</span>
              <span class="text-[11px] text-textMuted">Reset watchlist, theme preferences, and local cache to defaults.</span>
            </div>
            <button id="btn-reset-all" class="px-4 py-1.5 bg-pastelRed text-red-800 rounded-full text-xs font-bold hover:bg-red-200 transition-colors">
              Reset All
            </button>
          </div>
        </div>
      </div>

      <!-- Section 4: Backend & API Integration -->
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="text-base font-bold text-textMain">Backend & RAG Engine Integration</h3>
            <p class="text-xs text-textMuted mt-0.5">FastAPI server connection status</p>
          </div>
          <span id="api-status-badge" class="text-xs ${health.connected ? "bg-pastelGreen text-green-800" : "bg-bgLight text-textMuted"} px-3 py-1 rounded-full font-bold">
            ${health.connected ? "Connected" : "Mock Mode (Standalone)"}
          </span>
        </div>

        <p class="text-xs text-textMuted mb-4 leading-relaxed">
          OutlookIQ is fully prepared to connect with a Python FastAPI server running LangChain / ChromaDB for live document ingestion, PDF vectorization, and LLM chat.
        </p>

        <div class="space-y-3">
          <div>
            <label class="text-[10px] text-textMuted uppercase font-semibold block mb-1">FastAPI Base URL:</label>
            <input type="text" id="api-base-input" class="w-full bg-bgLight rounded-full py-2 px-4 text-xs text-textMain outline-none border border-transparent focus:border-pastelPink" value="${apiBase}" />
          </div>

          <div class="flex space-x-2 pt-1">
            <button id="btn-save-api" class="px-5 py-2 bg-sidebarDark text-white rounded-full text-xs font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all">Save Endpoint</button>
            <button id="btn-test-connection" class="px-4 py-2 bg-bgLight rounded-full text-xs font-semibold text-textMain hover:bg-gray-200 transition-colors">Test Connection</button>
          </div>

          <div id="connection-status-display" class="text-xs text-textMuted font-mono mt-2 p-3 bg-bgLight rounded-2xl">
            Status: ${health.message}
          </div>
        </div>
      </div>

      <!-- Section 5: Platform About & Version -->
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="flex items-center space-x-3.5 mb-3">
          <div class="w-10 h-10 rounded-full border-2 border-sidebarDark flex items-center justify-center relative">
            <div class="w-2.5 h-2.5 bg-sidebarDark rounded-full"></div>
            <div class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pastelPink rounded-full"></div>
          </div>
          <div>
            <h4 class="text-base font-bold text-textMain leading-tight">OutlookIQ</h4>
            <p class="text-xs text-textMuted italic">"What they forecast. What they delivered."</p>
            <p class="text-[10px] text-textMuted mt-0.5">Version 1.0.0 · Intelly Institutional Edition</p>
          </div>
        </div>
        <p class="text-xs text-textMuted leading-relaxed">
          Built with pure HTML5, CSS3, and ES6+ vanilla JavaScript. Powered by deterministic accounting mathematics and modern institutional fintech design systems.
        </p>
      </div>
    </div>
  `;

  document.getElementById("btn-theme-dark").addEventListener("click", () => {
    document.documentElement.classList.remove("light-theme");
    localStorage.setItem("outlookiq_theme", "dark");
    document.getElementById("btn-theme-dark").className = "px-4 py-1.5 rounded-full text-xs font-semibold bg-sidebarDark text-white transition-all";
    document.getElementById("btn-theme-light").className = "px-4 py-1.5 rounded-full text-xs font-semibold bg-bgLight text-textMuted hover:text-textMain transition-all";
    showToast("Dark Theme Activated", "Optimal for low-light financial environments.", "info");
  });

  document.getElementById("btn-theme-light").addEventListener("click", () => {
    document.documentElement.classList.add("light-theme");
    localStorage.setItem("outlookiq_theme", "light");
    document.getElementById("btn-theme-light").className = "px-4 py-1.5 rounded-full text-xs font-semibold bg-sidebarDark text-white transition-all";
    document.getElementById("btn-theme-dark").className = "px-4 py-1.5 rounded-full text-xs font-semibold bg-bgLight text-textMuted hover:text-textMain transition-all";
    showToast("Warm Theme Activated", "Intelly warm paper daylight palette.", "info");
  });

  document.getElementById("compact-toggle").addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    document.body.classList.toggle("compact-mode", isChecked);
    localStorage.setItem("outlookiq_compact", String(isChecked));
    showToast(
      isChecked ? "Compact Mode On" : "Standard Spacing Restored",
      "Interface density preference saved.",
      "info"
    );
  });

  document.getElementById("currency-select").addEventListener("change", (e) => {
    localStorage.setItem("outlookiq_currency", e.target.value);
    showToast("Currency Updated", `Display currency set to ${e.target.value}.`, "success");
  });

  document.getElementById("default-company-select").addEventListener("change", (e) => {
    localStorage.setItem("outlookiq_default_company", e.target.value);
    showToast("Default Company Saved", `${e.target.value} set as primary focus.`, "success");
  });

  document.getElementById("btn-clear-uploads").addEventListener("click", () => {
    api.clearLocalUploads();
    showToast("Local Uploads Cleared", "Staged user documents removed.", "info");
  });

  document.getElementById("btn-reset-all").addEventListener("click", () => {
    if (confirm("Reset all local settings, watchlists, and preferences?")) {
      localStorage.clear();
      showToast("Reset Complete", "Reloading application with defaults...", "warning");
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  document.getElementById("btn-save-api").addEventListener("click", () => {
    const url = document.getElementById("api-base-input").value.trim();
    api.setApiBase(url);
    showToast("Endpoint Saved", `Backend base URL updated to ${url}`, "success");
  });

  document.getElementById("btn-test-connection").addEventListener("click", async () => {
    const statusDisp = document.getElementById("connection-status-display");
    const badge = document.getElementById("api-status-badge");
    statusDisp.textContent = "Testing connection to FastAPI...";

    api.setUseMock(false);
    const testResult = await api.checkHealth();
    api.setUseMock(true);

    statusDisp.textContent = `Status: ${testResult.message}`;
    badge.textContent = testResult.connected ? "Connected" : "Mock Mode (Standalone)";
    badge.className = `text-xs ${testResult.connected ? "bg-pastelGreen text-green-800" : "bg-bgLight text-textMuted"} px-3 py-1 rounded-full font-bold`;

    showToast(
      testResult.connected ? "Backend Online" : "Backend Offline",
      testResult.message,
      testResult.connected ? "success" : "info"
    );
  });
}
