/**
 * PAGE 5 — Company Comparison (Neo-Brutalist Design)
 * Head-to-head quantitative benchmark styled with bold black borders (3px), hard drop-shadows (6px), Space Grotesk.
 */

import { api } from "../api.js";
import { calculateKPIs, evaluatePromise, formatValue, exportToCSV } from "../calculations.js";
import { renderCompanyComparisonChart } from "../charts.js";
import { showToast } from "../components.js";

export async function renderComparison(container, queryParams = {}) {
  const companies = await api.getCompanies();
  const allPromises = await api.getPromises();

  const defaultCompA = queryParams.compA || "NVDA";
  const defaultCompB = queryParams.compB || "MSFT";

  container.innerHTML = `
    <!-- Header -->
    <header class="header">
      <div class="header-title">
        <h1>Relative Evaluation</h1>
        <div class="badge">Head-to-Head Benchmark</div>
        <span style="margin-left: 12px; font-weight: 700; font-size: 0.9rem;">Cross-Issuer Guidance Accuracy & Execution Discipline</span>
      </div>
      <div class="header-actions">
        <button id="btn-export-comparison-csv" class="brutal-btn">
          <i class="fas fa-download"></i> Export Comparison CSV
        </button>
      </div>
    </header>

    <!-- Controls -->
    <div class="brutal-card" style="padding: 16px; margin-bottom: 24px; flex-direction: row; flex-wrap: wrap; gap: 16px; align-items: center;">
      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Firm A:</span>
        <select id="compare-comp-a" class="brutal-select">
          ${companies.map(c => `<option value="${c.ticker}" ${c.ticker === defaultCompA ? "selected" : ""}>${c.ticker} - ${c.name}</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Firm B:</span>
        <select id="compare-comp-b" class="brutal-select">
          ${companies.map(c => `<option value="${c.ticker}" ${c.ticker === defaultCompB ? "selected" : ""}>${c.ticker} - ${c.name}</option>`).join("")}
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Metric:</span>
        <select id="compare-metric-select" class="brutal-select">
          <option value="Revenue">Revenue</option>
          <option value="Gross Margin">Gross Margin</option>
          <option value="Diluted EPS">Diluted EPS</option>
        </select>
      </div>

      <div class="flex items-center gap-2">
        <span class="stat-label" style="border: none; margin: 0; padding: 0;">Window:</span>
        <select id="compare-window-select" class="brutal-select">
          <option value="ALL">All Available Quarters</option>
          <option value="2025">FY 2025 Quarters</option>
          <option value="2024">FY 2024 Quarters</option>
        </select>
      </div>

      <button id="btn-run-compare" class="brutal-btn" style="background: var(--main-yellow);">
        Run Comparison
      </button>
    </div>

    <!-- Side-by-Side Summary Cards -->
    <div class="grid-3" style="grid-template-columns: 1fr 1fr; margin-bottom: 24px;" id="comp-cards-container">
      <!-- Injected dynamically -->
    </div>

    <!-- Comparison Bar Chart Section -->
    <div class="brutal-card" style="margin-bottom: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
        <div>
          <h3 id="comp-chart-title" style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase;">Quarterly Performance Comparison</h3>
          <p style="font-weight: 600; font-size: 0.85rem; color: #666; margin-top: 4px;">Reported results against common-period guidance midpoint</p>
        </div>
        <span class="badge" style="background: var(--main-teal);" id="comp-metric-badge">Revenue</span>
      </div>
      <div style="height: 300px; position: relative;" id="comp-chart-wrapper">
        <canvas id="chart-company-comparison"></canvas>
      </div>
    </div>

    <!-- Common Period Reconciliation Table -->
    <div style="margin-bottom: 24px; overflow-x: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h3 style="font-size: 1.1rem; font-weight: 700; text-transform: uppercase;">Common-Period Financial Reconciliation</h3>
        <span class="badge" style="background: var(--main-pink);">Calendar Normalized</span>
      </div>

      <table class="brutal-table">
        <thead>
          <tr>
            <th>Target Quarter</th>
            <th>Metric</th>
            <th id="th-comp-a-guidance">Firm A Guidance</th>
            <th id="th-comp-a-actual">Firm A Actual</th>
            <th id="th-comp-b-guidance">Firm B Guidance</th>
            <th id="th-comp-b-actual">Firm B Actual</th>
            <th>Spread Variance</th>
          </tr>
        </thead>
        <tbody id="comp-table-tbody">
          <!-- Injected dynamically -->
        </tbody>
      </table>
    </div>
  `;

  function executeComparison() {
    const tickerA = document.getElementById("compare-comp-a").value;
    const tickerB = document.getElementById("compare-comp-b").value;
    const metric = document.getElementById("compare-metric-select").value;
    const windowVal = document.getElementById("compare-window-select").value;

    const compA = companies.find(c => c.ticker === tickerA);
    const compB = companies.find(c => c.ticker === tickerB);

    if (tickerA === tickerB) {
      showToast("Select two distinct companies for head-to-head comparison.");
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

    const cardsContainer = document.getElementById("comp-cards-container");
    cardsContainer.innerHTML = `
      <div class="brutal-card">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
          <div class="brutal-border bg-yellow" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
            ${compA.monogram || compA.ticker.slice(0, 2)}
          </div>
          <div>
            <span class="badge" style="font-size: 0.7rem; padding: 2px 6px;">${compA.ticker}</span>
            <h3 style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase;">${compA.name}</h3>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Evaluated Forecasts</span>
            <strong style="font-size: 0.95rem;">${kpisA.evaluatedCount} / ${kpisA.totalTracked}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Exceeded (Beat)</span>
            <strong style="color: #000; background: var(--main-yellow); padding: 2px 6px; border: 1px solid #000;">${kpisA.exceededCount} (${kpisA.exceededPct}%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Met Within Corridor</span>
            <strong style="background: var(--main-teal); padding: 2px 6px; border: 1px solid #000;">${kpisA.metCount} (${kpisA.metPct}%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Missed Guidance</span>
            <strong style="background: var(--main-pink); padding: 2px 6px; border: 1px solid #000;">${kpisA.missedCount} (${kpisA.missedPct}%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Mean Absolute Dev.</span>
            <strong style="font-size: 0.95rem;">${kpisA.meanAbsDev}%</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 4px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Net Forecast Bias</span>
            <strong style="font-size: 0.95rem;">${kpisA.netBias >= 0 ? "+" : ""}${kpisA.netBias}% (${kpisA.netBias >= 0 ? "Conservative" : "Aggressive"})</strong>
          </div>
        </div>
      </div>

      <div class="brutal-card">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; border-bottom: 2px solid var(--border-color); padding-bottom: 12px;">
          <div class="brutal-border bg-teal" style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
            ${compB.monogram || compB.ticker.slice(0, 2)}
          </div>
          <div>
            <span class="badge" style="font-size: 0.7rem; padding: 2px 6px;">${compB.ticker}</span>
            <h3 style="font-size: 1.25rem; font-weight: 700; text-transform: uppercase;">${compB.name}</h3>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Evaluated Forecasts</span>
            <strong style="font-size: 0.95rem;">${kpisB.evaluatedCount} / ${kpisB.totalTracked}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Exceeded (Beat)</span>
            <strong style="color: #000; background: var(--main-yellow); padding: 2px 6px; border: 1px solid #000;">${kpisB.exceededCount} (${kpisB.exceededPct}%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Met Within Corridor</span>
            <strong style="background: var(--main-teal); padding: 2px 6px; border: 1px solid #000;">${kpisB.metCount} (${kpisB.metPct}%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Missed Guidance</span>
            <strong style="background: var(--main-pink); padding: 2px 6px; border: 1px solid #000;">${kpisB.missedCount} (${kpisB.missedPct}%)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Mean Absolute Dev.</span>
            <strong style="font-size: 0.95rem;">${kpisB.meanAbsDev}%</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 4px;">
            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; color: #666;">Net Forecast Bias</span>
            <strong style="font-size: 0.95rem;">${kpisB.netBias >= 0 ? "+" : ""}${kpisB.netBias}% (${kpisB.netBias >= 0 ? "Conservative" : "Aggressive"})</strong>
          </div>
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
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-weight: 700; text-transform: uppercase; color: #666;">
          No overlapping evaluated quarters found for ${metric} in the selected window.
        </div>
      `;
    }

    document.getElementById("th-comp-a-guidance").textContent = `${compA.ticker} Guidance`;
    document.getElementById("th-comp-a-actual").textContent = `${compA.ticker} Actual`;
    document.getElementById("th-comp-b-guidance").textContent = `${compB.ticker} Guidance`;
    document.getElementById("th-comp-b-actual").textContent = `${compB.ticker} Actual`;

    const tableQuarters = ["Q3 FY25", "Q2 FY25", "Q1 FY25", "Q4 FY24", "Q3 FY24", "Q2 FY24", "Q1 FY24"];
    const tbody = document.getElementById("comp-table-tbody");

    const matchedRows = [];
    tableQuarters.forEach(q => {
      const pA = promisesA.find(p => p.targetQuarter === q && p.metric === metric);
      const pB = promisesB.find(p => p.targetQuarter === q && p.metric === metric);
      if (pA || pB) matchedRows.push({ quarter: q, pA, pB });
    });

    if (matchedRows.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; font-weight: 700; text-transform: uppercase;">No matched guidance records found across the selected quarters.</td></tr>`;
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
        <tr>
          <td style="font-weight: 700; text-transform: uppercase;">${row.quarter}</td>
          <td style="font-weight: 600;">${metric}</td>
          <td style="font-weight: 600;">${gStrA}</td>
          <td style="font-weight: 700;">${actStrA}</td>
          <td style="font-weight: 600;">${gStrB}</td>
          <td style="font-weight: 700;">${actStrB}</td>
          <td style="font-weight: 700; text-transform: uppercase;">${diffNote}</td>
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
    showToast(`Comparison summary exported.`);
  });

  executeComparison();
}
