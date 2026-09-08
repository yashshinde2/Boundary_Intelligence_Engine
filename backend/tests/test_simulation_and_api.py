"""
Unit Tests for Confidence Scoring, Strategic Simulation, and REST Endpoints
TGR Haas F1 Team & Austrian GP 2026 Validation
"""
import pytest
from fastapi.testclient import TestClient
from main import app
from engine.confidence import ConfidenceEngine
from engine.strategy_simulation import StrategySimulationEngine
from models import WheelFootprint, TelemetryPoint, SimulationRequest


def test_confidence_scoring_weights():
    fp = WheelFootprint(
        fl_inside=False,
        fr_inside=False,
        rl_inside=False,
        rr_inside=False,
        wheels_out_count=4
    )
    telem = TelemetryPoint(
        timestamp_sec=1937.4,
        vehicle_id=31,
        driver_name="Esteban Ocon",
        speed_kmh=224.0,
        steering_deg=-12.0,
        lateral_g=3.85,
        throttle_pct=100.0,
        brake_pct=0.0,
        gear=5,
        rpm=11400
    )

    conf = ConfidenceEngine.calculate_confidence(
        yolo_det_conf=0.96,
        tracking_consistency=0.95,
        margin_cm=-18.4,
        footprint=fp,
        consecutive_frames=5,
        telemetry=telem
    )

    assert conf.confidence_percentage >= 90.0
    assert conf.verdict == "HIGH CONFIDENCE"
    assert 0.0 <= conf.total_confidence <= 1.0


def test_strategy_simulation_engine():
    engine = StrategySimulationEngine()
    samples = [18.5, 17.2, 14.8, 12.1, 9.4, 4.2, 0.8, -5.2, -14.1]
    dist = engine.compute_margin_distribution("RBR-T3", "Turn 3 - Remus", samples)

    assert dist.lap_count == len(samples)
    assert dist.violation_count == 2
    assert dist.risk_score_pct > 0.0

    # Test What-If with tyre degradation and line offset
    req = SimulationRequest(
        corner_id="RBR-T3",
        tyre_compound="Medium",
        tyre_age_laps=25,
        fuel_load_kg=70.0,
        track_temperature_c=42.0,
        weather_condition="Dry",
        driving_line_offset_cm=14.0
    )

    rec, details = engine.run_what_if_simulation(dist, req)
    assert rec.projected_risk_pct >= 0.0
    assert len(details["tradeoff_curve"]) > 0
    assert rec.recommendation_level in ("CRITICAL", "ADVISORY", "OPTIMAL")


def test_fastapi_endpoints():
    client = TestClient(app)

    # Health check
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "online"
    assert "TGR Haas F1 Team" in res_health.json()["team"]

    # System Health
    res_sys = client.get("/api/system/health")
    assert res_sys.status_code == 200
    assert res_sys.json()["subsystems"]["detector"]["status"] == "HEALTHY"

    # Deterministic Demo Seed Endpoint
    res_demo = client.get("/api/simulation/demo")
    assert res_demo.status_code == 200
    demo_data = res_demo.json()
    assert demo_data["overall_risk_pct"] == 28.7
    assert demo_data["highest_risk_corner"]["number"] == 3
    assert demo_data["highest_risk_corner"]["risk_pct"] == 74.2
    assert demo_data["avg_boundary_margin_cm"] == 8.6
    assert demo_data["predicted_violations"] == 4
    assert len(demo_data["corners"]) == 10
    assert demo_data["rule_profile"] == "FIA_ALL_FOUR"

    # Dynamic Simulation Run Endpoint
    res_sim_run = client.post(
        "/api/simulation/run",
        json={"tyre_compound": "Soft", "tyre_age_laps": 18, "fuel_load_kg": 50.0, "driver_number": 87}
    )
    assert res_sim_run.status_code == 200
    sim_res = res_sim_run.json()
    assert sim_res["baseline"]["driver_number"] == 87
    assert sim_res["baseline"]["tyre"] == "Soft"

    # Corners
    res_corners = client.get("/api/corners")
    assert res_corners.status_code == 200
    assert len(res_corners.json()) == 10

    # Incidents
    res_inc = client.get("/api/incidents")
    assert res_inc.status_code == 200
    incidents = res_inc.json()
    assert len(incidents) >= 3

    # Adjudicate Incident
    first_inc_id = incidents[0]["incident_id"]
    res_adj = client.post(
        f"/api/incidents/{first_inc_id}/adjudicate",
        json={"action": "CONFIRM", "steward_name": "G. Connelly (FIA Lead Steward)", "notes": "Test ruling confirmed"}
    )
    assert res_adj.status_code == 200
    assert res_adj.json()["status"] == "CONFIRMED"


def test_video_upload_and_telemetry_endpoints(tmp_path):
    import cv2
    import numpy as np

    client = TestClient(app)

    # 1. Create a dummy test video
    test_vid_file = str(tmp_path / "api_test.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(test_vid_file, fourcc, 30.0, (320, 240))
    for _ in range(15):
        out.write(np.zeros((240, 320, 3), dtype=np.uint8))
    out.release()

    # 2. Upload video
    with open(test_vid_file, "rb") as f:
        res_upload = client.post(
            "/api/video/upload",
            files={"file": ("api_test.mp4", f, "video/mp4")},
            data={"corner_id": "RBR-T3"}
        )
    assert res_upload.status_code == 200
    data = res_upload.json()
    assert "video_id" in data
    assert data["status"] == "UPLOADED"
    video_id = data["video_id"]

    # 3. Check status
    res_status = client.get(f"/api/video/{video_id}/status")
    assert res_status.status_code == 200
    assert res_status.json()["video_id"] == video_id

    # 4. Upload CSV telemetry
    csv_content = b"timestamp,vehicle_id,speed,lateral_g,steering,throttle,brake\n0.1,31,224.0,3.8,-12.0,100.0,0.0\n0.2,31,226.0,3.9,-10.0,100.0,0.0"
    res_telem = client.post(
        f"/api/video/{video_id}/telemetry",
        files={"file": ("telemetry.csv", csv_content, "text/csv")}
    )
    assert res_telem.status_code == 200
    assert res_telem.json()["rows_ingested"] == 2

    # 5. Extract frame
    res_frame = client.get(f"/api/video/{video_id}/frame?frame_index=1")
    assert res_frame.status_code == 200
    assert res_frame.headers["content-type"] == "image/jpeg"

    # 6. Kick off analysis
    res_analyze = client.post(
        f"/api/video/{video_id}/analyze",
        json={"corner_id": "RBR-T3", "vehicle_id": 31}
    )
    assert res_analyze.status_code == 200
    assert res_analyze.json()["status"] == "PROCESSING"
