/**
 * OutlookIQ Chart.js Visualizations — CRM Design Theme
 * Warm cream aesthetic featuring Brand Yellow (#fbc531), Dark Accent (#232323), and soft neutrals.
 */

import { evaluatePromise } from "./calculations.js";

const activeCharts = new Map();

export function destroyChart(canvasId) {
  if (activeCharts.has(canvasId)) {
    activeCharts.get(canvasId).destroy();
    activeCharts.delete(canvasId);
  }
}

export function destroyAllCharts() {
  activeCharts.forEach((chart) => chart.destroy());
  activeCharts.clear();
}

function getChartTheme() {
  return {
    textColor: "#9a9a9a",
    gridColor: "rgba(0, 0, 0, 0.04)",
    tooltipBg: "#232323",
    tooltipTitle: "#ffffff",
    tooltipBody: "#e5e7eb",
    tooltipBorder: "#333333"
  };
}

/**
 * 1. Guidance vs Actual Performance (Grouped Bar Chart - CRM Style)
 */
export function renderGuidanceVsActualChart(canvasId, promises, metric = "Revenue") {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const filtered = promises
    .filter(p => p.metric === metric && p.status === "evaluated" && p.actual !== null)
    .sort((a, b) => (a.targetQuarter > b.targetQuarter ? 1 : -1));

  const labels = filtered.map(p => `${p.ticker} ${p.targetQuarter}`);
  const guidanceData = filtered.map(p => p.guidanceMidpoint || (p.guidanceLower + p.guidanceUpper) / 2);
  const actualData = filtered.map(p => p.actual);
  const units = filtered.length > 0 ? filtered[0].unit : "";

  const theme = getChartTheme();

  const chart = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Midpoint",
          data: guidanceData,
          backgroundColor: "#fbc531", // Brand Yellow
          borderColor: "#fbc531",
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.65,
          categoryPercentage: 0.6
        },
        {
          label: "Reported",
          data: actualData,
          backgroundColor: "#232323", // Dark Accent
          borderColor: "#232323",
          borderWidth: 1,
          borderRadius: 8,
          barPercentage: 0.65,
          categoryPercentage: 0.6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            color: "#1e1e1e",
            usePointStyle: true,
            boxWidth: 8,
            font: { family: "Inter", size: 11, weight: "600" }
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 12,
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y;
              return ` ${ctx.dataset.label}: ${units === "$M" ? "$" + val.toLocaleString() + "M" : val + " " + units}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 10 } }
        },
        y: {
          grid: { color: theme.gridColor },
          ticks: {
            color: theme.textColor,
            font: { family: "Inter", size: 10 },
            callback: (val) => units === "$M" ? `$${val}M` : `${val}${units}`
          }
        }
      }
    }
  });

  activeCharts.set(canvasId, chart);
  return chart;
}

/**
 * 2. Guidance Outcome Distribution (Doughnut Chart - CRM Style)
 */
export function renderOutcomeDistributionChart(canvasId, promises) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  let exceeded = 0;
  let met = 0;
  let missed = 0;
  let pending = 0;

  for (const p of promises) {
    const ev = evaluatePromise(p);
    if (ev.outcome === "Exceeded") exceeded++;
    else if (ev.outcome === "Met") met++;
    else if (ev.outcome === "Missed") missed++;
    else if (ev.outcome === "Pending") pending++;
  }

  const theme = getChartTheme();

  const chart = new window.Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Exceeded", "Met", "Missed", "Pending"],
      datasets: [
        {
          data: [exceeded, met, missed, pending],
          backgroundColor: [
            "#fbc531", // Brand Yellow
            "#232323", // Dark Accent
            "#9a9a9a", // Muted Gray
            "#ede9dd"  // Border cream
          ],
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#1e1e1e",
            usePointStyle: true,
            boxWidth: 8,
            padding: 12,
            font: { family: "Inter", size: 11, weight: "500" }
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 12,
          callbacks: {
            label: (ctx) => {
              const total = exceeded + met + missed + pending;
              const count = ctx.parsed;
              const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label}: ${count} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  activeCharts.set(canvasId, chart);
  return chart;
}

/**
 * 3. Forecast Accuracy Over Time (% Deviation Smooth Line Chart)
 */
export function renderAccuracyOverTimeChart(canvasId, promises) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const evaluated = promises
    .filter(p => p.status === "evaluated" && p.actual !== null)
    .map(p => {
      const ev = evaluatePromise(p);
      return {
        label: `${p.ticker} ${p.targetQuarter}`,
        quarter: p.targetQuarter,
        diffPct: ev.diffPct,
        outcome: ev.outcome
      };
    })
    .sort((a, b) => (a.quarter > b.quarter ? 1 : -1));

  const labels = evaluated.map(item => item.label);
  const data = evaluated.map(item => item.diffPct);
  const pointColors = evaluated.map(item =>
    item.outcome === "Exceeded" ? "#fbc531" : item.outcome === "Met" ? "#232323" : "#ef4444"
  );

  const theme = getChartTheme();

  const chart = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "% Deviation",
          data,
          borderColor: "#fbc531",
          backgroundColor: "rgba(251, 197, 49, 0.12)",
          borderWidth: 2.5,
          pointBackgroundColor: pointColors,
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => ` Deviation: ${ctx.parsed.y >= 0 ? "+" : ""}${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 10 }, maxRotation: 45 }
        },
        y: {
          grid: {
            color: (ctx) => (ctx.tick.value === 0 ? "rgba(0,0,0,0.15)" : theme.gridColor),
            lineWidth: (ctx) => (ctx.tick.value === 0 ? 1.5 : 1)
          },
          ticks: {
            color: theme.textColor,
            callback: (val) => `${val >= 0 ? "+" : ""}${val}%`
          }
        }
      }
    }
  });

  activeCharts.set(canvasId, chart);
  return chart;
}

