import React, { memo, useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { parseTrackingTimestamp } from '../utils/parseTrackingTimestamp';

function toChartData(points) {
  return points.map((p) => {
    const date = parseTrackingTimestamp(p.time);
    return {
      time: p.time,
      label: date ? date.toLocaleTimeString() : p.time,
      accuracy: p.Accuracy,
    };
  });
}

export const AccuracyChart = memo(function AccuracyChart({ points }) {
  const data = useMemo(() => toChartData(points), [points]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-widest text-slate-900">ACCURACY VS TIME</h2>
        <div className="text-xs text-slate-500">Lower is better</div>
      </div>

      <div className="mt-3 h-64 w-full text-emerald-700">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
            <XAxis dataKey="label" minTickGap={24} tick={{ fill: 'currentColor' }} axisLine={{ stroke: 'currentColor' }} tickLine={{ stroke: 'currentColor' }} />
            <YAxis width={48} tick={{ fill: 'currentColor' }} axisLine={{ stroke: 'currentColor' }} tickLine={{ stroke: 'currentColor' }} />
            <Tooltip
              formatter={(value) => [`${Math.round(value)} m`, 'Accuracy']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line type="monotone" dataKey="accuracy" stroke="currentColor" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
