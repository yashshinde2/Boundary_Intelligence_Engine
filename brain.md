# 🏎️ TrackShift 2026 — Comprehensive Project Brain & Technical Reference (brain.md)

> **Boundary Intelligence Engine (BIE) for Formula 1 & High-Performance Motorsport**  
> *Pre-Race Strategic Risk Mapping, Computer Vision Spatial Compliance & Human-in-the-Loop Steward Decision Support*

---

## 📌 1. Project Manifesto & Core Philosophy

### 1.1 The Fundamental Problem
In modern Formula 1 (e.g., Austrian Grand Prix at the Red Bull Ring), track limit enforcement is notoriously contentious:
- **Human Delay**: Stewards review hundreds of potential excursions manually during a 71-lap race, causing lap time deletions or penalties to be issued 15–30 minutes after the incident.
- **Reactive, Not Proactive**: Drivers and race engineers push to the absolute physical limit without probabilistic awareness of their risk envelope under changing fuel loads, tyre degradation, and track temperatures.
- **Lack of Explainability**: Automated systems often act as "black boxes", alienating drivers, teams, and fans.

### 1.2 The TrackShift 2026 Solution
TrackShift 2026 bridges the gap between **Race Engineering Strategy** and **FIA Steward Adjudication**:
1. **Pre-Race Strategic Risk Mapping**: Computes margin distributions across practice laps and simulates What-If scenarios (*"How much risk does a +12cm wider line add on Lap 35 on worn Medium tyres, and what is the exact lap time penalty to stay safe?"*).
2. **Real-Time Vision & Spatial Containment**: Fuses YOLO/OpenCV object detection with ByteTrack spatial persistence and Shapely polygon 4-wheel footprint geometry.
3. **Multi-Signal Explainable Confidence**: Combines visual, geometric, temporal, and physical telemetry data into a transparent 5-factor confidence score.
4. **Human-in-the-Loop Decision Support**: AI automatically flags evidence and renders a 10-second synchronized replay clip (±5s); the FIA steward retains final adjudicative authority.

---

## 🏗️ 2. System Architecture & End-to-End Data Pipeline

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DATA SOURCES & INGESTION                                │
│  - Broadcast / CCTV Race Video (.mp4, .avi, .mov)                               │
│  - CAN-Bus High-Frequency Telemetry CSV (Speed, Lat-G, Steer, Throttle, Brake)  │
│  - Procedural / High-Fidelity Simulation Fallback (Haas VF-24 @ Red Bull Ring)  │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    COMPUTER VISION & SPATIAL ENGINE                             │
│                                                                                 │
│  1. VideoIngestEngine (OpenCV)                                                  │
│     └─ Frame Extraction @ Native FPS, Resolution Probing, Timestamp Alignment  │
│                                                                                 │
│  2. VehicleDetector (YOLOv8/v11 + CV Optical Flow / Contour Fallback)           │
│     └─ Bounding Box Localization [x1, y1, x2, y2] with Class Confidence         │
│                                                                                 │
│  3. SpatialTracker (ByteTrack IoU + Trajectory Persistence)                     │
│     └─ Multi-Object Association, Track Age, Disappearance Grace Period          │
│                                                                                 │
│  4. GeometryEngine (Shapely Polygon Containment)                                │
│     ├─ 4-Wheel Contact Footprint (FL, FR, RL, RR) Matrix                        │
│     ├─ Margin-to-Legal-Boundary (in cm, scaled to physical track dimensions)    │
│     └─ State Machine: [SAFE] ➔ [BORDERLINE] ➔ [VIOLATION] ➔ [RECOVERED]         │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TELEMETRY FUSION & CONFIDENCE SCORING                        │
│                                                                                 │
│  5. ConfidenceEngine (5-Factor Weighted Evidence Formula)                       │
│     ├─ C_det  (30%): YOLO Detection Certainty                                  │
│     ├─ C_trk  (20%): ByteTrack Spatial Continuity                              │
│     ├─ C_geom (25%): Geometric Distance to Boundary Line                        │
│     ├─ C_temp (15%): Consecutive Frame Persistence                              │
│     └─ C_telem(10%): Physical Agreement (Lateral G vs Steering Angle)           │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       │
                   ┌───────────────────┴───────────────────┐
                   ▼                                       ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│    STRATEGIC INTELLIGENCE LAYER     │ │     STEWARD DECISION DOSSIER        │
