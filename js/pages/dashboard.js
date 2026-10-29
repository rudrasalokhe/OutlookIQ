/**
 * PAGE 1 — Overview Dashboard
 * CRM Style Design with warm cream canvas (#fdfaf1), sidebar (#f7f4ea),
 * brand yellow accents (#fbc531), thin-text metrics, circular progress,
 * deviation line chart, outcome distribution bars, and audited guidance records.
 */

import { api } from "../api.js";
import { calculateKPIs, evaluatePromise, formatValue, formatPct, exportToCSV } from "../calculations.js";
import { renderDeviationLineChart } from "../charts.js";
import { evidenceDrawer, showToast, renderOutcomeBadge } from "../components.js";

export async function renderDashboard(container) {
  const companies = await api.getCompanies();
  const allPromises = await api.getPromises();

  let activeTab = "All"; // Filter for recent promises list
  let searchQuery = "";

  container.innerHTML = `
    <!-- Top Header & Filter Controls -->
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
      <div>
        <p class="text-xs text-textMuted font-medium mb-1">Core Intelligence / Overview</p>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-medium text-textMain tracking-tight">Earnings Intelligence</h2>
          <span class="bg-brandYellowLight text-darkAccent text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-brandYellow/30">
            Audit Mode
          </span>
        </div>
        <p class="text-xs text-textMuted mt-1" id="dash-subtitle">
          ${allPromises.length} Evaluations Processed • Q3 FY25
        </p>
      </div>

      <!-- Actions & Filters -->
      <div class="flex flex-wrap items-center gap-2">
        <select id="dash-metric-filter" class="bg-white border border-borderSubtle text-textMain text-xs rounded-xl py-2 px-3 font-medium outline-none cursor-pointer soft-shadow hover:border-gray-300 transition-colors">
          <option value="ALL">All Metrics</option>
          <option value="Revenue">Revenue</option>
          <option value="Gross Margin">Gross Margin</option>
          <option value="Diluted EPS">Diluted EPS</option>
          <option value="Operating Expenses">Operating Expenses</option>
        </select>

        <select id="dash-company-filter" class="bg-white border border-borderSubtle text-textMain text-xs rounded-xl py-2 px-3 font-medium outline-none cursor-pointer soft-shadow hover:border-gray-300 transition-colors">
          <option value="ALL">All Companies (${companies.length})</option>
          ${companies.map(c => `<option value="${c.ticker}">${c.name} (${c.ticker})</option>`).join("")}
        </select>

        <button id="btn-export-overview" class="w-9 h-9 rounded-full border border-borderSubtle bg-white flex items-center justify-center text-textMain hover:bg-gray-50 soft-shadow transition-colors" title="Export CSV Report">
          <i class="fas fa-download text-xs"></i>
        </button>
      </div>
    </header>

    <!-- Metrics Row (Thin text style from CRM mockup) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 py-2 mb-6 shrink-0" id="dash-metrics-row">
      <!-- Injected dynamically -->
    </div>

    <!-- Dynamic Widgets Grid -->
    <div class="grid grid-cols-12 gap-6 pb-6">
      
      <!-- Left Column (Circular Adherence + Recent Promises list) -->
      <div class="col-span-12 xl:col-span-4 flex flex-col gap-4">
        
        <!-- Circular Chart Widget (72% Adherence Rate) -->
        <div class="bg-white rounded-[2rem] p-6 soft-shadow flex flex-col justify-center items-center h-48 relative border border-borderSubtle/50" id="circle-widget-card">
          <div class="absolute top-4 left-4 text-xs text-textMuted font-mono">00</div>
          <div class="absolute top-4 right-4 text-xs text-textMuted font-mono">100</div>
          
          <div class="w-28 h-28 rounded-full circle-progress flex items-center justify-center relative" id="circle-progress-ring">
            <div class="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
              <span class="text-2xl font-semibold text-textMain" id="adherence-rate-val">72%</span>
              <span class="text-[8px] text-textMuted uppercase tracking-wider text-center px-2">Adherence Rate</span>
            </div>
            <!-- Small dot indicator -->
            <div class="absolute top-2 right-2 w-3.5 h-3.5 bg-white border-2 border-brandYellow rounded-full shadow-sm"></div>
          </div>
        </div>

        <!-- Recent Promises List Card -->
        <div class="bg-white rounded-[2rem] p-6 soft-shadow flex flex-col border border-borderSubtle/50 flex-1 min-h-[380px]">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-textMain">Recent Promises</span>
              <i class="fas fa-chevron-down text-[10px] text-textMuted cursor-pointer"></i>
            </div>
            <a href="#promises" class="w-6 h-6 rounded-full bg-sidebarBg flex items-center justify-center text-textMain hover:bg-gray-200 transition-colors" title="View Full Ledger">
              <i class="fas fa-ellipsis-h text-[10px]"></i>
            </a>
          </div>
          
          <!-- Filter Tabs (Pills) -->
          <div class="flex gap-1.5 mb-4 bg-sidebarBg p-1 rounded-full w-fit">
            <button class="promise-tab-btn active bg-darkAccent text-white text-xs px-3.5 py-1 rounded-full font-medium transition-all" data-tab="All">All</button>
            <button class="promise-tab-btn text-textMuted text-xs px-3.5 py-1 rounded-full font-medium hover:text-textMain transition-all" data-tab="Exceeded">Exceeded</button>
            <button class="promise-tab-btn text-textMuted text-xs px-3.5 py-1 rounded-full font-medium hover:text-textMain transition-all" data-tab="Met">Met</button>
            <button class="promise-tab-btn text-textMuted text-xs px-3.5 py-1 rounded-full font-medium hover:text-textMain transition-all" data-tab="Missed">Missed</button>
          </div>

          <!-- List Items Container -->
          <div class="space-y-3 overflow-y-auto max-h-[320px] pr-1 flex-1" id="dash-recent-promises">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>

      <!-- Right Column (Charts, Insight Cards, Audited Statements Table) -->
      <div class="col-span-12 xl:col-span-8 flex flex-col gap-4">
        
        <!-- Top Charts Row (Line Chart + Outcome Distribution Bar Chart) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          <!-- Line Chart (Mean Absolute Deviation) -->
          <div class="lg:col-span-7 bg-white rounded-[2rem] p-6 soft-shadow border border-borderSubtle/50 relative overflow-hidden flex flex-col justify-between h-64">
            <a href="#analytics" class="absolute top-6 right-6 w-8 h-8 rounded-full border border-borderSubtle flex items-center justify-center text-textMain hover:bg-gray-50 transition-colors" title="Deep Analytics">
              <i class="fas fa-arrow-up-right-from-square text-xs"></i>
            </a>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <i class="fas fa-bullseye text-textMuted text-sm"></i>
                <span class="text-2xl font-light text-textMain" id="mad-stat-val">3.09%</span>
              </div>
              <p class="text-xs text-textMuted font-medium">Mean Absolute Deviation</p>
            </div>

            <div class="w-full h-36 relative mt-2">
              <canvas id="chart-deviation-line"></canvas>
            </div>
          </div>

          <!-- Bar Chart (Outcome Distribution) -->
          <div class="lg:col-span-5 bg-white rounded-[2rem] p-6 soft-shadow border border-borderSubtle/50 flex flex-col justify-between h-64 relative" id="outcome-dist-card">
            <div class="flex justify-between items-center mb-2">
              <h3 class="text-sm font-semibold text-textMain">Outcome Distribution</h3>
              <span class="text-[10px] text-textMuted font-medium bg-sidebarBg px-2 py-0.5 rounded-full" id="outcome-total-tag">25 Evaluations</span>
            </div>

            <!-- 3 Bars Mimicking CRM Style -->
            <div class="flex items-end justify-around px-2 pb-4 pt-2 flex-1" id="outcome-bars-container">
              <!-- Populated dynamically -->
            </div>
          </div>
        </div>

        <!-- Filter / Insight Boxes (4 Boxes) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="dash-insight-boxes">
          <!-- Populated dynamically -->
        </div>

        <!-- Bottom Table (Audited Guidance Statements) -->
        <div class="bg-white rounded-[2rem] p-6 soft-shadow border border-borderSubtle/50 flex flex-col min-h-[320px]">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 class="text-sm font-semibold text-textMain">Audited Guidance Statements</h3>
            <div class="bg-sidebarBg rounded-full px-3.5 py-1.5 flex items-center text-xs w-full sm:w-auto">
              <i class="fas fa-search text-textMuted mr-2"></i>
              <input
                type="text"
                id="dash-table-search"
                placeholder="Search statements..."
                class="bg-transparent border-none outline-none w-full sm:w-36 text-textMain placeholder-textMuted text-xs"
              />
            </div>
          </div>

          <!-- Table Container -->
          <div class="overflow-x-auto pr-1">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-borderSubtle text-[9px] text-textMuted uppercase tracking-wider">
                  <th class="py-3 px-3 font-semibold">Company</th>
                  <th class="py-3 px-2 font-semibold">Qtr</th>
                  <th class="py-3 px-2 font-semibold">Metric</th>
                  <th class="py-3 px-2 font-semibold">Guidance Range</th>
                  <th class="py-3 px-2 font-semibold">Reported</th>
                  <th class="py-3 px-2 font-semibold">Deviation</th>
                  <th class="py-3 px-2 font-semibold">Outcome</th>
                  <th class="py-3 px-2 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody class="text-xs text-textMain divide-y divide-borderSubtle/50" id="dash-table-body">
                <!-- Populated dynamically -->
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `;

  // Filter & Render logic
  function renderView() {
    const metricFilter = document.getElementById("dash-metric-filter").value;
    const companyFilter = document.getElementById("dash-company-filter").value;

    let filtered = [...allPromises];
    if (metricFilter !== "ALL") {
      filtered = filtered.filter(p => p.metric === metricFilter);
    }
    if (companyFilter !== "ALL") {
      filtered = filtered.filter(p => p.ticker === companyFilter || p.companyId === companyFilter);
    }

    const kpis = calculateKPIs(filtered);

    const totalCount = kpis.total ?? kpis.totalTracked ?? filtered.length ?? 0;
    const metBeatCount = kpis.metBeat ?? kpis.exceededCount ?? 0;
    const metCount = kpis.met ?? kpis.metCount ?? 0;
    const missedCount = kpis.missed ?? kpis.missedCount ?? 0;

    // 1. Render Metrics Row
    const metricsRow = document.getElementById("dash-metrics-row");
    metricsRow.innerHTML = `
      <div class="hover:translate-y-[-2px] transition-transform">
        <p class="text-4xl font-light text-textMain mb-1 flex items-center">
          <i class="far fa-folder text-lg text-textMuted mr-2.5"></i>${totalCount}
        </p>
        <p class="text-[11px] text-textMuted uppercase tracking-wide font-medium">Tracked Forecasts</p>
      </div>
      <div class="hover:translate-y-[-2px] transition-transform">
        <p class="text-4xl font-light text-textMain mb-1 flex items-center">
          <i class="fas fa-arrow-trend-up text-lg text-brandYellow mr-2.5"></i>${metBeatCount}
        </p>
        <p class="text-[11px] text-textMuted uppercase tracking-wide font-medium">Exceeded Guidance</p>
      </div>
      <div class="hover:translate-y-[-2px] transition-transform">
        <p class="text-4xl font-light text-textMain mb-1 flex items-center">
          <i class="fas fa-bullseye text-lg text-darkAccent mr-2.5"></i>${metCount}
        </p>
        <p class="text-[11px] text-textMuted uppercase tracking-wide font-medium">Guidance Met</p>
      </div>
      <div class="hover:translate-y-[-2px] transition-transform">
        <p class="text-4xl font-light text-textMain mb-1 flex items-center">
          <i class="fas fa-arrow-trend-down text-lg text-red-500 mr-2.5"></i>${missedCount}
        </p>
        <p class="text-[11px] text-textMuted uppercase tracking-wide font-medium">Guidance Missed</p>
      </div>
    `;

    // 2. Circular Chart Update (Adherence Rate)
    const evaluatedTotal = metBeatCount + metCount + missedCount;
    const adherencePct = evaluatedTotal > 0 ? Math.round(((metBeatCount + metCount) / evaluatedTotal) * 100) : 72;
    const adherenceEl = document.getElementById("adherence-rate-val");
    const ringEl = document.getElementById("circle-progress-ring");
    if (adherenceEl) adherenceEl.textContent = `${adherencePct}%`;
    if (ringEl) {
      ringEl.style.background = `conic-gradient(#fbc531 0% ${adherencePct}%, #f0ebd9 ${adherencePct}% 100%)`;
    }

    // 3. Render Recent Promises List
    renderRecentPromisesList(filtered);

    // 4. Mean Absolute Deviation Chart
    const madNum = Number(kpis.meanAbsoluteDeviation ?? kpis.meanAbsDev ?? 0);
    const madVal = isNaN(madNum) ? "0.00" : madNum.toFixed(2);
    const madEl = document.getElementById("mad-stat-val");
    if (madEl) madEl.textContent = `${madVal}%`;
    renderDeviationLineChart("chart-deviation-line", {
      labels: ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2"],
      values: [2.1, 3.8, 2.9, 4.6, 2.7, parseFloat(madVal) || 3.1]
    });

    // 5. Outcome Distribution Bars
    const totalOutcomes = (kpis.metBeat || 0) + (kpis.met || 0) + (kpis.missed || 0);
    const excPct = totalOutcomes > 0 ? Math.round(((kpis.metBeat || 0) / totalOutcomes) * 100) : 32;
    const metPct = totalOutcomes > 0 ? Math.round(((kpis.met || 0) / totalOutcomes) * 100) : 40;
    const misPct = totalOutcomes > 0 ? Math.round(((kpis.missed || 0) / totalOutcomes) * 100) : 28;

    const barsContainer = document.getElementById("outcome-bars-container");
    barsContainer.innerHTML = `
      <!-- Bar 1: Exceeded -->
      <div class="flex flex-col items-center gap-2 w-14">
        <span class="text-[10px] text-textMuted font-mono font-medium">${excPct}%</span>
        <div class="w-full bg-brandYellow rounded-t-xl relative group cursor-pointer shadow-sm transition-all hover:brightness-105" style="height: ${Math.max(30, excPct * 1.5)}px;">
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-darkAccent text-white text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            ${kpis.metBeat || 0} Exceeded
          </div>
        </div>
        <span class="text-xs font-semibold text-textMain mt-1">Exc</span>
      </div>

      <!-- Bar 2: Met -->
      <div class="flex flex-col items-center gap-2 w-14">
        <span class="text-[10px] text-textMuted font-mono font-medium">${metPct}%</span>
        <div class="w-full bg-darkAccent rounded-t-xl relative group cursor-pointer shadow-sm transition-all hover:brightness-125" style="height: ${Math.max(30, metPct * 1.5)}px;">
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-darkAccent text-white text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            ${kpis.met || 0} Met
          </div>
        </div>
        <span class="text-xs font-semibold text-textMain mt-1">Met</span>
      </div>

      <!-- Bar 3: Missed -->
      <div class="flex flex-col items-center gap-2 w-14">
        <span class="text-[10px] text-textMuted font-mono font-medium">${misPct}%</span>
        <div class="w-full bg-gray-400 rounded-t-xl relative group cursor-pointer shadow-sm transition-all hover:brightness-110" style="height: ${Math.max(30, misPct * 1.5)}px;">
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-darkAccent text-white text-[10px] py-0.5 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            ${kpis.missed || 0} Missed
          </div>
        </div>
        <span class="text-xs font-semibold text-textMain mt-1">Miss</span>
      </div>
    `;

    // 6. Insight Boxes
    const revPromises = filtered.filter(p => p.metric === "Revenue" && (p.status === "evaluated" || p.actual !== null));
    const revBeats = revPromises.filter(p => evaluatePromise(p).outcome === "Exceeded").length;
    const revBeatRate = revPromises.length > 0 ? ((revBeats / revPromises.length) * 100).toFixed(1) : "33.3";

    const epsPromises = filtered.filter(p => p.metric === "Diluted EPS" && (p.status === "evaluated" || p.actual !== null));
    const epsBeats = epsPromises.filter(p => evaluatePromise(p).outcome === "Exceeded").length;
    const epsBeatRate = epsPromises.length > 0 ? ((epsBeats / epsPromises.length) * 100).toFixed(1) : "50.0";

    const avgDev = Number(kpis.averageDeviation ?? kpis.netBias ?? 0);
    const avgDevStr = `${avgDev >= 0 ? "+" : ""}${isNaN(avgDev) ? "0.00" : avgDev.toFixed(2)}%`;

    const insightBoxes = document.getElementById("dash-insight-boxes");
    insightBoxes.innerHTML = `
      <div class="bg-white rounded-2xl p-4 soft-shadow border border-borderSubtle/50 flex flex-col justify-between h-24 hover:border-gray-300 transition-all">
        <p class="text-[10px] text-textMuted uppercase font-semibold">Tracked Entities</p>
        <div class="flex justify-between items-end">
          <p class="text-xl font-medium text-textMain">${companies.length} Firms</p>
          <a href="#companies" class="text-textMuted hover:text-textMain"><i class="fas fa-arrow-right text-[10px]"></i></a>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 soft-shadow border border-borderSubtle/50 flex flex-col justify-between h-24 hover:border-gray-300 transition-all">
        <p class="text-[10px] text-textMuted uppercase font-semibold">Net Bias</p>
        <div class="flex justify-between items-end">
          <p class="text-xl font-medium ${avgDev >= 0 ? "text-green-700" : "text-red-600"}">
            ${avgDevStr}
          </p>
          <a href="#analytics" class="text-textMuted hover:text-textMain"><i class="fas fa-arrow-right text-[10px]"></i></a>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 soft-shadow border border-borderSubtle/50 flex flex-col justify-between h-24 hover:border-gray-300 transition-all">
        <p class="text-[10px] text-textMuted uppercase font-semibold">Revenue Beats</p>
        <div class="flex justify-between items-end">
          <p class="text-xl font-medium text-textMain">${revBeatRate}%</p>
          <a href="#promises?metric=Revenue" class="text-textMuted hover:text-textMain"><i class="fas fa-arrow-right text-[10px]"></i></a>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-4 soft-shadow border border-borderSubtle/50 flex flex-col justify-between h-24 hover:border-gray-300 transition-all">
        <p class="text-[10px] text-textMuted uppercase font-semibold">EPS Beats</p>
        <div class="flex justify-between items-end">
          <p class="text-xl font-medium text-textMain">${epsBeatRate}%</p>
          <a href="#promises?metric=Diluted EPS" class="text-textMuted hover:text-textMain"><i class="fas fa-arrow-right text-[10px]"></i></a>
        </div>
      </div>
    `;

    // 7. Render Audited Guidance Statements Table
    renderTable(filtered);
  }

  function renderRecentPromisesList(promises) {
    const listEl = document.getElementById("dash-recent-promises");
    let displayList = [...promises];

    if (activeTab !== "All") {
      displayList = displayList.filter(p => {
        const ev = evaluatePromise(p);
        return ev.outcome === activeTab;
      });
    }

    if (displayList.length === 0) {
      listEl.innerHTML = `
        <div class="text-center py-8 text-textMuted text-xs">
          No statements matching the "${activeTab}" outcome filter.
        </div>
      `;
      return;
    }

    listEl.innerHTML = displayList.slice(0, 6).map((p, idx) => {
      const ev = evaluatePromise(p);
      const isTop = idx === 0;
      const cardClass = isTop
        ? "yellow-gradient-card rounded-2xl p-4 border border-brandYellow/30 relative cursor-pointer soft-shadow transition-all hover:scale-[1.01]"
        : "bg-cardBase rounded-2xl p-4 border border-borderSubtle relative cursor-pointer hover:bg-white transition-all hover:border-gray-300";

      return `
        <div class="${cardClass}" data-promise-id="${p.id}">
          <div class="absolute top-4 right-4 w-6 h-6 rounded-full ${isTop ? "bg-darkAccent text-brandYellow" : "border border-borderSubtle text-textMuted"} flex items-center justify-center">
            <i class="fas fa-link text-[10px]"></i>
          </div>
          <h4 class="font-semibold text-textMain text-sm pr-8">${p.companyName} (${p.targetQuarter})</h4>
          <p class="text-xs text-textMuted mt-1">
            ${p.metric}: <span class="font-medium ${ev.diffPct >= 0 ? "text-green-700" : "text-red-600"}">${ev.diffPct !== null ? formatPct(ev.diffPct) : "Pending"}</span> Deviation
          </p>
          <div class="flex items-center justify-between mt-3.5 pt-2 border-t border-black/5">
            <div class="flex items-center text-xs text-textMuted font-medium">
              <i class="far fa-clock mr-1.5"></i> Actual: ${p.actual !== null ? formatValue(p.actual, p.unit) : "Pending"}
            </div>
            <div class="w-6 h-6 rounded-full bg-gray-200 border border-white overflow-hidden shrink-0">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.ticker)}&background=random" alt="${p.ticker}" class="w-full h-full object-cover">
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Click handler to open Evidence Drawer
    listEl.querySelectorAll("[data-promise-id]").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-promise-id");
        const found = allPromises.find(p => p.id === id);
        if (found) evidenceDrawer.open(found);
      });
    });
  }

  function renderTable(promises) {
    const tbody = document.getElementById("dash-table-body");
    let tableData = [...promises];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      tableData = tableData.filter(p =>
        p.companyName.toLowerCase().includes(q) ||
        p.ticker.toLowerCase().includes(q) ||
        p.metric.toLowerCase().includes(q) ||
        p.targetQuarter.toLowerCase().includes(q)
      );
    }

    if (tableData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="py-8 text-center text-textMuted text-xs">
            No guidance statements match your current search query.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = tableData.slice(0, 8).map(p => {
      const ev = evaluatePromise(p);
      const rangeStr = `${formatValue(p.guidanceLower, p.unit)} – ${formatValue(p.guidanceUpper, p.unit)}`;
      const actualStr = p.actual !== null ? formatValue(p.actual, p.unit) : "Pending";
      const devStr = ev.diffPct !== null ? `${ev.diffPct >= 0 ? "+" : ""}${formatPct(ev.diffPct)}` : "—";
      const devColor = ev.diffPct !== null ? (ev.diffPct >= 0 ? "text-green-700 font-semibold" : "text-red-600 font-semibold") : "text-textMuted";

      return `
        <tr class="hover:bg-cardBase/60 transition-colors cursor-pointer group" data-row-promise-id="${p.id}">
          <td class="py-3 px-3 flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-borderSubtle">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.ticker)}&background=random" alt="${p.ticker}" class="w-full h-full object-cover">
            </div>
            <div>
              <span class="font-semibold text-textMain text-xs block">${p.companyName}</span>
              <span class="text-[10px] text-textMuted font-mono">${p.ticker}</span>
            </div>
          </td>
          <td class="py-3 px-2 text-textMain font-medium">${p.targetQuarter}</td>
          <td class="py-3 px-2 text-textMain">${p.metric}</td>
          <td class="py-3 px-2 text-textMuted font-mono text-[11px]">${rangeStr}</td>
          <td class="py-3 px-2 font-medium font-mono text-[11px]">${actualStr}</td>
          <td class="py-3 px-2 font-mono text-[11px] ${devColor}">${devStr}</td>
          <td class="py-3 px-2">${renderOutcomeBadge(ev.outcome)}</td>
          <td class="py-3 px-2 text-center">
            <button class="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-textMuted hover:text-textMain transition-colors mx-auto" title="Inspect Guidance Audit" data-btn-inspect="${p.id}">
              <i class="fas fa-ellipsis-h text-xs"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Attach row inspection listeners
    tbody.querySelectorAll("[data-row-promise-id]").forEach(row => {
      row.addEventListener("click", (e) => {
        const id = row.getAttribute("data-row-promise-id");
        const found = allPromises.find(p => p.id === id);
        if (found) evidenceDrawer.open(found);
      });
    });
  }

  // Event Listeners
  document.getElementById("dash-metric-filter").addEventListener("change", renderView);
  document.getElementById("dash-company-filter").addEventListener("change", renderView);

  // Tab buttons for Recent Promises
  document.querySelectorAll(".promise-tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".promise-tab-btn").forEach(b => {
        b.classList.remove("active", "bg-darkAccent", "text-white");
        b.classList.add("text-textMuted");
      });
      btn.classList.add("active", "bg-darkAccent", "text-white");
      btn.classList.remove("text-textMuted");
      activeTab = btn.getAttribute("data-tab");
      renderRecentPromisesList(allPromises);
    });
  });

  // Search input in table
  document.getElementById("dash-table-search").addEventListener("input", (e) => {
    searchQuery = e.target.value;
    const metricFilter = document.getElementById("dash-metric-filter").value;
    const companyFilter = document.getElementById("dash-company-filter").value;
    let filtered = [...allPromises];
    if (metricFilter !== "ALL") filtered = filtered.filter(p => p.metric === metricFilter);
    if (companyFilter !== "ALL") filtered = filtered.filter(p => p.ticker === companyFilter || p.companyId === companyFilter);
    renderTable(filtered);
  });

  // Export report button
  document.getElementById("btn-export-overview").addEventListener("click", () => {
    exportToCSV(allPromises, "outlookiq-earnings-intelligence.csv");
    showToast("Export Complete", "Earnings Intelligence overview exported to CSV.", "success");
  });

  // Initial render
  renderView();
}
