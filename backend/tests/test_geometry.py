"""
Unit Tests for Spatial Geometry Engine & State Machine
"""
import pytest
from engine.geometry import GeometryEngine
from models import TrackLimitState, WheelFootprint

# Test Track Polygon (Square box 0..100 for testing)
TEST_POLYGON = [
    [0.0, 0.0],
    [100.0, 0.0],
    [100.0, 100.0],
    [0.0, 100.0]
]


def test_wheel_footprint_inside():
    geom = GeometryEngine(TEST_POLYGON, pixels_to_cm_scale=1.0)
    # Car completely inside (bbox [20, 20, 80, 80])
    footprint = geom.calculate_wheel_footprint([20.0, 20.0, 80.0, 80.0])
    
    assert footprint.wheels_out_count == 0
    assert footprint.fl_inside is True
    assert footprint.fr_inside is True
    assert footprint.rl_inside is True
    assert footprint.rr_inside is True

    margin = geom.calculate_margin_cm(footprint, [20.0, 20.0, 80.0, 80.0])
    assert margin > 0.0  # Positive margin = Safe


def test_wheel_footprint_outside_violation():
    geom = GeometryEngine(TEST_POLYGON, pixels_to_cm_scale=1.0)
    # Car completely outside (bbox [150, 150, 200, 200])
    footprint = geom.calculate_wheel_footprint([150.0, 150.0, 200.0, 200.0])
    
    assert footprint.wheels_out_count == 4
    assert footprint.fl_inside is False
    assert footprint.fr_inside is False

    margin = geom.calculate_margin_cm(footprint, [150.0, 150.0, 200.0, 200.0])
    assert margin < 0.0  # Negative margin = Violation


def test_state_machine_transition():
    geom = GeometryEngine(TEST_POLYGON, pixels_to_cm_scale=1.0)
    vehicle_id = 27

    # Frame 1: Safe inside
    fp_safe = geom.calculate_wheel_footprint([20.0, 20.0, 80.0, 80.0])
    m_safe = geom.calculate_margin_cm(fp_safe, [20.0, 20.0, 80.0, 80.0])
    state, frames_out = geom.evaluate_state_machine(vehicle_id, fp_safe, m_safe)
    assert state == TrackLimitState.SAFE
    assert frames_out == 0

    # Frame 2: Outside (1st consecutive frame -> borderline/candidate)
    fp_out = geom.calculate_wheel_footprint([150.0, 150.0, 200.0, 200.0])
    m_out = geom.calculate_margin_cm(fp_out, [150.0, 150.0, 200.0, 200.0])
    state, frames_out = geom.evaluate_state_machine(vehicle_id, fp_out, m_out, min_consecutive_violation_frames=3)
    assert state == TrackLimitState.BORDERLINE
    assert frames_out == 1

    # Frame 3: Outside (2nd frame)
    state, frames_out = geom.evaluate_state_machine(vehicle_id, fp_out, m_out, min_consecutive_violation_frames=3)
    assert frames_out == 2

    # Frame 4: Outside (3rd frame -> triggers confirmed VIOLATION)
    state, frames_out = geom.evaluate_state_machine(vehicle_id, fp_out, m_out, min_consecutive_violation_frames=3)
    assert state == TrackLimitState.VIOLATION
    assert frames_out == 3

    # Frame 5: Re-enters track (1st inside frame)
    state, frames_out = geom.evaluate_state_machine(vehicle_id, fp_safe, m_safe)
    # Frame 6: Re-enters track (2nd inside frame -> triggers RECOVERED)
    state, frames_out = geom.evaluate_state_machine(vehicle_id, fp_safe, m_safe)
    assert state == TrackLimitState.RECOVERED
