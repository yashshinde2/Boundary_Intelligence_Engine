import React from 'react';
import type { SessionType } from '../types';
import { Radio } from 'lucide-react';

interface HeaderNavProps {
  isLiveStreaming: boolean;
  selectedDriverNumber: number;
  onSelectDriver: (num: number) => void;
  selectedSession: SessionType;
  onSelectSession: (sess: SessionType) => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
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
      </div>
    </header>
  );
};