/**
 * 4. Mean Absolute Deviation Line Chart (Dashboard Hero Mini Chart)
 */
export function renderDeviationLineChart(canvasId, quartersData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const labels = quartersData?.labels || ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2"];
  const data = quartersData?.values || [2.4, 4.1, 3.2, 5.0, 2.8, 3.1];

  const theme = getChartTheme();

  const chart = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Mean Absolute Deviation (%)",
          data,
          borderColor: "#fbc531",
          backgroundColor: "rgba(251, 197, 49, 0.12)",
          borderWidth: 2,
          pointBackgroundColor: "#fbc531",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` MAD: ${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 10 } }
        },
        y: {
          display: false,
          min: 0
        }
      }
    }
  });

  activeCharts.set(canvasId, chart);
  return chart;
}

/**
 * 5. Historical Outcomes by Fiscal Year (Stacked Bar Chart)
 */
export function renderHistoricalOutcomesChart(canvasId, promises) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const years = Array.from(new Set(promises.map(p => p.fiscalYear))).sort();
  const exceededByYear = [];
  const metByYear = [];
  const missedByYear = [];

  years.forEach(yr => {
    const yrPromises = promises.filter(p => p.fiscalYear === yr && p.status === "evaluated");
    let exc = 0;
    let m = 0;
    let mis = 0;
    yrPromises.forEach(p => {
      const ev = evaluatePromise(p);
      if (ev.outcome === "Exceeded") exc++;
      else if (ev.outcome === "Met") m++;
      else if (ev.outcome === "Missed") mis++;
    });
    exceededByYear.push(exc);
    metByYear.push(m);
    missedByYear.push(mis);
  });

  const theme = getChartTheme();

  const chart = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: years.map(y => `FY ${y}`),
      datasets: [
        {
          label: "Exceeded",
          data: exceededByYear,
          backgroundColor: "#fbc531", // Brand Yellow
          borderRadius: 6
        },
        {
          label: "Met",
          data: metByYear,
          backgroundColor: "#232323", // Dark Accent
          borderRadius: 6
        },
        {
          label: "Missed",
          data: missedByYear,
          backgroundColor: "#9a9a9a", // Muted Gray
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 11 } }
        },
        y: {
          stacked: true,
          grid: { color: theme.gridColor },
          ticks: { color: theme.textColor, stepSize: 1 }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#1e1e1e", usePointStyle: true, boxWidth: 8, font: { size: 11, weight: "500" } }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10
        }
      }
    }
  });

  activeCharts.set(canvasId, chart);
  return chart;
}

/**
 * 6. Side-by-side Company Comparison Bar Chart
 */
export function renderCompanyComparisonChart(canvasId, compA, compB, promisesA, promisesB, metric = "Revenue") {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const validA = promisesA.filter(p => p.metric === metric && p.status === "evaluated" && p.actual !== null);
  const validB = promisesB.filter(p => p.metric === metric && p.status === "evaluated" && p.actual !== null);

  const quartersA = new Set(validA.map(p => p.targetQuarter));
  const commonQuarters = validB
    .map(p => p.targetQuarter)
    .filter(q => quartersA.has(q))
    .sort();

  if (commonQuarters.length === 0) {
    return null;
  }

  const dataA = commonQuarters.map(q => {
    const item = validA.find(p => p.targetQuarter === q);
    return item ? item.actual : 0;
  });

  const dataB = commonQuarters.map(q => {
    const item = validB.find(p => p.targetQuarter === q);
    return item ? item.actual : 0;
  });

  const unit = validA[0]?.unit || "";
  const theme = getChartTheme();

  const chart = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels: commonQuarters,
      datasets: [
        {
          label: `${compA.ticker} (${compA.name})`,
          data: dataA,
          backgroundColor: "#fbc531", // Brand Yellow
          borderRadius: 6
        },
        {
          label: `${compB.ticker} (${compB.name})`,
          data: dataB,
          backgroundColor: "#232323", // Dark Accent
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "Inter", size: 11 } }
        },
        y: {
          grid: { color: theme.gridColor },
          ticks: {
            color: theme.textColor,
            callback: (v) => unit === "$M" ? `$${v}M` : `${v}${unit}`
          }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#1e1e1e", usePointStyle: true, boxWidth: 8, font: { size: 11, weight: "500" } }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${unit === "$M" ? "$" + ctx.parsed.y + "M" : ctx.parsed.y + " " + unit}`
          }
        }
      }
    }
  });

  activeCharts.set(canvasId, chart);
  return chart;
}

/**
 * Utility: Download a chart canvas as a high-resolution PNG
 */
export function downloadChartAsPNG(canvasId, filename = "outlookiq-chart.png") {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
