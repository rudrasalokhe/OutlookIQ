/**
 * PAGE 2 — Company Explorer (Neo-Brutalist Design)
 * High-contrast brutalist cards, bold black borders (3px), hard drop-shadows (6px), Space Grotesk.
 */

import { api } from "../api.js";
import { openCompanyProfileModal, getWatchlist, toggleWatchlist, showToast } from "../components.js";

export async function renderCompanies(container) {
  const companies = await api.getCompanies();
  const allPromises = await api.getPromises();

  container.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header-title">
        <h1>Tracked Issuers</h1>
        <div class="badge">Coverage Universe</div>
        <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">${companies.length} Active Tier-1 Corporate Issuers</span>
      </div>
      <div class="header-actions">
        <label class="brutal-card flex items-center gap-2 cursor-pointer select-none" style="padding: 8px 16px; flex-direction: row; margin: 0;">
          <input type="checkbox" id="watchlist-only-checkbox" style="cursor: pointer; width: 18px; height: 18px; accent-color: #000;" />
          <span style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">Watchlist Only</span>
        </label>
      </div>
    </header>

    <!-- Filter Control Bar -->
    <div class="brutal-card" style="padding: 16px; margin-bottom: 24px; flex-direction: row; flex-wrap: wrap; gap: 16px; align-items: center;">
      <div style="flex: 1; min-width: 240px; position: relative;">
        <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px;"></i>
        <input
          type="text"
          id="company-search-input"
          placeholder="SEARCH COMPANY, TICKER, OR INDUSTRY..."
          class="brutal-border"
          style="width: 100%; padding: 10px 14px 10px 38px; font-family: var(--font-sans); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; background: #fff;"
        />
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Sector:</span>
        <select id="company-sector-filter" class="brutal-select">
          <option value="ALL">All Sectors</option>
          <option value="Technology">Technology</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Clean Energy">Clean Energy</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Sort:</span>
        <select id="company-sort-select" class="brutal-select">
          <option value="marketcap">Market Cap (Highest)</option>
          <option value="coverage">Guidance Coverage</option>
          <option value="forecasts">Most Forecasts</option>
          <option value="name">Company Name (A-Z)</option>
        </select>
      </div>
    </div>

    <!-- Grid of Companies (3 columns) -->
    <div class="grid-3" id="companies-grid-container">
      <!-- Injected dynamically -->
    </div>
  `;

  function renderGrid() {
    const searchVal = (document.getElementById("company-search-input")?.value || "").toLowerCase().trim();
    const sectorVal = document.getElementById("company-sector-filter")?.value || "ALL";
    const sortVal = document.getElementById("company-sort-select")?.value || "marketcap";
    const watchlistOnly = Boolean(document.getElementById("watchlist-only-checkbox")?.checked);
    const watchlist = getWatchlist();

    let list = [...companies];

    // Filter search
    if (searchVal) {
      list = list.filter(c =>
        (c.name || "").toLowerCase().includes(searchVal) ||
        (c.ticker || "").toLowerCase().includes(searchVal) ||
        (c.industry || c.sector || "").toLowerCase().includes(searchVal)
      );
    }

    // Filter sector
    if (sectorVal !== "ALL") {
      list = list.filter(c => (c.sector || "").toLowerCase().includes(sectorVal.toLowerCase()));
    }

    // Filter watchlist
    if (watchlistOnly) {
      list = list.filter(c => watchlist.includes(c.ticker));
    }

    // Sort
    list.sort((a, b) => {
      if (sortVal === "name") return a.name.localeCompare(b.name);
      if (sortVal === "coverage") return parseFloat(b.guidanceCoverage) - parseFloat(a.guidanceCoverage);
      if (sortVal === "forecasts") return b.totalForecastsTracked - a.totalForecastsTracked;
      const numA = parseFloat(a.marketCap.replace(/[^0-9.]/g, ""));
      const numB = parseFloat(b.marketCap.replace(/[^0-9.]/g, ""));
      return numB - numA;
    });

    const grid = document.getElementById("companies-grid-container");

    if (list.length === 0) {
      grid.innerHTML = `
        <div class="brutal-card bg-yellow" style="grid-column: 1 / -1; padding: 40px; text-align: center;">
          <h3 style="font-size: 1.5rem; text-transform: uppercase; margin-bottom: 8px;">No matching corporate issuers</h3>
          <p style="font-weight: 600;">Clear your search filter or uncheck the watchlist filter to inspect full coverage.</p>
        </div>
      `;
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

    grid.innerHTML = list.map(comp => {
      const isStarred = watchlist.includes(comp.ticker);
      const compPromises = allPromises.filter(p => p.ticker === comp.ticker);
      const badgeStyle = badgeBgMap[comp.ticker] || "bg-yellow";

      return `
        <div class="brutal-card relative" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="brutal-border ${badgeStyle}" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
                  ${comp.monogram || comp.ticker.slice(0, 2)}
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase; color: #666;">${comp.sector}</div>
                  <h3 style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase; line-height: 1.1;">${comp.name}</h3>
                </div>
              </div>
              <button class="brutal-btn" style="padding: 6px 10px; background: ${isStarred ? "var(--main-yellow)" : "#fff"};" data-star-ticker="${comp.ticker}" title="${isStarred ? "Remove from Watchlist" : "Add to Watchlist"}">
                <i class="${isStarred ? "fas fa-star" : "far fa-star"}"></i>
              </button>
            </div>

            <p style="font-size: 0.85rem; font-weight: 600; line-height: 1.4; margin-bottom: 20px; color: #333;">
              ${comp.description}
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; border-top: 2px dashed var(--border-color); padding-top: 14px;">
              <div>
                <div class="stat-label" style="font-size: 0.75rem; margin-bottom: 4px; padding-bottom: 2px;">Market Cap</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${comp.marketCap}</div>
              </div>
              <div>
                <div class="stat-label" style="font-size: 0.75rem; margin-bottom: 4px; padding-bottom: 2px;">Guidance Adherence</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${comp.guidanceCoverage}</div>
              </div>
              <div>
                <div class="stat-label" style="font-size: 0.75rem; margin-bottom: 4px; padding-bottom: 2px;">Coverage</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${compPromises.length} Audits</div>
              </div>
              <div>
                <div class="stat-label" style="font-size: 0.75rem; margin-bottom: 4px; padding-bottom: 2px;">Ticker</div>
                <div style="font-weight: 700; font-size: 1.1rem; text-transform: uppercase;">${comp.ticker}</div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; border-top: 2px solid var(--border-color); padding-top: 14px;">
            <button class="brutal-btn flex-1 justify-center open-profile-btn" data-ticker="${comp.ticker}">
              Full Dossier
            </button>
            <a href="#promises" class="brutal-btn justify-center" style="background: var(--main-yellow);" onclick="window.location.hash='#promises';">
              Audit
            </a>
          </div>
        </div>
      `;
    }).join("");

    // Wire up star toggles
    grid.querySelectorAll("[data-star-ticker]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const t = btn.dataset.starTicker;
        const nowStarred = toggleWatchlist(t);
        showToast(nowStarred ? `Added ${t} to institutional watchlist` : `Removed ${t} from watchlist`);
        renderGrid();
      });
    });

    // Wire up open profile buttons
    grid.querySelectorAll(".open-profile-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const comp = companies.find(c => c.ticker === btn.dataset.ticker);
        if (comp) openCompanyProfileModal(comp, allPromises);
      });
    });
  }

  // Attach search and filter events
  document.getElementById("company-search-input").addEventListener("input", renderGrid);
  document.getElementById("company-sector-filter").addEventListener("change", renderGrid);
  document.getElementById("company-sort-select").addEventListener("change", renderGrid);
  document.getElementById("watchlist-only-checkbox").addEventListener("change", renderGrid);

  renderGrid();
}
