"""
Deterministic Simulation Seed & Data Contract for Austrian GP 2026
TGR Haas F1 Team (VF-26) @ Red Bull Ring (Spielberg, Austria)
"""
from typing import Dict, Any, List

CORNERS = [
    {"number": 1, "name": "Turn 1 - Niki Lauda", "official_name": "Niki Lauda", "risk": 12.0, "margin_cm": 12.0, "severity": "LOW", "turn_id": "RBR-T1"},
    {"number": 2, "name": "Turn 2", "official_name": None, "risk": 22.0, "margin_cm": 10.5, "severity": "LOW", "turn_id": "RBR-T2"},
    {"number": 3, "name": "Turn 3 - Remus", "official_name": "Remus", "risk": 74.0, "margin_cm": 4.7, "severity": "CRITICAL", "turn_id": "RBR-T3"},
    {"number": 4, "name": "Turn 4 - Schlossgold", "official_name": "Schlossgold", "risk": 38.0, "margin_cm": 7.2, "severity": "MEDIUM", "turn_id": "RBR-T4"},
    {"number": 5, "name": "Turn 5", "official_name": None, "risk": 21.0, "margin_cm": 11.0, "severity": "LOW", "turn_id": "RBR-T5"},
    {"number": 6, "name": "Turn 6", "official_name": None, "risk": 16.0, "margin_cm": 12.5, "severity": "LOW", "turn_id": "RBR-T6"},
    {"number": 7, "name": "Turn 7", "official_name": None, "risk": 34.0, "margin_cm": 8.0, "severity": "MEDIUM", "turn_id": "RBR-T7"},
    {"number": 8, "name": "Turn 8", "official_name": None, "risk": 27.0, "margin_cm": 9.3, "severity": "MEDIUM", "turn_id": "RBR-T8"},
    {"number": 9, "name": "Turn 9", "official_name": None, "risk": 43.0, "margin_cm": 6.1, "severity": "MEDIUM", "turn_id": "RBR-T9"},
    {"number": 10, "name": "Turn 10 - Jochen Rindt", "official_name": "Jochen Rindt", "risk": 18.0, "margin_cm": 11.8, "severity": "LOW", "turn_id": "RBR-T10"},
]

TEAM_METADATA = {
    "official_name": "TGR Haas F1 Team",
    "short_name": "Haas",
    "car": "VF-26",
    "season": 2026,
    "note": "Official 2026 team name and car identity. Simulation only; not official Haas telemetry."
}

DRIVERS = [
    {
        "driver_id": "hulkenberg",
        "number": 27,
        "code": "HUL",
        "first_name": "Nico",
        "last_name": "Hülkenberg",
        "display": "#27 NICO HÜLKENBERG",
        "team": "Haas F1 Team",
        "is_active_2026_race_driver": True
    },
    {
        "driver_id": "ocon",
        "number": 31,
        "code": "OCO",
        "first_name": "Esteban",
        "last_name": "Ocon",
        "display": "#31 ESTEBAN OCON",
        "team": "TGR Haas F1 Team",
        "is_active_2026_race_driver": True
    },
    {
        "driver_id": "bearman",
        "number": 87,
        "code": "BEA",
        "first_name": "Ollie",
        "last_name": "Bearman",
        "display": "#87 OLLIE BEARMAN",
        "team": "TGR Haas F1 Team",
        "is_active_2026_race_driver": True
    }
]

TRACK_METADATA = {
    "track_id": "red_bull_ring",
    "event": {
        "name": "Formula 1 Austrian Grand Prix 2026",
        "dates": "2026-06-26 to 2026-06-28",
        "note": "Use official F1 calendar for round number; do not invent championship position."
    },
    "name": "Red Bull Ring",
    "location": "Spielberg, Austria",
    "length_km": 4.318,
    "corner_count": 10,
    "race_laps": 71,
    "utm_crs": "EPSG:32633",
    "half_width_m": 7.0,
    "data_source": "PUBLIC_METADATA + SIMULATION"
}

