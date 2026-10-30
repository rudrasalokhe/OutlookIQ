/**
 * PAGE 9 — Application Settings (Neo-Brutalist Design)
 * Preferences, appearance, and backend diagnostic styled with bold black borders (3px), hard drop-shadows (6px), Space Grotesk.
 */

import { api } from "../api.js";
import { showToast } from "../components.js";

export async function renderSettings(container) {
  const getStorage = (k, def) => (typeof localStorage !== "undefined" ? localStorage.getItem(k) : null) || def;
  const currentTheme = getStorage("outlookiq_theme", "dark");
  const currencyPref = getStorage("outlookiq_currency", "USD");
  const defaultComp = getStorage("outlookiq_default_company", "NVDA");
  const apiBase = getStorage("outlookiq_api_base", "http://localhost:8000");
  const health = await api.checkHealth();

  container.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header-title">
        <h1>Application Settings</h1>
        <div class="badge">Configuration & Diagnostics</div>
        <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">Preferences, API Endpoints & ChromaDB Cache</span>
      </div>
      <div class="header-actions">
        <span class="badge" style="background: var(--main-yellow);">Deterministic Engine</span>
      </div>
    </header>

    <div style="display: flex; flex-direction: column; gap: 24px; max-width: 800px; margin-bottom: 32px;">
      
      <!-- Section 1: Appearance & Architecture -->
      <div class="brutal-card">
        <div class="stat-label">Visual Architecture & Design</div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
          <div>
            <strong style="text-transform: uppercase; font-size: 0.9rem;">Design Standard</strong>
            <p style="font-size: 0.8rem; font-weight: 600; color: #666; margin-top: 2px;">Neo-Brutalist Institutional Trading Desk.</p>
          </div>
          <span class="badge" style="background: var(--main-yellow);">Active</span>
        </div>
      </div>

      <!-- Section 2: Display Preferences -->
      <div class="brutal-card">
        <div class="stat-label">Financial Display Standards</div>

        <div style="display: flex; flex-direction: column; gap: 16px; padding-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed var(--border-color); padding-bottom: 12px;">
            <div>
              <strong style="text-transform: uppercase; font-size: 0.9rem;">Reporting Base Currency</strong>
              <p style="font-size: 0.8rem; font-weight: 600; color: #666; margin-top: 2px;">Default unit used across summary scorecards.</p>
            </div>
            <select id="currency-select" class="brutal-select">
              <option value="USD" ${currencyPref === "USD" ? "selected" : ""}>USD ($) - US Dollar</option>
              <option value="EUR" ${currencyPref === "EUR" ? "selected" : ""}>EUR (€) - Euro</option>
              <option value="GBP" ${currencyPref === "GBP" ? "selected" : ""}>GBP (£) - British Pound</option>
            </select>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="text-transform: uppercase; font-size: 0.9rem;">Default Focus Company</strong>
              <p style="font-size: 0.8rem; font-weight: 600; color: #666; margin-top: 2px;">Pre-selected entity on analytics initialization.</p>
            </div>
            <select id="default-company-select" class="brutal-select">
              <option value="NVDA" ${defaultComp === "NVDA" ? "selected" : ""}>NVIDIA Corporation (NVDA)</option>
              <option value="MSFT" ${defaultComp === "MSFT" ? "selected" : ""}>Microsoft Corporation (MSFT)</option>
              <option value="AAPL" ${defaultComp === "AAPL" ? "selected" : ""}>Apple Inc. (AAPL)</option>
              <option value="NVTD" ${defaultComp === "NVTD" ? "selected" : ""}>NovaTech Dynamics (NVTD)</option>
              <option value="APXC" ${defaultComp === "APXC" ? "selected" : ""}>Apex Cloud Systems (APXC)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Section 3: Backend Diagnostic -->
      <div class="brutal-card">
        <div class="stat-label">FastAPI & ChromaDB Diagnostics</div>

        <div style="display: flex; flex-direction: column; gap: 14px; padding-top: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed var(--border-color); padding-bottom: 12px;">
            <div>
              <strong style="text-transform: uppercase; font-size: 0.9rem;">API Base Endpoint</strong>
              <p style="font-size: 0.8rem; font-weight: 600; color: #666; margin-top: 2px;">Active REST endpoint for vector retrieval and promise querying.</p>
            </div>
            <input
              type="text"
              id="api-base-input"
              value="${apiBase}"
              class="brutal-border"
              style="padding: 8px 12px; font-family: var(--font-sans); font-weight: 700; font-size: 0.8rem; width: 220px;"
            />
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed var(--border-color); padding-bottom: 12px;">
            <div>
              <strong style="text-transform: uppercase; font-size: 0.9rem;">System Health Check</strong>
              <p style="font-size: 0.8rem; font-weight: 600; color: #666; margin-top: 2px;">Real-time connectivity to Python FastAPI backend.</p>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge" style="background: ${health.connected ? "var(--main-teal)" : "var(--main-pink)"};">
                ${health.connected ? "ONLINE (200 OK)" : "OFFLINE"}
              </span>
              <button id="btn-ping-backend" class="brutal-btn" style="padding: 6px 12px; font-size: 0.75rem;">Ping</button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="text-transform: uppercase; font-size: 0.9rem;">Reset Local Storage & Cache</strong>
              <p style="font-size: 0.8rem; font-weight: 600; color: #666; margin-top: 2px;">Clears watchlist, staged documents, and local filters.</p>
            </div>
            <button id="btn-reset-cache" class="brutal-btn" style="background: var(--main-pink); padding: 6px 12px; font-size: 0.75rem;">
              Purge Cache
            </button>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button id="btn-save-settings" class="brutal-btn" style="background: var(--main-yellow);">
          Save Configuration
        </button>
      </div>
    </div>
  `;

  document.getElementById("btn-ping-backend").addEventListener("click", async () => {
    const res = await api.checkHealth();
    if (res.connected) {
      showToast("Backend Online", "FastAPI server responded successfully.");
    } else {
      showToast("Backend Offline", "Could not reach FastAPI server on port 8000.");
    }
  });

  document.getElementById("btn-reset-cache").addEventListener("click", () => {
    if (confirm("Purge all local settings and watchlist cache?")) {
      localStorage.clear();
      showToast("Local Cache Purged", "Reloading application...");
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  document.getElementById("btn-save-settings").addEventListener("click", () => {
    const curr = document.getElementById("currency-select").value;
    const defComp = document.getElementById("default-company-select").value;
    const base = document.getElementById("api-base-input").value;

    localStorage.setItem("outlookiq_currency", curr);
    localStorage.setItem("outlookiq_default_company", defComp);
    localStorage.setItem("outlookiq_api_base", base);

    showToast("Settings Saved", "Preferences updated successfully.");
  });
}
