/**
 * PAGE 3 — Promise Tracker (Neo-Brutalist Design)
 * Audited Guidance Ledger styled with bold black borders (3px), hard drop-shadows (6px), Space Grotesk.
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
    <header class="header">
      <div class="header-title">
        <h1>Promise Tracker</h1>
        <div class="badge">Audited Ledger</div>
        <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">Deterministic Guidance vs Actuals</span>
      </div>
      <div class="header-actions">
        <button id="btn-export-tracker-csv" class="brutal-btn">
          <i class="fas fa-download"></i> Export CSV
        </button>
      </div>
    </header>

    <!-- Filter Control Bar -->
    <div class="brutal-card" style="padding: 16px; margin-bottom: 24px; flex-direction: row; flex-wrap: wrap; gap: 14px; align-items: center;">
      <div style="flex: 1; min-width: 240px; position: relative;">
        <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 14px;"></i>
        <input
          type="text"
          id="tracker-search-input"
          placeholder="SEARCH TICKER, METRIC, QUARTER (NVDA, REVENUE, Q3)..."
          class="brutal-border"
          style="width: 100%; padding: 10px 14px 10px 38px; font-family: var(--font-sans); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; background: #fff;"
        />
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Company:</span>
        <select id="tracker-company-filter" class="brutal-select">
          <option value="ALL">All Companies (${companies.length})</option>
          ${companies.map(c => `<option value="${c.ticker}" ${state.company === c.ticker ? "selected" : ""}>${c.ticker} - ${c.name}</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Metric:</span>
        <select id="tracker-metric-filter" class="brutal-select">
          <option value="ALL">All Metrics</option>
          <option value="Revenue">Revenue</option>
          <option value="Gross Margin">Gross Margin</option>
          <option value="Diluted EPS">Diluted EPS</option>
          <option value="Operating Expenses">Operating Expenses</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">FY:</span>
        <select id="tracker-fy-filter" class="brutal-select">
          <option value="ALL">All Years</option>
          <option value="2025">FY 2025</option>
          <option value="2024">FY 2024</option>
          <option value="2023">FY 2023</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Outcome:</span>
        <select id="tracker-outcome-filter" class="brutal-select">
          <option value="ALL">All Outcomes</option>
          <option value="Exceeded">Exceeded (Beat)</option>
          <option value="Met">Met (Within Range)</option>
          <option value="Missed">Missed (Shortfall)</option>
          <option value="Pending">Pending (Upcoming)</option>
        </select>
      </div>

      <button id="btn-reset-filters" class="brutal-btn" style="background: var(--main-yellow);">
        Reset
      </button>
    </div>

    <!-- Main Table Container -->
    <div style="margin-bottom: 24px; overflow-x: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 id="table-results-count" style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase;">Audited Guidance Statements</h3>
        <span class="badge" style="background: var(--main-teal);">Deterministic Match Active</span>
      </div>

      <table class="brutal-table">
        <thead>
          <tr>
            <th class="cursor-pointer hover:underline select-none sortable" data-sort="company">
              Company <span class="sort-icon ml-1">↕</span>
            </th>
            <th class="cursor-pointer hover:underline select-none sortable" data-sort="announcementDate">
              Announced <span class="sort-icon ml-1">↕</span>
            </th>
            <th class="cursor-pointer hover:underline select-none sortable" data-sort="targetQuarter">
              Target <span class="sort-icon ml-1">↕</span>
            </th>
            <th class="cursor-pointer hover:underline select-none sortable" data-sort="metric">
              Metric <span class="sort-icon ml-1">↕</span>
            </th>
            <th>Guidance Corridor</th>
            <th>Reported Actual</th>
            <th class="cursor-pointer hover:underline select-none sortable" data-sort="diffPct">
              Variance <span class="sort-icon ml-1">↕</span>
            </th>
            <th class="cursor-pointer hover:underline select-none sortable" data-sort="outcome">
              Outcome <span class="sort-icon ml-1">↕</span>
            </th>
            <th style="text-align: right;">Audit Trail</th>
          </tr>
        </thead>
        <tbody id="tracker-tbody">
          <!-- Injected dynamically -->
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <div class="brutal-card" style="padding: 16px; flex-direction: row; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div id="pagination-info-text" style="font-weight: 700; font-size: 0.85rem; text-transform: uppercase;">Showing 1 to 8 of 0 records</div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <button id="btn-prev-page" class="brutal-btn" style="padding: 6px 14px;">
          &larr; Prev
        </button>
        <span id="page-num-display" class="brutal-border" style="padding: 6px 14px; font-weight: 700; font-size: 0.85rem; background: #fff;">
          Page 1
        </span>
        <button id="btn-next-page" class="brutal-btn" style="padding: 6px 14px;">
          Next &rarr;
        </button>
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
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; font-weight: 700; text-transform: uppercase;">No guidance records match your filter criteria.</td></tr>`;
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

    tbody.innerHTML = pageRecords.map(p => {
      const ev = evaluatePromise(p);
      const rangeStr = `${formatValue(p.guidanceLower, p.unit)} - ${formatValue(p.guidanceUpper, p.unit)}`;
      const actualStr = p.actual !== null ? formatValue(p.actual, p.unit) : '<span class="badge" style="background: #e5e5e5;">Pending</span>';
      const devStr = ev.diffPct !== null ? formatPct(ev.diffPct) : "—";

      let outcomeMarkup = "";
      if (ev.outcome === "Exceeded") {
        outcomeMarkup = `<span class="stat-trend bg-yellow" style="margin: 0;">↗ EXCEEDED</span>`;
      } else if (ev.outcome === "Met") {
        outcomeMarkup = `<span class="stat-trend" style="background: var(--main-teal); margin: 0;">● MET</span>`;
      } else if (ev.outcome === "Missed") {
        outcomeMarkup = `<span class="stat-trend" style="background: var(--main-pink); margin: 0;">↘ MISSED</span>`;
      } else {
        outcomeMarkup = `<span class="stat-trend" style="background: #e5e5e5; margin: 0;">◌ PENDING</span>`;
      }

      const tickerBadge = badgeBgMap[p.ticker] || "bg-yellow";

      return `
        <tr style="cursor: pointer;" data-promise-id="${p.id}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${tickerBadge}" style="padding: 2px 6px; font-size: 0.75rem;">${p.ticker}</span>
              <strong style="font-size: 0.9rem;">${p.companyName}</strong>
            </div>
          </td>
          <td style="font-weight: 600;">${p.announcementDate}</td>
          <td style="font-weight: 700; text-transform: uppercase;">${p.targetQuarter}</td>
          <td style="font-weight: 700;">${p.metric}</td>
          <td style="font-weight: 600;">${rangeStr}</td>
          <td style="font-weight: 700; font-size: 0.95rem;">${actualStr}</td>
          <td style="font-weight: 700;">${devStr}</td>
          <td>${outcomeMarkup}</td>
          <td style="text-align: right;">
            <button class="brutal-btn" style="padding: 4px 10px; font-size: 0.75rem; background: var(--main-yellow);" data-promise-id="${p.id}">
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
    showToast("Filters Reset — viewing all records");
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
    showToast(`Exported ${rows.length} guidance records.`);
  });

  renderTable();
}