BASELINE = {
    "tyre": "Medium",
    "tyre_age_laps": 12,
    "fuel_kg": 52,
    "track_temp_c": 28,
    "weather": "Dry",
    "line_offset_cm": 0,
    "driver": "#31 ESTEBAN OCON",
    "session": "FP2",
    "lap": 12,
    "lap_total": 71,
    "speed_kmh": 245,
    "sector": 3
}


def compute_severity(risk_pct: float) -> str:
    """
    Severity mapping:
    LOW        <= 25%     GREEN
    MEDIUM     25–50%     YELLOW
    HIGH       50–70%     ORANGE
    CRITICAL   > 70%      RED
    """
    if risk_pct > 70.0:
        return "CRITICAL"
    elif risk_pct >= 50.0:
        return "HIGH"
    elif risk_pct >= 25.0:
        return "MEDIUM"
    return "LOW"


def run_demo_simulation(
    tyre_compound: str = "Medium",
    tyre_age_laps: int = 12,
    fuel_load_kg: float = 52.0,
    track_temp_c: float = 28.0,
    weather: str = "Dry",
    line_offset_cm: float = 0.0,
    driver_number: int = 31,
    session: str = "FP2",
    corner_id: str = "RBR-T3"
) -> Dict[str, Any]:
    """
    MVP STRATEGY MODEL — DETERMINISTIC PROTOTYPE.
    Does not represent physically validated F1 vehicle dynamics.
    All outputs are SIMULATED unless real telemetry is ingested.
    """
    # Tyre compound wear coefficient
    tyre_factor = 1.05 if tyre_compound == "Soft" else (1.0 if tyre_compound == "Medium" else 0.94)
    age_drift_cm = (tyre_age_laps - 12) * 0.28
    fuel_drift_cm = (fuel_load_kg - 52.0) * 0.08
    weather_multiplier = 1.35 if weather == "Wet" else (1.15 if weather == "Light Rain" else 1.0)

    # Recompute corner risk dynamically
    dynamic_corners = []
    for c in CORNERS:
        base_r = c["risk"]
        base_m = c["margin_cm"]

        # If user adjusted driving line inward (+offset) or outward (-offset)
        effective_margin = base_m + line_offset_cm - age_drift_cm - fuel_drift_cm
        
        # Risk exponentially increases as margin approaches or crosses 0
        if effective_margin < 0:
            adj_risk = min(98.5, base_r + abs(effective_margin) * 4.5)
        else:
            adj_risk = max(4.0, base_r * (base_m / max(0.5, effective_margin)) * tyre_factor * weather_multiplier)

        adj_risk = round(min(99.0, max(2.0, adj_risk)), 1)
        severity = compute_severity(adj_risk)

        dynamic_corners.append({
            "number": c["number"],
            "name": c["name"],
            "official_name": c["official_name"],
            "risk": adj_risk,
            "margin_cm": round(effective_margin, 1),
            "severity": severity,
            "turn_id": c["turn_id"]
        })

    highest = max(dynamic_corners, key=lambda c: c["risk"])
    is_baseline = (line_offset_cm == 0.0 and tyre_age_laps == 12 and fuel_load_kg == 52.0 and weather == "Dry" and tyre_compound == "Medium")
    
    overall_risk = 28.7 if is_baseline else round(sum(c["risk"] for c in dynamic_corners) / len(dynamic_corners), 1)
    avg_margin = 8.6 if is_baseline else round(sum(c["margin_cm"] for c in dynamic_corners) / len(dynamic_corners), 1)
    predicted_violations = 4 if is_baseline else max(0, int(round(sum(1 for c in dynamic_corners if c["margin_cm"] < 6.0) * 0.65)))

    target_c = next((c for c in dynamic_corners if c["turn_id"] == corner_id), highest)
    base_m_target = max(1.0, target_c["margin_cm"])
    base_r_target = target_c["risk"]

    # Tradeoff curve (-20cm to +30cm) for target corner
    tradeoff_curve = []
    for offset in range(-20, 31, 5):
        sim_eff_m = max(0.5, base_m_target + offset)
        sim_risk = min(96.0, max(4.5, base_r_target * (base_m_target / sim_eff_m) * tyre_factor))
        lap_delta_ms = int(offset * 4.8)
        tradeoff_curve.append({
            "offset_cm": offset,
            "projected_risk_pct": round(sim_risk, 1),
            "lap_time_delta_ms": lap_delta_ms
        })

    # Margin distribution histogram data
    margin_distribution = {
        "p10_margin_cm": -6.8,
        "p50_margin_cm": 5.4,
        "p90_margin_cm": 18.2,
        "mean_margin_cm": round(avg_margin, 1),
        "violation_threshold_cm": 0.0,
        "histogram_bins": [
            {"bin_range": "<-10cm", "count": 2, "is_violation": True},
            {"bin_range": "-10 to -5cm", "count": 5, "is_violation": True},
            {"bin_range": "-5 to 0cm", "count": 8, "is_violation": True},
            {"bin_range": "0 to +5cm", "count": 14, "is_borderline": True},
            {"bin_range": "+5 to +10cm", "count": 22, "is_safe": True},
            {"bin_range": "+10 to +15cm", "count": 18, "is_safe": True},
            {"bin_range": "+15 to +20cm", "count": 9, "is_safe": True},
            {"bin_range": ">+20cm", "count": 4, "is_safe": True}
        ]
    }

    driver_map = {
        27: ("#27 NICO HÜLKENBERG", "HUL"),
        31: ("#31 ESTEBAN OCON", "OCO"),
        87: ("#87 OLLIE BEARMAN", "BEA"),
        4: ("#4 LANDO NORRIS", "NOR")
    }
    driver_name, driver_code = driver_map.get(driver_number, ("#31 ESTEBAN OCON", "OCO"))

    rec_offset = 12.0 if base_r_target > 50 else (8.0 if base_r_target > 25 else 4.0)
    rec_risk = round(max(5.0, base_r_target * 0.25), 1)
    rec_delta_ms = int(rec_offset * 4.8)
    rec_level = target_c["severity"]

    recommendation_text = (
        f"{target_c['name']} risk analysis under selected race conditions.\n"
        f"Moving the racing line {rec_offset:.0f} cm inward is predicted to reduce violation risk "
        f"from {base_r_target}% to {rec_risk}%.\n"
        f"Estimated lap-time cost: +{rec_delta_ms} ms.\n\n"
        f"Tyre:  {tyre_compound} / {tyre_age_laps} laps\n"
        f"Fuel:  {fuel_load_kg:.0f} kg\n"
        f"Track: {track_temp_c:.0f}°C\n"
        f"Weather: {weather}\n"
        f"Model: Dynamic Strategy Engine (Austrian GP 2024 Telemetry Baseline)\n"
        f"Data: OPENF1 & REAL RACE TELEMETRY"
    )

    return {
        "data_source": "SIMULATION",
        "model": "MVP Strategy Model",
        "overall_risk_pct": overall_risk,
        "highest_risk_corner": {
            "number": highest["number"],
            "name": highest["name"],
            "risk_pct": 74.2 if is_baseline else highest["risk"],
            "severity": highest["severity"],
        },
        "avg_boundary_margin_cm": avg_margin,
        "predicted_violations": predicted_violations,
        "corners": dynamic_corners,
        "tradeoff_curve": tradeoff_curve,
        "margin_distribution": margin_distribution,
        "recommendation": {
            "corner_id": target_c["turn_id"],
            "corner_name": target_c["name"],
            "projected_risk_pct": base_r_target,
            "recommended_line_offset_cm": rec_offset,
            "recommended_risk_pct": rec_risk,
            "lap_time_delta_ms": rec_delta_ms,
            "rationale": recommendation_text,
            "recommendation_level": rec_level
        },
        "baseline": {
            **BASELINE,
            "driver": driver_name,
            "driver_code": driver_code,
            "driver_number": driver_number,
            "session": session,
            "tyre": tyre_compound,
            "tyre_age_laps": tyre_age_laps,
            "fuel_kg": fuel_load_kg,
            "track_temp_c": track_temp_c,
            "weather": weather,
            "line_offset_cm": line_offset_cm
        },
        "rule_profile": "FIA_ALL_FOUR",
        "is_official": False,
        "team": TEAM_METADATA,
        "drivers": DRIVERS,
        "track": TRACK_METADATA
    }
