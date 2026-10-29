"""
Unit tests for financial mathematics and guidance evaluation policies.
"""

from backend.services.calculations import (
    evaluate_guidance_performance,
    is_lower_better,
    is_percentage_metric,
    calculate_portfolio_kpis
)

def test_higher_is_better_revenue_exceeded():
    # Revenue guidance: 50,000 to 52,000 (midpoint 51,000). Actual: 53,000 -> Exceeded
    res = evaluate_guidance_performance("Revenue", 50000.0, 52000.0, 53000.0, "$M")
    assert res["outcome"] == "Exceeded"
    assert res["midpoint"] == 51000.0
    assert res["diff_abs"] == 2000.0
    assert res["diff_pct"] == round((2000.0 / 51000.0) * 100, 2)

def test_higher_is_better_revenue_met():
    # Actual: 51,500 (within 50,000 - 52,000) -> Met
    res = evaluate_guidance_performance("Revenue", 50000.0, 52000.0, 51500.0, "$M")
    assert res["outcome"] == "Met"
    assert res["diff_abs"] == 500.0

def test_higher_is_better_revenue_missed():
    # Actual: 48,000 (below 50,000) -> Missed
    res = evaluate_guidance_performance("Revenue", 50000.0, 52000.0, 48000.0, "$M")
    assert res["outcome"] == "Missed"
    assert res["diff_abs"] == -3000.0

def test_lower_is_better_operating_expenses():
    # OpEx: Lower is better. Guided: 4,000 to 4,200 (midpoint 4,100).
    # If actual is 3,800 (< 4,000), spending was contained -> Exceeded
    res_exc = evaluate_guidance_performance("Operating Expenses", 4000.0, 4200.0, 3800.0, "$M")
    assert res_exc["outcome"] == "Exceeded"

    # If actual is 4,100 -> Met
    res_met = evaluate_guidance_performance("Operating Expenses", 4000.0, 4200.0, 4100.0, "$M")
    assert res_met["outcome"] == "Met"

    # If actual is 4,500 (> 4,200), over budget -> Missed
    res_mis = evaluate_guidance_performance("Operating Expenses", 4000.0, 4200.0, 4500.0, "$M")
    assert res_mis["outcome"] == "Missed"

def test_percentage_metric_gross_margin():
    # Gross Margin: 73.0% to 74.0% (midpoint 73.5%). Actual: 75.0%
    res = evaluate_guidance_performance("Gross Margin", 73.0, 74.0, 75.0, "%")
    assert res["outcome"] == "Exceeded"
    assert res["diff_pts"] == 1.5  # 1.5 percentage points above midpoint

def test_pending_actual_results():
    res = evaluate_guidance_performance("Revenue", 1000.0, 1100.0, None, "$M")
    assert res["outcome"] == "Pending"
    assert res["actual"] is None
    assert res["diff_abs"] is None

def test_portfolio_kpis_calculation():
    evals = [
        {"outcome": "Exceeded", "deviationPct": 5.0},
        {"outcome": "Met", "deviationPct": -0.5},
        {"outcome": "Missed", "deviationPct": -4.0},
        {"outcome": "Pending", "deviationPct": None}
    ]
    kpis = calculate_portfolio_kpis(evals)
    assert kpis["total"] == 4
    assert kpis["evaluated"] == 3
    assert kpis["exceeded"] == 1
    assert kpis["met"] == 1
    assert kpis["missed"] == 1
    assert kpis["pending"] == 1
    assert kpis["adherence_rate"] == round((2 / 3) * 100, 1)
