/**
 * PAGE 4 — Financial Analytics (Intelly Aesthetic)
 * Quantitative intelligence styled with Intelly warm canvas, white rounded-3xl cards, and pastel badges.
 */

import { api } from "../api.js";
import { calculateKPIs, evaluatePromise, exportToCSV } from "../calculations.js";
import {
  renderAccuracyOverTimeChart,
  renderGuidanceVsActualChart,
  renderHistoricalOutcomesChart,
  downloadChartAsPNG
} from "../charts.js";
import { showToast } from "../components.js";

export async function renderAnalytics(container) {
  const companies = await api.getCompanies();
  const allPromises = await api.getPromises();

  container.innerHTML = `
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
      <div>
        <div class="flex items-center text-xs text-textMuted font-medium mb-1">
          <a href="#dashboard" class="hover:text-textMain transition-colors">OutlookIQ</a>
          <i class="fas fa-chevron-right mx-2 text-[9px]"></i>
          <span class="text-textMain font-semibold">Analytics</span>
        </div>
        <h2 class="text-2xl font-bold text-textMain">Guidance Analytics</h2>
        <p class="text-textMuted text-xs mt-1">Quantitative audit of forecasting accuracy, directional bias, and cross-quarter delivery.</p>
      </div>
      <button id="btn-export-analytics-csv" class="flex items-center px-4 py-2 bg-cardWhite border border-gray-100 rounded-full text-textMain hover:bg-bgLight transition-colors text-xs font-semibold intelly-shadow self-start sm:self-auto">
        <i class="fas fa-download mr-2 text-pastelPink"></i> Export Analytics CSV
      </button>
    </div>

    <!-- Analytics Controls -->
    <div class="bg-cardWhite rounded-2xl p-4 mb-6 intelly-shadow flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label for="analytics-company-select" class="text-xs text-textMuted font-medium">Issuer:</label>
        <select id="analytics-company-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Covered Universe</option>
          ${companies.map(c => `<option value="${c.ticker}">${c.name} (${c.ticker})</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="analytics-metric-select" class="text-xs text-textMuted font-medium">Metric:</label>
        <select id="analytics-metric-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="Revenue">Revenue</option>
          <option value="Gross Margin">Gross Margin</option>
          <option value="Diluted EPS">Diluted EPS</option>
          <option value="Operating Expenses">Operating Expenses</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <label for="analytics-fy-select" class="text-xs text-textMuted font-medium">Fiscal Year:</label>
        <select id="analytics-fy-select" class="bg-bgLight text-textMain rounded-full py-1.5 px-4 text-xs outline-none cursor-pointer border border-transparent focus:border-pastelPink">
          <option value="ALL">All Available Years</option>
          <option value="2025">FY 2025</option>
          <option value="2024">FY 2024</option>
          <option value="2023">FY 2023</option>
        </select>
      </div>
    </div>

    <!-- KPI Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="analytics-kpi-grid">
      <!-- Injected dynamically -->
    </div>

    <!-- Section A: Forecast Accuracy Over Time -->
    <div class="bg-cardWhite rounded-3xl p-6 mb-6 intelly-shadow border border-gray-100">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-base font-bold text-textMain">Forecast Accuracy Over Time</h3>
          <p class="text-xs text-textMuted mt-0.5">% Deviation from midpoint. Zero-line denotes exact midpoint adherence.</p>
        </div>
        <button id="btn-dl-accuracy-chart" class="px-3 py-1.5 bg-bgLight rounded-full text-xs text-textMuted hover:text-textMain font-semibold transition-colors">
          <i class="fas fa-image mr-1 text-[10px] text-pastelPink"></i> Export PNG
        </button>
      </div>
      <div class="chart-wrapper h-[300px] relative">
        <canvas id="chart-accuracy-time"></canvas>
      </div>
    </div>

    <!-- Section B & C: Side-by-Side Charts -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Section B: Guidance vs Actual -->
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-base font-bold text-textMain">Guidance vs Actual</h3>
            <p class="text-xs text-textMuted mt-0.5" id="chart-b-subtitle">Grouped quarterly comparison</p>
          </div>
          <button id="btn-dl-guidance-chart" class="px-3 py-1.5 bg-bgLight rounded-full text-xs text-textMuted hover:text-textMain font-semibold transition-colors">
            <i class="fas fa-image mr-1 text-[10px] text-pastelPink"></i> PNG
          </button>
        </div>
        <div class="chart-wrapper h-[260px] relative">
          <canvas id="chart-analytics-guidance"></canvas>
        </div>
      </div>

      <!-- Section C: Historical Outcomes Stacked -->
      <div class="bg-cardWhite rounded-3xl p-6 intelly-shadow border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-base font-bold text-textMain">Historical Outcomes</h3>
            <p class="text-xs text-textMuted mt-0.5">Annual distribution of Exceeded, Met, and Missed forecasts</p>
          </div>
          <button id="btn-dl-outcomes-chart" class="px-3 py-1.5 bg-bgLight rounded-full text-xs text-textMuted hover:text-textMain font-semibold transition-colors">
            <i class="fas fa-image mr-1 text-[10px] text-pastelPink"></i> PNG
          </button>
        </div>
        <div class="chart-wrapper h-[260px] relative">
          <canvas id="chart-analytics-historical"></canvas>
        </div>
      </div>
    </div>

    <!-- Section D: Metric-Level Breakdown -->
    <div class="bg-cardWhite rounded-3xl intelly-shadow overflow-hidden mb-8 border border-gray-100">
      <div class="p-5 border-b border-gray-100">
        <h3 class="text-base font-bold text-textMain">Metric-Level Quantitative Audit</h3>
        <p class="text-xs text-textMuted mt-0.5">Mathematical breakdown across individual financial statement line items</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-bgLight/50 border-b border-gray-100 text-[10px] text-textMuted uppercase tracking-wider font-semibold">
              <th class="py-3.5 px-5">Financial Metric</th>
              <th class="py-3.5 px-5">Benchmark Direction</th>
              <th class="py-3.5 px-5">Tracked</th>
              <th class="py-3.5 px-5">Evaluated</th>
              <th class="py-3.5 px-5">Beat Rate (%)</th>
              <th class="py-3.5 px-5">Mean Abs. Dev.</th>
              <th class="py-3.5 px-5">Net Forecast Bias</th>
            </tr>
          </thead>
          <tbody id="metric-breakdown-tbody" class="text-xs text-textMain divide-y divide-gray-100">
            <!-- Injected dynamically -->
          </tbody>
        </table>
      </div>

      <div class="p-4 border-t border-gray-100 bg-bgLight/30 text-xs text-textMuted leading-relaxed">
        <strong class="text-textMain">Methodological Note:</strong> Mean Absolute Deviation (MAD) quantifies magnitude of variance from management guidance midpoint regardless of direction. Net Forecast Bias measures systematic tendency to under-guide (+) or over-promise (-).
      </div>
    </div>
  `;

  function updateAnalytics() {
    const selectedCompany = document.getElementById("analytics-company-select").value;
    const selectedMetric = document.getElementById("analytics-metric-select").value;
    const selectedFY = document.getElementById("analytics-fy-select").value;

    let filtered = [...allPromises];

    if (selectedCompany !== "ALL") filtered = filtered.filter(p => p.ticker === selectedCompany);
    if (selectedFY !== "ALL") filtered = filtered.filter(p => p.fiscalYear === selectedFY);

    const kpis = calculateKPIs(filtered);
    const kpiGrid = document.getElementById("analytics-kpi-grid");

    kpiGrid.innerHTML = `
      <div class="bg-cardWhite rounded-2xl p-5 intelly-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-bgLight flex items-center justify-center text-textMuted">
            <i class="far fa-folder text-xs"></i>
          </div>
          <span class="text-xs text-textMuted font-semibold uppercase tracking-wider">Evaluated</span>
        </div>
        <p class="text-2xl font-bold text-textMain">${kpis.evaluatedCount} <span class="text-xs text-textMuted font-normal font-sans">/ ${kpis.totalTracked}</span></p>
        <p class="text-[10px] text-textMuted mt-1">${kpis.pendingCount} pending releases</p>
      </div>

      <div class="bg-cardWhite rounded-2xl p-5 intelly-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-pastelYellow flex items-center justify-center text-yellow-800">
            <i class="fas fa-calculator text-xs"></i>
          </div>
          <span class="text-xs text-textMuted font-semibold uppercase tracking-wider">Mean Abs. Dev.</span>
        </div>
        <p class="text-2xl font-bold text-textMain font-mono">${kpis.meanAbsDev}%</p>
        <p class="text-[10px] text-textMuted mt-1">Avg deviation from midpoint</p>
      </div>

      <div class="bg-cardWhite rounded-2xl p-5 intelly-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-pastelGreen flex items-center justify-center text-green-800">
            <i class="fas fa-balance-scale text-xs"></i>
          </div>
          <span class="text-xs text-textMuted font-semibold uppercase tracking-wider">Net Bias</span>
        </div>
        <div class="flex items-center gap-2">
          <p class="text-2xl font-bold font-mono ${kpis.netBias >= 0 ? "text-green-700" : "text-red-700"}">${kpis.netBias >= 0 ? "+" : ""}${kpis.netBias}%</p>
          <span class="text-[10px] ${kpis.netBias >= 0 ? "bg-pastelGreen text-green-800" : "bg-pastelRed text-red-800"} px-2 py-0.5 rounded-full font-bold">
            ${kpis.netBias >= 0 ? "Conservative" : "Aggressive"}
          </span>
        </div>
        <p class="text-[10px] text-textMuted mt-1">Tendency to beat guidance</p>
      </div>

      <div class="bg-cardWhite rounded-2xl p-5 intelly-shadow">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 rounded-full bg-pastelBlue flex items-center justify-center text-blue-800">
            <i class="fas fa-shield-alt text-xs"></i>
          </div>
          <span class="text-xs text-textMuted font-semibold uppercase tracking-wider">Adherence Rate</span>
        </div>
        <p class="text-2xl font-bold text-textMain font-mono">${(Number(kpis.metPct || 0) + Number(kpis.exceededPct || 0)).toFixed(1)}%</p>
        <p class="text-[10px] text-textMuted mt-1">Met or exceeded targets</p>
      </div>
    `;

    renderAccuracyOverTimeChart("chart-accuracy-time", filtered);
    renderGuidanceVsActualChart("chart-analytics-guidance", filtered, selectedMetric);
    renderHistoricalOutcomesChart("chart-analytics-historical", filtered);
    document.getElementById("chart-b-subtitle").textContent = `${selectedMetric} · Midpoint vs Reported`;

    const metrics = ["Revenue", "Gross Margin", "Diluted EPS", "Operating Expenses"];
    const tbody = document.getElementById("metric-breakdown-tbody");

    tbody.innerHTML = metrics.map(m => {
      const metricPromises = filtered.filter(p => p.metric === m);
      const mKpis = calculateKPIs(metricPromises);
      const direction = m === "Operating Expenses" ? "Lower is better" : "Higher is better";

      return `
        <tr class="hover:bg-bgLight/50 transition-colors">
          <td class="py-3.5 px-5 font-bold text-textMain">${m}</td>
          <td class="py-3.5 px-5 text-xs text-textMuted">${direction}</td>
          <td class="py-3.5 px-5 font-mono text-xs text-textMain">${mKpis.totalTracked}</td>
          <td class="py-3.5 px-5 font-mono text-xs text-textMain">${mKpis.evaluatedCount}</td>
          <td class="py-3.5 px-5 font-mono text-xs font-bold text-green-700">${mKpis.exceededPct}%</td>
          <td class="py-3.5 px-5 font-mono text-xs text-textMain">${mKpis.meanAbsDev}%</td>
          <td class="py-3.5 px-5 font-mono text-xs font-bold ${mKpis.netBias >= 0 ? "text-green-700" : "text-red-700"}">
            ${mKpis.netBias >= 0 ? "+" : ""}${mKpis.netBias}%
          </td>
        </tr>
      `;
    }).join("");
  }

  ["analytics-company-select", "analytics-metric-select", "analytics-fy-select"].forEach(id => {
    document.getElementById(id).addEventListener("change", updateAnalytics);
  });

  document.getElementById("btn-dl-accuracy-chart").addEventListener("click", () => {
    downloadChartAsPNG("chart-accuracy-time", "OutlookIQ-Accuracy-Over-Time.png");
    showToast("Chart Downloaded", "Accuracy chart PNG saved.", "success");
  });

  document.getElementById("btn-dl-guidance-chart").addEventListener("click", () => {
    downloadChartAsPNG("chart-analytics-guidance", "OutlookIQ-Guidance-vs-Actual.png");
    showToast("Chart Downloaded", "Guidance chart PNG saved.", "success");
  });

  document.getElementById("btn-dl-outcomes-chart").addEventListener("click", () => {
    downloadChartAsPNG("chart-analytics-historical", "OutlookIQ-Outcomes-Historical.png");
    showToast("Chart Downloaded", "Outcomes chart PNG saved.", "success");
  });

  document.getElementById("btn-export-analytics-csv").addEventListener("click", () => {
    const selectedCompany = document.getElementById("analytics-company-select").value;
    let exportSet = allPromises;
    if (selectedCompany !== "ALL") exportSet = exportSet.filter(p => p.ticker === selectedCompany);

    const rows = exportSet.map(p => {
      const ev = evaluatePromise(p);
      return {
        Ticker: p.ticker,
        Metric: p.metric,
        TargetQuarter: p.targetQuarter,
        FiscalYear: p.fiscalYear,
        Midpoint: ev.midpoint,
        Actual: p.actual ?? "Pending",
        DiffAbs: ev.diffAbs ?? "N/A",
        DiffPct: (ev.diffPct !== null && typeof ev.diffPct === "number") ? `${ev.diffPct.toFixed(2)}%` : "N/A",
        Outcome: ev.outcome
      };
    });
    exportToCSV(`OutlookIQ-Analytics-Summary-${Date.now()}.csv`, rows);
    showToast("CSV Exported", "Analytics dataset downloaded.", "success");
  });

  updateAnalytics();
}
