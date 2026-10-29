"""
Deterministic financial calculation and guidance evaluation engine.
Implements verifiable math, favorable direction handling (higher vs lower is better),
percentage deviation, and auditable English explanations.
"""

from typing import Dict, Any, Optional

LOWER_IS_BETTER_METRICS = {
    "operating expenses",
    "opex",
    "capital expenditures",
    "capex",
    "cost of goods sold",
    "cogs",
    "operating costs"
}

PERCENTAGE_METRICS = {
    "gross margin",
    "operating margin",
    "net margin",
    "tax rate",
    "effective tax rate"
}

def is_lower_better(metric: str) -> bool:
    """Determine whether a lower reported number represents a favorable outcome."""
    return metric.strip().lower() in LOWER_IS_BETTER_METRICS

def is_percentage_metric(metric: str) -> bool:
    """Determine whether the metric is naturally a percentage."""
    return metric.strip().lower() in PERCENTAGE_METRICS

def evaluate_guidance_performance(
    metric: str,
    guidance_lower: float,
    guidance_upper: float,
    actual: Optional[float],
    unit: str = "$M"
) -> Dict[str, Any]:
    """
    Evaluate actual performance against a guidance corridor.
    Returns:
      midpoint, diff_abs, diff_pct, diff_pts (for %), outcome, explanation
    """
    midpoint = round((guidance_lower + guidance_upper) / 2.0, 4)

    if actual is None:
        return {
            "midpoint": midpoint,
            "actual": None,
            "diff_abs": None,
            "diff_pct": None,
            "diff_pts": None,
            "outcome": "Pending",
            "explanation": f"Target period results have not yet been published. Guidance corridor: {guidance_lower} – {guidance_upper} {unit}."
        }

    diff_abs = round(actual - midpoint, 4)
    diff_pct = round(((actual - midpoint) / midpoint * 100.0), 2) if midpoint != 0 else 0.0

    diff_pts = round(actual - midpoint, 2) if is_percentage_metric(metric) else None
    lower_favorable = is_lower_better(metric)

    if not lower_favorable:
        # Standard metrics: Higher is better (Revenue, Gross Margin, EPS)
        if actual > guidance_upper:
            outcome = "Exceeded"
            status_desc = f"exceeded the upper guidance ceiling of {guidance_upper} {unit}"
        elif actual >= guidance_lower:
            outcome = "Met"
            status_desc = f"delivered within the guided range of {guidance_lower} – {guidance_upper} {unit}"
        else:
            outcome = "Missed"
            status_desc = f"fell below the lower guidance floor of {guidance_lower} {unit}"
    else:
        # Inverted metrics: Lower is better (Operating Expenses, Cost of Goods Sold)
        if actual < guidance_lower:
            outcome = "Exceeded"
            status_desc = f"demonstrated superior expense discipline below guided floor of {guidance_lower} {unit}"
        elif actual <= guidance_upper:
            outcome = "Met"
            status_desc = f"contained expenses within guided envelope of {guidance_lower} – {guidance_upper} {unit}"
        else:
            outcome = "Missed"
            status_desc = f"exceeded expense ceiling of {guidance_upper} {unit}"

    # Detailed explanation
    sign = "+" if diff_pct > 0 else ""
    pts_str = f" ({sign}{diff_pts} percentage points)" if diff_pts is not None else ""
    explanation = (
        f"Reported {metric} of {actual} {unit} {status_desc}. "
        f"Guidance midpoint was {midpoint} {unit}, producing a net variance of "
        f"{sign}{diff_abs} {unit} ({sign}{diff_pct}%{pts_str})."
    )

    return {
        "midpoint": midpoint,
        "actual": actual,
        "diff_abs": diff_abs,
        "diff_pct": diff_pct,
        "diff_pts": diff_pts,
        "outcome": outcome,
        "explanation": explanation
    }

def calculate_portfolio_kpis(evaluations: list[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate aggregate KPIs across a collection of guidance evaluations."""
    total = len(evaluations)
    if total == 0:
        return {
            "total": 0,
            "evaluated": 0,
            "exceeded": 0,
            "met": 0,
            "missed": 0,
            "pending": 0,
            "unverifiable": 0,
            "adherence_rate": 0.0,
            "average_deviation": 0.0,
            "mean_absolute_deviation": 0.0
        }

    exceeded = sum(1 for e in evaluations if e.get("outcome") == "Exceeded")
    met = sum(1 for e in evaluations if e.get("outcome") == "Met")
    missed = sum(1 for e in evaluations if e.get("outcome") == "Missed")
    pending = sum(1 for e in evaluations if e.get("outcome") == "Pending")
    unverifiable = sum(1 for e in evaluations if e.get("outcome") == "Unverifiable")

    evaluated = exceeded + met + missed
    adherence_rate = round(((exceeded + met) / evaluated * 100.0), 1) if evaluated > 0 else 0.0

    valid_deviations = [
        e["deviationPct"] for e in evaluations 
        if e.get("deviationPct") is not None and e.get("outcome") in ("Exceeded", "Met", "Missed")
    ]

    avg_dev = round(sum(valid_deviations) / len(valid_deviations), 2) if valid_deviations else 0.0
    mad = round(sum(abs(d) for d in valid_deviations) / len(valid_deviations), 2) if valid_deviations else 0.0

    return {
        "total": total,
        "evaluated": evaluated,
        "exceeded": exceeded,
        "met": met,
        "missed": missed,
        "pending": pending,
        "unverifiable": unverifiable,
        "adherence_rate": adherence_rate,
        "average_deviation": avg_dev,
        "mean_absolute_deviation": mad
    }
