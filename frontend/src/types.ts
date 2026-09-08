export type TrackLimitState = 'SAFE' | 'BORDERLINE' | 'VIOLATION' | 'RECOVERED';
export type IncidentStatus = 'PENDING_REVIEW' | 'UNDER_REVIEW' | 'CONFIRMED' | 'DISMISSED';
export type ViewMode = 'STRATEGY' | 'LIVE_STEWARD' | 'CALIBRATION' | 'INCIDENTS' | 'UPLOAD';
export type RuleProfile = 'FIA_ALL_FOUR' | 'MVP_ANY_WHEEL';
export type SessionType = 'FP1' | 'FP2' | 'FP3' | 'QUALIFYING' | 'RACE SIMULATION';
export type WeatherType = 'Dry' | 'Light Rain' | 'Wet';

export interface DriverInfo {
  driver_id: string;
  number: number;
  code: string;
  first_name: string;
  last_name: string;
  display: string;
  is_active_2026_race_driver: boolean;
}

export interface VideoRecord {
  video_id: string;
  filename: string;
  filepath: string;
  uploaded_at: string;
  duration_sec: number;
  fps: number;
  width: number;
  height: number;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  current_frame: number;
  total_frames: number;
  corner_id: string;
  telemetry_json?: string;
}

export interface WheelFootprint {
  fl_inside: boolean;
  fr_inside: boolean;
  rl_inside: boolean;
  rr_inside: boolean;
  fl_coords: [number, number];
  fr_coords: [number, number];
  rl_coords: [number, number];
  rr_coords: [number, number];
  wheels_out_count: number;
}

export interface ConfidenceBreakdown {
  detection: number;
  tracking: number;
  boundary_evidence: number;
  temporal_evidence: number;
  telemetry_evidence: number;
  total_confidence: number;
  confidence_percentage: number;
  verdict: string;
}

export interface TelemetryPoint {
  timestamp_sec: number;
  vehicle_id: number;
  driver_name: string;
  speed_kmh: number;
  steering_deg: number;
  lateral_g: number;
  throttle_pct: number;
  brake_pct: number;
  gear: number;
  rpm: number;
  tyre_wear_pct: number;
  fuel_load_kg: number;
  lap: number;
  sector: number;
  corner_id?: string;
}

export interface CornerCalibration {
  track_id: string;
  corner_id: string;
  corner_name: string;
  legal_polygon: [number, number][];
  kerb_polygon?: [number, number][];
  runoff_polygon?: [number, number][];
  apex_point?: [number, number];
  racing_line?: [number, number][];
  danger_zone_distance_cm: number;
  image_width: number;
  image_height: number;
}

export interface CornerItem {
  corner_id: string;
  track_id: string;
  track_name: string;
  corner_name: string;
  turn_number: number;
  speed_category: string;
  danger_threshold_cm: number;
  calibration: CornerCalibration;
}

export interface DynamicCornerRisk {
  number: number;
  name: string;
  official_name: string | null;
  risk: number;
  margin_cm: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  turn_id: string;
}

export interface ExactCoordinates {
  center_px: [number, number];
  track_coords_m: [number, number];
  bbox: [number, number, number, number];
  heading_deg: number;
  heading_rad: number;
  margin_cm: number;
  wheels_out_count: number;
  fl: { coords: [number, number]; inside: boolean };
  fr: { coords: [number, number]; inside: boolean };
  rl: { coords: [number, number]; inside: boolean };
  rr: { coords: [number, number]; inside: boolean };
}

export interface CompanionVehicle {
  vehicle_id: number;
  car_number: number;
  driver_name: string;
  team_name: string;
  bbox: [number, number, number, number];
  center: [number, number];
  track_coords_m?: [number, number];
  heading_deg: number;
  heading_rad?: number;
  wheel_pts: Record<string, [number, number]>;
  telemetry: TelemetryPoint;
  is_safe?: boolean;
}

export interface LiveTrackCar {
  id: string;
  number: number;
  driverName: string;
  driverCode: string;
  teamName: string;
  colorHex: string;
  progress: number; // 0.0 to 1.0 along circuit
  x: number; // SVG X
  y: number; // SVG Y
  trackCoordsM: [number, number]; // Scaled track meters
  headingDeg: number;
  speedKmh: number;
  gear: number;
  throttle: number;
  brake: number;
  marginCm: number;
  wheelsOut: number;
  state: TrackLimitState;
  isViolating: boolean;
  lap: number;
}

