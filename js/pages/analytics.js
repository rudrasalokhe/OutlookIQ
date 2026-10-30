/**
 * PAGE 4 — Financial Analytics (Neo-Brutalist Design)
 * Quantitative intelligence styled with bold black borders (3px), hard drop-shadows (6px), Space Grotesk.
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
    <header class="header">
      <div class="header-title">
        <h1>Guidance Analytics</h1>
        <div class="badge">Quantitative Audit</div>
        <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">Forecast Dispersion, Bias & Execution Consistency</span>
      </div>
      <div class="header-actions">
        <button id="btn-export-analytics-csv" class="brutal-btn">
          <i class="fas fa-download"></i> Export Analytics CSV
        </button>
      </div>
    </header>

    <!-- Analytics Controls -->
    <div class="brutal-card" style="padding: 16px; margin-bottom: 24px; flex-direction: row; flex-wrap: wrap; gap: 16px; align-items: center;">
      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Issuer:</span>
        <select id="analytics-company-select" class="brutal-select">
          <option value="ALL">All Covered Universe</option>
          ${companies.map(c => `<option value="${c.ticker}">${c.name} (${c.ticker})</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Metric:</span>
        <select id="analytics-metric-select" class="brutal-select">
          <option value="Revenue">Revenue</option>
          <option value="Gross Margin">Gross Margin</option>
          <option value="Diluted EPS">Diluted EPS</option>
          <option value="Operating Expenses">Operating Expenses</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Fiscal Year:</span>
        <select id="analytics-fy-select" class="brutal-select">
          <option value="ALL">All Available Years</option>
          <option value="2025">FY 2025</option>
          <option value="2024">FY 2024</option>
          <option value="2023">FY 2023</option>
        </select>
      </div>
    </div>

    <!-- KPI Grid (4 Cards) -->
    <div class="grid-4" id="analytics-kpi-grid">
      <!-- Injected dynamically -->
    </div>

    <!-- Section A: Forecast Accuracy Over Time -->
    <div class="brutal-card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase;">Forecast Accuracy Over Time</h3>
          <p style="font-weight: 600; font-size: 0.85rem; color: #666; margin-top: 4px;">% Deviation from management corridor midpoint. The 0% axis marks exact delivery.</p>
        </div>
        <button id="btn-dl-accuracy-chart" class="brutal-btn" style="padding: 6px 12px; font-size: 0.75rem;">
          <i class="fas fa-image"></i> Export PNG
        </button>
      </div>
      <div style="height: 320px; position: relative;">
        <canvas id="chart-accuracy-time"></canvas>
      </div>
    </div>

    <!-- Section B & C: Side-by-Side Charts -->
    <div class="grid-3" style="grid-template-columns: 1fr 1fr; margin-bottom: 24px;">
      <!-- Guidance vs Actual -->
      <div class="brutal-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase;">Guidance vs Actual</h3>
            <p id="chart-b-subtitle" style="font-weight: 600; font-size: 0.8rem; color: #666; margin-top: 4px;">Grouped quarterly comparison</p>
          </div>
          <button id="btn-dl-guidance-chart" class="brutal-btn" style="padding: 4px 10px; font-size: 0.75rem;">
            PNG
          </button>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="chart-analytics-guidance"></canvas>
        </div>
      </div>

      <!-- Historical Outcomes -->
      <div class="brutal-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 700; text-transform: uppercase;">Historical Outcomes</h3>
            <p style="font-weight: 600; font-size: 0.8rem; color: #666; margin-top: 4px;">Annual distribution of Exceeded, Met, and Missed forecasts</p>
          </div>
          <button id="btn-dl-outcomes-chart" class="brutal-btn" style="padding: 4px 10px; font-size: 0.75rem;">
            PNG
          </button>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="chart-analytics-historical"></canvas>
        </div>
      </div>
    </div>

    <!-- Section D: Metric-Level Breakdown -->
    <div style="margin-bottom: 24px; overflow-x: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase;">Metric-Level Quantitative Breakdown</h3>
        <span class="badge" style="background: var(--main-yellow);">Mathematical Verification</span>
      </div>

      <table class="brutal-table">
        <thead>
          <tr>
            <th>Financial Metric</th>
            <th>Optimization Benchmark</th>
            <th>Tracked</th>
            <th>Evaluated</th>
            <th>Beat Rate (%)</th>
            <th>Mean Abs. Dev.</th>
            <th>Net Forecast Bias</th>
          </tr>
        </thead>
        <tbody id="metric-breakdown-tbody">
          <!-- Injected dynamically -->
        </tbody>
      </table>
    </div>

    <div class="brutal-card bg-yellow" style="padding: 16px; margin-bottom: 24px;">
      <div style="font-weight: 700; text-transform: uppercase; font-size: 0.85rem; margin-bottom: 4px;">Methodological Note</div>
      <div style="font-size: 0.85rem; font-weight: 600; line-height: 1.4;">
        Mean Absolute Deviation (MAD) quantifies the raw magnitude of forecast error relative to management corridor midpoints. Net Forecast Bias measures systematic asymmetry: positive values denote conservative guidance (under-promising / over-delivering), while negative values indicate aggressive over-forecasting.
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

    const adherence = (Number(kpis.metPct || 0) + Number(kpis.exceededPct || 0)).toFixed(1);

    kpiGrid.innerHTML = `
      <div class="brutal-card">
        <div class="stat-label">Evaluated / Total</div>
        <div class="stat-value">${kpis.evaluatedCount} <span style="font-size: 1.2rem; color: #666; margin-left: 8px;">/ ${kpis.totalTracked}</span></div>
        <div style="font-size: 0.8rem; font-weight: 600; margin-top: 8px; color: #666;">${kpis.pendingCount} pending releases</div>
      </div>

      <div class="brutal-card">
        <div class="stat-label">Mean Abs. Dev.</div>
        <div class="stat-value">${kpis.meanAbsDev}%</div>
        <div style="font-size: 0.8rem; font-weight: 600; margin-top: 8px; color: #666;">Avg error from midpoint</div>
      </div>

      <div class="brutal-card">
        <div class="stat-label">Net Forecast Bias</div>
        <div class="stat-value" style="font-size: 2.5rem;">
          ${kpis.netBias >= 0 ? "+" : ""}${kpis.netBias}%
          <span class="stat-trend ${kpis.netBias >= 0 ? "bg-yellow" : ""}" style="font-size: 0.75rem; ${kpis.netBias < 0 ? "background: var(--main-pink);" : ""}">
            ${kpis.netBias >= 0 ? "CONSERVATIVE" : "AGGRESSIVE"}
          </span>
        </div>
        <div style="font-size: 0.8rem; font-weight: 600; margin-top: 8px; color: #666;">Directional skew</div>
      </div>

      <div class="brutal-card bg-yellow">
        <div class="stat-label">Adherence Rate</div>
        <div class="stat-value">${adherence}%</div>
        <div style="font-size: 0.8rem; font-weight: 700; margin-top: 8px;">Met or exceeded corridors</div>
      </div>
    `;

    renderAccuracyOverTimeChart("chart-accuracy-time", filtered);
    renderGuidanceVsActualChart("chart-analytics-guidance", filtered, selectedMetric);
    renderHistoricalOutcomesChart("chart-analytics-historical", filtered);
    document.getElementById("chart-b-subtitle").textContent = `${selectedMetric} · Midpoint vs Reported Actuals`;

    const metrics = ["Revenue", "Gross Margin", "Diluted EPS", "Operating Expenses"];
    const tbody = document.getElementById("metric-breakdown-tbody");

    tbody.innerHTML = metrics.map(m => {
      const metricPromises = filtered.filter(p => p.metric === m);
      const mKpis = calculateKPIs(metricPromises);
      const direction = m === "Operating Expenses" ? "Lower is better" : "Higher is better";

      return `
        <tr>
          <td style="font-weight: 700; font-size: 0.95rem;">${m}</td>
          <td style="font-weight: 600; color: #666;">${direction}</td>
          <td style="font-weight: 700;">${mKpis.totalTracked}</td>
          <td style="font-weight: 700;">${mKpis.evaluatedCount}</td>
          <td style="font-weight: 700;">${mKpis.exceededPct}%</td>
          <td style="font-weight: 700;">${mKpis.meanAbsDev}%</td>
          <td style="font-weight: 700;">
            <span class="stat-trend ${mKpis.netBias >= 0 ? "bg-yellow" : ""}" style="${mKpis.netBias < 0 ? "background: var(--main-pink);" : ""} margin: 0;">
              ${mKpis.netBias >= 0 ? "+" : ""}${mKpis.netBias}%
            </span>
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
    showToast("Accuracy chart PNG exported");
  });

  document.getElementById("btn-dl-guidance-chart").addEventListener("click", () => {
    downloadChartAsPNG("chart-analytics-guidance", "OutlookIQ-Guidance-vs-Actual.png");
    showToast("Guidance chart PNG exported");
  });

  document.getElementById("btn-dl-outcomes-chart").addEventListener("click", () => {
    downloadChartAsPNG("chart-analytics-historical", "OutlookIQ-Outcomes-Historical.png");
    showToast("Outcomes chart PNG exported");
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
    showToast(`Exported ${rows.length} analytics records.`);
  });

  updateAnalytics();
}
