import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface MarginHistogramProps {
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  bins: Array<{
    bin_range: string;
    count: number;
    is_violation?: boolean;
    is_borderline?: boolean;
    is_safe?: boolean;
  }>;
}

export const MarginHistogram: React.FC<MarginHistogramProps> = ({
  p10,
  p50,
  p90,
  mean,
  bins
}) => {
  return (
    <div className="f1-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232332] pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Margin Distribution & Percentile Histogram
          </h3>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          Threshold = 0.0 cm (FIA_ALL_FOUR)
        </span>
      </div>

      {/* 4 Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#20202e]">
          <span className="text-[10px] text-gray-400 block uppercase">P10 (Tightest Excursion)</span>
          <span className="text-base font-mono font-bold text-[#E10600]">
            {p10} cm
          </span>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#20202e]">
          <span className="text-[10px] text-gray-400 block uppercase">P50 (Median Margin)</span>
          <span className="text-base font-mono font-bold text-[#FFB800]">
            +{p50} cm
          </span>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#20202e]">
          <span className="text-[10px] text-gray-400 block uppercase">P90 (Safe Margin)</span>
          <span className="text-base font-mono font-bold text-[#00E676]">
            +{p90} cm
          </span>
        </div>

        <div className="bg-[#0e0e15] p-2.5 rounded border border-[#20202e]">
          <span className="text-[10px] text-gray-400 block uppercase">Mean Margin</span>
          <span className="text-base font-mono font-bold text-[#00E5FF]">
            +{mean} cm
          </span>
        </div>
      </div>

      {/* Histogram Bar Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c28" />
            <XAxis dataKey="bin_range" stroke="#707088" fontSize={10} tickLine={false} />
            <YAxis stroke="#707088" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#14141e', borderColor: '#2c2c40', fontSize: '11px' }}
              labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            />
            <Bar dataKey="count" name="Frequency (Laps)" radius={[4, 4, 0, 0]}>
              {bins.map((entry, index) => {
                const color = entry.is_violation ? '#E10600' : entry.is_borderline ? '#FFB800' : '#00E676';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-[#1f1f2c]">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[#E10600]">
            <span className="w-2 h-2 rounded-sm bg-[#E10600]" /> Violation (&lt;0cm)
          </span>
          <span className="flex items-center gap-1 text-[#FFB800]">
            <span className="w-2 h-2 rounded-sm bg-[#FFB800]" /> Borderline (0 to +5cm)
          </span>
          <span className="flex items-center gap-1 text-[#00E676]">
            <span className="w-2 h-2 rounded-sm bg-[#00E676]" /> Safe (&gt;+5cm)
          </span>
        </div>
        <span>FIA_ALL_FOUR Profile</span>
      </div>
    </div>
  );
};