│                                     │ │                                     │
│  - Margin Distribution Histograms   │ │  - Live Canvas Frame & HUD Stream   │
│  - What-If Race Simulator:          │ │  - 10s Replay Clip Generator (±5s)  │
│    * Tyre Compound & Wear Stint     │ │  - Explainable Evidence Breakdown   │
│    * Fuel Load (10–110 kg)          │ │  - Human-in-the-Loop Adjudication   │
│    * Track Temperature & Weather    │ │    [CONFIRM (Delete Lap) / DISMISS] │
│  - Risk vs. Lap-Time Trade-off      │ │  - Real-Time Incidents Queue        │
└─────────────────────────────────────┘ └─────────────────────────────────────┘
```

---

## ⚙️ 3. Core Modules & Algorithmic Breakdown

### 3.1 Video Ingestion & Probing (`backend/engine/video_ingest.py`)
- **`extract_metadata(video_path)`**: Probes video duration, FPS, width, height, and total frame count via OpenCV `VideoCapture`.
- **`get_frame(video_path, frame_index)`**: Random-access frame retrieval by 1-based frame index.
- **`get_frame_jpeg(video_path, frame_index, quality=85)`**: Encodes extracted frame to compressed JPEG bytes for real-time canvas streaming and calibration overlays.
- **`iter_frames(video_path, step=1)`**: High-performance generator yielding `(frame_idx, frame_bgr, timestamp_sec)` for sequential pipeline analysis.

### 3.2 Vehicle Detection (`backend/engine/detector.py`)
- **Dual-Engine Architecture**:
  1. **YOLOv8/v11 Model**: When weights are provided (`ultralytics`), runs inference targeting vehicles (COCO classes: `car`, `truck`, `bus`).
  2. **High-Performance Optical Flow / Contour Fallback**: Analyzes HSV color masking (Haas matte black chassis, red endplates, white sidepod accents) and contour aspect ratios (`0.8 <= w/h <= 3.5`, `area > 1200 px²`).

### 3.3 Spatial Tracking (`backend/engine/tracker.py`)
- **ByteTrack-Inspired Spatial Tracker**:
  - Computes Intersection-over-Union (IoU) matrix between existing track bounding boxes and current frame detections.
  - Maintains persistent vehicle IDs across temporary occlusions (`max_disappeared=15`).
  - Evaluates tracking trajectory smoothness and continuity score:
    $$\text{Tracking Continuity} = \min\left(1.0,\, 0.70 + (\text{Track Age} \times 0.03)\right)$$

### 3.4 Geometric Spatial Containment & State Machine (`backend/engine/geometry.py`)
- **4-Wheel Contact Footprint Estimation**:
  - Calculates coordinate positions for 4 tyre contact patches from vehicle bounding box and aspect ratio:
    - **Front-Left (FL)**: `(x1 + 0.15*w, y1 + 0.18*h)`
    - **Front-Right (FR)**: `(x2 - 0.15*w, y1 + 0.18*h)`
    - **Rear-Left (RL)**: `(x1 + 0.15*w, y2 - 0.18*h)`
    - **Rear-Right (RR)**: `(x2 - 0.15*w, y2 - 0.18*h)`
  - Tests each tyre contact patch against calibrated Shapely `Polygon` representing legal track limits.
- **Physical Margin Calculation**:
  - Computes exact distance in centimeters between outer tyre contact points and nearest legal track edge:
    - **Positive Margin ($>0\,\text{cm}$)**: Inside legal track limit.
    - **Negative Margin ($<0\,\text{cm}$)**: Beyond legal track limit onto kerb/runoff.
- **State Machine Transitions**:
  - **`SAFE`**: $\ge 1$ wheel safely on legal track surface.
  - **`BORDERLINE`**: All 4 wheels outside legal boundary, but consecutive frames $< 3$.
  - **`VIOLATION`**: All 4 wheels outside legal boundary for $\ge 3$ consecutive frames.
  - **`RECOVERED`**: Vehicle re-establishes $\ge 1$ wheel within legal track limits for $\ge 2$ consecutive frames.

### 3.5 Explainable Multi-Factor Confidence Scoring (`backend/engine/confidence.py`)
The system computes an explainable confidence score ($0.0 \to 1.0$) based on 5 weighted signals:
$$C_{\text{total}} = 0.30\,C_{\text{det}} + 0.20\,C_{\text{trk}} + 0.25\,C_{\text{geom}} + 0.15\,C_{\text{temp}} + 0.10\,C_{\text{telem}}$$

1. **$C_{\text{det}}$ (Detection Certainty, 30%)**: Raw YOLO / contour detection score.
2. **$C_{\text{trk}}$ (Tracking Consistency, 20%)**: Spatial trajectory continuity and track age.
3. **$C_{\text{geom}}$ (Geometric Evidence, 25%)**: Scaled distance beyond track boundary:
   $$C_{\text{geom}} = \min\left(1.0,\, 0.70 + \frac{|\text{margin\_cm}|}{20.0} \times 0.30\right)$$
4. **$C_{\text{temp}}$ (Temporal Persistence, 15%)**: Number of consecutive violation frames:
   $$C_{\text{temp}} = \min(1.0,\, \text{frames\_out} \times 0.25)$$
5. **$C_{\text{telem}}$ (Physical Telemetry Agreement, 10%)**: Cross-references lateral acceleration with steering input:
   $$C_{\text{telem}} = \begin{cases} 0.95 & \text{if Lateral G} > 3.0\text{ and } \text{Throttle} > 80\% \\ 0.85 & \text{otherwise} \end{cases}$$

### 3.6 Strategic Risk & What-If Simulation Engine (`backend/engine/strategy_simulation.py`)
- **Margin Distribution Analysis**: Computes Mean, Standard Deviation, P10, P50, and P90 margin statistics for any corner.
- **What-If Scenario Simulation**:
  - **Tyre Compound Factor**: Soft (`+4%` grip), Medium (`0%`), Hard (`-4%` grip).
  - **Tyre Degradation Drift**: Shifts racing line outward by $+0.35\,\text{cm}$ per lap of tyre age.
  - **Fuel Load Inertia**: Heavy fuel ($100\,\text{kg}$) increases outward lateral drift by $+0.12\,\text{cm}/\text{kg}$.
  - **Line Offset Tradeoff Curve**: Simulates line adjustments from $-20\,\text{cm}$ to $+30\,\text{cm}$, calculating the exact projected violation risk (%) and lap-time delta (ms) using the empirical derivative ($+1\,\text{cm}$ inward offset $\approx +4.2\,\text{ms}$ lap time).

### 3.7 Analysis Pipeline & Replay Clip Generator (`backend/engine/analysis_pipeline.py`)
- Executes batch video processing as background tasks.
- **10-Second Synchronized Replay Export**:
  - On confirmed violation, extracts a 10-second window ($\pm 5\,\text{s}$) around the excursion timestamp.
  - Burns in legal boundary polygons (yellow/cyan), vehicle bounding box, 4-wheel contact dots, and FIA violation HUD banner.
  - Exports to `backend/output/incident_{incident_id}.mp4` and serves via `GET /api/incidents/{id}/replay`.

---

## 🗄️ 4. Database Schema (SQLite)

### 4.1 Tables
- **`corners`**: `corner_id` (PK), `track_id`, `track_name`, `corner_name`, `turn_number`, `speed_category`, `danger_threshold_cm`, `calibration_json`.
- **`vehicles`**: `vehicle_id` (PK), `car_number`, `driver_name`, `team_name`, `color_hex`.
- **`practice_laps`**: `lap_id` (PK), `vehicle_id`, `corner_id`, `lap_number`, `entry_speed_kmh`, `apex_speed_kmh`, `exit_speed_kmh`, `min_margin_cm`, `lateral_g`, `tyre_compound`, `tyre_age_laps`, `fuel_kg`, `status`, `confidence_score`, `created_at`.
- **`incidents`**: `incident_id` (PK), `timestamp_str`, `timestamp_sec`, `vehicle_id`, `corner_id`, `lap`, `violation_type`, `side`, `wheels_out`, `min_margin_cm`, `consecutive_frames`, `confidence_json`, `status` (`PENDING_REVIEW`, `UNDER_REVIEW`, `CONFIRMED`, `DISMISSED`), `steward_notes`, `reviewed_by`, `review_timestamp`, `telemetry_json`.
- **`simulations`**: `sim_id` (PK), `corner_id`, `vehicle_id`, `params_json`, `results_json`, `created_at`.
- **`videos`**: `video_id` (PK), `filename`, `filepath`, `uploaded_at`, `duration_sec`, `fps`, `width`, `height`, `status` (`UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`), `current_frame`, `total_frames`, `corner_id`, `telemetry_json`.

---

## 🌐 5. REST & WebSocket API Reference

### 5.1 Video Ingestion & Pipeline
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/video/upload` | Upload `.mp4` video with target corner ID. |
| `GET` | `/api/videos` | List all uploaded videos and status. |
| `GET` | `/api/video/{video_id}/status` | Query processing progress (`frames_done`, `total_frames`, `percent`). |
| `GET` | `/api/video/{video_id}/frame?frame_index=1` | Extract single frame JPEG for track calibration. |
| `POST` | `/api/video/{video_id}/analyze` | Start background YOLO + ByteTrack compliance analysis. |
| `POST` | `/api/video/{video_id}/telemetry` | Upload telemetry CSV for physical fusion. |
| `GET` | `/api/incidents/{incident_id}/replay` | Stream 10-second video replay clip with burned overlays. |

