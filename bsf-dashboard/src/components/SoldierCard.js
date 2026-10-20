import React, { memo } from 'react';
import { formatTimestamp } from '../utils/parseTrackingTimestamp';

function valueOrDash(value) {
  return value === undefined || value === null || value === '' ? '—' : value;
}

function formatAge(seconds) {
  if (!Number.isFinite(seconds)) return 'No valid report time';
  if (seconds < 1) return 'Reported just now';
  return `Reported ${Math.round(seconds)}s ago`;
}

export const SoldierCard = memo(function SoldierCard({ soldier }) {
  const point = soldier.latestPoint;
  const emergency = soldier.isEmergency;
  const active = soldier.isActive && !emergency;

  return (
    <article
      className={
        emergency
          ? 'rounded-xl border-2 border-rose-400 bg-rose-50 p-4 shadow-sm shadow-rose-100'
          : 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">SOLDIER</div>
          <h2 className="mt-1 text-lg font-bold text-slate-900">{soldier.id}</h2>
        </div>
        <span
          className={
            emergency
              ? 'rounded-full bg-rose-600 px-3 py-1 text-xs font-bold tracking-widest text-white'
              : active
                ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-widest text-emerald-700'
                : 'rounded-full bg-slate-200 px-3 py-1 text-xs font-bold tracking-widest text-slate-600'
          }
        >
          {emergency ? 'EMERGENCY' : active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {emergency ? (
        <div className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white">
          Emergency signal received. Immediate attention required.
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-slate-500">LAST REPORT</div>
          <div className="mt-1 font-medium text-slate-900">{formatAge(soldier.ageSeconds)}</div>
          <div className="text-xs text-slate-500">{formatTimestamp(point.time)}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-slate-500">LINK</div>
          <div className="mt-1 font-medium text-slate-900">{valueOrDash(point.Link)}</div>
          <div className="text-xs text-slate-500">{point.Status || 'No status supplied'}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-slate-500">SIGNAL</div>
          <div className="mt-1 font-medium text-slate-900">RSSI {valueOrDash(point.RSSI)}</div>
          <div className="text-xs text-slate-500">{valueOrDash(point.Satellites)} satellites</div>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold tracking-widest text-slate-500">LORA PACKET</div>
          <div className="mt-1 truncate font-mono text-xs text-slate-900" title={point.LoRaPacket || ''}>
            {valueOrDash(point.LoRaPacket)}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-slate-500">LOCATION</div>
          <div className="mt-1 font-mono text-xs text-slate-900">
            {Number.isFinite(point.Latitude) ? point.Latitude.toFixed(5) : '—'},{' '}
            {Number.isFinite(point.Longitude) ? point.Longitude.toFixed(5) : '—'}
          </div>
          <div className="text-xs text-slate-500">
            Accuracy {Number.isFinite(point.Accuracy) ? `${Math.round(point.Accuracy)}m` : '—'}
          </div>
        </div>
      </div>
    </article>
  );
});
