"""
Strategic Risk & What-If Simulation Engine for TrackShift 2026
Implements:
- Practice session margin distribution analysis (mean, std, percentiles)
- Multi-variable race condition projection (Tyre wear, fuel load, track temp, rain)
- Risk-vs-Lap-Time trade-off optimization
- Strategy recommendations for Race Engineers
"""
import math
import numpy as np
from typing import List, Dict, Any, Tuple
from scipy.stats import norm
from models import (
    SimulationRequest,
    StrategyRecommendation,
    CornerMarginDistribution
)


class StrategySimulationEngine:
    def __init__(self):
        pass

    def compute_margin_distribution(
        self,
        corner_id: str,
        corner_name: str,
        margin_samples: List[float]
    ) -> CornerMarginDistribution:
        """
        Computes statistical distribution of boundary margins from practice laps.
        """
        if not margin_samples:
            margin_samples = [15.0]

        arr = np.array(margin_samples)
        mean_m = float(np.mean(arr))
        std_m = float(np.std(arr)) if len(arr) > 1 else 3.5
        p10 = float(np.percentile(arr, 10))
        p50 = float(np.percentile(arr, 50))
        p90 = float(np.percentile(arr, 90))

        violations = int(np.sum(arr < 0.0))
        borderline = int(np.sum((arr >= 0.0) & (arr <= 15.0)))

        # Risk score = probability that margin falls below 0cm
        risk_pct = float(norm.cdf(0.0, loc=mean_m, scale=max(0.5, std_m)) * 100.0)
        risk_pct = round(max(0.0, min(100.0, risk_pct)), 1)

        return CornerMarginDistribution(
            corner_id=corner_id,
            corner_name=corner_name,
            lap_count=len(margin_samples),
            samples=[round(float(x), 2) for x in margin_samples],
            mean_margin_cm=round(mean_m, 2),
            std_margin_cm=round(std_m, 2),
            p10_margin_cm=round(p10, 2),
            p50_margin_cm=round(p50, 2),
            p90_margin_cm=round(p90, 2),
            violation_count=violations,
            borderline_count=borderline,
            risk_score_pct=risk_pct
        )

    def run_what_if_simulation(
        self,
        baseline: CornerMarginDistribution,
        request: SimulationRequest
    ) -> Tuple[StrategyRecommendation, Dict[str, Any]]:
        """
        Projects track-limit risk under specified race scenarios and calculates
        the optimal risk vs lap-time trade-off curve.
        """
        # Baseline mean and standard deviation
        mu_0 = baseline.mean_margin_cm
        sigma_0 = max(1.0, baseline.std_margin_cm)

        # 1. Tyre Age & Compound Impact
        # High tyre age increases lateral sliding/understeer, shifting vehicle exit path outward (reducing margin)
        compound_deg_rate = {"Soft": 0.65, "Medium": 0.42, "Hard": 0.28}.get(request.tyre_compound, 0.42)
        tyre_drift_cm = -1.0 * (request.tyre_age_laps * compound_deg_rate)
        tyre_variance_multiplier = 1.0 + (request.tyre_age_laps * 0.015)

        # 2. Fuel Load Impact (Baseline 45kg)
        # Heavy fuel (+kg) increases inertia and corner exit radius
        fuel_delta_kg = request.fuel_load_kg - 45.0
        fuel_drift_cm = -1.0 * (fuel_delta_kg * 0.08)

        # 3. Track Temperature Impact (Baseline 35°C)
        temp_delta_c = request.track_temperature_c - 35.0
        temp_drift_cm = -1.0 * (temp_delta_c * 0.12) if temp_delta_c > 0 else (abs(temp_delta_c) * 0.05)

        # 4. Weather Grip Modifier
        weather_slip_cm = 0.0
        if request.weather_condition == "Damp":
            weather_slip_cm = -8.0
            tyre_variance_multiplier *= 1.4
        elif request.weather_condition == "Wet":
            weather_slip_cm = -18.0
            tyre_variance_multiplier *= 1.8

        # 5. Intentional Driving Line Adjustment
        # Moving entry/apex line further inside (+cm) increases margin
        line_adj_cm = request.driving_line_offset_cm

        # Projected Mean & Sigma
        mu_projected = mu_0 + tyre_drift_cm + fuel_drift_cm + temp_drift_cm + weather_slip_cm + line_adj_cm
        sigma_projected = sigma_0 * tyre_variance_multiplier

        # Projected Risk (% probability of margin < 0)
        projected_risk_pct = float(norm.cdf(0.0, loc=mu_projected, scale=sigma_projected) * 100.0)
        projected_risk_pct = round(max(0.0, min(100.0, projected_risk_pct)), 1)

        # Calculate Risk vs Lap-Time Trade-off Curve across different line offsets
        # For offsets from -20cm to +30cm
        tradeoff_curve = []
        best_recommended_offset = 0.0
        min_risk_target = 8.0  # Safe acceptable threshold < 8%

        for offset in range(-20, 35, 5):
            m_test = mu_0 + tyre_drift_cm + fuel_drift_cm + temp_drift_cm + weather_slip_cm + offset
            risk_test = round(float(norm.cdf(0.0, loc=m_test, scale=sigma_projected) * 100.0), 1)
            
            # Estimated lap-time delta:
            # Tighter line inside (+offset) reduces apex radius and exit speed: ~3.8ms per cm
            # Aggressive wider line (-offset) gains lap time: ~-3.2ms per cm (but spikes risk)
            if offset >= 0:
                lap_delta_ms = round(offset * 3.8, 1)
            else:
                lap_delta_ms = round(offset * 3.2, 1)

            tradeoff_curve.append({
                "offset_cm": offset,
                "projected_risk_pct": risk_test,
                "lap_time_delta_ms": lap_delta_ms,
                "projected_margin_cm": round(m_test, 1)
            })

            # Find minimum offset achieving risk < 8%
            if risk_test <= min_risk_target and best_recommended_offset == 0.0 and offset > 0:
                best_recommended_offset = float(offset)

        if best_recommended_offset == 0.0:
            best_recommended_offset = 12.0 if projected_risk_pct > 25.0 else 0.0

        # Calculate recommended performance
        rec_m = mu_0 + tyre_drift_cm + fuel_drift_cm + temp_drift_cm + weather_slip_cm + best_recommended_offset
        rec_risk_pct = round(float(norm.cdf(0.0, loc=rec_m, scale=sigma_projected) * 100.0), 1)
        rec_lap_delta_ms = round(best_recommended_offset * 3.8, 1)

        # Determine Recommendation Level and Rationale
        if projected_risk_pct >= 60.0:
            rec_level = "CRITICAL"
            rationale = (
                f"{baseline.corner_name} presents severe track-limit exposure ({projected_risk_pct}% risk) "
                f"due to tyre degradation ({request.tyre_age_laps} laps on {request.tyre_compound}) and high lateral acceleration. "
                f"A +{best_recommended_offset:.0f}cm wider entry line reduces violation risk to {rec_risk_pct}% "
                f"at an estimated lap-time cost of +{rec_lap_delta_ms / 1000.0:.3f}s."
            )
        elif projected_risk_pct >= 25.0:
            rec_level = "ADVISORY"
            rationale = (
                f"{baseline.corner_name} shows elevated risk ({projected_risk_pct}%). "
                f"Tighter apex management by +{best_recommended_offset:.0f}cm will stabilize exit margins "
                f"for a minimal delta of +{rec_lap_delta_ms / 1000.0:.3f}s per lap."
            )
        else:
            rec_level = "OPTIMAL"
            rationale = (
                f"Current driving trajectory is well within safety thresholds ({projected_risk_pct}% risk). "
                f"No line modification required."
            )

        recommendation = StrategyRecommendation(
            corner_id=baseline.corner_id,
            corner_name=baseline.corner_name,
            current_risk_pct=baseline.risk_score_pct,
            current_avg_margin_cm=baseline.mean_margin_cm,
            projected_risk_pct=projected_risk_pct,
            recommended_line_offset_cm=best_recommended_offset,
            recommended_risk_pct=rec_risk_pct,
            lap_time_delta_ms=rec_lap_delta_ms,
            rationale=rationale,
            tyre_deg_impact_pct=round(abs(tyre_drift_cm) / (abs(mu_0) + 1.0) * 100.0, 1),
            fuel_load_impact_pct=round(abs(fuel_drift_cm) / (abs(mu_0) + 1.0) * 100.0, 1),
            recommendation_level=rec_level
        )

        simulation_details = {
            "request": request.model_dump(),
            "baseline": baseline.model_dump(),
            "projected_mean_margin_cm": round(mu_projected, 2),
            "projected_std_margin_cm": round(sigma_projected, 2),
            "tradeoff_curve": tradeoff_curve
        }

        return recommendation, simulation_details
