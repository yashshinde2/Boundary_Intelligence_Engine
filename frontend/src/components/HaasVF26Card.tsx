import React from 'react';
import { Gauge, Fuel, Disc, GaugeCircle, Activity, Info } from 'lucide-react';

interface HaasVF26CardProps {
  driverNumber: number;
  driverName: string;
  lap: number;
  speedKmh: number;
  sector: number;
  tyreCompound: string;
  tyreAgeLaps: number;
  fuelKg: number;
  isSimulated?: boolean;
}

export const HaasVF26Card: React.FC<HaasVF26CardProps> = ({
  driverNumber,
  driverName,
  lap,
  speedKmh,
  sector,
  tyreCompound,
  tyreAgeLaps,
  fuelKg,
  isSimulated = true
}) => {
  const tyreColor = tyreCompound === 'Soft' ? '#E10600' : tyreCompound === 'Medium' ? '#FFB800' : '#FFFFFF';

  return (
    <div className="f1-card p-5 space-y-4 relative overflow-hidden">
      {/* Background Car Silhouette Watermark */}
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-9xl font-black italic select-none">
        VF-26
      </div>

      {/* Header Team & Car Identity */}
      <div className="flex items-center justify-between border-b border-[#232332] pb-3">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            TGR HAAS F1 TEAM
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-lg font-black text-white italic tracking-wider">
              VF-26
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-[#E10600] text-white font-mono font-bold">
              {driverName}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-gray-400 uppercase font-mono block">Car #{driverNumber} • Lap</span>
          <span className="text-lg font-black font-mono text-white">
            {lap} <span className="text-xs font-normal text-gray-500">/ 71</span>
          </span>
        </div>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#1f1f2c]">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase">
            <Gauge className="w-3 h-3 text-[#00E5FF]" />
            <span>Speed</span>
          </div>
          <div className="text-base font-mono font-bold text-white mt-1">
            {speedKmh} <span className="text-[10px] font-normal text-gray-400">km/h</span>
          </div>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#1f1f2c]">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase">
            <Activity className="w-3 h-3 text-[#00E676]" />
            <span>Sector</span>
          </div>
          <div className="text-base font-mono font-bold text-white mt-1">
            Sector {sector}
          </div>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#1f1f2c]">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase">
            <Disc className="w-3 h-3" style={{ color: tyreColor }} />
            <span>Tyre</span>
          </div>
          <div className="text-base font-mono font-bold text-white mt-1" style={{ color: tyreColor }}>
            {tyreCompound}
          </div>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#1f1f2c]">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase">
            <GaugeCircle className="w-3 h-3 text-gray-400" />
            <span>Tyre Age</span>
          </div>
          <div className="text-base font-mono font-bold text-white mt-1">
            {tyreAgeLaps} <span className="text-[10px] font-normal text-gray-400">laps</span>
          </div>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#1f1f2c]">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase">
            <Fuel className="w-3 h-3 text-[#FFB800]" />
            <span>Fuel Load</span>
          </div>
          <div className="text-base font-mono font-bold text-white mt-1">
            {fuelKg} <span className="text-[10px] font-normal text-gray-400">kg</span>
          </div>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#1f1f2c]">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase">
            <Info className="w-3 h-3 text-[#00E5FF]" />
            <span>Rule Profile</span>
          </div>
          <div className="text-xs font-mono font-bold text-[#00E5FF] mt-1.5">
            FIA_ALL_FOUR
          </div>
        </div>
      </div>

      {/* Badge under telemetry */}
      {isSimulated && (
        <div className="pt-2 border-t border-[#1f1f2c] flex items-center justify-between">
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#1c1c28] text-gray-400 font-mono font-semibold border border-[#2b2b3c]">
            SIMULATED TELEMETRY
          </span>
          <span className="text-[10px] text-gray-500 font-mono">
            Red Bull Ring • 4.318 km
          </span>
        </div>
      )}
    </div>
  );
};
