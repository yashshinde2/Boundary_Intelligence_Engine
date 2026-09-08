import pytest
from fastapi.testclient import TestClient
from main import app
from engine.real_telemetry_loader import RealTelemetryLoader
from engine.telemetry import TelemetryEngine

client = TestClient(app)

def test_real_telemetry_dataset_integrity():
    data = RealTelemetryLoader.get_data()
    assert "metadata" in data
    assert "circuit" in data
    assert "drivers" in data
    assert "race_control_incidents" in data

    circuit = data["circuit"]
    assert circuit["track_points_count"] >= 500
    assert len(circuit["corners"]) == 10
    assert len(data["race_control_incidents"]) >= 10

    drivers = data["drivers"]
    assert "27" in drivers  # Nico Hülkenberg (Haas F1 Team)
    assert "31" in drivers  # Esteban Ocon
    assert len(drivers["27"]["telemetry"]) > 100


def test_circuit_svg_projection():
    svg_data = RealTelemetryLoader.get_circuit_svg_path_and_corners(width=800, height=450, padding=40)
    assert "svg_path_d" in svg_data
    assert svg_data["svg_path_d"].startswith("M ")
    assert svg_data["svg_path_d"].endswith("Z")
    assert len(svg_data["corners"]) == 10

    # Ensure all corners are positioned within SVG canvas bounds
    for c in svg_data["corners"]:
        assert 0 <= c["x"] <= 800
        assert 0 <= c["y"] <= 450
        assert "name" in c


def test_telemetry_interpolation():
    p_apex = RealTelemetryLoader.get_interpolated_telemetry_at_progress(27, 0.5)
    assert p_apex["driver_number"] == 27
    assert 50.0 <= p_apex["speed_kmh"] <= 330.0
    assert 0.0 <= p_apex["throttle_pct"] <= 100.0
    assert 0.0 <= p_apex["brake_pct"] <= 100.0
    assert 1 <= p_apex["gear"] <= 8
    assert p_apex["rpm"] > 8000


def test_telemetry_engine_real_source():
    telem = TelemetryEngine.generate_corner_telemetry_frame(
        timestamp_sec=1935.0,
        progress_ratio=0.5,
        vehicle_id=27,
        driver_name="Nico Hülkenberg",
        corner_id="RBR-T3"
    )
    assert telem.data_source == "OFFICIAL_F1_AUSTRIAN_GP_2024_RACEDAY"
    assert telem.vehicle_id == 27
    assert telem.speed_kmh > 0


def test_real_telemetry_api_endpoints():
    res_info = client.get("/api/real-telemetry/info")
    assert res_info.status_code == 200
    info = res_info.json()
    assert "FORMULA 1" in info["meeting"]
    assert info["circuit_name"] == "Red Bull Ring"

    res_svg = client.get("/api/real-telemetry/circuit-svg")
    assert res_svg.status_code == 200
    svg = res_svg.json()
    assert "svg_path_d" in svg
    assert len(svg["corners"]) == 10

    res_drivers = client.get("/api/real-telemetry/drivers")
    assert res_drivers.status_code == 200
    assert "27" in res_drivers.json()

    res_incidents = client.get("/api/real-telemetry/incidents")
    assert res_incidents.status_code == 200
    incidents = res_incidents.json()
    assert len(incidents) > 0
