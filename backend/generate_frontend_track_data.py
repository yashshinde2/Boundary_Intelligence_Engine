import os
import json
from engine.real_telemetry_loader import RealTelemetryLoader

res = RealTelemetryLoader.get_circuit_svg_path_and_corners(width=800, height=450, padding=45)
meta = RealTelemetryLoader.get_circuit_metadata()

data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "src", "data")
os.makedirs(data_dir, exist_ok=True)
target_path = os.path.join(data_dir, "austriaTrackPath.ts")

content = f"""// Authentic Formula 1 Red Bull Ring (Spielberg, Austria) Official Circuit Geometry
// Sourced from MultiViewer & OpenF1 Official FIA Track Data (539 track points)

export const OFFICIAL_AUSTRIAN_GP_SVG_PATH = "{res['svg_path_d']}";

export const OFFICIAL_CORNERS = {json.dumps(res['corners'], indent=2)};

export const CIRCUIT_METADATA = {json.dumps(meta, indent=2)};
"""

with open(target_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated {target_path} successfully. Size: {os.path.getsize(target_path)} bytes.")
