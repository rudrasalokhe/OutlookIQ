/**
 * OutlookIQ Chart.js Visualizations — Neo-Brutalist Design System
 * Bold black borders (2px/3px), sharp edges (borderRadius: 0),
 * Space Grotesk typography, and high-contrast yellow (#fde047), teal (#5eead4), and black (#171717).
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
    textColor: "#171717",
    gridColor: "rgba(23, 23, 23, 0.12)",
    tooltipBg: "#171717",
    tooltipTitle: "#fde047",
    tooltipBody: "#ffffff",
    tooltipBorder: "#171717"
  };
}

/**
 * 1. Guidance vs Actual Performance (Grouped Bar Chart - Neo-Brutalist)
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
          backgroundColor: "#fde047", // Neo-Brutalist Yellow
          borderColor: "#171717",
          borderWidth: 2,
          borderRadius: 0,
          barPercentage: 0.7,
          categoryPercentage: 0.6
        },
        {
          label: "Reported",
          data: actualData,
          backgroundColor: "#171717", // Pitch Black
          borderColor: "#171717",
          borderWidth: 2,
          borderRadius: 0,
          barPercentage: 0.7,
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
            color: "#171717",
            usePointStyle: false,
            boxWidth: 12,
            font: { family: "'Space Grotesk', sans-serif", size: 11, weight: "700" }
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 2,
          cornerRadius: 0,
          titleFont: { family: "'Space Grotesk', sans-serif", weight: "700" },
          bodyFont: { family: "'Space Grotesk', sans-serif", weight: "600" },
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${units === "$M" ? "$" + ctx.parsed.y + "M" : ctx.parsed.y + " " + units}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "'Space Grotesk', sans-serif", size: 10, weight: "700" } }
        },
        y: {
          grid: { color: theme.gridColor, lineWidth: 1 },
          ticks: {
            color: theme.textColor,
            font: { family: "'Space Grotesk', sans-serif", size: 10, weight: "700" },
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
 * 2. Guidance Outcome Distribution (Doughnut Chart - Neo-Brutalist)
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
            "#fde047", // Yellow
            "#5eead4", // Teal
            "#f9a8d4", // Pink
            "#e5e5e5"  // Gray
          ],
          borderColor: "#171717",
          borderWidth: 3,
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#171717",
            usePointStyle: false,
            boxWidth: 12,
            padding: 14,
            font: { family: "'Space Grotesk', sans-serif", size: 11, weight: "700" }
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 2,
          padding: 10,
          cornerRadius: 0,
          titleFont: { family: "'Space Grotesk', sans-serif", weight: "700" },
          bodyFont: { family: "'Space Grotesk', sans-serif", weight: "600" },
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
 * 3. Forecast Accuracy Over Time (% Deviation - Neo-Brutalist)
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
    item.outcome === "Exceeded" ? "#fde047" : item.outcome === "Met" ? "#5eead4" : "#f9a8d4"
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
          borderColor: "#171717",
          backgroundColor: "rgba(253, 224, 71, 0.3)",
          borderWidth: 3,
          pointBackgroundColor: pointColors,
          pointBorderColor: "#171717",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          fill: true,
          stepped: false
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
          borderWidth: 2,
          cornerRadius: 0,
          titleFont: { family: "'Space Grotesk', sans-serif", weight: "700" },
          bodyFont: { family: "'Space Grotesk', sans-serif", weight: "600" },
          callbacks: {
            label: (ctx) => ` Deviation: ${ctx.parsed.y >= 0 ? "+" : ""}${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "'Space Grotesk', sans-serif", size: 10, weight: "700" }, maxRotation: 45 }
        },
        y: {
          grid: {
            color: (ctx) => (ctx.tick.value === 0 ? "#171717" : theme.gridColor),
            lineWidth: (ctx) => (ctx.tick.value === 0 ? 2 : 1)
          },
          ticks: {
            color: theme.textColor,
            font: { family: "'Space Grotesk', sans-serif", size: 10, weight: "700" },
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
  const data = quartersData?.values || [2.4, 4.1, 2.9, 4.5, 2.7, 2.82];

  const theme = getChartTheme();

  const chart = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "MAD (%)",
          data,
          borderColor: "#171717",
          backgroundColor: "rgba(253, 224, 71, 0.4)",
          borderWidth: 3,
          pointBackgroundColor: "#fde047",
          pointBorderColor: "#171717",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true
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
          borderColor: theme.tooltipBorder,
          borderWidth: 2,
          cornerRadius: 0,
          titleFont: { family: "'Space Grotesk', sans-serif", weight: "700" },
          bodyFont: { family: "'Space Grotesk', sans-serif", weight: "600" },
          callbacks: {
            label: (ctx) => ` MAD: ${ctx.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "'Space Grotesk', sans-serif", size: 10, weight: "700" } }
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
 * 5. Historical Outcomes by Fiscal Year (Stacked Bar Chart - Neo-Brutalist)
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
          backgroundColor: "#fde047", // Yellow
          borderColor: "#171717",
          borderWidth: 2,
          borderRadius: 0
        },
        {
          label: "Met",
          data: metByYear,
          backgroundColor: "#5eead4", // Teal
          borderColor: "#171717",
          borderWidth: 2,
          borderRadius: 0
        },
        {
          label: "Missed",
          data: missedByYear,
          backgroundColor: "#f9a8d4", // Pink
          borderColor: "#171717",
          borderWidth: 2,
          borderRadius: 0
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
          ticks: { color: theme.textColor, font: { family: "'Space Grotesk', sans-serif", size: 11, weight: "700" } }
        },
        y: {
          stacked: true,
          grid: { color: theme.gridColor },
          ticks: { color: theme.textColor, font: { family: "'Space Grotesk', sans-serif", size: 10, weight: "700" }, stepSize: 1 }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#171717", usePointStyle: false, boxWidth: 12, font: { family: "'Space Grotesk', sans-serif", size: 11, weight: "700" } }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 2,
          cornerRadius: 0,
          titleFont: { family: "'Space Grotesk', sans-serif", weight: "700" },
          bodyFont: { family: "'Space Grotesk', sans-serif", weight: "600" }
        }
      }
    }
  });

  activeCharts.set(canvasId, chart);
  return chart;
}

/**
 * 6. Side-by-side Company Comparison Bar Chart (Neo-Brutalist)
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
          backgroundColor: "#fde047", // Yellow
          borderColor: "#171717",
          borderWidth: 2,
          borderRadius: 0
        },
        {
          label: `${compB.ticker} (${compB.name})`,
          data: dataB,
          backgroundColor: "#5eead4", // Teal
          borderColor: "#171717",
          borderWidth: 2,
          borderRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: theme.textColor, font: { family: "'Space Grotesk', sans-serif", size: 11, weight: "700" } }
        },
        y: {
          grid: { color: theme.gridColor },
          ticks: {
            color: theme.textColor,
            font: { family: "'Space Grotesk', sans-serif", size: 10, weight: "700" },
            callback: (v) => unit === "$M" ? `$${v}M` : `${v}${unit}`
          }
        }
      },
      plugins: {
        legend: {
          position: "top",
          labels: { color: "#171717", usePointStyle: false, boxWidth: 12, font: { family: "'Space Grotesk', sans-serif", size: 11, weight: "700" } }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.tooltipTitle,
          bodyColor: theme.tooltipBody,
          borderColor: theme.tooltipBorder,
          borderWidth: 2,
          cornerRadius: 0,
          titleFont: { family: "'Space Grotesk', sans-serif", weight: "700" },
          bodyFont: { family: "'Space Grotesk', sans-serif", weight: "600" },
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
