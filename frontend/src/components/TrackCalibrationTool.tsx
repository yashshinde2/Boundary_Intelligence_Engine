import React, { useState, useEffect, useRef } from 'react';
import type { CornerItem, CornerCalibration } from '../types';
import { 
  Sliders, 
  Save, 
  RotateCcw, 
  Plus, 
  Check, 
  Crosshair, 
  HelpCircle, 
  Video
} from 'lucide-react';
import { API_URL } from '../config';

interface TrackCalibrationToolProps {
  corners: CornerItem[];
  selectedCornerId: string;
  onSelectCorner: (id: string) => void;
  onCalibrationSaved: () => void;
  activeVideoId?: string | null;
}

export const TrackCalibrationTool: React.FC<TrackCalibrationToolProps> = ({
  corners,
  selectedCornerId,
  onSelectCorner,
  onCalibrationSaved,
  activeVideoId = null
}) => {
  const currentCorner = corners.find(c => c.corner_id === selectedCornerId);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [apexPoint, setApexPoint] = useState<[number, number] | null>(null);
  const [dangerThresholdCm, setDangerThresholdCm] = useState<number>(15.0);
  const [activeTool, setActiveTool] = useState<'POLYGON' | 'APEX'>('POLYGON');
  const [draggedPointIdx, setDraggedPointIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [frameIndex, setFrameIndex] = useState(1);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load points when corner changes
  useEffect(() => {
    if (currentCorner) {
      setPoints([...currentCorner.calibration.legal_polygon]);
      setApexPoint(currentCorner.calibration.apex_point ? [...currentCorner.calibration.apex_point] : null);
      setDangerThresholdCm(currentCorner.danger_threshold_cm || 15.0);
      setIsSaved(false);
    }
  }, [currentCorner]);

  // Load real video frame if activeVideoId is provided
  useEffect(() => {
    if (activeVideoId) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${API_URL}/api/video/${activeVideoId}/frame?frame_index=${frameIndex}`;
      img.onload = () => {
        setBgImage(img);
      };
      img.onerror = () => {
        setBgImage(null);
      };
    } else {
      setBgImage(null);
    }
  }, [activeVideoId, frameIndex]);

  // Draw on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
      // 1. Draw Simulated Track Roadway Background
      ctx.fillStyle = '#22242a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Runoff Gravel
      ctx.fillStyle = '#183820';
      ctx.fillRect(0, 0, canvas.width, 340);

      // Kerb Stripes along outer curve
      ctx.strokeStyle = '#E10600';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(120, 560);
      ctx.bezierCurveTo(450, 420, 800, 330, 1140, 320);
      ctx.stroke();
    }

    // 2. Draw Current Calibrated Polygon
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();

      // Semi-transparent legal track fill
      ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.fill();

      // Bright Cyan boundary stroke
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw draggable vertex handles
      points.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 8, 0, 2 * Math.PI);
        ctx.fillStyle = draggedPointIdx === idx ? '#FFB800' : '#E10600';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        // Index label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`P${idx + 1}`, pt[0] + 10, pt[1] - 10);
      });
    }

    // 3. Draw Apex Reference Point
    if (apexPoint) {
      ctx.beginPath();
      ctx.arc(apexPoint[0], apexPoint[1], 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#00E676';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      ctx.fillStyle = '#00E676';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('APEX REFERENCE', apexPoint[0] + 14, apexPoint[1] + 4);
    }

    // 4. Live Cursor Coordinates
    if (mousePos) {
      ctx.fillStyle = '#A0A0B0';
      ctx.font = '11px monospace';
      ctx.fillText(`X: ${mousePos.x}px  Y: ${mousePos.y}px`, 20, canvas.height - 20);
    }
  }, [points, apexPoint, draggedPointIdx, mousePos]);

  // Handle Canvas Mouse Clicks & Drags
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (activeTool === 'APEX') {
      setApexPoint([x, y]);
      setIsSaved(false);
      return;
    }

    // Check if clicked near an existing polygon vertex to drag
    const clickedIdx = points.findIndex(
      (pt) => Math.hypot(pt[0] - x, pt[1] - y) <= 18
    );

    if (clickedIdx !== -1) {
      setDraggedPointIdx(clickedIdx);
    } else {
      // Add new vertex
      setPoints([...points, [x, y]]);
      setIsSaved(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setMousePos({ x, y });

    if (draggedPointIdx !== null) {
      const updated = [...points];
      updated[draggedPointIdx] = [x, y];
      setPoints(updated);
      setIsSaved(false);
    }
  };

  const handleMouseUp = () => {
    setDraggedPointIdx(null);
  };

  const handleReset = () => {
    if (currentCorner) {
      setPoints([...currentCorner.calibration.legal_polygon]);
      setApexPoint(currentCorner.calibration.apex_point ? [...currentCorner.calibration.apex_point] : null);
      setIsSaved(false);
    }
  };

  const handleSaveCalibration = async () => {
    if (!currentCorner) return;
    try {
      setSaving(true);
      const updatedCalib: CornerCalibration = {
        ...currentCorner.calibration,
        legal_polygon: points,
        apex_point: apexPoint || undefined,
        danger_zone_distance_cm: dangerThresholdCm
      };

      const res = await fetch(`${API_URL}/api/corners/${currentCorner.corner_id}/calibrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCalib)
      });

      if (res.ok) {
        setIsSaved(true);
        onCalibrationSaved();
      }
    } catch (e) {
      console.error('Failed to save calibration:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#232332] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#E10600]" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Corner Track Boundary Calibration Tool
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Manually calibrate permitted track boundary polygons, apex coordinates, and safety buffer zones per corner.
          </p>
        </div>

        {/* Corner Selection Tabs */}
        <div className="flex items-center gap-2">
          {corners.map((c) => (
            <button
              key={c.corner_id}
              onClick={() => onSelectCorner(c.corner_id)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                selectedCornerId === c.corner_id
                  ? 'bg-[#E10600] text-white shadow-md shadow-red-900/40'
                  : 'bg-[#12121a] text-gray-400 hover:text-white border border-[#272738]'
              }`}
            >
              {c.corner_name}
            </button>
          ))}
        </div>
      </div>

      {/* Frame Scrubber for Real Video Calibration */}
      {activeVideoId && (
        <div className="f1-card p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#303046]">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-bold text-white uppercase">Calibrating on Real Video Frame</span>
            <span className="text-xs font-mono text-gray-400">({activeVideoId})</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-mono text-gray-300">Frame #{frameIndex}</span>
            <input
              type="range"
              min={1}
              max={300}
              value={frameIndex}
              onChange={(e) => setFrameIndex(parseInt(e.target.value))}
              className="w-48 accent-[#E10600] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Canvas & Calibration Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Area (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="f1-card p-4 space-y-3">
            {/* Toolbar Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTool('POLYGON')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    activeTool === 'POLYGON'
                      ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]'
                      : 'bg-[#121218] text-gray-400 border-[#262638]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Edit Track Polygon ({points.length} pts)</span>
                </button>

                <button
                  onClick={() => setActiveTool('APEX')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                    activeTool === 'APEX'
                      ? 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]'
                      : 'bg-[#121218] text-gray-400 border-[#262638]'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Set Apex Reference</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#161622] text-gray-300 hover:text-white text-xs font-semibold border border-[#2c2c3e]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  onClick={handleSaveCalibration}
                  disabled={saving}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold transition-all ${
                    isSaved
                      ? 'bg-[#00E676] text-black'
                      : 'bg-[#E10600] text-white hover:bg-red-700 shadow-md shadow-red-900/40'
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaved ? 'Calibration Saved' : 'Save Calibration'}</span>
                </button>
              </div>
            </div>

            {/* Canvas Surface */}
            <div className="relative rounded-lg overflow-hidden border border-[#222230] bg-black aspect-video cursor-crosshair">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Parameters & Instructions (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Instructions Box */}
          <div className="f1-card p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#232332] pb-2.5">
              <HelpCircle className="w-4 h-4 text-[#00E5FF]" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Calibration Instructions
              </h3>
            </div>
            <ul className="text-xs text-gray-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF] font-bold">•</span>
                <span>Click on the canvas to add boundary points defining the legal racing surface.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#E10600] font-bold">•</span>
                <span>Click & drag any red vertex handle (<span className="text-[#FFB800]">P1..PN</span>) to adjust track limits.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E676] font-bold">•</span>
                <span>Switch to <strong>Set Apex</strong> to mark the geometric clipping point.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FFB800] font-bold">•</span>
                <span>All spatial geometry calculations and state machines update instantly against these coordinates.</span>
              </li>
            </ul>
          </div>

          {/* Settings Panel */}
          <div className="f1-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#232332] pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Buffer Thresholds
              </span>
              <span className="text-[10px] font-mono text-[#FFB800]">
                Corner Safety Margin
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Danger Zone Buffer (Borderline Zone)</span>
                <span className="font-mono text-white font-bold">{dangerThresholdCm} cm</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                value={dangerThresholdCm}
                onChange={(e) => {
                  setDangerThresholdCm(Number(e.target.value));
                  setIsSaved(false);
                }}
                className="w-full accent-[#FFB800] bg-[#222230] h-1.5 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-gray-400">
                Vehicles with contact patches within {dangerThresholdCm}cm of the boundary line trigger the <span className="text-[#FFB800] font-bold">BORDERLINE</span> state.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
