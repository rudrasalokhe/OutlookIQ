/**
 * PAGE 2 — Company Explorer (Intelly Aesthetic)
 * Universe browser styled with Intelly warm canvas, white rounded cards, and pastel accents.
 */

import { api } from "../api.js";
import { openCompanyProfileModal, getWatchlist, toggleWatchlist, showToast } from "../components.js";

export async function renderCompanies(container) {
  const companies = await api.getCompanies();
  const allPromises = await api.getPromises();

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
      <div>
        <div class="flex items-center text-xs text-textMuted font-medium mb-1">
          <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
          <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
          <span class="text-textMain font-semibold">Universe Explorer</span>
        </div>
        <h2 class="text-2xl font-bold text-textMain">Tracked Companies</h2>
        <p class="text-textMuted text-xs mt-1">Discover historical management guidance, forecast accuracy, and actual reported outcomes.</p>
      </div>
      <div class="bg-cardWhite text-textMain border border-gray-100 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 intelly-shadow self-start sm:self-auto">
        <span class="w-2 h-2 bg-pastelGreen rounded-full"></span>
        <span>Coverage Active (${companies.length} Tier-1 Issuers)</span>
      </div>
    </div>

    <!-- Filter Control Bar -->
    <div class="bg-cardWhite rounded-2xl p-4 mb-6 intelly-shadow flex flex-wrap items-center gap-4">
      <div class="relative flex-1 min-w-[260px]">
        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-pastelPink text-xs"></i>
        <input
          type="text"
          id="company-search-input"
          placeholder="Search company, ticker, or industry..."
          class="w-full bg-bgLight rounded-full py-2 pl-10 pr-4 text-xs text-textMain placeholder-textMuted outline-none border border-transparent focus:border-pastelPink transition-colors"
        />
      </div>

      <div class="flex items-center gap-2">
        <label for="company-sector-filter" class="text-xs text-textMuted font-medium">Sector:</label>
        <select id="company-sector-filter" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Sectors</option>
          <option value="Technology">Technology</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Clean Energy">Clean Energy</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="company-sort-select" class="text-xs text-textMuted font-medium">Sort By:</label>
        <select id="company-sort-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="marketcap">Market Cap (Highest)</option>
          <option value="coverage">Guidance Coverage</option>
          <option value="forecasts">Most Forecasts</option>
          <option value="name">Company Name (A-Z)</option>
        </select>
      </div>

      <label class="flex items-center space-x-2 text-xs text-textMuted hover:text-textMain cursor-pointer select-none bg-bgLight px-3 py-1.5 rounded-full transition-colors">
        <input type="checkbox" id="watchlist-only-checkbox" class="rounded text-sidebarDark focus:ring-0 cursor-pointer" />
        <span>Watchlist Only</span>
      </label>
    </div>

    <!-- Grid of Companies (3 columns) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="companies-grid-container">
      <!-- Injected dynamically -->
    </div>
  `;

  function renderGrid() {
    const searchVal = document.getElementById("company-search-input").value.toLowerCase().trim();
    const sectorVal = document.getElementById("company-sector-filter").value;
    const sortVal = document.getElementById("company-sort-select").value;
    const watchlistOnly = document.getElementById("watchlist-only-checkbox").checked;
    const watchlist = getWatchlist();

    let list = [...companies];

    // Filter search
    if (searchVal) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(searchVal) ||
        c.ticker.toLowerCase().includes(searchVal) ||
        c.industry.toLowerCase().includes(searchVal)
      );
    }

    // Filter sector
    if (sectorVal !== "ALL") {
      list = list.filter(c => c.sector.toLowerCase().includes(sectorVal.toLowerCase()));
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
        <div class="col-span-full bg-cardWhite rounded-3xl p-12 text-center intelly-shadow">
          <div class="w-12 h-12 rounded-full bg-bgLight mx-auto flex items-center justify-center text-textMuted mb-3">
            <i class="fas fa-search text-base"></i>
          </div>
          <h3 class="text-base font-bold text-textMain mb-1">No matching companies found</h3>
          <p class="text-xs text-textMuted">Try clearing your search query or unchecking the Watchlist filter.</p>
        </div>
      `;
      return;
    }

    const pastelBgMap = {
      NVTD: "bg-pastelGreen text-green-800",
      APXC: "bg-pastelBlue text-blue-800",
      LMBO: "bg-pastelPink text-pink-900",
      SOLR: "bg-pastelYellow text-yellow-900"
    };

    grid.innerHTML = list.map(comp => {
      const isStarred = watchlist.includes(comp.ticker);
      const compPromises = allPromises.filter(p => p.ticker === comp.ticker);
      const badgeStyle = pastelBgMap[comp.ticker] || "bg-bgLight text-textMain";

      return `
        <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow flex flex-col relative group border border-transparent hover:border-gray-200 transition-all">
          <button class="absolute top-6 right-6 text-base ${isStarred ? "text-amber-500" : "text-gray-300 hover:text-amber-500"} transition-colors" data-star-ticker="${comp.ticker}" title="${isStarred ? "Remove from Watchlist" : "Add to Watchlist"}">
            <i class="${isStarred ? "fas fa-star" : "far fa-star"}"></i>
          </button>
          
          <div class="flex items-center gap-3.5 mb-4">
            <div class="w-11 h-11 rounded-2xl ${badgeStyle} flex items-center justify-center font-bold text-sm shrink-0">
              ${comp.monogram}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-textMain">${comp.ticker}</span>
                <span class="text-[10px] bg-bgLight text-textMuted px-2 py-0.5 rounded-full font-medium">${comp.sector}</span>
              </div>
              <h3 class="text-base font-bold text-textMain leading-tight mt-0.5">${comp.name}</h3>
            </div>
          </div>

          <p class="text-xs text-textMuted leading-relaxed mb-5 flex-1 line-clamp-3">${comp.description}</p>

          <div class="grid grid-cols-2 gap-3 mb-6 bg-bgLight p-3.5 rounded-2xl">
            <div>
              <p class="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Market Cap</p>
              <p class="font-mono text-xs font-bold text-textMain mt-0.5">${comp.marketCap}</p>
            </div>
            <div>
              <p class="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Guidance Coverage</p>
              <p class="font-mono text-xs font-bold text-green-700 mt-0.5">${comp.guidanceCoverage}</p>
            </div>
            <div>
              <p class="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Forecasts</p>
              <p class="text-xs font-semibold text-textMain mt-0.5">${compPromises.length} records</p>
            </div>
            <div>
              <p class="text-[10px] text-textMuted uppercase tracking-wider font-semibold">Latest Quarter</p>
              <p class="text-xs font-semibold text-textMain mt-0.5">${comp.lastReportedQuarter}</p>
            </div>
          </div>

          <div class="flex justify-between items-center mt-auto pt-2">
            <button class="text-xs text-textMuted hover:text-textMain font-semibold btn-view-profile flex items-center gap-1.5 transition-colors" data-ticker="${comp.ticker}">
              <i class="far fa-id-card"></i> Profile
            </button>
            <a href="#promises?company=${comp.ticker}" class="bg-sidebarDark text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all flex items-center gap-1.5">
              <span>Forecasts</span>
              <i class="fas fa-arrow-right text-[10px]"></i>
            </a>
          </div>
        </div>
      `;
    }).join("");

    // Attach View Profile clicks
    grid.querySelectorAll(".btn-view-profile").forEach(btn => {
      btn.addEventListener("click", () => {
        const ticker = btn.dataset.ticker;
        const comp = companies.find(c => c.ticker === ticker);
        if (comp) openCompanyProfileModal(comp, allPromises);
      });
    });

    // Attach Watchlist star toggles
    grid.querySelectorAll("[data-star-ticker]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const ticker = btn.dataset.starTicker;
        const updated = toggleWatchlist(ticker);
        showToast(
          updated ? "Watchlist Updated" : "Watchlist Removed",
          `${ticker} ${updated ? "added to" : "removed from"} your local watchlist.`,
          "info"
        );
        renderGrid();
      });
    });
  }

  document.getElementById("company-search-input").addEventListener("input", renderGrid);
  document.getElementById("company-sector-filter").addEventListener("change", renderGrid);
  document.getElementById("company-sort-select").addEventListener("change", renderGrid);
  document.getElementById("watchlist-only-checkbox").addEventListener("change", renderGrid);

  renderGrid();
}
