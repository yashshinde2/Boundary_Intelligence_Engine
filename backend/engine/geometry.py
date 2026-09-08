"""
Spatial Geometry Engine & State Machine for TrackShift 2026
Implements:
- Vehicle 4-point wheel contact footprint calculation
- Point-in-polygon track boundary containment
- Real-world scaled margin-to-boundary distance (cm)
- F1 Track Limit State Machine: SAFE -> BORDERLINE -> VIOLATION -> RECOVERED
"""
import math
from typing import List, Tuple, Dict, Any, Optional
from shapely.geometry import Point, Polygon, LineString
from models import TrackLimitState, WheelFootprint


class GeometryEngine:
    def __init__(self, legal_polygon_coords: List[List[float]], pixels_to_cm_scale: float = 0.5):
        """
        :param legal_polygon_coords: List of [x, y] points defining the legal racing surface
        :param pixels_to_cm_scale: Real-world scale factor (cm per pixel)
        """
        self.scale = float(pixels_to_cm_scale)
        self.legal_polygon = self._normalize_polygon(legal_polygon_coords)
        self.boundary_linestring = LineString(self.legal_polygon.exterior.coords)

        # State machine tracking per vehicle
        self.vehicle_states: Dict[int, TrackLimitState] = {}
        self.consecutive_outside_counts: Dict[int, int] = {}
        self.consecutive_inside_counts: Dict[int, int] = {}

    @staticmethod
    def _normalize_polygon(legal_polygon_coords: List[List[float]]) -> Polygon:
        if len(legal_polygon_coords) < 3:
            raise ValueError("A legal track polygon requires at least 3 vertices.")

        points = [(float(x), float(y)) for x, y in legal_polygon_coords]
        if points[0] != points[-1]:
            points.append(points[0])

        polygon = Polygon(points)
        if polygon.is_empty or polygon.area <= 0:
            raise ValueError("Legal track polygon is empty or degenerate.")

        return polygon

    def update_boundary(self, legal_polygon_coords: List[List[float]]):
        self.legal_polygon = self._normalize_polygon(legal_polygon_coords)
        self.boundary_linestring = LineString(self.legal_polygon.exterior.coords)

    def _build_wheel_points(self, bbox: List[float], heading_angle_deg: Optional[float] = None) -> Dict[str, Tuple[float, float]]:
        x1, y1, x2, y2 = bbox
        width = max(x2 - x1, 1.0)
        height = max(y2 - y1, 1.0)

        local_offsets = {
            "fl": (-0.18 * width, -0.20 * height),
            "fr": (0.18 * width, -0.20 * height),
            "rl": (-0.18 * width, 0.18 * height),
            "rr": (0.18 * width, 0.18 * height),
        }

        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        theta = math.radians(heading_angle_deg or 0.0)
        cos_t = math.cos(theta)
        sin_t = math.sin(theta)

        wheel_points: Dict[str, Tuple[float, float]] = {}
        for name, (dx, dy) in local_offsets.items():
            px = dx + (cx if name in {"fr", "rr"} else cx)
            py = dy + cy
            rx = px - cx
            ry = py - cy
            qx = cx + (rx * cos_t - ry * sin_t)
            qy = cy + (rx * sin_t + ry * cos_t)
            wheel_points[name] = (qx, qy)

        return wheel_points

    def calculate_wheel_footprint(
        self,
        bbox: List[float],
        heading_angle_deg: Optional[float] = None,
        wheel_coords: Optional[Dict[str, Tuple[float, float]]] = None
    ) -> WheelFootprint:
        """
        Calculates 4 contact patch points (FL, FR, RL, RR) based on a vehicle bbox
        or explicit rotated wheel coordinates dict {'fl': (x, y), ...}.
        """
        if wheel_coords:
            fl = tuple(wheel_coords.get("fl", (0.0, 0.0)))
            fr = tuple(wheel_coords.get("fr", (0.0, 0.0)))
            rl = tuple(wheel_coords.get("rl", (0.0, 0.0)))
            rr = tuple(wheel_coords.get("rr", (0.0, 0.0)))
        else:
            wheel_points = self._build_wheel_points(bbox, heading_angle_deg)
            fl = wheel_points["fl"]
            fr = wheel_points["fr"]
            rl = wheel_points["rl"]
            rr = wheel_points["rr"]

        fl_in = self.legal_polygon.covers(Point(fl))
        fr_in = self.legal_polygon.covers(Point(fr))
        rl_in = self.legal_polygon.covers(Point(rl))
        rr_in = self.legal_polygon.covers(Point(rr))

        wheels_out = sum(1 for inside in (fl_in, fr_in, rl_in, rr_in) if not inside)

        return WheelFootprint(
            fl_inside=fl_in,
            fr_inside=fr_in,
            rl_inside=rl_in,
            rr_inside=rr_in,
            fl_coords=fl,
            fr_coords=fr,
            rl_coords=rl,
            rr_coords=rr,
            wheels_out_count=wheels_out
        )

    def calculate_margin_cm(self, footprint: WheelFootprint, bbox: Optional[List[float]] = None) -> float:
        """
        Calculates a signed margin to the legal boundary in centimetres.
        Positive values are inside the legal boundary. Negative values indicate a track-limit violation.
        """
        points = [
            Point(footprint.fl_coords),
            Point(footprint.fr_coords),
            Point(footprint.rl_coords),
            Point(footprint.rr_coords)
        ]

        if not points:
            return 0.0

        inside_points = [
            pt for pt, inside in (
                (Point(footprint.fl_coords), footprint.fl_inside),
                (Point(footprint.fr_coords), footprint.fr_inside),
                (Point(footprint.rl_coords), footprint.rl_inside),
                (Point(footprint.rr_coords), footprint.rr_inside),
            ) if inside
        ]
        outside_points = [
            pt for pt, inside in (
                (Point(footprint.fl_coords), footprint.fl_inside),
                (Point(footprint.fr_coords), footprint.fr_inside),
                (Point(footprint.rl_coords), footprint.rl_inside),
                (Point(footprint.rr_coords), footprint.rr_inside),
            ) if not inside
        ]

        if inside_points:
            margin_px = min(self.boundary_linestring.distance(pt) for pt in inside_points)
            return round(margin_px * self.scale, 2)

        if outside_points:
            margin_px = min(self.boundary_linestring.distance(pt) for pt in outside_points)
            return -round(margin_px * self.scale, 2)

        return 0.0

    def evaluate_state_machine(
        self,
        vehicle_id: int,
        footprint: WheelFootprint,
        margin_cm: float,
        min_consecutive_violation_frames: int = 3,
        rule_profile: str = "FIA_ALL_FOUR"
    ) -> Tuple[TrackLimitState, int]:
        """
        Processes a physical state transition for a vehicle approaching or exceeding the legal boundary.
        """
        current_state = self.vehicle_states.get(vehicle_id, TrackLimitState.SAFE)
        outside_count = self.consecutive_outside_counts.get(vehicle_id, 0)
        inside_count = self.consecutive_inside_counts.get(vehicle_id, 0)

        if rule_profile == "FIA_ALL_FOUR":
            is_violation = footprint.wheels_out_count >= 4 or margin_cm <= -2.0
            is_borderline = footprint.wheels_out_count in (1, 2, 3) or (0.0 <= margin_cm <= 15.0)
        else:
            is_violation = footprint.wheels_out_count >= 1 or margin_cm < 0.0
            is_borderline = footprint.wheels_out_count >= 1 or (0.0 <= margin_cm <= 15.0)

        if is_violation:
            outside_count += 1
            inside_count = 0
        else:
            inside_count += 1
            outside_count = 0

        self.consecutive_outside_counts[vehicle_id] = outside_count
        self.consecutive_inside_counts[vehicle_id] = inside_count

        new_state = current_state

        if current_state == TrackLimitState.SAFE:
            if is_violation and outside_count >= min_consecutive_violation_frames:
                new_state = TrackLimitState.VIOLATION
            elif is_borderline or (is_violation and outside_count < min_consecutive_violation_frames):
                new_state = TrackLimitState.BORDERLINE

        elif current_state == TrackLimitState.BORDERLINE:
            if is_violation and outside_count >= min_consecutive_violation_frames:
                new_state = TrackLimitState.VIOLATION
            elif not is_violation and inside_count >= 2:
                new_state = TrackLimitState.SAFE

        elif current_state == TrackLimitState.VIOLATION:
            if not is_violation and inside_count >= 2:
                new_state = TrackLimitState.RECOVERED

        elif current_state == TrackLimitState.RECOVERED:
            if not is_violation and inside_count >= 4:
                new_state = TrackLimitState.SAFE
            elif is_violation and outside_count >= min_consecutive_violation_frames:
                new_state = TrackLimitState.VIOLATION
            elif is_borderline:
                new_state = TrackLimitState.BORDERLINE

        self.vehicle_states[vehicle_id] = new_state
        return new_state, outside_count
