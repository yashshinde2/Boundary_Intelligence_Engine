"""
Pydantic Models for TrackShift 2026 - Boundary Intelligence Engine
"""
from typing import List, Optional, Dict, Any, Tuple
from pydantic import BaseModel, Field
from enum import Enum


class TrackLimitState(str, Enum):
    SAFE = "SAFE"
    BORDERLINE = "BORDERLINE"
    VIOLATION = "VIOLATION"
    RECOVERED = "RECOVERED"


class IncidentStatus(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    UNDER_REVIEW = "UNDER_REVIEW"
    CONFIRMED = "CONFIRMED"
    DISMISSED = "DISMISSED"


class WheelFootprint(BaseModel):
    fl_inside: bool = Field(True, description="Front-Left wheel inside boundary")
    fr_inside: bool = Field(True, description="Front-Right wheel inside boundary")
    rl_inside: bool = Field(True, description="Rear-Left wheel inside boundary")
    rr_inside: bool = Field(True, description="Rear-Right wheel inside boundary")
    fl_coords: Tuple[float, float] = (0.0, 0.0)
    fr_coords: Tuple[float, float] = (0.0, 0.0)
    rl_coords: Tuple[float, float] = (0.0, 0.0)
    rr_coords: Tuple[float, float] = (0.0, 0.0)
    wheels_out_count: int = Field(0, ge=0, le=4)


class ConfidenceBreakdown(BaseModel):
    detection: float = Field(0.0, ge=0.0, le=1.0)
    tracking: float = Field(0.0, ge=0.0, le=1.0)
    boundary_evidence: float = Field(0.0, ge=0.0, le=1.0)
    temporal_evidence: float = Field(0.0, ge=0.0, le=1.0)
    telemetry_evidence: float = Field(0.0, ge=0.0, le=1.0)
    total_confidence: float = Field(0.0, ge=0.0, le=1.0)
    confidence_percentage: float = Field(0.0, ge=0.0, le=100.0)
    verdict: str = "HIGH CONFIDENCE"


class TelemetryPoint(BaseModel):
    timestamp_sec: float
    vehicle_id: int
    driver_name: str
    speed_kmh: float
    steering_deg: float
    lateral_g: float
    throttle_pct: float
    brake_pct: float
    gear: int
    rpm: int
    tyre_wear_pct: float = 0.0
    fuel_load_kg: float = 100.0
    lap: int = 1
    sector: int = 1
    corner_id: Optional[str] = None
    drs: Optional[int] = 0
    data_source: Optional[str] = "REAL_F1_AUSTRIAN_GP_2024_RACEDAY"
    world_coords: Optional[List[float]] = None
    timestamp_utc: Optional[str] = None


class CornerCalibration(BaseModel):
    track_id: str
    corner_id: str
    corner_name: str
    legal_polygon: List[List[float]] = Field(..., description="List of [x, y] coordinates for legal track area")
    kerb_polygon: Optional[List[List[float]]] = None
    runoff_polygon: Optional[List[List[float]]] = None
    apex_point: Optional[List[float]] = None
    racing_line: Optional[List[List[float]]] = None
    danger_zone_distance_cm: float = 15.0
    image_width: int = 1280
    image_height: int = 720


class FrameAnalysisResult(BaseModel):
    frame_index: int
    timestamp_sec: float
    corner_id: str
    vehicle_id: int
    driver_name: str
    team_name: str
    bbox: List[float] = Field(..., description="[x1, y1, x2, y2]")
    footprint: WheelFootprint
    margin_to_boundary_cm: float
    state: TrackLimitState
    consecutive_frames_outside: int
    confidence: ConfidenceBreakdown
    telemetry: TelemetryPoint
    incident_id: Optional[str] = None


class Incident(BaseModel):
    incident_id: str
    timestamp_str: str
    timestamp_sec: float
    vehicle_id: int
    driver_name: str
    team: str
    car_number: int
    corner_id: str
    corner_name: str
    lap: int
    violation_type: str = "Track Limit Excursion"
    side: str = "Left"
    wheels_out: int = 4
    min_margin_cm: float = -18.4
    consecutive_frames: int = 6
    confidence: ConfidenceBreakdown
    status: IncidentStatus = IncidentStatus.PENDING_REVIEW
    steward_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_timestamp: Optional[str] = None
    replay_frames: Optional[List[Dict[str, Any]]] = None
    telemetry_snapshot: Optional[List[TelemetryPoint]] = None


class SimulationRequest(BaseModel):
    corner_id: str
    driver_number: int = 31
    tyre_compound: str = "Medium"
    tyre_age_laps: int = Field(15, ge=1, le=50)
    fuel_load_kg: float = Field(65.0, ge=5.0, le=110.0)
    track_temperature_c: float = Field(38.0, ge=15.0, le=60.0)
    weather_condition: str = "Dry"  # Dry, Damp, Wet
    driving_line_offset_cm: float = Field(0.0, description="Lateral shift in apex entry line (-30cm to +30cm)")


class StrategyRecommendation(BaseModel):
    corner_id: str
    corner_name: str
    current_risk_pct: float
    current_avg_margin_cm: float
    projected_risk_pct: float
    recommended_line_offset_cm: float
    recommended_risk_pct: float
    lap_time_delta_ms: float
    rationale: str
    tyre_deg_impact_pct: float
    fuel_load_impact_pct: float
    recommendation_level: str  # CRITICAL, ADVISORY, OPTIMAL


class CornerMarginDistribution(BaseModel):
    corner_id: str
    corner_name: str
    lap_count: int
    samples: List[float] = Field(..., description="Margin samples in cm")
    mean_margin_cm: float
    std_margin_cm: float
    p10_margin_cm: float
    p50_margin_cm: float
    p90_margin_cm: float
    violation_count: int
    borderline_count: int
    risk_score_pct: float
