import React, { memo, useMemo } from 'react';
import { formatTimestamp } from '../utils/parseTrackingTimestamp';

function formatCoord(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(6);
}

function formatAccuracy(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value)} m`;
}

export const LiveLocation = memo(function LiveLocation({ latestPoint, speedKmh }) {
  const lastUpdated = useMemo(() => {
    if (!latestPoint?.time) return '—';
    return formatTimestamp(latestPoint.time);
  }, [latestPoint]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-widest text-slate-900">LIVE LOCATION</h2>
        <span className="text-xs text-slate-500">Last updated: {lastUpdated}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] tracking-widest text-slate-500">LAT</div>
          <div className="mt-1 font-mono text-sm text-slate-900">{formatCoord(latestPoint?.Latitude)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] tracking-widest text-slate-500">LON</div>
          <div className="mt-1 font-mono text-sm text-slate-900">{formatCoord(latestPoint?.Longitude)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] tracking-widest text-slate-500">ACCURACY</div>
          <div className="mt-1 text-sm font-medium text-slate-900">{formatAccuracy(latestPoint?.Accuracy)}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] tracking-widest text-slate-500">SPEED</div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            {Number.isFinite(speedKmh) ? `${speedKmh.toFixed(1)} km/h` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
});
