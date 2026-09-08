import React, { useState, useEffect } from 'react';
import type { 
  CornerItem, 
  DeterministicDemoSeed,
  SessionType,
  WeatherType
} from '../types';
import { 
  Layers, 
  Zap, 
  Sliders 
} from 'lucide-react';
import { AustriaTrackMap } from './AustriaTrackMap';
import { HaasVF26Card } from './HaasVF26Card';
import { MarginHistogram } from './MarginHistogram';
import { RiskVsLapTimeChart } from './RiskVsLapTimeChart';
import { SystemHealthPanel } from './SystemHealthPanel';
import { API_URL } from '../config';

interface StrategicDashboardProps {
  corners: CornerItem[];
  selectedCornerId: string;
  onSelectCorner: (id: string) => void;
  selectedDriverNumber: number;
  onSelectDriver: (num: number) => void;
  selectedSession: SessionType;
  onSelectSession: (sess: SessionType) => void;
}

export const StrategicDashboard: React.FC<StrategicDashboardProps> = ({
  corners,
  selectedCornerId,
  onSelectCorner,
  selectedDriverNumber,
  onSelectDriver,
  selectedSession,
  onSelectSession
}) => {
  const [demoData, setDemoData] = useState<DeterministicDemoSeed | null>(null);

  // Simulation Controls State
  const [tyreCompound, setTyreCompound] = useState<'Soft' | 'Medium' | 'Hard'>('Medium');
  const [tyreAgeLaps, setTyreAgeLaps] = useState<number>(12);
  const [fuelLoadKg, setFuelLoadKg] = useState<number>(52);
  const [trackTempC, setTrackTempC] = useState<number>(28);
  const [weatherCondition, setWeatherCondition] = useState<WeatherType>('Dry');
  const [drivingLineOffsetCm, setDrivingLineOffsetCm] = useState<number>(0);

  // Fetch initial deterministic demo seed & re-run on parameter change
  useEffect(() => {
    runSimulation();
  }, [selectedCornerId, selectedDriverNumber, selectedSession, tyreCompound, tyreAgeLaps, fuelLoadKg, trackTempC, weatherCondition, drivingLineOffsetCm]);

  const runSimulation = async () => {
    try {
      const payload = {
        tyre_compound: tyreCompound,
        tyre_age_laps: tyreAgeLaps,
        fuel_load_kg: fuelLoadKg,
        track_temp_c: trackTempC,
        weather: weatherCondition,
        line_offset_cm: drivingLineOffsetCm,
        driver_number: selectedDriverNumber,
        session: selectedSession,
        corner_id: selectedCornerId
      };

      const res = await fetch(`${API_URL}/api/simulation/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data: DeterministicDemoSeed = await res.json();
        setDemoData(data);
      }
    } catch (e) {
      console.error('Failed to run simulation:', e);
    }
  };

  const driverName = selectedDriverNumber === 27
    ? '#27 NICO HÜLKENBERG'
    : selectedDriverNumber === 31
    ? '#31 ESTEBAN OCON'
    : selectedDriverNumber === 4
    ? '#4 LANDO NORRIS'
    : '#87 OLLIE BEARMAN';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner: Paradigm Quote & Product Framing */}
      <div className="bg-gradient-to-r from-[#171722] via-[#1e1e2c] to-[#171722] border-l-4 border-[#E10600] p-4 rounded-r-lg shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#E10600]" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              TGR Haas F1 Team — Austrian GP 2026 — Red Bull Ring — Boundary Intelligence Simulation
            </h2>
          </div>
          <p className="text-xs text-gray-300 mt-1 italic">
            “Don’t just detect that the car crossed the line. Predict where track-limit risk will occur, quantify the margin, simulate alternative driving strategies, and tell the race engineer what the risk costs.”
          </p>
        </div>

        {/* Driver Toggle in Banner */}
        <div className="flex items-center gap-1.5 bg-[#12121a] p-1 rounded border border-[#272738] shrink-0">
          <button
            onClick={() => onSelectDriver(27)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              selectedDriverNumber === 27
                ? 'bg-[#E10600] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Haas F1 Team - Nico Hülkenberg"
          >
            #27 HÜL
          </button>
          <button
            onClick={() => onSelectDriver(31)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              selectedDriverNumber === 31
                ? 'bg-[#E10600] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
            title="TGR Haas F1 Team - Esteban Ocon"
          >
            #31 OCO
          </button>
          <button
            onClick={() => onSelectDriver(87)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              selectedDriverNumber === 87
                ? 'bg-[#E10600] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
            title="TGR Haas F1 Team - Ollie Bearman"
          >
            #87 BEA
          </button>
          <button
            onClick={() => onSelectDriver(4)}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
              selectedDriverNumber === 4
                ? 'bg-[#FF8700] text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
            title="McLaren F1 Team - Lando Norris"
          >
            #4 NOR
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards (Computed Deterministically by Backend) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="f1-card p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Overall Session Risk
          </span>
          <div className={`text-2xl font-black font-mono ${
            (demoData?.overall_risk_pct ?? 28.7) > 50 ? 'text-[#E10600]' : (demoData?.overall_risk_pct ?? 28.7) > 25 ? 'text-[#FFB800]' : 'text-[#00E676]'
          }`}>
            {demoData?.overall_risk_pct ?? 28.7}%
          </div>
          <span className="text-[10px] text-gray-400">Exposure-weighted aggregate</span>
        </div>

        <div className="f1-card p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Highest Risk Corner
          </span>
          <div className="text-xl font-black text-[#E10600] truncate">
            {demoData?.highest_risk_corner?.name ?? 'Turn 3 - Remus'}
          </div>
          <span className="text-[10px] font-mono text-red-400 font-bold">
            {demoData?.highest_risk_corner?.risk_pct ?? 74.2}% Risk (CRITICAL)
          </span>
        </div>

        <div className="f1-card p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Avg Boundary Margin
          </span>
          <div className="text-2xl font-black font-mono text-[#00E5FF]">
            +{demoData?.avg_boundary_margin_cm ?? 8.6} <span className="text-xs font-normal text-gray-400">cm</span>
          </div>
          <span className="text-[10px] text-gray-400">Weighted track margin</span>
        </div>

        <div className="f1-card p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            Predicted Violations
          </span>
          <div className="text-2xl font-black font-mono text-[#FFB800]">
            {demoData?.predicted_violations ?? 4} <span className="text-xs font-normal text-gray-400">/ 71 laps</span>
          </div>
          <span className="text-[10px] text-gray-400">Under FIA_ALL_FOUR Rule</span>
        </div>
      </div>

      {/* Red Bull Ring 10-Corner Circuit Map */}
      <AustriaTrackMap
        corners={corners}
        selectedCornerId={selectedCornerId}
        onSelectCorner={onSelectCorner}
        dynamicCornerRisks={demoData?.corners || []}
        driverNumber={selectedDriverNumber}
      />

      {/* Main Grid: Practice Risk Charts (Left) & Haas VF-26 + Simulation Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Margin Distribution & Trade-off Curve (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Margin Histogram */}
          <MarginHistogram
            p10={demoData?.margin_distribution?.p10_margin_cm ?? -6.8}
            p50={demoData?.margin_distribution?.p50_margin_cm ?? 5.4}
            p90={demoData?.margin_distribution?.p90_margin_cm ?? 18.2}
            mean={demoData?.margin_distribution?.mean_margin_cm ?? 8.6}
            bins={demoData?.margin_distribution?.histogram_bins || []}
          />

          {/* Risk vs Lap Time Tradeoff Curve */}
          <RiskVsLapTimeChart
            tradeoffCurve={demoData?.tradeoff_curve || []}
            recommendedOffsetCm={demoData?.recommendation?.recommended_line_offset_cm ?? 12.0}
            recommendedRiskPct={demoData?.recommendation?.recommended_risk_pct ?? 12.7}
            lapTimeCostMs={demoData?.recommendation?.lap_time_delta_ms ?? 58}
          />
        </div>

        {/* Right Column: Haas VF-26 Telemetry + What-If Controls + Recommendation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Vehicle Card */}
          <HaasVF26Card
            driverNumber={selectedDriverNumber}
            driverName={driverName}
            lap={demoData?.baseline?.lap ?? 12}
            speedKmh={demoData?.baseline?.speed_kmh ?? 245}
            sector={demoData?.baseline?.sector ?? 3}
            tyreCompound={tyreCompound}
            tyreAgeLaps={tyreAgeLaps}
            fuelKg={fuelLoadKg}
            isSimulated={true}
          />

          {/* AI Strategy Recommendation Card */}
          {demoData?.recommendation && (
            <div className="f1-card p-5 border-l-4 border-l-[#E10600] f1-card-glow-red space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#E10600]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Race Engineer Strategy Recommendation
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-950 text-red-400 border border-red-800">
                  CRITICAL
                </span>
              </div>

              {/* Exact Recommendation Text Block */}
              <div className="bg-[#0f0f15] p-3.5 rounded border border-[#232332] font-mono text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                {demoData.recommendation.rationale}
              </div>

              {/* Metric Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-[#12121a] p-2 rounded">
                  <span className="text-[10px] text-gray-400 block uppercase">Projected Risk</span>
                  <span className="text-base font-mono font-bold text-[#E10600]">
                    {demoData.recommendation.projected_risk_pct}%
                  </span>
                </div>

                <div className="bg-[#12121a] p-2 rounded">
                  <span className="text-[10px] text-gray-400 block uppercase">Rec. Line Shift</span>
                  <span className="text-base font-mono font-bold text-[#00E5FF]">
                    +{demoData.recommendation.recommended_line_offset_cm} <span className="text-[10px]">cm</span>
                  </span>
                </div>

                <div className="bg-[#12121a] p-2 rounded">
                  <span className="text-[10px] text-gray-400 block uppercase">Lap-Time Cost</span>
                  <span className="text-base font-mono font-bold text-[#FFB800]">
                    +{demoData.recommendation.lap_time_delta_ms} <span className="text-[10px]">ms</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive What-If Scenario Simulator Sliders */}
          <div className="f1-card p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-[#232332] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00E5FF]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  What-If Scenario Simulator
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e2d] text-[#00E5FF] font-mono">
                {driverName}
              </span>
            </div>

            {/* Control 1: Session Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium flex items-center justify-between">
                <span>Session Type</span>
                <span className="font-mono text-[#00E5FF]">{selectedSession}</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                {(['FP1', 'FP2', 'FP3'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onSelectSession(s)}
                    className={`py-1 rounded font-bold transition-all border ${
                      selectedSession === s
                        ? 'bg-[#E10600] text-white border-red-500'
                        : 'bg-[#101017] text-gray-400 border-[#262638] hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                {(['QUALIFYING', 'RACE SIMULATION'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onSelectSession(s)}
                    className={`py-1 rounded font-bold transition-all border ${
                      selectedSession === s
                        ? 'bg-[#E10600] text-white border-red-500'
                        : 'bg-[#101017] text-gray-400 border-[#262638] hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 2: Tyre Compound */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium flex items-center justify-between">
                <span>Tyre Compound</span>
                <span className="font-mono text-[#00E5FF]">{tyreCompound}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Soft', 'Medium', 'Hard'] as const).map((comp) => (
                  <button
                    key={comp}
                    onClick={() => setTyreCompound(comp)}
                    className={`py-1.5 rounded text-xs font-bold transition-all border ${
                      tyreCompound === comp
                        ? comp === 'Soft' 
                          ? 'bg-[#E10600] text-white border-red-600'
                          : comp === 'Medium'
                          ? 'bg-[#FFB800] text-black border-amber-500'
                          : 'bg-gray-200 text-black border-white'
                        : 'bg-[#101017] text-gray-400 border-[#262638] hover:text-white'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Tyre Stint Age */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Tyre Stint Age</span>
                <span className="font-mono text-white font-bold">{tyreAgeLaps} Laps</span>
              </div>
              <input
                type="range"
                min={1}
                max={45}
                value={tyreAgeLaps}
                onChange={(e) => setTyreAgeLaps(Number(e.target.value))}
                className="w-full accent-[#E10600] bg-[#222230] h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>New (1 Lap)</span>
                <span>Stint Limit (45 Laps)</span>
              </div>
            </div>

            {/* Control 4: Fuel Load */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Fuel Load</span>
                <span className="font-mono text-white font-bold">{fuelLoadKg} kg</span>
              </div>
              <input
                type="range"
                min={10}
                max={110}
                value={fuelLoadKg}
                onChange={(e) => setFuelLoadKg(Number(e.target.value))}
                className="w-full accent-[#00E5FF] bg-[#222230] h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Low Fuel (10kg)</span>
                <span>Full Tank (110kg)</span>
              </div>
            </div>

            {/* Control 5: Track Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Track Temperature</span>
                <span className="font-mono text-white font-bold">{trackTempC} °C</span>
              </div>
              <input
                type="range"
                min={15}
                max={55}
                value={trackTempC}
                onChange={(e) => setTrackTempC(Number(e.target.value))}
                className="w-full accent-[#FFB800] bg-[#222230] h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>Cool (15°C)</span>
                <span>Hot Track (55°C)</span>
              </div>
            </div>

            {/* Control 6: Weather Switch */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300 font-medium">Weather Condition</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Dry', 'Light Rain', 'Wet'] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeatherCondition(w)}
                    className={`py-1.5 rounded text-xs font-bold transition-all border ${
                      weatherCondition === w
                        ? 'bg-[#00E5FF] text-black border-cyan-400'
                        : 'bg-[#101017] text-gray-400 border-[#262638] hover:text-white'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Control 7: Driving Line Shift Offset */}
            <div className="space-y-1.5 pt-2 border-t border-[#232332]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Racing Line Apex Shift</span>
                <span className={`font-mono font-bold ${drivingLineOffsetCm > 0 ? 'text-[#00E676]' : drivingLineOffsetCm < 0 ? 'text-[#E10600]' : 'text-gray-300'}`}>
                  {drivingLineOffsetCm > 0 ? `+${drivingLineOffsetCm}cm (Inward Margin)` : drivingLineOffsetCm < 0 ? `${drivingLineOffsetCm}cm (Aggressive)` : '0cm (Baseline)'}
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={30}
                value={drivingLineOffsetCm}
                onChange={(e) => setDrivingLineOffsetCm(Number(e.target.value))}
                className="w-full accent-[#00E676] bg-[#222230] h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Subsystem Health Panel */}
      <SystemHealthPanel />
    </div>
  );
};
