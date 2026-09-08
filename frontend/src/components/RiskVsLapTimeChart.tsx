import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Award } from 'lucide-react';

interface RiskVsLapTimeChartProps {
  tradeoffCurve: Array<{
    offset_cm: number;
    projected_risk_pct: number;
    lap_time_delta_ms: number;
  }>;
  recommendedOffsetCm?: number;
  recommendedRiskPct?: number;
  lapTimeCostMs?: number;
}

export const RiskVsLapTimeChart: React.FC<RiskVsLapTimeChartProps> = ({
  tradeoffCurve,
  recommendedOffsetCm = 12.0,
  recommendedRiskPct = 12.7,
  lapTimeCostMs = 58
}) => {
  return (
    <div className="f1-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#232332] pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#FFB800]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Risk vs. Lap-Time Trade-Off Curve
          </h3>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          Optimal Apex Line Shift
        </span>
      </div>

      {/* Optimal Point Badge */}
      <div className="bg-[#12121c] p-3 rounded border border-[#242436] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-[#00E5FF]" />
          <span className="text-xs font-bold text-white uppercase">Calculated Optimal Recommendation:</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-[#00E5FF] font-bold">Line: +{recommendedOffsetCm} cm</span>
          <span className="text-gray-500">|</span>
          <span className="text-[#00E676] font-bold">Risk: {recommendedRiskPct}%</span>
          <span className="text-gray-500">|</span>
          <span className="text-[#FFB800] font-bold">Cost: +{lapTimeCostMs} ms</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={tradeoffCurve} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c28" />
            <XAxis 
              dataKey="offset_cm" 
              stroke="#707088" 
              fontSize={10} 
              unit="cm" 
              label={{ value: 'Lateral Offset Inward (cm)', position: 'insideBottom', offset: -4, fill: '#666', fontSize: 9 }}
            />
            <YAxis yAxisId="left" stroke="#E10600" fontSize={10} unit="%" domain={[0, 100]} />
            <YAxis yAxisId="right" orientation="right" stroke="#FFB800" fontSize={10} unit="ms" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#14141e', borderColor: '#2c2c40', fontSize: '11px' }}
            />
            <ReferenceLine yAxisId="left" x={recommendedOffsetCm} stroke="#00E5FF" strokeDasharray="4 4" label={{ value: 'OPTIMAL (+12cm)', fill: '#00E5FF', fontSize: 9 }} />
            <Line yAxisId="left" type="monotone" dataKey="projected_risk_pct" name="Violation Risk (%)" stroke="#E10600" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="lap_time_delta_ms" name="Lap Time Cost (ms)" stroke="#FFB800" strokeWidth={2} strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-[#1f1f2c]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#E10600]">
            <span className="w-3 h-0.5 bg-[#E10600]" /> Violation Risk (%)
          </span>
          <span className="flex items-center gap-1 text-[#FFB800]">
            <span className="w-3 h-0.5 bg-[#FFB800] border-t border-dashed" /> Lap-Time Delta (ms)
          </span>
        </div>
        <span>Model: MVP Strategy Model</span>
      </div>
    </div>
  );
};
