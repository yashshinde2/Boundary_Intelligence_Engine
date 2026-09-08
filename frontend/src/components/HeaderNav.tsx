import React from 'react';
import type { ViewMode, SessionType } from '../types';
import { 
  ShieldAlert, 
  Sliders, 
  Layers, 
  Radio,
  Upload,
  UserCheck
} from 'lucide-react';

interface HeaderNavProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  pendingIncidentsCount: number;
  isLiveStreaming: boolean;
  selectedDriverNumber: number;
  onSelectDriver: (num: number) => void;
  selectedSession: SessionType;
  onSelectSession: (sess: SessionType) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentMode,
  onSelectMode,
  pendingIncidentsCount,
  isLiveStreaming,
  selectedDriverNumber,
  onSelectDriver,
  selectedSession,
  onSelectSession
}) => {
  const getDriverDisplay = (num: number) => {
    switch (num) {
      case 27: return '#27 NICO HÜLKENBERG';
      case 31: return '#31 ESTEBAN OCON';
      case 87: return '#87 OLLIE BEARMAN';
      case 4: return '#4 LANDO NORRIS';
      case 1: return '#1 MAX VERSTAPPEN';
      default: return `#${num} DRIVER`;
    }
  };
  const driverDisplay = getDriverDisplay(selectedDriverNumber);

  return (
    <header className="bg-[#0e0e14] border-b border-[#222230] px-5 py-2.5 flex flex-col xl:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
      {/* Brand Section */}
      <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E10600] via-[#A80000] to-[#500000] flex items-center justify-center shadow-lg shadow-red-900/50 border border-red-500/30">
            <span className="font-black text-white text-lg tracking-tighter italic">BIE</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider text-white uppercase italic">
                BOUNDARY INTELLIGENCE ENGINE
              </h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e1e2d] text-gray-400 font-mono font-medium border border-gray-700">
                TrackShift 2026
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">
              TRACK-LIMIT COMPLIANCE • STRATEGIC RISK • RACE INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Driver Quick Switcher */}
        <div className="flex items-center gap-1.5 bg-[#161622] p-1 rounded border border-[#2a2a3c]">
          <button
            onClick={() => onSelectDriver(31)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
              selectedDriverNumber === 31
                ? 'bg-[#E10600] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="TGR Haas F1 Team - Esteban Ocon"
          >
            <UserCheck className="w-3 h-3" />
            #31 OCO
          </button>
          <button
            onClick={() => onSelectDriver(87)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
              selectedDriverNumber === 87
                ? 'bg-[#E10600] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="TGR Haas F1 Team - Ollie Bearman"
          >
            <UserCheck className="w-3 h-3" />
            #87 BEA
          </button>
          <button
            onClick={() => onSelectDriver(27)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
              selectedDriverNumber === 27
                ? 'bg-[#E10600] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Haas F1 Team - Nico Hülkenberg"
          >
            <UserCheck className="w-3 h-3" />
            #27 HÜL
          </button>
        </div>
      </div>

      {/* Middle Status Telemetry Bar */}
      <div className="hidden 2xl:flex items-center gap-4 bg-[#14141e] px-3.5 py-1.5 rounded-md border border-[#232332] text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-bold uppercase">SESSION</span>
          <select 
            value={selectedSession} 
            onChange={(e) => onSelectSession(e.target.value as SessionType)}
            className="bg-transparent text-white font-bold cursor-pointer outline-none"
          >
            <option value="FP1" className="bg-[#14141e] text-white">FP1</option>
            <option value="FP2" className="bg-[#14141e] text-white">FP2</option>
            <option value="FP3" className="bg-[#14141e] text-white">FP3</option>
            <option value="QUALIFYING" className="bg-[#14141e] text-white">QUALIFYING</option>
            <option value="RACE SIMULATION" className="bg-[#14141e] text-white">RACE SIMULATION</option>
          </select>
        </div>

        <span className="text-[#2c2c40]">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-bold uppercase">TRACK</span>
          <span className="text-white font-semibold">AUSTRIA — Red Bull Ring</span>
        </div>

        <span className="text-[#2c2c40]">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-bold uppercase">CAR</span>
          <span className="text-white font-bold">VF-26</span>
        </div>

        <span className="text-[#2c2c40]">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-bold uppercase">DRIVER</span>
          <span className="text-[#00E5FF] font-bold">{driverDisplay}</span>
        </div>

        <span className="text-[#2c2c40]">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-bold uppercase">LAP</span>
          <span className="text-white font-bold">12 / 71</span>
        </div>

        <span className="text-[#2c2c40]">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-bold uppercase">DATA SOURCE</span>
          <span className="text-[#FFB800] font-semibold">SIMULATION</span>
        </div>

        <span className="text-[#2c2c40]">|</span>

        <div className="flex items-center gap-1.5 text-[#00E676] font-bold">
          <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-[#00E676] animate-pulse' : 'bg-gray-500'}`} />
          <span>SYSTEM HEALTHY</span>
        </div>
      </div>

      {/* Navigation Modes */}
      <nav className="flex items-center gap-1 bg-[#141420] p-1 rounded-lg border border-[#262638]">
        <button
          onClick={() => onSelectMode('STRATEGY')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentMode === 'STRATEGY'
              ? 'bg-[#E10600] text-white shadow-md shadow-red-900/50'
              : 'text-gray-400 hover:text-white hover:bg-[#1e1e2d]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>STRATEGY</span>
        </button>

        <button
          onClick={() => onSelectMode('LIVE_STEWARD')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentMode === 'LIVE_STEWARD'
              ? 'bg-[#E10600] text-white shadow-md shadow-red-900/50'
              : 'text-gray-400 hover:text-white hover:bg-[#1e1e2d]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>LIVE STEWARD</span>
        </button>

        <button
          onClick={() => onSelectMode('CALIBRATION')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentMode === 'CALIBRATION'
              ? 'bg-[#E10600] text-white shadow-md shadow-red-900/50'
              : 'text-gray-400 hover:text-white hover:bg-[#1e1e2d]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>CALIBRATION</span>
        </button>

        <button
          onClick={() => onSelectMode('INCIDENTS')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all relative ${
            currentMode === 'INCIDENTS'
              ? 'bg-[#E10600] text-white shadow-md shadow-red-900/50'
              : 'text-gray-400 hover:text-white hover:bg-[#1e1e2d]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>INCIDENTS</span>
          {pendingIncidentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#FFB800] text-black text-[10px] font-bold">
              {pendingIncidentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectMode('UPLOAD')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            currentMode === 'UPLOAD'
              ? 'bg-[#E10600] text-white shadow-md shadow-red-900/50'
              : 'text-gray-400 hover:text-white hover:bg-[#1e1e2d]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>VIDEO INGEST</span>
        </button>
      </nav>
    </header>
  );
};
