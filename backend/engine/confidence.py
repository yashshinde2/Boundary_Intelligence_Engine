"""
Multi-Factor Explainable Confidence Scoring Engine for TrackShift 2026
Implements:
Final Confidence = 0.30 * Detection
                 + 0.20 * Tracking
                 + 0.25 * Boundary Evidence
                 + 0.15 * Temporal Evidence
                 + 0.10 * Telemetry Evidence
"""
import math
from typing import Dict, Any, Optional
from models import ConfidenceBreakdown, WheelFootprint, TelemetryPoint


class ConfidenceEngine:
    @staticmethod
    def calculate_confidence(
        yolo_det_conf: float,
        tracking_consistency: float,
        margin_cm: float,
        footprint: WheelFootprint,
        consecutive_frames: int,
        telemetry: Optional[TelemetryPoint] = None
    ) -> ConfidenceBreakdown:
        """
        Calculates explainable multi-signal confidence score.
        """
        # 1. Detection Confidence (0.0 - 1.0)
        c_det = max(0.0, min(1.0, yolo_det_conf))

        # 2. Tracking Continuity (0.0 - 1.0)
        c_track = max(0.0, min(1.0, tracking_consistency))

        # 3. Geometric Boundary Evidence (0.0 - 1.0)
        # Clear violations (>10cm outside) or clear safe margins (>20cm inside) have high geometric clarity.
        # Boundary edges (within +/- 3cm) have slightly lower certainty due to resolution limits.
        abs_margin = abs(margin_cm)
        if abs_margin >= 10.0:
            c_geom = 0.98
        elif abs_margin >= 5.0:
            c_geom = 0.92
        elif abs_margin >= 2.0:
            c_geom = 0.84
        else:
            c_geom = 0.72

        # Bonus for unambiguous wheel count (e.g. 4/4 wheels out or 0/4 wheels out)
        if footprint.wheels_out_count == 4 or footprint.wheels_out_count == 0:
            c_geom = min(1.0, c_geom + 0.05)

        # 4. Temporal Consistency (0.0 - 1.0)
        # 1 frame = 0.60, 2 frames = 0.80, 3 frames = 0.92, 4+ frames = 0.98
        if consecutive_frames >= 4:
            c_temp = 0.98
        elif consecutive_frames == 3:
            c_temp = 0.92
        elif consecutive_frames == 2:
            c_temp = 0.80
        elif consecutive_frames == 1:
            c_temp = 0.65
        else:
            c_temp = 0.50

        # 5. Telemetry Evidence (0.0 - 1.0)
        # Check if telemetry physical dynamics corroborate the visual track-limit excursion
        c_telem = 0.85
        if telemetry is not None:
            # Under high lateral G (cornering load > 3.0G) and high throttle (>75%), car is pushed wide
            if telemetry.lateral_g >= 3.2 and telemetry.throttle_pct >= 80.0:
                c_telem = 0.96
            elif telemetry.lateral_g >= 2.5:
                c_telem = 0.90
            else:
                c_telem = 0.80

        # Weighted Combination
        total_conf = (
            0.30 * c_det +
            0.20 * c_track +
            0.25 * c_geom +
            0.15 * c_temp +
            0.10 * c_telem
        )
        total_conf = round(max(0.0, min(1.0, total_conf)), 3)
        pct = round(total_conf * 100.0, 1)

        verdict = "HIGH CONFIDENCE" if pct >= 90.0 else ("MODERATE CONFIDENCE" if pct >= 75.0 else "LOW CONFIDENCE")

        return ConfidenceBreakdown(
            detection=round(c_det, 3),
            tracking=round(c_track, 3),
            boundary_evidence=round(c_geom, 3),
            temporal_evidence=round(c_temp, 3),
            telemetry_evidence=round(c_telem, 3),
            total_confidence=total_conf,
            confidence_percentage=pct,
            verdict=verdict
        )
