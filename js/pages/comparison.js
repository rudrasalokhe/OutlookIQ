/**
 * PAGE 5 — Company Comparison (Intelly Aesthetic)
 * Side-by-side relative evaluation styled with Intelly warm canvas, white rounded-3xl cards, and pastel badges.
 */

import { api } from "../api.js";
import { calculateKPIs, evaluatePromise, formatValue, exportToCSV } from "../calculations.js";
import { renderCompanyComparisonChart } from "../charts.js";
import { showToast } from "../components.js";

export async function renderComparison(container, queryParams = {}) {
  const companies = await api.getCompanies();
  const allPromises = await api.getPromises();

  const defaultCompA = queryParams.compA || "NVTD";
  const defaultCompB = queryParams.compB || "APXC";

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
      <div>
        <div class="flex items-center text-xs text-textMuted font-medium mb-1">
          <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
          <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
          <span class="text-textMain font-semibold">Relative Comparison</span>
        </div>
        <h2 class="text-2xl font-bold text-textMain">Company Comparison</h2>
        <p class="text-textMuted text-xs mt-1">Cross-company benchmark of forecasting reliability, execution consistency, and bias.</p>
      </div>
      <button id="btn-export-comparison-csv" class="flex items-center px-4 py-2 bg-cardWhite border border-gray-100 rounded-full text-textMain hover:bg-bgLight transition-colors text-xs font-semibold intelly-shadow self-start sm:self-auto">
        <i class="fas fa-download mr-2 text-pastelPink"></i> Export CSV
      </button>
    </div>

    <!-- Controls -->
    <div class="bg-cardWhite rounded-2xl p-4 mb-6 intelly-shadow flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label for="compare-comp-a" class="text-xs text-textMuted font-medium">Company A:</label>
        <select id="compare-comp-a" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          ${companies.map(c => `<option value="${c.ticker}" ${c.ticker === defaultCompA ? "selected" : ""}>${c.ticker} - ${c.name}</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="compare-comp-b" class="text-xs text-textMuted font-medium">Company B:</label>
        <select id="compare-comp-b" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          ${companies.map(c => `<option value="${c.ticker}" ${c.ticker === defaultCompB ? "selected" : ""}>${c.ticker} - ${c.name}</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="compare-metric-select" class="text-xs text-textMuted font-medium">Metric:</label>
        <select id="compare-metric-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="Revenue">Revenue</option>
          <option value="Gross Margin">Gross Margin</option>
          <option value="Diluted EPS">Diluted EPS</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="compare-window-select" class="text-xs text-textMuted font-medium">Window:</label>
        <select id="compare-window-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Overlapping Quarters</option>
          <option value="2024">FY 2024 Quarters</option>
          <option value="2023">FY 2023 Quarters</option>
        </select>
      </div>

      <button id="btn-run-compare" class="px-5 py-2 bg-sidebarDark text-white rounded-full text-xs font-semibold hover:bg-pastelPink hover:text-sidebarDark transition-all">
        Compare
      </button>
    </div>

    <!-- Side-by-Side Summary Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6" id="comp-cards-container">
      <!-- Injected dynamically -->
    </div>

    <!-- Comparison Bar Chart Section -->
    <div class="bg-cardWhite rounded-3xl p-6 mb-6 intelly-shadow border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 id="comp-chart-title" class="text-base font-bold text-textMain">Quarterly Performance Comparison</h3>
          <p class="text-xs text-textMuted mt-0.5">Reported results against common-period guidance midpoint</p>
        </div>
        <span class="text-xs bg-pastelBlue text-blue-800 px-3 py-1 rounded-full font-bold" id="comp-metric-badge">Revenue</span>
      </div>
      <div class="chart-wrapper h-[280px] relative" id="comp-chart-wrapper">
        <canvas id="chart-company-comparison"></canvas>
      </div>
    </div>

    <!-- Common Period Reconciliation Table -->
    <div class="bg-cardWhite rounded-3xl intelly-shadow overflow-hidden mb-8 border border-gray-100">
      <div class="p-5 border-b border-gray-100">
        <h3 class="text-base font-bold text-textMain">Common-Period Financial Reconciliation</h3>
        <p class="text-xs text-textMuted mt-0.5">Direct head-to-head guidance vs actual performance across matched quarters</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-bgLight/50 border-b border-gray-100 text-[10px] text-textMuted uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-5">Target Quarter</th>
              <th class="py-3.5 px-5">Metric</th>
              <th class="py-3.5 px-5" id="th-comp-a-guidance">Comp A Guidance</th>
              <th class="py-3.5 px-5" id="th-comp-a-actual">Comp A Actual</th>
              <th class="py-3.5 px-5" id="th-comp-b-guidance">Comp B Guidance</th>
              <th class="py-3.5 px-5" id="th-comp-b-actual">Comp B Actual</th>
              <th class="py-3.5 px-5">Spread Variance</th>
            </tr>
          </thead>
          <tbody id="comp-table-tbody" class="text-xs text-textMain divide-y divide-gray-100">
            <!-- Injected dynamically -->
          </tbody>
        </table>
      </div>
      <div class="p-4 border-t border-gray-100 bg-bgLight/30 text-xs text-textMuted font-medium">
        <strong class="text-textMain">Calendar Normalization:</strong> Evaluating overlapping periods only. Different fiscal year ends are mapped to matching calendar calendar quarters.
      </div>
    </div>
  `;

  const pastelBadgeMap = {
    NVTD: "bg-pastelGreen text-green-800",
    APXC: "bg-pastelBlue text-blue-800",
    LMBO: "bg-pastelPink text-pink-900",
    SOLR: "bg-pastelYellow text-yellow-900"
  };

  function executeComparison() {
    const tickerA = document.getElementById("compare-comp-a").value;
    const tickerB = document.getElementById("compare-comp-b").value;
    const metric = document.getElementById("compare-metric-select").value;
    const windowVal = document.getElementById("compare-window-select").value;

    const compA = companies.find(c => c.ticker === tickerA);
    const compB = companies.find(c => c.ticker === tickerB);

    if (tickerA === tickerB) {
      showToast("Comparison Notice", "Please choose two distinct companies to compare.", "warning");
      return;
    }

    let promisesA = allPromises.filter(p => p.ticker === tickerA);
    let promisesB = allPromises.filter(p => p.ticker === tickerB);

    if (windowVal !== "ALL") {
      promisesA = promisesA.filter(p => p.fiscalYear === windowVal);
      promisesB = promisesB.filter(p => p.fiscalYear === windowVal);
    }

    const kpisA = calculateKPIs(promisesA);
    const kpisB = calculateKPIs(promisesB);

    const badgeA = pastelBadgeMap[compA.ticker] || "bg-bgLight text-textMain";
    const badgeB = pastelBadgeMap[compB.ticker] || "bg-bgLight text-textMain";

    const cardsContainer = document.getElementById("comp-cards-container");
    cardsContainer.innerHTML = `
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="flex items-center gap-3.5 mb-5">
          <div class="w-11 h-11 rounded-2xl ${badgeA} flex items-center justify-center font-bold text-sm shrink-0">
            ${compA.monogram}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-textMain">${compA.ticker}</span>
              <span class="text-[10px] bg-bgLight text-textMuted px-2 py-0.5 rounded-full">${compA.sector}</span>
            </div>
            <h3 class="text-base font-bold text-textMain leading-tight mt-0.5">${compA.name}</h3>
          </div>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Evaluated Forecasts</span><span class="font-mono font-bold text-textMain">${kpisA.evaluatedCount} / ${kpisA.totalTracked}</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Exceeded Guidance</span><span class="font-mono text-green-700 font-bold">${kpisA.exceededCount} (${kpisA.exceededPct}%)</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Met Guidance</span><span class="font-mono text-blue-700 font-bold">${kpisA.metCount} (${kpisA.metPct}%)</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Missed Guidance</span><span class="font-mono text-red-700 font-bold">${kpisA.missedCount} (${kpisA.missedPct}%)</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Mean Absolute Dev.</span><span class="font-mono text-textMain font-bold">${kpisA.meanAbsDev}%</span></div>
          <div class="flex justify-between py-1.5"><span class="text-textMuted">Net Forecast Bias</span><span class="font-mono font-bold ${kpisA.netBias >= 0 ? "text-green-700" : "text-red-700"}">${kpisA.netBias >= 0 ? "+" : ""}${kpisA.netBias}%</span></div>
        </div>
      </div>

      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="flex items-center gap-3.5 mb-5">
          <div class="w-11 h-11 rounded-2xl ${badgeB} flex items-center justify-center font-bold text-sm shrink-0">
            ${compB.monogram}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-bold text-textMain">${compB.ticker}</span>
              <span class="text-[10px] bg-bgLight text-textMuted px-2 py-0.5 rounded-full">${compB.sector}</span>
            </div>
            <h3 class="text-base font-bold text-textMain leading-tight mt-0.5">${compB.name}</h3>
          </div>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Evaluated Forecasts</span><span class="font-mono font-bold text-textMain">${kpisB.evaluatedCount} / ${kpisB.totalTracked}</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Exceeded Guidance</span><span class="font-mono text-green-700 font-bold">${kpisB.exceededCount} (${kpisB.exceededPct}%)</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Met Guidance</span><span class="font-mono text-blue-700 font-bold">${kpisB.metCount} (${kpisB.metPct}%)</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Missed Guidance</span><span class="font-mono text-red-700 font-bold">${kpisB.missedCount} (${kpisB.missedPct}%)</span></div>
          <div class="flex justify-between py-1.5 border-b border-gray-100"><span class="text-textMuted">Mean Absolute Dev.</span><span class="font-mono text-textMain font-bold">${kpisB.meanAbsDev}%</span></div>
          <div class="flex justify-between py-1.5"><span class="text-textMuted">Net Forecast Bias</span><span class="font-mono font-bold ${kpisB.netBias >= 0 ? "text-green-700" : "text-red-700"}">${kpisB.netBias >= 0 ? "+" : ""}${kpisB.netBias}%</span></div>
        </div>
      </div>
    `;

    document.getElementById("comp-metric-badge").textContent = metric;
    document.getElementById("comp-chart-title").textContent = `${compA.ticker} vs ${compB.ticker} · ${metric} Performance`;

    const chartInstance = renderCompanyComparisonChart(
      "chart-company-comparison",
      compA,
      compB,
      promisesA,
      promisesB,
      metric
    );

    const chartWrapper = document.getElementById("comp-chart-wrapper");
    if (!chartInstance) {
      chartWrapper.innerHTML = `
        <div class="flex items-center justify-center h-full text-center text-textMuted text-xs p-8">
          No overlapping evaluated quarters found for ${metric} in the selected fiscal window.
        </div>
      `;
    }

    document.getElementById("th-comp-a-guidance").textContent = `${compA.ticker} Guidance`;
    document.getElementById("th-comp-a-actual").textContent = `${compA.ticker} Actual`;
    document.getElementById("th-comp-b-guidance").textContent = `${compB.ticker} Guidance`;
    document.getElementById("th-comp-b-actual").textContent = `${compB.ticker} Actual`;

    const tableQuarters = ["Q3 FY24", "Q2 FY24", "Q1 FY24", "Q4 FY23"];
    const tbody = document.getElementById("comp-table-tbody");

    const matchedRows = [];
    tableQuarters.forEach(q => {
      const pA = promisesA.find(p => p.targetQuarter === q && p.metric === metric);
      const pB = promisesB.find(p => p.targetQuarter === q && p.metric === metric);
      if (pA || pB) matchedRows.push({ quarter: q, pA, pB });
    });

    if (matchedRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-textMuted font-medium">No matched guidance records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = matchedRows.map(row => {
      const evA = row.pA ? evaluatePromise(row.pA) : null;
      const evB = row.pB ? evaluatePromise(row.pB) : null;

      const gStrA = row.pA ? `${formatValue(row.pA.guidanceLower, row.pA.unit)} - ${formatValue(row.pA.guidanceUpper, row.pA.unit)}` : "—";
      const actStrA = row.pA && row.pA.actual !== null && typeof evA?.diffPct === "number" ? `${formatValue(row.pA.actual, row.pA.unit)} (${evA.diffPct >= 0 ? "+" : ""}${evA.diffPct.toFixed(1)}%)` : (row.pA && row.pA.actual !== null ? formatValue(row.pA.actual, row.pA.unit) : "—");

      const gStrB = row.pB ? `${formatValue(row.pB.guidanceLower, row.pB.unit)} - ${formatValue(row.pB.guidanceUpper, row.pB.unit)}` : "—";
      const actStrB = row.pB && row.pB.actual !== null && typeof evB?.diffPct === "number" ? `${formatValue(row.pB.actual, row.pB.unit)} (${evB.diffPct >= 0 ? "+" : ""}${evB.diffPct.toFixed(1)}%)` : (row.pB && row.pB.actual !== null ? formatValue(row.pB.actual, row.pB.unit) : "—");

      let diffNote = "Comparable";
      if (evA && evB && evA.diffPct !== null && evB.diffPct !== null) {
        const spread = (evA.diffPct - evB.diffPct).toFixed(2);
        diffNote = `${compA.ticker} ${spread >= 0 ? "+" : ""}${spread}% vs ${compB.ticker}`;
      }

      return `
        <tr class="hover:bg-bgLight/50 transition-colors">
          <td class="py-3.5 px-5 font-bold text-textMain">${row.quarter}</td>
          <td class="py-3.5 px-5 text-textMuted">${metric}</td>
          <td class="py-3.5 px-5 font-mono text-xs text-textMuted">${gStrA}</td>
          <td class="py-3.5 px-5 font-mono text-xs ${evA?.diffPct > 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}">
            ${actStrA}
          </td>
          <td class="py-3.5 px-5 font-mono text-xs text-textMuted">${gStrB}</td>
          <td class="py-3.5 px-5 font-mono text-xs ${evB?.diffPct > 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}">
            ${actStrB}
          </td>
          <td class="py-3.5 px-5 text-xs font-semibold text-textMain">${diffNote}</td>
        </tr>
      `;
    }).join("");
  }

  document.getElementById("btn-run-compare").addEventListener("click", executeComparison);
  ["compare-comp-a", "compare-comp-b", "compare-metric-select", "compare-window-select"].forEach(id => {
    document.getElementById(id).addEventListener("change", executeComparison);
  });

  document.getElementById("btn-export-comparison-csv").addEventListener("click", () => {
    const tickerA = document.getElementById("compare-comp-a").value;
    const tickerB = document.getElementById("compare-comp-b").value;
    const metric = document.getElementById("compare-metric-select").value;

    const rows = [
      { Parameter: "Company", CompA: tickerA, CompB: tickerB },
      { Parameter: "Metric Analyzed", CompA: metric, CompB: metric },
      { Parameter: "Export Timestamp", CompA: new Date().toISOString(), CompB: new Date().toISOString() }
    ];
    exportToCSV(`OutlookIQ-Comparison-${tickerA}-vs-${tickerB}.csv`, rows);
    showToast("Comparison CSV Exported", "Comparison summary downloaded.", "success");
  });

  executeComparison();
}
