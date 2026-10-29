/**
 * PAGE 3 — Promise Tracker (Intelly Aesthetic)
 * Guidance audit ledger styled with Intelly warm canvas, white rounded-3xl card, and pastel badges.
 */

import { api } from "../api.js";
import { evaluatePromise, formatValue, formatPct, exportToCSV } from "../calculations.js";
import { evidenceDrawer, showToast } from "../components.js";

export async function renderPromises(container, queryParams = {}) {
  const companies = await api.getCompanies();
  const allPromises = await api.getPromises();

  let state = {
    search: "",
    company: queryParams.company || "ALL",
    metric: "ALL",
    fiscalYear: "ALL",
    outcome: "ALL",
    sortBy: "announcementDate",
    sortOrder: "desc",
    currentPage: 1,
    pageSize: 8
  };

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
      <div>
        <div class="flex items-center text-xs text-textMuted font-medium mb-1">
          <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
          <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
          <span class="text-textMain font-semibold">Promise Tracker</span>
        </div>
        <h2 class="text-2xl font-bold text-textMain">Management Promise Tracker</h2>
        <p class="text-textMuted text-xs mt-1">A comprehensive historical ledger of forward-looking guidance vs reported quarterly earnings.</p>
      </div>
      <div class="flex items-center space-x-3">
        <button id="btn-export-tracker-csv" class="flex items-center px-4 py-2 bg-cardWhite border border-gray-100 rounded-full text-textMain hover:bg-bgLight transition-colors text-xs font-semibold intelly-shadow">
          <i class="fas fa-download mr-2 text-pastelPink"></i> Export CSV
        </button>
      </div>
    </div>

    <!-- Filter Control Bar -->
    <div class="bg-cardWhite rounded-2xl p-4 mb-6 intelly-shadow flex flex-wrap items-center gap-4">
      <div class="relative flex-1 min-w-[220px]">
        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-pastelPink text-xs"></i>
        <input
          type="text"
          id="tracker-search-input"
          placeholder="Search ticker, metric, quarter (NVTD, Revenue, Q3)..."
          class="w-full bg-bgLight rounded-full py-2 pl-10 pr-4 text-xs text-textMain placeholder-textMuted outline-none border border-transparent focus:border-pastelPink transition-colors"
        />
      </div>

      <div class="flex items-center gap-2">
        <label for="tracker-company-filter" class="text-xs text-textMuted font-medium">Company:</label>
        <select id="tracker-company-filter" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Companies (${companies.length})</option>
          ${companies.map(c => `<option value="${c.ticker}" ${state.company === c.ticker ? "selected" : ""}>${c.ticker} - ${c.name}</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="tracker-metric-filter" class="text-xs text-textMuted font-medium">Metric:</label>
        <select id="tracker-metric-filter" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Metrics</option>
          <option value="Revenue">Revenue</option>
          <option value="Gross Margin">Gross Margin</option>
          <option value="Diluted EPS">Diluted EPS</option>
          <option value="Operating Expenses">Operating Expenses</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="tracker-fy-filter" class="text-xs text-textMuted font-medium">FY:</label>
        <select id="tracker-fy-filter" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Years</option>
          <option value="2025">FY 2025</option>
          <option value="2024">FY 2024</option>
          <option value="2023">FY 2023</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="tracker-outcome-filter" class="text-xs text-textMuted font-medium">Outcome:</label>
        <select id="tracker-outcome-filter" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Outcomes</option>
          <option value="Exceeded">Exceeded (Beat)</option>
          <option value="Met">Met (Within Range)</option>
          <option value="Missed">Missed (Shortfall)</option>
          <option value="Pending">Pending (Upcoming)</option>
        </select>
      </div>

      <button id="btn-reset-filters" class="px-3.5 py-1.5 bg-bgLight rounded-full text-xs text-textMuted hover:text-textMain font-medium transition-colors">
        Reset
      </button>
    </div>

    <!-- Main Table Container -->
    <div class="bg-cardWhite rounded-3xl intelly-shadow overflow-hidden mb-8 border border-gray-100">
      <div class="p-5 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 id="table-results-count" class="text-base font-bold text-textMain">Audited Guidance Statements</h3>
          <p class="text-xs text-textMuted mt-0.5">Click any row or 'View Evidence' for calculation trail & earnings transcripts</p>
        </div>
        <div class="bg-sidebarDark text-white px-3.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
          <span class="w-2 h-2 bg-pastelGreen rounded-full"></span>
          <span>Deterministic Audit Active</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-bgLight/50 border-b border-gray-100 text-[10px] text-textMuted uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-5 cursor-pointer hover:text-textMain select-none sortable" data-sort="company">
                Company <span class="sort-icon ml-1">↕</span>
              </th>
              <th class="py-3.5 px-5 cursor-pointer hover:text-textMain select-none sortable" data-sort="announcementDate">
                Announced <span class="sort-icon ml-1">↕</span>
              </th>
              <th class="py-3.5 px-5 cursor-pointer hover:text-textMain select-none sortable" data-sort="targetQuarter">
                Target <span class="sort-icon ml-1">↕</span>
              </th>
              <th class="py-3.5 px-5 cursor-pointer hover:text-textMain select-none sortable" data-sort="metric">
                Metric <span class="sort-icon ml-1">↕</span>
              </th>
              <th class="py-3.5 px-5">Guidance Corridor</th>
              <th class="py-3.5 px-5">Reported</th>
              <th class="py-3.5 px-5 cursor-pointer hover:text-textMain select-none sortable" data-sort="diffPct">
                Variance <span class="sort-icon ml-1">↕</span>
              </th>
              <th class="py-3.5 px-5 cursor-pointer hover:text-textMain select-none sortable" data-sort="outcome">
                Outcome <span class="sort-icon ml-1">↕</span>
              </th>
              <th class="py-3.5 px-5 text-right">Audit</th>
            </tr>
          </thead>
          <tbody id="tracker-tbody" class="text-xs text-textMain divide-y divide-gray-100">
            <!-- Injected dynamically -->
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 bg-bgLight/30 gap-3">
        <div id="pagination-info-text" class="text-xs text-textMuted font-medium">Showing 1 to 8 of 0 records</div>
        <div class="flex items-center space-x-2">
          <button id="btn-prev-page" class="px-3 py-1.5 bg-cardWhite border border-gray-200 rounded-full text-xs font-semibold text-textMain hover:bg-bgLight disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <i class="fas fa-chevron-left mr-1 text-[10px]"></i> Previous
          </button>
          <span id="page-num-display" class="px-3 py-1 bg-cardWhite rounded-full text-xs font-mono font-bold text-textMain border border-gray-100">
            Page 1
          </span>
          <button id="btn-next-page" class="px-3 py-1.5 bg-cardWhite border border-gray-200 rounded-full text-xs font-semibold text-textMain hover:bg-bgLight disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Next <i class="fas fa-chevron-right ml-1 text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  function getFilteredAndSortedPromises() {
    let list = [...allPromises];

    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(p =>
        p.ticker.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.metric.toLowerCase().includes(q) ||
        p.targetQuarter.toLowerCase().includes(q)
      );
    }

    if (state.company !== "ALL") {
      list = list.filter(p => p.ticker === state.company);
    }
    if (state.metric !== "ALL") {
      list = list.filter(p => p.metric === state.metric);
    }
    if (state.fiscalYear !== "ALL") {
      list = list.filter(p => p.fiscalYear === state.fiscalYear);
    }
    if (state.outcome !== "ALL") {
      list = list.filter(p => {
        const ev = evaluatePromise(p);
        return ev.outcome.toLowerCase() === state.outcome.toLowerCase();
      });
    }

    list.sort((a, b) => {
      let valA, valB;
      const evA = evaluatePromise(a);
      const evB = evaluatePromise(b);

      if (state.sortBy === "company") {
        valA = a.ticker;
        valB = b.ticker;
      } else if (state.sortBy === "announcementDate") {
        valA = a.announcementDate;
        valB = b.announcementDate;
      } else if (state.sortBy === "targetQuarter") {
        valA = a.targetQuarter;
        valB = b.targetQuarter;
      } else if (state.sortBy === "metric") {
        valA = a.metric;
        valB = b.metric;
      } else if (state.sortBy === "diffPct") {
        valA = evA.diffPct ?? -9999;
        valB = evB.diffPct ?? -9999;
      } else if (state.sortBy === "outcome") {
        valA = evA.outcome;
        valB = evB.outcome;
      } else {
        valA = a.announcementDate;
        valB = b.announcementDate;
      }

      if (valA < valB) return state.sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return state.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }

  function renderTable() {
    const filteredList = getFilteredAndSortedPromises();
    const totalRecords = filteredList.length;
    const totalPages = Math.ceil(totalRecords / state.pageSize) || 1;

    if (state.currentPage > totalPages) state.currentPage = totalPages;
    if (state.currentPage < 1) state.currentPage = 1;

    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = Math.min(startIdx + state.pageSize, totalRecords);
    const pageRecords = filteredList.slice(startIdx, endIdx);

    document.getElementById("table-results-count").textContent = `Audited Guidance Statements (${totalRecords} records)`;
    document.getElementById("pagination-info-text").textContent = totalRecords > 0
      ? `Showing ${startIdx + 1} to ${endIdx} of ${totalRecords} records`
      : "No records found matching filters";
    document.getElementById("page-num-display").textContent = `Page ${state.currentPage} of ${totalPages}`;
    document.getElementById("btn-prev-page").disabled = state.currentPage <= 1;
    document.getElementById("btn-next-page").disabled = state.currentPage >= totalPages;

    const tbody = document.getElementById("tracker-tbody");

    if (pageRecords.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-10 text-textMuted font-medium">No guidance records match your filter criteria.</td></tr>`;
      return;
    }

    const pastelTickerBadges = {
      NVTD: "bg-pastelGreen text-green-800",
      APXC: "bg-pastelBlue text-blue-800",
      LMBO: "bg-pastelPink text-pink-900",
      SOLR: "bg-pastelYellow text-yellow-900"
    };

    tbody.innerHTML = pageRecords.map(p => {
      const ev = evaluatePromise(p);
      const rangeStr = `${formatValue(p.guidanceLower, p.unit)} - ${formatValue(p.guidanceUpper, p.unit)}`;
      const actualStr = p.actual !== null ? formatValue(p.actual, p.unit) : '<span class="text-amber-700 bg-pastelYellow px-2 py-0.5 rounded-full text-[10px] font-semibold">Pending</span>';
      const devStr = ev.diffPct !== null ? formatPct(ev.diffPct) : "—";

      let outcomeMarkup = "";
      if (ev.outcome === "Exceeded") {
        outcomeMarkup = `<span class="bg-pastelGreen text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fas fa-arrow-up mr-1 text-[8px]"></i> Exceeded</span>`;
      } else if (ev.outcome === "Met") {
        outcomeMarkup = `<span class="bg-pastelBlue text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fas fa-check mr-1 text-[8px]"></i> Met</span>`;
      } else if (ev.outcome === "Missed") {
        outcomeMarkup = `<span class="bg-pastelRed text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fas fa-arrow-down mr-1 text-[8px]"></i> Missed</span>`;
      } else {
        outcomeMarkup = `<span class="bg-pastelYellow text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="far fa-clock mr-1 text-[8px]"></i> Pending</span>`;
      }

      const devClass = ev.diffPct > 0 ? "text-green-700 font-bold" : ev.diffPct < 0 ? "text-red-700 font-bold" : "text-textMain";
      const tickerBadge = pastelTickerBadges[p.ticker] || "bg-bgLight text-textMain";

      return `
        <tr class="hover:bg-bgLight/60 transition-colors cursor-pointer group" data-promise-id="${p.id}">
          <td class="py-3.5 px-5 flex items-center gap-2">
            <span class="text-[10px] font-mono font-bold ${tickerBadge} px-2 py-0.5 rounded-lg">${p.ticker}</span>
            <span class="font-bold text-textMain group-hover:text-black transition-colors">${p.companyName}</span>
          </td>
          <td class="py-3.5 px-5 font-mono text-xs text-textMuted">${p.announcementDate}</td>
          <td class="py-3.5 px-5 font-semibold text-textMain">${p.targetQuarter}</td>
          <td class="py-3.5 px-5 text-textMain">${p.metric}</td>
          <td class="py-3.5 px-5 font-mono text-xs text-textMuted">${rangeStr}</td>
          <td class="py-3.5 px-5 font-mono text-xs font-bold text-textMain">${actualStr}</td>
          <td class="py-3.5 px-5 font-mono text-xs ${devClass}">${devStr}</td>
          <td class="py-3.5 px-5">${outcomeMarkup}</td>
          <td class="py-3.5 px-5 text-right">
            <button class="bg-sidebarDark text-white px-3 py-1.5 rounded-full text-[11px] font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all btn-evidence" data-promise-id="${p.id}">
              Inspect &rarr;
            </button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("[data-promise-id]").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.dataset.promiseId;
        const record = allPromises.find(p => p.id === id);
        if (record) evidenceDrawer.open(record);
      });
    });
  }

  document.getElementById("tracker-search-input").addEventListener("input", (e) => {
    state.search = e.target.value;
    state.currentPage = 1;
    renderTable();
  });

  document.getElementById("tracker-company-filter").addEventListener("change", (e) => {
    state.company = e.target.value;
    state.currentPage = 1;
    renderTable();
  });

  document.getElementById("tracker-metric-filter").addEventListener("change", (e) => {
    state.metric = e.target.value;
    state.currentPage = 1;
    renderTable();
  });

  document.getElementById("tracker-fy-filter").addEventListener("change", (e) => {
    state.fiscalYear = e.target.value;
    state.currentPage = 1;
    renderTable();
  });

  document.getElementById("tracker-outcome-filter").addEventListener("change", (e) => {
    state.outcome = e.target.value;
    state.currentPage = 1;
    renderTable();
  });

  document.getElementById("btn-reset-filters").addEventListener("click", () => {
    state.search = "";
    state.company = "ALL";
    state.metric = "ALL";
    state.fiscalYear = "ALL";
    state.outcome = "ALL";
    state.currentPage = 1;

    document.getElementById("tracker-search-input").value = "";
    document.getElementById("tracker-company-filter").value = "ALL";
    document.getElementById("tracker-metric-filter").value = "ALL";
    document.getElementById("tracker-fy-filter").value = "ALL";
    document.getElementById("tracker-outcome-filter").value = "ALL";

    renderTable();
    showToast("Filters Reset", "Viewing all guidance records.", "info");
  });

  document.getElementById("btn-prev-page").addEventListener("click", () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderTable();
    }
  });

  document.getElementById("btn-next-page").addEventListener("click", () => {
    state.currentPage++;
    renderTable();
  });

  container.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const field = th.dataset.sort;
      if (state.sortBy === field) {
        state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = field;
        state.sortOrder = "asc";
      }
      container.querySelectorAll("th.sortable").forEach(h => {
        h.querySelector(".sort-icon").textContent = "↕";
      });
      th.querySelector(".sort-icon").textContent = state.sortOrder === "asc" ? "▲" : "▼";
      renderTable();
    });
  });

  document.getElementById("btn-export-tracker-csv").addEventListener("click", () => {
    const list = getFilteredAndSortedPromises();
    const rows = list.map(p => {
      const ev = evaluatePromise(p);
      return {
        Ticker: p.ticker,
        CompanyName: p.companyName,
        AnnouncementDate: p.announcementDate,
        TargetQuarter: p.targetQuarter,
        Metric: p.metric,
        GuidanceLower: p.guidanceLower,
        GuidanceUpper: p.guidanceUpper,
        GuidanceMidpoint: ev.midpoint,
        ActualReported: p.actual ?? "Pending",
        Unit: p.unit,
        Outcome: ev.outcome,
        DeviationPct: (ev.diffPct !== null && typeof ev.diffPct === "number") ? `${ev.diffPct.toFixed(2)}%` : "N/A",
        SourceDocument: p.sourceDocTitle
      };
    });
    exportToCSV(`OutlookIQ-Promises-Ledger-${Date.now()}.csv`, rows);
    showToast("CSV Exported", `Exported ${rows.length} promise records.`, "success");
  });

  renderTable();
}
