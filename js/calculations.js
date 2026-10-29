/**
 * OutlookIQ Financial Calculation Engine
 * Deterministic math for guidance evaluation, deviations, bounds, and summary stats.
 */

/**
 * Evaluates whether a financial forecast was Exceeded, Met, Missed, Pending, or Unverifiable.
 * Respects metric directionality (higher-is-better vs lower-is-better).
 */
export function evaluatePromise(promise) {
  if (promise.status === "pending" || promise.actual === null || promise.actual === undefined) {
    return {
      outcome: "Pending",
      statusClass: "pending",
      diffAbs: null,
      diffPct: null,
      midpoint: promise.guidanceMidpoint || (promise.guidanceLower + promise.guidanceUpper) / 2,
      explanation: "Awaiting official earnings release and financial filing."
    };
  }

  if (promise.status === "unverifiable") {
    return {
      outcome: "Unverifiable",
      statusClass: "unverifiable",
      diffAbs: null,
      diffPct: null,
      midpoint: promise.guidanceMidpoint || (promise.guidanceLower + promise.guidanceUpper) / 2,
      explanation: "Actual results not disclosed or reporting standard altered."
    };
  }

  const midpoint = promise.guidanceMidpoint !== undefined ? promise.guidanceMidpoint : (promise.guidanceLower + promise.guidanceUpper) / 2;
  const actual = Number(promise.actual);
  const lower = Number(promise.guidanceLower);
  const upper = Number(promise.guidanceUpper);
  const direction = promise.direction || "higher";

  const diffAbs = actual - midpoint;
  const diffPct = midpoint !== 0 ? (diffAbs / Math.abs(midpoint)) * 100 : 0;

  let outcome = "Met";
  let explanation = "";

  if (direction === "higher") {
    // Higher is better (e.g. Revenue, GM, EPS)
    if (actual > upper) {
      outcome = "Exceeded";
      explanation = `Reported ${formatValue(actual, promise.unit)} exceeded upper guidance boundary of ${formatValue(upper, promise.unit)} by ${formatPct(diffPct)}.`;
    } else if (actual < lower) {
      outcome = "Missed";
      explanation = `Reported ${formatValue(actual, promise.unit)} fell short of lower guidance boundary of ${formatValue(lower, promise.unit)} by ${formatPct(Math.abs(diffPct))}.`;
    } else {
      outcome = "Met";
      explanation = `Reported ${formatValue(actual, promise.unit)} landed cleanly within guidance band (${formatValue(lower, promise.unit)} - ${formatValue(upper, promise.unit)}).`;
    }
  } else {
    // Lower is better (e.g. Operating Expenses, Capex)
    if (actual < lower) {
      outcome = "Exceeded"; // disciplined expense control
      explanation = `Actual expense ${formatValue(actual, promise.unit)} beat guidance lower bound of ${formatValue(lower, promise.unit)} by ${formatPct(Math.abs(diffPct))} (cost discipline).`;
    } else if (actual > upper) {
      outcome = "Missed"; // overspent
      explanation = `Actual expense ${formatValue(actual, promise.unit)} exceeded upper cost ceiling of ${formatValue(upper, promise.unit)} by ${formatPct(diffPct)} (budget overrun).`;
    } else {
      outcome = "Met";
      explanation = `Actual expense ${formatValue(actual, promise.unit)} landed within modeled corridor (${formatValue(lower, promise.unit)} - ${formatValue(upper, promise.unit)}).`;
    }
  }

  const statusClass = outcome.toLowerCase();

  return {
    outcome,
    statusClass,
    diffAbs,
    diffPct,
    midpoint,
    explanation
  };
}

/**
 * Calculates aggregate KPIs across a set of promises.
 */
export function calculateKPIs(promises) {
  const evaluated = [];
  let exceededCount = 0;
  let metCount = 0;
  let missedCount = 0;
  let pendingCount = 0;
  let unverifiableCount = 0;
  let totalDevSum = 0;
  let absDevSum = 0;

  for (const p of promises) {
    const evalResult = evaluatePromise(p);
    if (evalResult.outcome === "Pending") {
      pendingCount++;
    } else if (evalResult.outcome === "Unverifiable") {
      unverifiableCount++;
    } else {
      evaluated.push({ ...p, ...evalResult });
      if (evalResult.outcome === "Exceeded") exceededCount++;
      if (evalResult.outcome === "Met") metCount++;
      if (evalResult.outcome === "Missed") missedCount++;
      totalDevSum += evalResult.diffPct;
      absDevSum += Math.abs(evalResult.diffPct);
    }
  }

  const total = promises.length;
  const evalTotal = evaluated.length;
  const exceededPct = evalTotal > 0 ? ((exceededCount / evalTotal) * 100).toFixed(1) : "0.0";
  const metPct = evalTotal > 0 ? ((metCount / evalTotal) * 100).toFixed(1) : "0.0";
  const missedPct = evalTotal > 0 ? ((missedCount / evalTotal) * 100).toFixed(1) : "0.0";
  const meanAbsDev = evalTotal > 0 ? (absDevSum / evalTotal).toFixed(2) : "0.00";
  const netBias = evalTotal > 0 ? (totalDevSum / evalTotal).toFixed(2) : "0.00";

  const meanAbsDevNum = Number(meanAbsDev);
  const netBiasNum = Number(netBias);

  return {
    totalTracked: total,
    total: total,
    evaluatedCount: evalTotal,
    exceededCount,
    metBeat: exceededCount,
    exceededPct: Number(exceededPct),
    metCount,
    met: metCount,
    metPct: Number(metPct),
    missedCount,
    missed: missedCount,
    missedPct: Number(missedPct),
    pendingCount,
    unverifiableCount,
    meanAbsDev: meanAbsDevNum,
    meanAbsoluteDeviation: meanAbsDevNum,
    netBias: netBiasNum,
    averageDeviation: netBiasNum
  };
}

/**
 * Value formatter for financial metrics
 */
export function formatValue(val, unit = "") {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  
  if (unit === "$M") {
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}M`;
  }
  if (unit === "%") {
    return `${num.toFixed(1)}%`;
  }
  if (unit === "$") {
    return `$${num.toFixed(2)}`;
  }
  return `${num.toLocaleString()} ${unit}`.trim();
}

/**
 * Format percentage deviation with explicit + or - sign
 */
export function formatPct(val) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

/**
 * Generates an accessible, color-coded HTML status badge
 */
export function renderOutcomeBadge(outcome) {
  const norm = (outcome || "").toLowerCase();
  let badgeClass = "badge-neutral";
  let icon = "•";

  if (norm === "exceeded") {
    badgeClass = "badge-success";
    icon = "▲";
  } else if (norm === "met") {
    badgeClass = "badge-info";
    icon = "✓";
  } else if (norm === "missed") {
    badgeClass = "badge-danger";
    icon = "▼";
  } else if (norm === "pending") {
    badgeClass = "badge-warning";
    icon = "⏱";
  } else if (norm === "unverifiable") {
    badgeClass = "badge-neutral";
    icon = "—";
  }

  return `<span class="badge ${badgeClass}" title="${outcome} guidance"><span class="badge-icon">${icon}</span> ${outcome}</span>`;
}

/**
 * Export structured records to CSV and trigger browser download
 */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(","),
    ...rows.map(row =>
      keys
        .map(key => {
          let val = row[key];
          if (val === null || val === undefined) val = "";
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    )
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
