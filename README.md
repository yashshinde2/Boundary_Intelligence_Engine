# 🏎️ TrackShift 2026 — Boundary Intelligence Engine (BIE)
> **Pre-Race Strategic Risk Mapping & Spatial Compliance Intelligence for Motorsport**  
> *"Don’t just tell stewards a violation happened. Provide real-time computer vision detection, 4-wheel footprint spatial containment, synchronized telemetry fusion, and tell race engineers what it costs in lap time to stay safely inside the limit."*

---

## 🌟 Key Innovations & Architecture

TrackShift 2026 combines **Real Race Video Ingestion**, **Vehicle Detection & Tracking**, **High-Frequency Telemetry Fusion**, **Geometric Spatial Containment**, and **Predictive Race-Condition Simulation**:

```text
Race Video (.mp4) + Telemetry CSV
                 ↓
     Frame Extraction (OpenCV / Ingest Engine)
                 ↓
     Vehicle Detection (YOLO / Optical Flow Contours)
                 ↓
     ByteTrack Spatial Tracking (IoU & Trajectory Persistence)
                 ↓
     Track Boundary Geometry Engine (Shapely Polygon Containment)
     (4-Wheel Contact Footprint vs Legal Boundary & Kerb Buffer)
                 ↓
     State Machine (SAFE → BORDERLINE → VIOLATION → RECOVERED)
                 ↓
     Multi-Factor Explainable Confidence Breakdown (5 Weighted Signals)
                 ↓
  ┌──────────────────────────────┴──────────────────────────────┐
  ↓                                                             ↓
STRATEGIC INTELLIGENCE (Race Engineer)           STEWARD LIVE VISION (FIA Adjudication)
- Practice margin distribution per corner        - Real-time video frame & boundary overlay stream
- Race-Day What-If Simulator (Tyre/Fuel/Temp)    - 10s Replay Clip Generation (±5s with burned overlays)
- Multi-Corner Risk vs Lap-Time Trade-off        - Human-in-the-Loop Confirm / Dismiss ruling workflow
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Computer Vision** | OpenCV (`opencv-python-headless`), YOLO (`ultralytics`), ByteTrack Tracking, Shapely Geometric Polygons |
| **Backend & APIs** | FastAPI, WebSockets, Python 3.11, Pydantic v2, NumPy, SciPy, Pandas, SQLite |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, HTML5 Canvas |
| **Packaging & Docker** | Docker, Docker Compose, Centralized Configuration (`config.ts`, `.env.example`) |
| **Design System** | MoneyGram Haas F1 Team Dark/Carbon aesthetic (`#E10600`, `#00E5FF`, `#FFB800`, `#00E676`) |

---

## 🚀 Quick Start Guide

### Option A: One-Command Spin-up via Docker Compose
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:5173`
- Backend REST API: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`

---

### Option B: Local Development Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- Health Check: `http://localhost:8000/api/health`
- WebSocket Feed: `ws://localhost:8000/ws/session`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

#### 3. Run Automated Test Suite
```bash
cd backend
python -m pytest tests/
```

---

## 📡 REST & WebSocket API Endpoints

### Video Ingestion & Compliance Analysis
- `POST /api/video/upload` — Upload race video (`.mp4`, `.avi`, `.mov`) with selected corner ID.
- `GET /api/videos` — List all uploaded session videos with processing status.
- `GET /api/video/{video_id}/status` — Progress polling (`current_frame`, `total_frames`, `percent_complete`).
- `GET /api/video/{video_id}/frame?frame_index=1` — Extract single frame for track calibration.
- `POST /api/video/{video_id}/analyze` — Trigger automated YOLO + ByteTrack compliance analysis in the background.
- `POST /api/video/{video_id}/telemetry` — Upload CSV telemetry for fusion (`timestamp,vehicle_id,speed,lateral_g,steering,throttle,brake`).
- `GET /api/incidents/{incident_id}/replay` — Serve the generated 10-second video replay clip (`.mp4`) with burned-in overlays.

### Live WebSocket Stream
- `WS /ws/session?mode=synthetic` — High-fidelity Austrian GP Haas VF-24 simulation feed (default fallback).
- `WS /ws/session?mode=live_analysis&video_id={id}&corner_id=RBR-T9&vehicle_id=27` — Stream frame-by-frame real video detections and compliance evaluations.

### Strategic Risk & Calibration
- `GET /api/corners` — List all calibrated corners (Red Bull Ring Turns 9, 10, 4, 6, 1).
- `POST /api/corners/{corner_id}/calibrate` — Update legal boundary polygon and danger zone buffers.
- `GET /api/strategy/distribution/{corner_id}` — Get margin distribution histogram and statistical risk.
- `POST /api/strategy/simulate` — Run What-If scenario simulations with tyre degradation, fuel load, and line offset tradeoffs.
- `GET /api/incidents` & `POST /api/incidents/{incident_id}/adjudicate` — Steward incident queue and human-in-the-loop ruling dossier.
