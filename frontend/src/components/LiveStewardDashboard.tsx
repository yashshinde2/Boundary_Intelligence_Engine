import React, { useState, useEffect, useRef } from 'react';
import type { 
  FrameAnalysisResult, 
  CornerItem, 
  Incident 
} from '../types';
import { 
  ShieldAlert, 
  Radio, 
  Play, 
  Pause, 
  CheckCircle
} from 'lucide-react';
import { API_URL, WS_URL } from '../config';

interface LiveStewardDashboardProps {
  corners: CornerItem[];
  selectedCornerId: string;
  onSelectCorner: (id: string) => void;
  onOpenIncidentReview: (incidentId: string) => void;
  onSetLiveStreaming: (isStreaming: boolean) => void;
  activeVideoId?: string | null;
  mode?: 'synthetic' | 'live_analysis';
  selectedDriverNumber?: number;
}

export const LiveStewardDashboard: React.FC<LiveStewardDashboardProps> = ({
  corners,
  selectedCornerId,
  onSelectCorner,
  onOpenIncidentReview,
  onSetLiveStreaming,
  activeVideoId = null,
  mode = 'synthetic',
  selectedDriverNumber = 31
}) => {
  const [frameData, setFrameData] = useState<FrameAnalysisResult | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showFootprint, setShowFootprint] = useState(true);
  const [showCompanion, setShowCompanion] = useState(false);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [adjudicationSuccess, setAdjudicationSuccess] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Connect to WebSocket for real-time video and telemetry stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    let shouldReconnect = true;

    const connectWs = () => {
      if (!isMountedRef.current) return;

      const wsUrl = new URL(`${WS_URL}/ws/session`);
      wsUrl.searchParams.set('mode', mode || 'synthetic');
      if (selectedCornerId) {
        wsUrl.searchParams.set('corner_id', selectedCornerId);
      }
      if (activeVideoId) {
        wsUrl.searchParams.set('video_id', activeVideoId);
      }
      wsUrl.searchParams.set('vehicle_id', String(selectedDriverNumber));

      ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMountedRef.current) {
          onSetLiveStreaming(true);
        }
      };

      ws.onmessage = (event) => {
        if (isPaused || !isMountedRef.current) return;
        try {
          const data: FrameAnalysisResult = JSON.parse(event.data);
          setFrameData(data);
        } catch (e) {
          console.error('Error parsing frame WS message:', e);
        }
      };

      ws.onclose = () => {
        if (isMountedRef.current) {
          onSetLiveStreaming(false);
          if (shouldReconnect) {
            setTimeout(connectWs, 2000);
          }
        }
      };

      ws.onerror = () => {
        if (isMountedRef.current) {
          onSetLiveStreaming(false);
        }
      };
    };

    connectWs();
    fetchRecentIncidents();

    return () => {
      shouldReconnect = false;
      if (ws) {
        ws.close();
      }
    };
  }, [isPaused, selectedCornerId, activeVideoId, mode, selectedDriverNumber]);

  const fetchRecentIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        setRecentIncidents(data);
      }
    } catch (e) {
      console.error('Error fetching incidents:', e);
    }
  };

  const handleQuickAdjudicate = async (action: 'CONFIRM' | 'DISMISS') => {
    const targetId = recentIncidents.length > 0 ? recentIncidents[0].incident_id : 'AUT2024-RACE-0027';
    try {
      const res = await fetch(`${API_URL}/api/incidents/${targetId}/adjudicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          steward_name: 'G. Connelly (FIA Lead Steward)',
          notes: action === 'CONFIRM' 
            ? 'Lap time deleted under FIA Sporting Regulations Art 33.3 (all 4 wheels beyond track limit line).'
            : 'Dismissed by Stewards - Car maintained legal contact.'
        })
      });

      if (res.ok) {
        setAdjudicationSuccess(action === 'CONFIRM' ? 'LAP DELETED â€¢ OFFENCE CONFIRMED' : 'INCIDENT DISMISSED');
        fetchRecentIncidents();
        setTimeout(() => setAdjudicationSuccess(null), 4000);
      }
    } catch (e) {
      console.error('Failed to quick adjudicate:', e);
    }
  };

  // Render video frame and overlays on Canvas
  useEffect(() => {
    if (!frameData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = frameData.frame_b64;
    img.onload = () => {
      canvas.width = 1280;
      canvas.height = 720;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (!showOverlays) return;

      // 1. Draw Calibrated Legal Track Polygon
      const curCorner = corners.find(c => c.corner_id === frameData.corner_id);
      if (curCorner && curCorner.calibration.legal_polygon) {
        ctx.beginPath();
        const poly = curCorner.calibration.legal_polygon;
        ctx.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i][0], poly[i][1]);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 2. Draw Companion Vehicle (#87 Bearman) if present and safe
      if (showCompanion && frameData.companion_vehicle) {
        const comp = frameData.companion_vehicle;
        const [cx1, cy1, cx2, cy2] = comp.bbox;
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(cx1, cy1, cx2 - cx1, cy2 - cy1);

        ctx.fillStyle = 'rgba(0, 229, 255, 0.85)';
        ctx.fillRect(cx1, cy1 - 20, 160, 18);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText(`${comp.driver_name} (LEGAL TRACK)`, cx1 + 5, cy1 - 7);

        // Companion 4 Wheels
        if (showFootprint && comp.wheel_pts) {
          Object.entries(comp.wheel_pts).forEach(([_, pt]) => {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 5.5, 0, 2 * Math.PI);
            ctx.fillStyle = '#00E676';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#FFFFFF';
            ctx.stroke();
          });
        }
      }

      // 3. Draw Primary Vehicle Bounding Box (Highlighted Red for Violation)
      const [bx1, by1, bx2, by2] = frameData.bbox;
      const isViol = frameData.state === 'VIOLATION';
      const isBorder = frameData.state === 'BORDERLINE';

      ctx.strokeStyle = isViol ? '#E10600' : isBorder ? '#FFB800' : '#00E676';
      ctx.lineWidth = isViol ? 3.5 : 2.5;
      ctx.strokeRect(bx1, by1, bx2 - bx1, by2 - by1);

      // Label on Bounding Box
      ctx.fillStyle = isViol ? 'rgba(225, 6, 0, 0.90)' : isBorder ? 'rgba(255, 184, 0, 0.85)' : 'rgba(0, 230, 118, 0.85)';
      ctx.fillRect(bx1, by1 - 22, 210, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(`${frameData.car_model || 'VF-26'} ${frameData.driver_name} (${frameData.margin_to_boundary_cm > 0 ? '+' : ''}${frameData.margin_to_boundary_cm}cm)`, bx1 + 6, by1 - 8);

      // 4. Draw 4 Wheel Footprint Contact Patches with Exact Coordinates
      if (showFootprint && frameData.footprint) {
        const fp = frameData.footprint;
        const wheels = [
          { name: 'FL', pt: fp.fl_coords, inside: fp.fl_inside },
          { name: 'FR', pt: fp.fr_coords, inside: fp.fr_inside },
          { name: 'RL', pt: fp.rl_coords, inside: fp.rl_inside },
          { name: 'RR', pt: fp.rr_coords, inside: fp.rr_inside }
        ];

        wheels.forEach(w => {
          ctx.beginPath();
          ctx.arc(w.pt[0], w.pt[1], 7.5, 0, 2 * Math.PI);
          ctx.fillStyle = w.inside ? '#00E676' : '#E10600';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#FFFFFF';
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(w.name, w.pt[0] - 6, w.pt[1] - 10);
        });
      }
    };
  }, [frameData, showOverlays, showFootprint, showCompanion, corners]);

  const isRealVideo = mode === 'live_analysis' && Boolean(activeVideoId);

  const telemetry = frameData?.telemetry;
  const physicsMetrics = [
    { label: 'Speed', value: `${telemetry?.speed_kmh ?? 0} km/h`, tone: 'text-cyan-300' },
    { label: 'Lateral G', value: `${telemetry?.lateral_g ?? 0} G`, tone: 'text-amber-300' },
    { label: 'Throttle', value: `${telemetry?.throttle_pct ?? 0}%`, tone: 'text-emerald-300' },
    { label: 'Steering', value: `${telemetry?.steering_deg ?? 0}°`, tone: 'text-violet-300' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className={`rounded-xl border p-3 ${
          frameData?.state === 'VIOLATION'
            ? 'border-red-500/50 bg-red-950/20'
            : frameData?.state === 'BORDERLINE'
            ? 'border-amber-500/50 bg-amber-950/20'
            : frameData?.state === 'RECOVERED'
            ? 'border-cyan-500/50 bg-cyan-950/20'
            : 'border-emerald-500/40 bg-emerald-950/20'
        }`}>
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">System state</div>
          <div className={`mt-1 text-xl font-black ${
            frameData?.state === 'VIOLATION' ? 'text-red-500' : frameData?.state === 'BORDERLINE' ? 'text-amber-400' : frameData?.state === 'RECOVERED' ? 'text-cyan-400' : 'text-emerald-400'
          }`}>{frameData?.state ?? 'SAFE'}</div>
        </div>

        <div className="rounded-xl border border-[#222232] bg-[#101018] p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Boundary margin</div>
          <div className={`mt-1 text-xl font-black font-mono ${
            (frameData?.margin_to_boundary_cm ?? 0) < 0 ? 'text-red-500' : (frameData?.margin_to_boundary_cm ?? 0) <= 15 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {(frameData?.margin_to_boundary_cm ?? 0) > 0 ? '+' : ''}{frameData?.margin_to_boundary_cm ?? 0}cm
          </div>
        </div>

        <div className="rounded-xl border border-[#222232] bg-[#101018] p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Wheels out</div>
          <div className="mt-1 text-xl font-black font-mono text-white">{frameData?.footprint?.wheels_out_count ?? 0}/4</div>
        </div>

        <div className="rounded-xl border border-[#222232] bg-[#101018] p-3">
          <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Confidence</div>
          <div className="mt-1 text-xl font-black font-mono text-cyan-400">{frameData?.confidence?.confidence_percentage ?? 97.8}%</div>
        </div>
      </div>

      {adjudicationSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/60 bg-emerald-600/15 px-4 py-2 text-sm font-medium text-emerald-200">
          <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />{adjudicationSuccess}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">FIA logged</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.65fr_0.95fr]">
        <section className="rounded-2xl border border-[#222232] bg-[#0d0d13] p-3">
          <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-gray-300">
              <Radio className="w-3.5 h-3.5 text-red-500" />
              {isRealVideo ? 'LIVE VIDEO' : 'SIM FEED'}
            </div>
            <div className="flex items-center gap-2">
              {corners.slice(0, 5).map((c) => (
                <button
                  key={c.corner_id}
                  onClick={() => onSelectCorner(c.corner_id)}
                  className={`rounded px-2 py-1 text-[10px] font-mono font-bold border ${
                    selectedCornerId === c.corner_id
                      ? 'border-red-500 bg-red-600 text-white'
                      : 'border-[#222232] bg-[#101018] text-gray-400'
                  }`}
                >
                  T{c.turn_number}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.18em] text-gray-400">
            <span>{frameData?.timestamp_str ?? '00:32:17.40'} • Lap {frameData?.lap ?? 12}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowOverlays(!showOverlays)} className={`rounded px-2 py-1 ${showOverlays ? 'bg-cyan-500/15 text-cyan-300' : 'bg-[#121218] text-gray-400'}`}>Boundary</button>
              <button onClick={() => setShowFootprint(!showFootprint)} className={`rounded px-2 py-1 ${showFootprint ? 'bg-emerald-500/15 text-emerald-300' : 'bg-[#121218] text-gray-400'}`}>Footprint</button>
              <button onClick={() => setIsPaused(!isPaused)} className="rounded border border-[#2b2b3a] bg-[#181821] p-1.5 text-white">{isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}</button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-[#222232] bg-black aspect-video">
            <canvas ref={canvasRef} className="h-full w-full object-contain" />
            {frameData?.state === 'VIOLATION' && (
              <div className="absolute inset-x-4 top-4 rounded-lg border border-red-400 bg-red-600/90 p-3 text-white shadow-2xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em]">Track limit violation</div>
                      <div className="text-[11px] font-mono text-red-100">{frameData.driver_name} • {frameData.margin_to_boundary_cm}cm • {frameData.consecutive_outside} frames</div>
                    </div>
                  </div>
                  <button onClick={() => handleQuickAdjudicate('CONFIRM')} className="rounded bg-white px-2 py-1 text-[10px] font-bold text-red-700">Delete lap</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#222232] bg-[#0d0d13] p-4">
            <div className="mb-3 flex items-center justify-between border-b border-[#1f1f2c] pb-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Physics outcome</div>
              <span className="text-[10px] font-mono text-cyan-300">{frameData?.confidence?.verdict ?? 'HIGH CONFIDENCE'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {physicsMetrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-[#1f1f2c] bg-[#101018] p-2.5">
                  <div className="text-[9px] uppercase tracking-[0.16em] text-gray-400">{metric.label}</div>
                  <div className={`mt-1 text-base font-black font-mono ${metric.tone}`}>{metric.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-[#222232] bg-[#101018] p-3 text-sm text-gray-300">
              <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Rule result</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-medium text-white">Driver</span>
                <span className="font-mono text-white">#{frameData?.vehicle_id ?? selectedDriverNumber}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-medium text-white">Corner</span>
                <span className="font-mono text-white">T{corners.find(c => c.corner_id === selectedCornerId)?.turn_number ?? '9'}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-medium text-white">Verdict</span>
                <span className={((frameData?.margin_to_boundary_cm ?? 0) < 0 ? 'text-red-400' : 'text-emerald-400')}>
                  {(frameData?.margin_to_boundary_cm ?? 0) < 0 ? 'Excursion' : 'Legal'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#222232] bg-[#0d0d13] p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-gray-400">Steward action</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleQuickAdjudicate('CONFIRM')} className="rounded-md bg-red-600 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white">Delete lap</button>
              <button onClick={() => handleQuickAdjudicate('DISMISS')} className="rounded-md border border-emerald-700 bg-emerald-900/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Dismiss</button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#222232] bg-[#0d0d13] p-4">
            <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-gray-400">Incident queue</div>
            {recentIncidents.slice(0, 3).map((inc) => (
              <button
                key={inc.incident_id}
                onClick={() => onOpenIncidentReview(inc.incident_id)}
                className="mb-2 block w-full rounded-lg border border-[#222232] bg-[#101018] p-2 text-left hover:border-red-600/50"
              >
                <div className="flex justify-between text-[10px] text-gray-300">
                  <span className="font-mono">{inc.incident_id}</span>
                  <span className="text-red-400">{inc.status.replace('_', ' ')}</span>
                </div>
                <div className="mt-1 text-[11px] text-gray-400">Lap {inc.lap} • Car #{inc.vehicle_id} • {inc.min_margin_cm}cm</div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};


