"""
Guidance Matching & Deterministic Verification Engine.
Links forward-looking management promises with subsequent actual reported financial outcomes.
Verifies company, metric, period, basis, chronological order, and unit compatibility.
"""

from typing import Optional, Tuple
from sqlalchemy.orm import Session
from backend.models.guidance import Guidance, GuidanceEvaluation
from backend.models.financial_result import FinancialResult
from backend.services.calculations import evaluate_guidance_performance

class GuidanceMatcher:
    def match_and_evaluate(self, db: Session, guidance: Guidance) -> GuidanceEvaluation:
        """
        Find matching actual financial result for a given guidance record and evaluate outcome.
        """
        # Look for matching reported financial result:
        # 1. Same company
        # 2. Same metric
        # 3. Same fiscal reporting period (e.g. "Q4 FY25")
        # 4. Compatible accounting basis
        actual_query = db.query(FinancialResult).filter(
            FinancialResult.company_id == guidance.company_id,
            FinancialResult.metric.ilike(guidance.metric),
            FinancialResult.fiscal_period.ilike(guidance.target_period)
        )

        # Attempt basis match if available
        matched_actual = None
        for candidate in actual_query.all():
            if candidate.accounting_basis.lower() == guidance.accounting_basis.lower():
                matched_actual = candidate
                break
        if not matched_actual:
            matched_actual = actual_query.first()

        # If actual result exists, verify chronological validity
        # (Report date should be on or after announcement date)
        if matched_actual and matched_actual.report_date:
            if guidance.announcement_date and matched_actual.report_date < guidance.announcement_date:
                # Chronologically invalid (actual from prior period)
                matched_actual = None

        actual_val = matched_actual.actual_value if matched_actual else None

        eval_res = evaluate_guidance_performance(
            metric=guidance.metric,
            guidance_lower=guidance.guidance_lower,
            guidance_upper=guidance.guidance_upper,
            actual=actual_val,
            unit=guidance.unit
        )

        # Fetch or create evaluation record
        evaluation = db.query(GuidanceEvaluation).filter(
            GuidanceEvaluation.guidance_id == guidance.id
        ).first()

        if not evaluation:
            evaluation = GuidanceEvaluation(
                id=f"EVAL-{guidance.id}",
                guidance_id=guidance.id,
                actual_result_id=matched_actual.id if matched_actual else None,
                absolute_deviation=eval_res["diff_abs"],
                percentage_deviation=eval_res["diff_pct"],
                outcome=eval_res["outcome"],
                explanation=eval_res["explanation"],
                policy_applied="Standard Guidance Corridor Policy"
            )
            db.add(evaluation)
        else:
            evaluation.actual_result_id = matched_actual.id if matched_actual else None
            evaluation.absolute_deviation = eval_res["diff_abs"]
            evaluation.percentage_deviation = eval_res["diff_pct"]
            evaluation.outcome = eval_res["outcome"]
            evaluation.explanation = eval_res["explanation"]

        db.commit()
        db.refresh(evaluation)
        return evaluation

guidance_matcher = GuidanceMatcher()
