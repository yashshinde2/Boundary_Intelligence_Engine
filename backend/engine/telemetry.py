"""
Telemetry Stream & Synchronization Engine for TrackShift 2026
Enhanced with Real Formula 1 Austrian Grand Prix 2024 Race Day Telemetry (OpenF1 & FIA Timing)
"""
from typing import List, Dict, Any, Optional
import math
import random
from models import TelemetryPoint

try:
    from engine.real_telemetry_loader import RealTelemetryLoader
except ImportError:
    try:
        from real_telemetry_loader import RealTelemetryLoader
    except ImportError:
        RealTelemetryLoader = None


class TelemetryEngine:
    def __init__(self):
        pass

    @staticmethod
    def generate_corner_telemetry_frame(
        timestamp_sec: float,
        progress_ratio: float,  # 0.0 (entry) -> 0.5 (apex) -> 1.0 (exit)
        vehicle_id: int = 27,
        driver_name: str = "Nico Hülkenberg",
        corner_id: str = "RBR-T9",
        lap: int = 12,
        drift_wide: bool = False
    ) -> TelemetryPoint:
        """
        Generates high-precision F1 telemetry snapshot for corner traversal,
        prioritizing authentic Formula 1 Austrian Grand Prix Race Day telemetry (OpenF1 & FIA Official Timing).
        """
        # Attempt to load authentic Austrian GP Race Day telemetry point
        if RealTelemetryLoader is not None:
            try:
                # Map corner progress to track section progress (T9 is roughly ~0.84 to 0.90 of the Spielberg lap)
                base_lap_p = 0.84 + progress_ratio * 0.06 if "T9" in corner_id else (
                    0.26 + progress_ratio * 0.08 if "T3" in corner_id else progress_ratio
                )
                real_point = RealTelemetryLoader.get_interpolated_telemetry_at_progress(
                    driver_number=vehicle_id,
                    progress=base_lap_p
                )
                if real_point:
                    speed = real_point["speed_kmh"]
                    throttle = real_point["throttle_pct"]
                    brake = real_point["brake_pct"]
                    gear = real_point["gear"]
                    rpm = real_point["rpm"]
                    lat_g = real_point["lateral_g"]
                    steer = real_point["heading_deg"]
                    drs = real_point.get("drs", 0)
                    world_coords = real_point.get("world_coords")
                    ts_utc = real_point.get("timestamp_utc")

                    if drift_wide and progress_ratio >= 0.6:
                        lat_g = min(4.8, lat_g + 0.35)
                        throttle = 100.0

                    return TelemetryPoint(
                        timestamp_sec=round(timestamp_sec, 3),
                        vehicle_id=vehicle_id,
                        driver_name=driver_name,
                        speed_kmh=round(speed, 1),
                        steering_deg=round(steer, 1),
                        lateral_g=round(lat_g, 2),
                        throttle_pct=round(throttle, 1),
                        brake_pct=round(brake, 1),
                        gear=gear,
                        rpm=rpm,
                        tyre_wear_pct=round(lap * 2.8, 1),
                        fuel_load_kg=round(max(15.0, 105.0 - lap * 1.4), 1),
                        lap=lap,
                        sector=3 if "T9" in corner_id or "T10" in corner_id else (2 if "T4" in corner_id else 1),
                        corner_id=corner_id,
                        drs=drs,
                        data_source="OFFICIAL_F1_AUSTRIAN_GP_2024_RACEDAY",
                        world_coords=world_coords,
                        timestamp_utc=ts_utc
                    )
            except Exception:
                pass

        # Robust physics fallback if real loader unavailable
        if progress_ratio < 0.35:
            t = progress_ratio / 0.35
            speed = 265.0 - t * 45.0 + random.uniform(-1.0, 1.0)
            lat_g = 1.2 + t * 2.6
            steer = -2.0 - t * 13.0
            throttle = max(0.0, 100.0 - t * 90.0)
            brake = min(100.0, t * 65.0)
            gear = 6 if progress_ratio < 0.18 else 5
            rpm = int(11200 - t * 1800)
        elif progress_ratio <= 0.65:
            t = (progress_ratio - 0.35) / 0.30
            speed = 216.0 + t * 12.0 + random.uniform(-0.8, 0.8)
            lat_g = 3.9 + math.sin(t * math.pi) * 0.4
            steer = -15.5 + t * 4.0
            throttle = 25.0 + t * 55.0
            brake = 0.0
            gear = 5
            rpm = int(10400 + t * 1200)
        else:
            t = (progress_ratio - 0.65) / 0.35
            speed = 228.0 + t * 24.0 + random.uniform(-1.0, 1.0)
            lat_g = max(1.0, 3.8 - t * 2.4)
            steer = -11.5 + t * 10.0
            throttle = 100.0
            brake = 0.0
            gear = 5 if t < 0.5 else 6
            rpm = int(11600 + t * 1100)

        if drift_wide and progress_ratio >= 0.6:
            lat_g = min(4.4, lat_g + 0.3)
            throttle = 100.0

        return TelemetryPoint(
            timestamp_sec=round(timestamp_sec, 3),
            vehicle_id=vehicle_id,
            driver_name=driver_name,
            speed_kmh=round(speed, 1),
            steering_deg=round(steer, 1),
            lateral_g=round(lat_g, 2),
            throttle_pct=round(throttle, 1),
            brake_pct=round(brake, 1),
            gear=gear,
            rpm=rpm,
            tyre_wear_pct=round(lap * 3.2, 1),
            fuel_load_kg=round(max(15.0, 105.0 - lap * 2.2), 1),
            lap=lap,
            sector=3,
            corner_id=corner_id,
            data_source="FALLBACK_PHYSICS"
        )