export interface SessionMeta {
  meeting: string;
  session: string;
  circuit: string;
  circuit_key?: number;
  date: string;
  provenance: string;
  official_laps?: number;
}

export interface FrameAnalysisResult {
  type: string;
  frame_index: number;
  lap?: number;
  timestamp_sec: number;
  timestamp_str: string;
  timestamp_utc?: string;
  corner_id: string;
  corner_name: string;
  vehicle_id: number;
  driver_name: string;
  team_name: string;
  car_model?: string;
  car_number: number;
  bbox: [number, number, number, number];
  center: [number, number];
  track_coords_m?: [number, number];
  heading_deg?: number;
  footprint: WheelFootprint;
  margin_to_boundary_cm: number;
  state: TrackLimitState;
  consecutive_outside: number;
  confidence: ConfidenceBreakdown;
  telemetry: TelemetryPoint;
  exact_coordinates?: ExactCoordinates;
  companion_vehicle?: CompanionVehicle;
  frame_b64: string;
  incident_flag: boolean;
  official_fia_notice?: string | null;
  rule_profile?: string;
  data_source?: string;
  session_info?: SessionMeta;
  is_official?: boolean;
}

export interface Incident {
  incident_id: string;
  timestamp_str: string;
  timestamp_sec: number;
  vehicle_id: number;
  driver_name?: string;
  corner_id: string;
  lap: number;
  violation_type: string;
  side: string;
  wheels_out: number;
  min_margin_cm: number;
  consecutive_frames: number;
  confidence: ConfidenceBreakdown;
  status: IncidentStatus;
  steward_notes?: string;
  reviewed_by?: string;
  review_timestamp?: string;
  telemetry?: Array<{
    time: number;
    speed: number;
    lat_g: number;
    steer: number;
    throttle: number;
    brake: number;
  }>;
  rule_profile?: string;
  data_source?: string;
  is_official?: boolean;
}

export interface StrategyRecommendation {
  corner_id: string;
  corner_name: string;
  projected_risk_pct: number;
  recommended_line_offset_cm: number;
  recommended_risk_pct: number;
  lap_time_delta_ms: number;
  rationale: string;
  recommendation_level: 'CRITICAL' | 'ADVISORY' | 'OPTIMAL';
}

export interface CornerMarginDistribution {
  corner_id: string;
  corner_name: string;
  lap_count: number;
  samples: number[];
  mean_margin_cm: number;
  std_margin_cm: number;
  p10_margin_cm: number;
  p50_margin_cm: number;
  p90_margin_cm: number;
  violation_count: number;
  borderline_count: number;
  risk_score_pct: number;
}

export interface DeterministicDemoSeed {
  data_source: string;
  model: string;
  overall_risk_pct: number;
  highest_risk_corner: {
    number: number;
    name: string;
    risk_pct: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  avg_boundary_margin_cm: number;
  predicted_violations: number;
  corners: DynamicCornerRisk[];
  tradeoff_curve: Array<{
    offset_cm: number;
    projected_risk_pct: number;
    lap_time_delta_ms: number;
  }>;
  margin_distribution: {
    p10_margin_cm: number;
    p50_margin_cm: number;
    p90_margin_cm: number;
    mean_margin_cm: number;
    violation_threshold_cm: number;
    histogram_bins: Array<{
      bin_range: string;
      count: number;
      is_violation?: boolean;
      is_borderline?: boolean;
      is_safe?: boolean;
    }>;
  };
  recommendation: StrategyRecommendation;
  baseline: {
    tyre: string;
    tyre_age_laps: number;
    fuel_kg: number;
    track_temp_c: number;
    weather: string;
    line_offset_cm: number;
    driver: string;
    driver_code: string;
    driver_number: number;
    session: string;
    lap: number;
    lap_total: number;
    speed_kmh: number;
    sector: number;
  };
  rule_profile: string;
  is_official: boolean;
  team: {
    official_name: string;
    short_name: string;
    car: string;
    season: number;
    note: string;
  };
  drivers: DriverInfo[];
  track: {
    track_id: string;
    name: string;
    location: string;
    length_km: number;
    corner_count: number;
    race_laps: number;
    data_source: string;
  };
}