### 5.2 Real-Time WebSocket
- **`WS /ws/session`**:
  - Query Params: `mode` (`synthetic` \| `live_analysis`), `video_id`, `corner_id`, `vehicle_id`.
  - Emits JSON payload containing: `frame_b64`, `bbox`, `center`, `footprint`, `margin_to_boundary_cm`, `state`, `confidence`, `telemetry`, `incident_flag`.

### 5.3 Corners, Calibration & Strategy
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status and circuit/team metadata. |
| `GET` | `/api/corners` | Retrieve all calibrated corners (RBR T9, T10, T4, T6, T1). |
| `GET` | `/api/corners/{id}` | Get corner details and polygon calibration. |
| `POST` | `/api/corners/{id}/calibrate` | Update legal boundary polygon & danger zone buffer. |
| `GET` | `/api/strategy/distribution/{id}` | Statistical margin distribution and risk scores. |
| `POST` | `/api/strategy/simulate` | Run What-If simulation with tyre/fuel/line parameters. |
| `GET` | `/api/incidents` | List all flagged track limit incidents. |
| `GET` | `/api/incidents/{id}` | Get incident evidence dossier and telemetry snapshot. |
| `POST` | `/api/incidents/{id}/adjudicate` | Record FIA steward verdict (`CONFIRM` / `DISMISS`) with notes. |

