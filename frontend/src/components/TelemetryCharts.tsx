import React, { useState, useEffect } from 'react';
import type { TelemetryPoint } from '../types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface TelemetryChartsProps {
  currentTelemetry: TelemetryPoint;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ currentTelemetry }) => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!currentTelemetry) return;
    setHistory((prev) => {
      const point = {
        time: currentTelemetry.timestamp_sec.toFixed(1),
        speed: currentTelemetry.speed_kmh,
        lat_g: currentTelemetry.lateral_g,
        throttle: currentTelemetry.throttle_pct,
        brake: currentTelemetry.brake_pct,
        steer: currentTelemetry.steering_deg
      };
      const updated = [...prev, point];
      if (updated.length > 25) {
        return updated.slice(updated.length - 25);
      }
      return updated;
    });
  }, [currentTelemetry]);

  return (
    <div className="f1-card p-4 space-y-3">
      {/* Top Gauges Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {/* Speed Gauge */}
        <div className="bg-[#0f0f16] p-2.5 rounded border border-[#20202e] text-center">
          <span className="text-[10px] text-gray-400 uppercase font-medium">Speed</span>
          <div className="text-base font-mono font-bold text-white mt-0.5">
            {currentTelemetry.speed_kmh} <span className="text-[10px] font-normal text-gray-400">km/h</span>
          </div>
        </div>

        {/* Lateral G */}
        <div className="bg-[#0f0f16] p-2.5 rounded border border-[#20202e] text-center">
          <span className="text-[10px] text-gray-400 uppercase font-medium">Lateral G</span>
          <div className="text-base font-mono font-bold text-[#FFB800] mt-0.5">
            {currentTelemetry.lateral_g} <span className="text-[10px] font-normal text-gray-400">G</span>
          </div>
        </div>

        {/* Throttle */}
        <div className="bg-[#0f0f16] p-2.5 rounded border border-[#20202e] text-center">
          <span className="text-[10px] text-gray-400 uppercase font-medium">Throttle</span>
          <div className="text-base font-mono font-bold text-[#00E676] mt-0.5">
            {currentTelemetry.throttle_pct} <span className="text-[10px] font-normal text-gray-400">%</span>
          </div>
        </div>

        {/* Brake */}
        <div className="bg-[#0f0f16] p-2.5 rounded border border-[#20202e] text-center">
          <span className="text-[10px] text-gray-400 uppercase font-medium">Brake</span>
          <div className="text-base font-mono font-bold text-[#E10600] mt-0.5">
            {currentTelemetry.brake_pct} <span className="text-[10px] font-normal text-gray-400">%</span>
          </div>
        </div>

        {/* Gear & RPM */}
        <div className="bg-[#0f0f16] p-2.5 rounded border border-[#20202e] text-center">
          <span className="text-[10px] text-gray-400 uppercase font-medium">Gear / RPM</span>
          <div className="text-base font-mono font-bold text-white mt-0.5">
            G{currentTelemetry.gear} <span className="text-xs text-gray-400 font-normal">({currentTelemetry.rpm})</span>
          </div>
        </div>

        {/* Steering Angle */}
        <div className="bg-[#0f0f16] p-2.5 rounded border border-[#20202e] text-center">
          <span className="text-[10px] text-gray-400 uppercase font-medium">Steering</span>
          <div className="text-base font-mono font-bold text-[#00E5FF] mt-0.5">
            {currentTelemetry.steering_deg}°
          </div>
        </div>
      </div>

      {/* Waveform Telemetry Charts (Speed & Lateral G) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Chart 1: Speed km/h */}
        <div className="bg-[#0e0e15] p-3 rounded border border-[#1e1e2c]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Speed Profile</span>
            <span className="text-[10px] font-mono text-white">{currentTelemetry.speed_kmh} km/h</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1c1c28" />
                <XAxis dataKey="time" stroke="#505068" fontSize={9} tickLine={false} />
                <YAxis stroke="#505068" fontSize={9} domain={[180, 280]} />
                <Tooltip contentStyle={{ backgroundColor: '#14141e', borderColor: '#2c2c40', fontSize: '10px' }} />
                <Line type="monotone" dataKey="speed" stroke="#00E5FF" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lateral G & Throttle */}
        <div className="bg-[#0e0e15] p-3 rounded border border-[#1e1e2c]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Lateral Acceleration & Throttle</span>
            <span className="text-[10px] font-mono text-[#FFB800]">{currentTelemetry.lateral_g} G</span>
          </div>
          <div className="h-28">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1c1c28" />
                <XAxis dataKey="time" stroke="#505068" fontSize={9} tickLine={false} />
                <YAxis yAxisId="lat" stroke="#FFB800" fontSize={9} domain={[0, 5]} />
                <YAxis yAxisId="thr" orientation="right" stroke="#00E676" fontSize={9} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#14141e', borderColor: '#2c2c40', fontSize: '10px' }} />
                <Line yAxisId="lat" type="monotone" dataKey="lat_g" name="Lateral G" stroke="#FFB800" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line yAxisId="thr" type="monotone" dataKey="throttle" name="Throttle %" stroke="#00E676" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
