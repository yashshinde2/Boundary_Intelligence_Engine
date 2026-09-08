import React, { useState, useEffect } from 'react';
import type { Incident } from '../types';
import { ShieldAlert, Search } from 'lucide-react';
import { API_URL } from '../config';

interface IncidentsQueueViewProps {
  onOpenIncidentReview: (incidentId: string) => void;
}

export const IncidentsQueueView: React.FC<IncidentsQueueViewProps> = ({
  onOpenIncidentReview
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_URL}/api/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (e) {
      console.error('Failed to fetch incidents:', e);
    }
  };

  const filtered = incidents.filter(i => {
    const matchStatus = filterStatus === 'ALL' || i.status === filterStatus;
    const matchSearch = 
      i.incident_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.corner_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.driver_name && i.driver_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#232332] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#E10600]" />
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              FIA Stewarding & Incident Adjudication Queue
            </h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Austrian GP 2026 • AI-flagged track limit excursions, spatial evidence, and steward rulings under FIA_ALL_FOUR.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Incident ID, Corner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#12121a] border border-[#272738] rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#E10600]"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#12121a] border border-[#272738] rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#E10600]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CONFIRMED">Confirmed Violations</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="f1-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#111118] text-gray-400 uppercase font-mono border-b border-[#20202e]">
            <tr>
              <th className="py-3.5 px-4 font-semibold">Incident ID</th>
              <th className="py-3.5 px-4 font-semibold">Car & Driver</th>
              <th className="py-3.5 px-4 font-semibold">Location / Lap</th>
              <th className="py-3.5 px-4 font-semibold">Wheels Out</th>
              <th className="py-3.5 px-4 font-semibold">Min Margin</th>
              <th className="py-3.5 px-4 font-semibold">AI Confidence</th>
              <th className="py-3.5 px-4 font-semibold">Rule Profile</th>
              <th className="py-3.5 px-4 font-semibold">Status</th>
              <th className="py-3.5 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b1b26]">
            {filtered.map((inc) => {
              const driverName = inc.vehicle_id === 31 ? '#31 Esteban Ocon' : (inc.vehicle_id === 87 ? '#87 Ollie Bearman' : (inc.driver_name ?? `#${inc.vehicle_id}`));
              const teamName = (inc.vehicle_id === 31 || inc.vehicle_id === 87) ? 'TGR Haas F1 Team' : (inc.vehicle_id === 16 ? 'Scuderia Ferrari' : 'Formula 1 Team');

              return (
                <tr 
                  key={inc.incident_id}
                  onClick={() => onOpenIncidentReview(inc.incident_id)}
                  className="hover:bg-[#181822] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    {inc.incident_id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{driverName}</div>
                    <div className="text-[10px] text-gray-400">{teamName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-300">
                    {inc.corner_id} • Lap {inc.lap}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-bold ${inc.wheels_out === 4 ? 'text-[#E10600]' : 'text-[#FFB800]'}`}>
                      {inc.wheels_out}/4 Out
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#E10600]">
                    {inc.min_margin_cm} cm
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-[#00E5FF] font-bold">{inc.confidence.confidence_percentage}%</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    {inc.rule_profile ?? 'FIA_ALL_FOUR'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      inc.status === 'CONFIRMED'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : inc.status === 'DISMISSED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {inc.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenIncidentReview(inc.incident_id);
                      }}
                      className="px-3 py-1 bg-[#20202e] hover:bg-[#2c2c3e] text-white font-semibold rounded text-xs border border-[#303046] transition-all"
                    >
                      Review Dossier
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
