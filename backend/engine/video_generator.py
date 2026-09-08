"""
High-Fidelity Realistic Race Video & Frame Sequence Generator for TrackShift 2026
Features:
- Official F1 Austrian Grand Prix (Red Bull Ring - Spielberg, Austria) Track Layout
- MoneyGram Haas F1 Team (VF-24) Car Model with realistic livery, Halo, and Pirelli tyres
- Dynamic tire smoke, skid marks, trackside FIA digital light panels, and curb vibration
"""
import os
import math
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from engine.telemetry import TelemetryEngine
from models import TelemetryPoint

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "videos")
os.makedirs(OUTPUT_DIR, exist_ok=True)


from scipy.interpolate import CubicSpline


class VideoGenerator:
    def __init__(self, width: int = 1280, height: int = 720, fps: int = 30):
        self.width = width
        self.height = height
        self.fps = fps

    def render_austria_track_background(self, corner_id: str = "RBR-T9") -> np.ndarray:
        """
        Renders the realistic Red Bull Ring (Austria) circuit environment:
        Styrian hills backdrop, textured tarmac with tire rubbering, Austrian red/white sawtooth kerbs,
        yellow sausage kerbs, green painted runoff, gravel trap, and FIA marshal digital light panel.
        """
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        
        # 1. Austrian Alpine Backdrop (Styrian mountain forest gradient)
        for y in range(0, 180):
            grad = y / 180.0
            b = int(28 + grad * 14)
            g = int(48 + grad * 22)
            r = int(22 + grad * 16)
            frame[y, :] = (b, g, r)

        # Mountain ridgeline detail
        for x in range(0, self.width, 4):
            ridge_h = int(120 + 25 * math.sin(x * 0.008) + 12 * math.cos(x * 0.02))
            cv2.line(frame, (x, ridge_h), (x, 180), (22, 38, 18), 4)

        # 2. Trackside Armco Barrier with Red Bull Ring Sponsorship
        cv2.rectangle(frame, (0, 180), (self.width, 240), (70, 75, 80), -1)  # Armco metal barrier
        cv2.line(frame, (0, 195), (self.width, 195), (140, 145, 150), 2)
        cv2.line(frame, (0, 215), (self.width, 215), (140, 145, 150), 2)
        
        # Red Bull Ring Sponsor Banner on Barrier
        cv2.rectangle(frame, (80, 188), (340, 224), (20, 20, 140), -1)
        cv2.putText(frame, "RED BULL RING", (95, 212), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.rectangle(frame, (680, 188), (980, 224), (190, 15, 15), -1)
        cv2.putText(frame, "SPIELBERG - AUSTRIA", (695, 212), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)

        # 3. Gravel Trap with realistic stippled pebble texture
        frame[240:, :] = (55, 65, 75)  # Base gravel tone
        np.random.seed(101)
        noise = np.random.randint(-10, 10, (self.height - 240, self.width, 3))
        frame[240:, :] = np.clip(frame[240:, :] + noise, 0, 255).astype(np.uint8)

        # 4. Green Painted Astroturf / Runoff Beyond Track Limits
        runoff_poly = np.array([
            [500, 435],
            [780, 365],
            [1040, 320],
            [1280, 280],
            [1280, 305],
            [1180, 318],
            [1040, 338],
            [840, 368],
            [580, 418],
            [500, 435]
        ], dtype=np.int32)
        cv2.fillPoly(frame, [runoff_poly], (25, 95, 45))  # Austrian GP green runoff

        # 5. Main Asphalt Racing Surface (Dark textured asphalt)
        track_poly = np.array([
            [120, 560],
            [320, 480],
            [580, 410],
            [840, 360],
            [1040, 332],
            [1180, 312],
            [1280, 300],
            [1280, 390],
            [1160, 425],
            [980, 470],
            [690, 540],
            [390, 620],
            [140, 710]
        ], dtype=np.int32)
        cv2.fillPoly(frame, [track_poly], (42, 45, 48))  # Dark asphalt

        # Rubbered-in Racing Line / Dark Tire Groove
        groove_line = np.array([
            [160, 650], [420, 540], [740, 460], [980, 410], [1180, 365], [1280, 345]
        ], dtype=np.int32)
        cv2.polylines(frame, [groove_line], False, (28, 30, 32), 46, cv2.LINE_AA)

        # 6. Austrian Red & White Alternating Exit Kerbs (Turn 9 / Turn 10 Jochen Rindt)
        kerb_points = [
            (520, 420), (580, 404), (640, 390), (700, 377), (760, 365),
            (820, 354), (880, 344), (940, 335), (1000, 327), (1060, 320),
            (1120, 314), (1180, 308), (1240, 302), (1280, 298)
        ]
        for i in range(len(kerb_points) - 1):
            p1 = kerb_points[i]
            p2 = kerb_points[i + 1]
            color = (255, 255, 255) if i % 2 == 0 else (20, 20, 225)  # Austrian Red & White
            cv2.line(frame, p1, p2, color, 16, cv2.LINE_AA)

        # Yellow Sausage Kerb (Positioned realistically in outer runoff zone)
        sausage_points = [
            (900, 290), (980, 280), (1060, 270), (1140, 262), (1220, 255)
        ]
        for i in range(len(sausage_points) - 1):
            cv2.line(frame, sausage_points[i], sausage_points[i + 1], (0, 215, 255), 6, cv2.LINE_AA)

        # 7. Crisp White Track Limit Boundary Line (Outer & Inner)
        outer_line = np.array([
            [120, 560], [320, 480], [580, 410], [840, 360], [1040, 332], [1180, 312], [1280, 300]
        ], dtype=np.int32)
        cv2.polylines(frame, [outer_line], False, (255, 255, 255), 5, cv2.LINE_AA)

        inner_line = np.array([
            [140, 710], [390, 620], [690, 540], [980, 470], [1160, 425], [1280, 390]
        ], dtype=np.int32)
        cv2.polylines(frame, [inner_line], False, (240, 240, 240), 5, cv2.LINE_AA)

        # 8. Inner Apex Kerb (Turn 9 Apex)
        apex_kerb = [(690, 540), (760, 515), (840, 495), (920, 480), (980, 470)]
        for i in range(len(apex_kerb) - 1):
            p1 = apex_kerb[i]
            p2 = apex_kerb[i + 1]
            color = (255, 255, 255) if i % 2 == 0 else (20, 20, 225)
            cv2.line(frame, p1, p2, color, 14, cv2.LINE_AA)

        # 9. FIA Digital Trackside Marshal Light Board
        # Positioned top-right overlooking Turn 9 exit
        cv2.rectangle(frame, (1080, 195), (1180, 245), (10, 10, 15), -1)
        cv2.rectangle(frame, (1080, 195), (1180, 245), (60, 60, 75), 2)
        # Green flag LED matrix by default
        cv2.circle(frame, (1130, 220), 14, (0, 230, 80), -1, cv2.LINE_AA)
        cv2.putText(frame, "FIA MP-9", (1085, 242), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (180, 180, 180), 1, cv2.LINE_AA)

        # Corner Label HUD (Simulation Framing)
        cv2.putText(frame, "SIMULATED TRACK VIEW | TGR HAAS F1 TEAM (VF-26)", (30, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(frame, "SIMULATED - NOT RACE FOOTAGE | RED BULL RING (AUSTRIA 2026)", (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 229, 255), 1, cv2.LINE_AA)

        return frame

    def draw_haas_f1_car(
        self,
        frame: np.ndarray,
        center_x: float,
        center_y: float,
        heading_rad: float,
        car_number: int = 31,
        driver_name: str = "E. OCON",
        is_excursion: bool = False
    ) -> Tuple[List[float], Dict[str, Tuple[float, float]]]:
        """
        Renders the TGR Haas F1 Team VF-26 with authentic matte black carbon chassis,
        white livery sidepod highlights, Haas red endplates, Halo structure, and Pirelli P-Zero tires.
        """
        car_len = 105.0
        car_w = 42.0

        cos_a = math.cos(heading_rad)
        sin_a = math.sin(heading_rad)

        def rotate_pt(dx, dy):
            rx = center_x + dx * cos_a - dy * sin_a
            ry = center_y + dx * sin_a + dy * cos_a
            return (rx, ry)

        # 4 Tyre Patches (FL, FR, RL, RR)
        fl_c = rotate_pt(car_len * 0.38, -car_w * 0.48)
        fr_c = rotate_pt(car_len * 0.38, car_w * 0.48)
        rl_c = rotate_pt(-car_len * 0.38, -car_w * 0.48)
        rr_c = rotate_pt(-car_len * 0.38, car_w * 0.48)

        # Subtle tire smoke / kerb dust trail if in lateral excursion on exit kerb
        if is_excursion:
            smoke_pts = [rl_c, rr_c]
            for sp in smoke_pts:
                cv2.circle(frame, (int(sp[0] - cos_a * 18), int(sp[1] - sin_a * 18)), 8, (190, 195, 200), -1, cv2.LINE_AA)
                cv2.circle(frame, (int(sp[0] - cos_a * 32), int(sp[1] - sin_a * 32)), 12, (160, 165, 170), -1, cv2.LINE_AA)

        # Draw Pirelli P-Zero Tyres (Black rubber with Pirelli Yellow Medium stripe)
        for pt in [fl_c, fr_c, rl_c, rr_c]:
            # Outer tyre tread
            cv2.circle(frame, (int(pt[0]), int(pt[1])), 8, (15, 15, 18), -1, cv2.LINE_AA)
            # Pirelli Yellow compound ring (Medium C3)
            cv2.circle(frame, (int(pt[0]), int(pt[1])), 7, (0, 200, 255), 2, cv2.LINE_AA)
            # Black wheel rim center
            cv2.circle(frame, (int(pt[0]), int(pt[1])), 3, (40, 40, 45), -1, cv2.LINE_AA)

        # Front Wing Assembly (TGR Haas White & Red)
        fl_wing = rotate_pt(car_len * 0.50, -car_w * 0.54)
        fr_wing = rotate_pt(car_len * 0.50, car_w * 0.54)
        nose_tip = rotate_pt(car_len * 0.54, 0)
        
        # Front wing main plane
        cv2.line(frame, (int(fl_wing[0]), int(fl_wing[1])), (int(fr_wing[0]), int(fr_wing[1])), (240, 240, 245), 4, cv2.LINE_AA)
        # Red Endplates
        cv2.circle(frame, (int(fl_wing[0]), int(fl_wing[1])), 3, (0, 0, 225), -1, cv2.LINE_AA)
        cv2.circle(frame, (int(fr_wing[0]), int(fr_wing[1])), 3, (0, 0, 225), -1, cv2.LINE_AA)

        # Main Chassis Body Shell (TGR Haas Matte Carbon + White Highlights)
        rl_corner = rotate_pt(-car_len * 0.48, -car_w * 0.36)
        rr_corner = rotate_pt(-car_len * 0.48, car_w * 0.36)

        chassis_poly = np.array([
            nose_tip,
            rotate_pt(car_len * 0.28, -car_w * 0.24),
            rotate_pt(-car_len * 0.15, -car_w * 0.34),
            rl_corner,
            rr_corner,
            rotate_pt(-car_len * 0.15, car_w * 0.34),
            rotate_pt(car_len * 0.28, car_w * 0.24)
        ], dtype=np.int32)
        
        # Carbon Black Body
        cv2.fillPoly(frame, [chassis_poly], (20, 20, 24))
        # Haas Red Trim Outline
        cv2.polylines(frame, [chassis_poly], True, (0, 0, 225), 2, cv2.LINE_AA)

        # White Engine Cover / Sidepod Highlight
        sidepod_white = np.array([
            rotate_pt(car_len * 0.15, -car_w * 0.18),
            rotate_pt(-car_len * 0.20, -car_w * 0.28),
            rotate_pt(-car_len * 0.20, car_w * 0.28),
            rotate_pt(car_len * 0.15, car_w * 0.18)
        ], dtype=np.int32)
        cv2.fillPoly(frame, [sidepod_white], (245, 245, 250))

        # Cockpit, Halo & Driver Helmet
        cockpit_c = rotate_pt(car_len * 0.08, 0)
        # Black cockpit opening
        cv2.circle(frame, (int(cockpit_c[0]), int(cockpit_c[1])), 7, (10, 10, 12), -1, cv2.LINE_AA)
        # Driver Helmet (Ocon, Hülkenberg, Bearman, Norris, Verstappen)
        if car_number == 31:
            helmet_color = (255, 100, 0)  # Esteban Ocon (Red/Blue)
        elif car_number == 27:
            helmet_color = (0, 240, 255)  # Nico Hülkenberg (Neon yellow)
        elif car_number == 4:
            helmet_color = (0, 255, 180)  # Lando Norris (Fluorescent yellow)
        elif car_number == 1:
            helmet_color = (240, 240, 240)  # Max Verstappen (White/gold)
        else:
            helmet_color = (0, 200, 255)  # Ollie Bearman (Yellow/red)
        cv2.circle(frame, (int(cockpit_c[0] - cos_a * 2), int(cockpit_c[1] - sin_a * 2)), 4, helmet_color, -1, cv2.LINE_AA)
        # Titanium Halo structure
        halo_front = rotate_pt(car_len * 0.16, 0)
        cv2.line(frame, (int(halo_front[0]), int(halo_front[1])), (int(cockpit_c[0]), int(cockpit_c[1])), (0, 0, 225), 2, cv2.LINE_AA)

        # Rear Wing & DRS Flap (Haas Red)
        rear_l = rotate_pt(-car_len * 0.50, -car_w * 0.48)
        rear_r = rotate_pt(-car_len * 0.50, car_w * 0.48)
        cv2.line(frame, (int(rear_l[0]), int(rear_l[1])), (int(rear_r[0]), int(rear_r[1])), (0, 0, 225), 5, cv2.LINE_AA)
        cv2.line(frame, (int(rear_l[0]), int(rear_l[1])), (int(rear_r[0]), int(rear_r[1])), (250, 250, 250), 2, cv2.LINE_AA)

        # FIA Rear Rain / ERS LED Light (Blinking Red)
        rear_light = rotate_pt(-car_len * 0.52, 0)
        cv2.circle(frame, (int(rear_light[0]), int(rear_light[1])), 3, (0, 0, 255), -1, cv2.LINE_AA)

        # Driver Car Number (#27, #31, #87, #4) on Nose
        num_pos = rotate_pt(car_len * 0.32, -4)
        cv2.putText(frame, str(car_number), (int(num_pos[0]), int(num_pos[1])), cv2.FONT_HERSHEY_SIMPLEX, 0.40, (255, 255, 255), 1, cv2.LINE_AA)

        # Bounding Box Computation
        all_x = [fl_c[0], fr_c[0], rl_c[0], rr_c[0], fl_wing[0], fr_wing[0], rear_l[0], rear_r[0]]
        all_y = [fl_c[1], fr_c[1], rl_c[1], rr_c[1], fl_wing[1], fr_wing[1], rear_l[1], rear_r[1]]
        x1, y1 = max(0, min(all_x) - 4), max(0, min(all_y) - 4)
        x2, y2 = min(self.width, max(all_x) + 4), min(self.height, max(all_y) + 4)

        footprint_pts = {
            "fl": (round(fl_c[0], 2), round(fl_c[1], 2)),
            "fr": (round(fr_c[0], 2), round(fr_c[1], 2)),
            "rl": (round(rl_c[0], 2), round(rl_c[1], 2)),
            "rr": (round(rr_c[0], 2), round(rr_c[1], 2))
        }

        return [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)], footprint_pts

    def generate_austria_session_sequence(
        self,
        corner_id: str = "RBR-T9",
        num_frames: int = 90,
        incident_excursion: bool = True,
        car_number: int = 31,
        driver_name: str = "#31 ESTEBAN OCON"
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic frame-by-frame data of F1 cars traversing Austria Turn 3 / Turn 9 / Turn 10.
        Renders both cars on the circuit:
        - Companion car: Strictly runs on track along the legal asphalt racing line.
        - Primary monitored car: Pushes on corner exit, sliding wide onto the exit kerb in track limit excursion.
        """
        bg = self.render_austria_track_background(corner_id)
        frames_data = []

        # Driver lookup table
        DRIVER_INFO = {
            27: {"name": "Nico Hülkenberg", "short": "N. HÜLKENBERG", "team": "Haas F1 Team", "companion": 31},
            31: {"name": "Esteban Ocon", "short": "E. OCON", "team": "TGR Haas F1 Team", "companion": 87},
            87: {"name": "Ollie Bearman", "short": "O. BEARMAN", "team": "TGR Haas F1 Team", "companion": 31},
            4:  {"name": "Lando Norris", "short": "L. NORRIS", "team": "McLaren F1 Team", "companion": 1},
            1:  {"name": "Max Verstappen", "short": "M. VERSTAPPEN", "team": "Red Bull Racing", "companion": 4}
        }
        prim_meta = DRIVER_INFO.get(car_number, {
            "name": driver_name.replace("#", "").strip() if driver_name else f"Car #{car_number}",
            "short": driver_name.split()[-1] if driver_name and " " in driver_name else f"CAR #{car_number}",
            "team": "TGR Haas F1 Team",
            "companion": 31 if car_number != 31 else 87
        })
        comp_num = prim_meta.get("companion", 31 if car_number != 31 else 87)
        comp_meta = DRIVER_INFO.get(comp_num, {
            "name": f"Car #{comp_num}",
            "short": f"CAR #{comp_num}",
            "team": "TGR Haas F1 Team",
            "companion": car_number
        })

        # 1. Safe racing line waypoints (Companion car - strictly stays on legal track)
        wp_safe = [
            (150, 640),
            (380, 545),
            (640, 465),
            (840, 415),
            (1000, 380),
            (1140, 355),
            (1270, 345)
        ]

        # 2. Excursion line waypoints (Monitored car - aggressive corner exit wide onto kerb & runoff)
        wp_viol = [
            (150, 640),
            (380, 535),
            (640, 445),
            (830, 385),
            (970, 338),
            (1070, 300),
            (1150, 280),
            (1220, 295),
            (1280, 330)
        ]

        # Natural cubic splines for smooth C^2 continuous vehicle physics
        cs_safe_x = CubicSpline(np.linspace(0, 1, len(wp_safe)), [p[0] for p in wp_safe])
        cs_safe_y = CubicSpline(np.linspace(0, 1, len(wp_safe)), [p[1] for p in wp_safe])

        cs_viol_x = CubicSpline(np.linspace(0, 1, len(wp_viol)), [p[0] for p in wp_viol])
        cs_viol_y = CubicSpline(np.linspace(0, 1, len(wp_viol)), [p[1] for p in wp_viol])

        eval_t = np.linspace(0, 1, num_frames)

        for idx in range(num_frames):
            t = eval_t[idx]
            frame = bg.copy()
            timestamp_sec = 1935.0 + (idx / float(self.fps))

            # --- Companion Car (Safe Racing Line Ahead, Strictly Legal) ---
            t_comp = min(0.96, t * 0.85 + 0.12)
            cx_comp = float(cs_safe_x(t_comp))
            cy_comp = float(cs_safe_y(t_comp))

            # Heading Companion
            if idx < num_frames - 1:
                t_next_comp = min(0.96, eval_t[idx + 1] * 0.85 + 0.12)
                dx_comp = float(cs_safe_x(t_next_comp)) - cx_comp
                dy_comp = float(cs_safe_y(t_next_comp)) - cy_comp
                heading_comp = math.atan2(dy_comp, dx_comp) if (dx_comp != 0 or dy_comp != 0) else -0.18
            else:
                heading_comp = -0.15

            # --- Primary Monitored Car (Excursion Line Trailing, Exceeds Boundary on Exit) ---
            t_prim = t
            target_spline_x = cs_viol_x if incident_excursion else cs_safe_x
            target_spline_y = cs_viol_y if incident_excursion else cs_safe_y

            cx_prim = float(target_spline_x(t_prim))
            cy_prim = float(target_spline_y(t_prim))

            # Heading Primary
            if idx < num_frames - 1:
                dx_prim = float(target_spline_x(eval_t[idx + 1])) - cx_prim
                dy_prim = float(target_spline_y(eval_t[idx + 1])) - cy_prim
                heading_prim = math.atan2(dy_prim, dx_prim) if (dx_prim != 0 or dy_prim != 0) else -0.15
            else:
                heading_prim = math.atan2(cy_prim - float(target_spline_y(eval_t[idx - 1])), cx_prim - float(target_spline_x(eval_t[idx - 1])))

            is_outside_prim = incident_excursion and (0.50 <= t_prim <= 0.82)

            # If primary car in excursion, light up FIA digital marshal light panel with amber warning
            if is_outside_prim:
                cv2.circle(frame, (1130, 220), 14, (0, 165, 255), -1, cv2.LINE_AA)
                cv2.putText(frame, f"TRACK LIMITS VIOLATION - CAR #{car_number}", (880, 270), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 2, cv2.LINE_AA)

            # Draw Companion Car (Leading on safe line strictly inside track)
            bbox_comp, wheel_pts_comp = self.draw_haas_f1_car(
                frame,
                cx_comp,
                cy_comp,
                heading_comp,
                car_number=comp_num,
                driver_name=comp_meta["short"],
                is_excursion=False
            )

            # Draw Primary Car (Monitored car in excursion on exit kerb)
            bbox_prim, wheel_pts_prim = self.draw_haas_f1_car(
                frame,
                cx_prim,
                cy_prim,
                heading_prim,
                car_number=car_number,
                driver_name=prim_meta["short"],
                is_excursion=is_outside_prim
            )

            # Telemetry for both cars
            telem_prim = TelemetryEngine.generate_corner_telemetry_frame(
                timestamp_sec=timestamp_sec,
                progress_ratio=t_prim,
                vehicle_id=car_number,
                driver_name=prim_meta["name"],
                corner_id=corner_id,
                lap=12,
                drift_wide=incident_excursion
            )

            telem_comp = TelemetryEngine.generate_corner_telemetry_frame(
                timestamp_sec=timestamp_sec,
                progress_ratio=t_comp,
                vehicle_id=comp_num,
                driver_name=comp_meta["name"],
                corner_id=corner_id,
                lap=12,
                drift_wide=False
            )

            # Encode frame as JPEG for streaming
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            jpeg_bytes = buffer.tobytes()

            # Physical coordinates scaled to circuit metric space (1px = 0.5m in track frame)
            companion_data = {
                "vehicle_id": comp_num,
                "car_number": comp_num,
                "driver_name": f"#{comp_num} {comp_meta['name'].upper()}",
                "team_name": comp_meta["team"],
                "bbox": bbox_comp,
                "center": [round(cx_comp, 1), round(cy_comp, 1)],
                "track_coords_m": [round(cx_comp * 0.5, 2), round(cy_comp * 0.5, 2)],
                "heading_deg": round(math.degrees(heading_comp), 1),
                "heading_rad": round(heading_comp, 3),
                "wheel_pts": {k: [round(v[0], 1), round(v[1], 1)] for k, v in wheel_pts_comp.items()},
                "telemetry": telem_comp.model_dump(),
                "is_safe": True
            }

            frames_data.append({
                "frame_index": idx,
                "timestamp_sec": round(timestamp_sec, 3),
                "bbox": bbox_prim,
                "center": [round(cx_prim, 1), round(cy_prim, 1)],
                "track_coords_m": [round(cx_prim * 0.5, 2), round(cy_prim * 0.5, 2)],
                "heading_deg": round(math.degrees(heading_prim), 1),
                "heading_rad": round(heading_prim, 3),
                "wheel_pts": {k: [round(v[0], 1), round(v[1], 1)] for k, v in wheel_pts_prim.items()},
                "telemetry": telem_prim.model_dump(),
                "companion_vehicle": companion_data,
                "jpeg_bytes": jpeg_bytes
            })

        return frames_data


if __name__ == "__main__":
    gen = VideoGenerator()
    frames = gen.generate_austria_session_sequence(corner_id="RBR-T9", num_frames=90, incident_excursion=True)
    print(f"Generated {len(frames)} Austrian GP Haas VF-24 frames successfully.")
