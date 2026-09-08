import React from 'react';
import type { ViewMode, SessionType } from '../types';
import { ShieldAlert, Sliders, Layers, Radio, Upload } from 'lucide-react';

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
  return (
    <header className="sticky top-0 z-50 border-b border-[#222230] bg-[#0e0e14] px-4 py-2 shadow-md">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-red-500/30 bg-[#b00000]">
            <span className="text-sm font-black italic tracking-tighter text-white">BIE</span>
          </div>
          <div>
            <h1 className="text-xs font-black uppercase italic tracking-[0.16em] text-white">Steward Control</h1>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-500">Track-limit compliance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded border border-[#2a2a3c] bg-[#161622] p-1">
          <button
            onClick={() => onSelectDriver(31)}
            className={`rounded px-2 py-1 text-[10px] font-mono font-bold transition-all ${
              selectedDriverNumber === 31
                ? 'bg-[#E10600] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Esteban Ocon"
          >
            #31 OCO
          </button>
          <button
            onClick={() => onSelectDriver(87)}
            className={`rounded px-2 py-1 text-[10px] font-mono font-bold transition-all ${
              selectedDriverNumber === 87
                ? 'bg-[#E10600] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Ollie Bearman"
          >
            #87 BEA
          </button>
          <button
            onClick={() => onSelectDriver(27)}
            className={`rounded px-2 py-1 text-[10px] font-mono font-bold transition-all ${
              selectedDriverNumber === 27
                ? 'bg-[#E10600] text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Nico Hülkenberg"
          >
            #27 HÜL
          </button>
          </div>
          <label className="flex items-center gap-2 rounded border border-[#2a2a3c] bg-[#161622] px-2 py-1 text-[10px] font-mono font-bold text-gray-400">
            SESSION
            <select
              value={selectedSession}
              onChange={(e) => onSelectSession(e.target.value as SessionType)}
              className="bg-transparent text-white outline-none"
            >
              <option value="FP1">FP1</option>
              <option value="FP2">FP2</option>
              <option value="FP3">FP3</option>
              <option value="QUALIFYING">QUAL</option>
              <option value="RACE SIMULATION">RACE SIM</option>
            </select>
          </label>
          <div className="hidden items-center gap-1.5 border-l border-[#2a2a3c] pl-3 text-[10px] font-bold uppercase tracking-wider sm:flex">
            <Radio className="h-3 w-3 text-[#00E676]" />
            <span className={isLiveStreaming ? 'text-[#00E676]' : 'text-gray-500'}>
              {isLiveStreaming ? 'LIVE FEED' : 'CONNECTING'}
            </span>
          </div>
        </div>
        <nav className="flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-[#262638] bg-[#141420] p-1 lg:w-auto">
          <button
            onClick={() => onSelectMode('STRATEGY')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
              currentMode === 'STRATEGY' ? 'bg-[#E10600] text-white' : 'text-gray-400 hover:bg-[#1e1e2d] hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            STRATEGY
          </button>
          <button
            onClick={() => onSelectMode('LIVE_STEWARD')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
              currentMode === 'LIVE_STEWARD' ? 'bg-[#E10600] text-white' : 'text-gray-400 hover:bg-[#1e1e2d] hover:text-white'
            }`}
          >
            <Radio className="h-3 w-3" />
            LIVE STEWARD
          </button>
          <button
            onClick={() => onSelectMode('CALIBRATION')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
              currentMode === 'CALIBRATION' ? 'bg-[#E10600] text-white' : 'text-gray-400 hover:bg-[#1e1e2d] hover:text-white'
            }`}
          >
            <Sliders className="h-3 w-3" />
            CALIBRATION
          </button>
          <button
            onClick={() => onSelectMode('INCIDENTS')}
            className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
              currentMode === 'INCIDENTS' ? 'bg-[#E10600] text-white' : 'text-gray-400 hover:bg-[#1e1e2d] hover:text-white'
            }`}
          >
            <ShieldAlert className="h-3 w-3" />
            INCIDENTS
            {pendingIncidentsCount > 0 && (
              <span className="rounded-full bg-[#FFB800] px-1.5 text-[9px] font-bold text-black">{pendingIncidentsCount}</span>
            )}
          </button>
          <button
            onClick={() => onSelectMode('UPLOAD')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all ${
              currentMode === 'UPLOAD' ? 'bg-[#E10600] text-white' : 'text-gray-400 hover:bg-[#1e1e2d] hover:text-white'
            }`}
          >
            <Upload className="h-3 w-3" />
            VIDEO INGEST
          </button>
        </nav>
      </div>
    </header>
  );
};
