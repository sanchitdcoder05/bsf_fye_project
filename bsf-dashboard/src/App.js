import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LiveLocation } from './components/LiveLocation';
import { MapView } from './components/MapView';
import { SoldierCard } from './components/SoldierCard';
import { StatsPanel } from './components/StatsPanel';
import { useTrackingData } from './hooks/useTrackingData';
import { haversineMeters } from './utils/geo';
import { parseTrackingTimestamp } from './utils/parseTrackingTimestamp';

function App() {
  const {
    loading,
    error,
    validPoints,
    invalidPoints,
    latestValid,
    soldiers = [],
  } = useTrackingData();
  const [showInvalid, setShowInvalid] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'history'
  const [tileMode, setTileMode] = useState('street'); // 'street' | 'satellite'
  // History index represents the "start" point of the visible track:
  // - Present: last index (shows just current point)
  // - Past: smaller index (shows more of the track up to present)
  const [historyIndex, setHistoryIndex] = useState(null);
  const historyWheelRef = useRef(null);

  // When entering history mode (or when data arrives), default to the newest point.
  useEffect(() => {
    if (activeTab !== 'history') return;
    if (!validPoints.length) {
      setHistoryIndex(null);
      return;
    }
    setHistoryIndex((idx) => {
      if (idx === null || idx === undefined) return validPoints.length - 1;
      return Math.max(0, Math.min(validPoints.length - 1, idx));
    });
  }, [activeTab, validPoints.length]);

  const selectedHistoryPoint = useMemo(() => {
    if (activeTab !== 'history') return null;
    if (historyIndex === null || historyIndex === undefined) return null;
    return validPoints[historyIndex] || null;
  }, [activeTab, historyIndex, validPoints]);

  // Mouse wheel scrubbing: scroll down -> older points, scroll up -> newer.
  useEffect(() => {
    if (activeTab !== 'history') return;
    const el = historyWheelRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (!validPoints.length) return;

      // Prevent page scrolling while scrubbing.
      e.preventDefault();

      // Down = go to the past (smaller index), Up = go to the present (bigger index)
      const direction = e.deltaY > 0 ? -1 : 1;
      setHistoryIndex((idx) => {
        const current = idx === null || idx === undefined ? validPoints.length - 1 : idx;
        const next = current + direction;
        return Math.max(0, Math.min(validPoints.length - 1, next));
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [activeTab, validPoints]);

  const speedKmh = useMemo(() => {
    if (validPoints.length < 2) return NaN;
    const a = validPoints[validPoints.length - 2];
    const b = validPoints[validPoints.length - 1];

    const da = parseTrackingTimestamp(a.time);
    const db = parseTrackingTimestamp(b.time);
    if (!da || !db) return NaN;
    const dtSeconds = (db.getTime() - da.getTime()) / 1000;
    if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return NaN;

    const meters = haversineMeters(a.Latitude, a.Longitude, b.Latitude, b.Longitude);
    const mps = meters / dtSeconds;
    return mps * 3.6;
  }, [validPoints]);

  const historySpeedKmh = useMemo(() => {
    if (activeTab !== 'history') return NaN;
    if (historyIndex === null || historyIndex === undefined) return NaN;
    if (historyIndex < 1) return NaN;
    const a = validPoints[historyIndex - 1];
    const b = validPoints[historyIndex];
    if (!a || !b) return NaN;

    const da = parseTrackingTimestamp(a.time);
    const db = parseTrackingTimestamp(b.time);
    if (!da || !db) return NaN;
    const dtSeconds = (db.getTime() - da.getTime()) / 1000;
    if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return NaN;

    const meters = haversineMeters(a.Latitude, a.Longitude, b.Latitude, b.Longitude);
    const mps = meters / dtSeconds;
    return mps * 3.6;
  }, [activeTab, historyIndex, validPoints]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold tracking-wide text-slate-900">REAL-TIME LOCATION DASHBOARD</h1>
              <p className="text-sm text-slate-500">Realtime Database · Node: Tracking</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('live')}
                  className={
                    activeTab === 'live'
                      ? 'rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold tracking-widest text-emerald-700'
                      : 'rounded-md px-3 py-1.5 text-xs font-semibold tracking-widest text-slate-600 hover:text-slate-900'
                  }
                >
                  LIVE
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={
                    activeTab === 'history'
                      ? 'rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold tracking-widest text-emerald-700'
                      : 'rounded-md px-3 py-1.5 text-xs font-semibold tracking-widest text-slate-600 hover:text-slate-900'
                  }
                >
                  HISTORY
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs tracking-wide text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-500"
                  checked={showInvalid}
                  onChange={(e) => setShowInvalid(e.target.checked)}
                />
                Show invalid (Accuracy &gt; 1000)
              </label>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
            Loading realtime data…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-white p-6 text-sm text-rose-700">
            Failed to load tracking data: {String(error?.message || error)}
          </div>
        ) : null}

        {activeTab === 'live' ? (
          <>
            <section className="mt-4">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold tracking-widest text-slate-900">SOLDIER STATUS</h2>
                  <p className="mt-1 text-xs text-slate-500">Active means a report was received within the last 15 seconds.</p>
                </div>
                <div className="text-xs text-slate-500">{soldiers.length} tracked soldier{soldiers.length === 1 ? '' : 's'}</div>
              </div>
              {soldiers.length ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {soldiers.map((soldier) => <SoldierCard key={soldier.id} soldier={soldier} />)}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No soldier reports available yet.
                </div>
              )}
            </section>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MapView
                  validPoints={validPoints}
                  invalidPoints={invalidPoints}
                  showInvalid={showInvalid}
                  mode="latest"
                  tileMode={tileMode}
                  onTileModeChange={setTileMode}
                />
              </div>

              <div className="space-y-4">
                <LiveLocation latestPoint={latestValid} speedKmh={speedKmh} />
                <StatsPanel validPoints={validPoints} latestPoint={latestValid} />
              </div>
            </div>

          </>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2" ref={historyWheelRef}>
                <MapView
                  validPoints={validPoints}
                  invalidPoints={invalidPoints}
                  showInvalid={showInvalid}
                  mode="track"
                  startIndex={historyIndex}
                  enableScrollZoom={false}
                  tileMode={tileMode}
                  onTileModeChange={setTileMode}
                />
                <div className="mt-2 text-xs text-slate-500">
                  Tip: Hover and use mouse wheel to scrub (down = past, up = present).
                </div>
              </div>

              <div className="space-y-4">
                <LiveLocation latestPoint={selectedHistoryPoint} speedKmh={historySpeedKmh} />

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h2 className="text-xs font-semibold tracking-widest text-slate-900">HISTORY CONTROL</h2>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Past</span>
                      <span>Present</span>
                    </div>

                    <input
                      type="range"
                      className="mt-2 w-full"
                      min={0}
                      max={Math.max(0, validPoints.length - 1)}
                      value={historyIndex ?? Math.max(0, validPoints.length - 1)}
                      onChange={(e) => setHistoryIndex(Number(e.target.value))}
                      disabled={!validPoints.length}
                    />

                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Start point: {validPoints.length ? (historyIndex ?? validPoints.length - 1) + 1 : 0} / {validPoints.length}
                      </span>
                      <span className="font-mono">{selectedHistoryPoint?.time || '—'}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[11px] tracking-widest text-slate-500">RECENT POINTS</div>
                    <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white">
                      {validPoints.length ? (
                        (() => {
                          const total = validPoints.length;
                          const start = Math.max(0, total - 50);
                          const recent = validPoints.slice(start);
                          return recent.reverse().map((p, localIdx) => {
                            const idx = total - 1 - localIdx;
                          const selected = idx === historyIndex;
                          return (
                            <button
                              key={p.time}
                              type="button"
                              onClick={() => setHistoryIndex(idx)}
                              className={
                                selected
                                  ? 'flex w-full items-center justify-between gap-3 border-b border-slate-200 bg-emerald-50 px-3 py-2 text-left text-xs text-emerald-800'
                                  : 'flex w-full items-center justify-between gap-3 border-b border-slate-200 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50'
                              }
                            >
                              <span className="font-mono">{p.time}</span>
                                <span className="text-slate-500">{Math.round(p.Accuracy)}m</span>
                            </button>
                          );
                          });
                        })()
                      ) : (
                        <div className="px-3 py-3 text-xs text-slate-500">No points yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}
      </main>
    </div>
  );
}

export default App;