---

## 🎨 6. Frontend Architecture & Design System

### 6.1 Technology Stack
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 + Vanilla CSS Design Tokens.
- **Iconography**: Lucide React.
- **Visualization**: Recharts + HTML5 Canvas.
- **Configuration**: Centralized `frontend/src/config.ts` reading `import.meta.env` (`VITE_API_URL`, `VITE_WS_URL`).

### 6.2 Haas F1 Dark / Carbon Design Tokens
- **Primary Haas Red**: `#E10600` (Gradients to `#800300`)
- **Telemetry Cyan**: `#00E5FF`
- **Advisory Amber**: `#FFB800`
- **Compliance Green**: `#00E676`
- **Background Matte Carbon**: `#0b0b0f` / `#101017`
- **Card Surface**: `#14141f` with border `#242434`

### 6.3 Dashboard Views
1. **Video Pipeline (`VideoUploadView.tsx`)**: Race footage upload, telemetry CSV attachment, progress bar, quick analysis trigger.
2. **Steward Live Vision (`LiveStewardDashboard.tsx`)**: Real-time canvas with boundary polygon overlays, 4-wheel contact patches, telemetry HUD gauges, and explainable confidence meter.
3. **Strategic Risk Mapping (`StrategicDashboard.tsx`)**: Practice margin distribution, What-If simulation sliders, and risk vs. lap time tradeoff curves.
4. **Track Calibration Tool (`TrackCalibrationTool.tsx`)**: Interactive canvas polygon vertex editor with real-video frame scrubbing slider.
5. **Incidents Queue & Review Modal (`IncidentsQueueView.tsx`, `IncidentReviewModal.tsx`)**: Incident review dossier with 10s replay video player, telemetry table, and steward confirmation buttons.

---

## 🚀 7. Developer Runbook

### 7.1 Spin-up with Docker Compose
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

### 7.2 Local Development
```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate    # Windows
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

### 7.3 Automated Testing
```bash
cd backend
python -m pytest tests/
```
*Current test suite passing 20/20 unit and integration tests (100%).*

---

## 🗺️ 8. Future Roadmap & Production Enhancements
- [ ] **Multi-Camera Multi-View Fusion**: Triangulating vehicle position from overhead helicopter and apex kerb CCTV cameras.
- [ ] **Direct FastF1 / Live Timing Ingestion**: Real-time OpenF1 / FastF1 session telemetry telemetry stream integration.
- [ ] **GPU Acceleration**: TensorRT / ONNX Runtime execution for YOLOv11 at 120 FPS on multi-car 4K feeds.
- [ ] **Automated Kerb Wear Compensation**: Dynamic boundary adjustment based on track kerb degradation during 300 km grand prix distances.
