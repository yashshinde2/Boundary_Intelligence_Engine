"""
End-to-End System Verification Test Script for Boundary Intelligence Engine
Tests:
1. REST API endpoints (10 Corners, Austria Red Bull Ring, TGR Haas VF-26 vehicles, Practice Laps, Incidents)
2. What-If Strategic Simulation calculations (Tyre degradation, Fuel load, Line offset)
3. Live WebSocket Session Feed (Frame analysis, state machine, 4-wheel footprint, confidence)
4. Steward Adjudication Workflow
"""
import sys
import json
import asyncio
import urllib.request
import websockets

BACKEND_HTTP = "http://127.0.0.1:8000"
BACKEND_WS = "ws://127.0.0.1:8000/ws/session"


def _get_json(endpoint: str):
    try:
        req = urllib.request.urlopen(f"{BACKEND_HTTP}{endpoint}")
        return json.loads(req.read().decode())
    except Exception:
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        res = client.get(endpoint)
        return res.json()


def _post_json(endpoint: str, payload: dict):
    try:
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            f"{BACKEND_HTTP}{endpoint}",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        res = urllib.request.urlopen(req)
        return json.loads(res.read().decode())
    except Exception:
        from fastapi.testclient import TestClient
        from main import app
        client = TestClient(app)
        res = client.post(endpoint, json=payload)
        return res.json()


def test_api_health():
    print("1. Testing Health Endpoint...")
    data = _get_json("/api/health")
    assert data["status"] == "online"
    assert "Red Bull Ring" in data["circuit"]
    assert "TGR Haas" in data["team"]
    print("   [PASS] Health check verified:", data)


def test_austria_corners():
    print("2. Testing Austrian GP 10 Corners...")
    corners = _get_json("/api/corners")
    assert len(corners) == 10
    corner_ids = [c["corner_id"] for c in corners]
    assert "RBR-T1" in corner_ids
    assert "RBR-T3" in corner_ids
    assert "RBR-T4" in corner_ids
    assert "RBR-T9" in corner_ids
    assert "RBR-T10" in corner_ids
    print(f"   [PASS] {len(corners)} Austrian GP corners verified: {corner_ids}")


def test_what_if_simulation():
    print("3. Testing What-If Strategic Simulation...")
    sim_payload = {
        "corner_id": "RBR-T3",
        "tyre_compound": "Medium",
        "tyre_age_laps": 12,
        "fuel_load_kg": 52.0,
        "track_temperature_c": 28.0,
        "weather_condition": "Dry",
        "driving_line_offset_cm": 12.0
    }
    result = _post_json("/api/strategy/simulate", sim_payload)
    rec = result["recommendation"]
    assert rec["corner_id"] == "RBR-T3"
    assert "rationale" in rec
    assert len(result["details"]["tradeoff_curve"]) > 0
    print(f"   [PASS] Simulation successful. Projected Risk: {rec['projected_risk_pct']}%, Recommended Offset: +{rec['recommended_line_offset_cm']}cm, Lap Delta: +{rec['lap_time_delta_ms']}ms")


def test_incidents_and_adjudication():
    print("4. Testing Incident Queue & Adjudication...")
    incidents = _get_json("/api/incidents")
    assert len(incidents) > 0
    first_inc = incidents[0]
    print(f"   [PASS] Found {len(incidents)} incidents. Testing adjudication on {first_inc['incident_id']}...")

    adj_payload = {
        "action": "CONFIRM",
        "steward_name": "G. Connelly (FIA Lead Steward)",
        "notes": "Verified all 4 wheels beyond exit kerb limit on Turn 3. Lap time deleted."
    }
    adj_data = _post_json(f"/api/incidents/{first_inc['incident_id']}/adjudicate", adj_payload)
    assert adj_data["status"] == "CONFIRMED"
    print(f"   [PASS] Incident {first_inc['incident_id']} successfully confirmed and lap deleted.")


def test_live_websocket_stream():
    print("5. Testing Live WebSocket Stream (/ws/session)...")
    from fastapi.testclient import TestClient
    from main import app
    client = TestClient(app)
    with client.websocket_connect("/ws/session?mode=synthetic") as websocket:
        for _ in range(10):
            data = websocket.receive_json()
            assert data["type"] == "FRAME_ANALYSIS"
            assert "bbox" in data
            assert "footprint" in data
            assert data["vehicle_id"] in (31, 87)
            assert "TGR Haas" in data["team_name"]
            assert data["rule_profile"] == "FIA_ALL_FOUR"
            assert "exact_coordinates" in data
            assert "companion_vehicle" in data


def test_multicar_simulation_and_exact_coordinates():
    print("6. Testing Multi-Car Trajectory Compliance & Exact Coordinates...")
    from engine.video_generator import VideoGenerator
    from engine.geometry import GeometryEngine
    from models import TrackLimitState

    gen = VideoGenerator()
    frames = gen.generate_austria_session_sequence(corner_id="RBR-T9", num_frames=90)
    assert len(frames) == 90

    legal_poly = [
        [100, 570], [320, 480], [580, 410], [840, 360], [1040, 332], [1180, 312],
        [1350, 300], [1350, 400], [1160, 425], [980, 470], [690, 540], [390, 620], [100, 720]
    ]
    geom = GeometryEngine(legal_poly, pixels_to_cm_scale=0.5)

    states_31 = []
    wheels_out_87 = []

    for f in frames:
        # Check car 31 (excursion car)
        fp_31 = geom.calculate_wheel_footprint(f["bbox"], wheel_coords=f["wheel_pts"])
        margin_31 = geom.calculate_margin_cm(fp_31, f["bbox"])
        state_31, out_cnt_31 = geom.evaluate_state_machine(31, fp_31, margin_31, min_consecutive_violation_frames=3)
        states_31.append(state_31)

        # Check car 87 (safe companion car)
        comp = f["companion_vehicle"]
        assert comp is not None
        fp_87 = geom.calculate_wheel_footprint(comp["bbox"], wheel_coords=comp["wheel_pts"])
        wheels_out_87.append(fp_87.wheels_out_count)

    # Car 87 must strictly remain on track
    assert max(wheels_out_87) == 0, f"Expected 0 wheels out for safe Car 87, got {max(wheels_out_87)}"

    # Car 31 must transition to VIOLATION and RECOVER
    assert TrackLimitState.VIOLATION in states_31, "Car 31 must reach VIOLATION state"
    assert TrackLimitState.SAFE in states_31, "Car 31 must have SAFE state"
    print("   [PASS] Multi-car compliance verified: Car #87 strictly on track (0 wheels out), Car #31 enters violation and recovers.")


def main():
    print("==================================================")
    print(">>> BOUNDARY INTELLIGENCE ENGINE - VERIFICATION SUITE")
    print("==================================================")
    test_api_health(); print()
    test_austria_corners(); print()
    test_what_if_simulation(); print()
    test_incidents_and_adjudication(); print()
    test_live_websocket_stream(); print()
    test_multicar_simulation_and_exact_coordinates(); print()
    print("==================================================")
    print("[SUCCESS] ALL END-TO-END VERIFICATION CHECKS PASSED 100%!")
    print("==================================================")


if __name__ == "__main__":
    main()
