import React, { memo, useMemo } from 'react';
import { formatTimestamp } from '../utils/parseTrackingTimestamp';

function avg(values) {
  const finiteValues = values.filter(Number.isFinite);
  if (!finiteValues.length) return NaN;
  const sum = finiteValues.reduce((acc, v) => acc + v, 0);
  return sum / finiteValues.length;
}

export const StatsPanel = memo(function StatsPanel({ validPoints, latestPoint }) {
  const stats = useMemo(() => {
    const total = validPoints.length;
    const avgAccuracy = avg(validPoints.map((p) => p.Accuracy));
    const lastUpdated = latestPoint?.time ? formatTimestamp(latestPoint.time) : '—';
    return { total, avgAccuracy, lastUpdated };
  }, [validPoints, latestPoint]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-xs font-semibold tracking-widest text-slate-900">STATISTICS</h2>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] tracking-widest text-slate-500">VALID PTS</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] tracking-widest text-slate-500">AVG ACC</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {Number.isFinite(stats.avgAccuracy) ? `${Math.round(stats.avgAccuracy)} m` : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] tracking-widest text-slate-500">LAST UPD</div>
          <div className="mt-1 text-sm font-medium text-slate-900">{stats.lastUpdated}</div>
        </div>
      </div>
    </div>
  );
});
