import React, { memo, useMemo } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { parseTrackingTimestamp } from '../utils/parseTrackingTimestamp';

// Fix Leaflet's default marker icons in webpack/CRA.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const latestIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'latest-marker',
});

function asLatLng(p) {
  return [p.Latitude, p.Longitude];
}

function Recenter({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (!center) return;
    // Keep the map focused on the newest valid location WITHOUT overriding
    // whatever zoom level the user set manually.
    map.setView(center, map.getZoom(), { animate: true });
  }, [map, center]);
  return null;
}

export const MapView = memo(function MapView({
  validPoints,
  invalidPoints,
  showInvalid,
  // mode:
  // - 'latest': show only the latest valid point (no path)
  // - 'track': show a path from `startIndex` up to the latest point
  mode = 'track',
  startIndex = null,
  enableScrollZoom = true,
  tileMode = 'street',
  onTileModeChange,
}) {
  const tiles = useMemo(() => {
    if (tileMode === 'satellite') {
      return {
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution:
          'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxNativeZoom: 19,
      };
    }

    return {
      name: 'Street',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxNativeZoom: 19,
    };
  }, [tileMode]);
  const latestOverall = useMemo(
    () => (validPoints.length ? validPoints[validPoints.length - 1] : null),
    [validPoints]
  );

  const visibleValidPoints = useMemo(() => {
    if (mode === 'latest') return latestOverall ? [latestOverall] : [];
    if (!validPoints.length) return [];

    const start = startIndex === null || startIndex === undefined ? 0 : startIndex;
    const clampedStart = Math.max(0, Math.min(validPoints.length - 1, start));
    return validPoints.slice(clampedStart);
  }, [mode, startIndex, latestOverall, validPoints]);

  const latest = latestOverall;

  const center = useMemo(() => {
    if (latest) return asLatLng(latest);
    return [20.5937, 78.9629];
  }, [latest]);

  const path = useMemo(() => visibleValidPoints.map(asLatLng), [visibleValidPoints]);
  const invalidMarkers = useMemo(() => {
    if (!showInvalid) return [];
    // Only render invalid markers if coordinates are still numbers.
    const base = invalidPoints.filter((p) => Number.isFinite(p.Latitude) && Number.isFinite(p.Longitude));

    // In track mode with a selected startIndex, only show invalid points in the visible time window.
    if (mode !== 'track' || startIndex === null || startIndex === undefined || !latest?.time) return base;

    const endDate = parseTrackingTimestamp(latest.time);
    const startPoint = validPoints[Math.max(0, Math.min(validPoints.length - 1, startIndex))];
    const startDate = startPoint?.time ? parseTrackingTimestamp(startPoint.time) : null;
    if (!endDate || !startDate) return base;

    const endMs = endDate.getTime();
    const startMs = startDate.getTime();
    return base.filter((p) => {
      const d = parseTrackingTimestamp(p.time);
      if (!d) return true;
      const t = d.getTime();
      return t >= startMs && t <= endMs;
    });
  }, [showInvalid, invalidPoints, mode, startIndex, latest?.time, validPoints]);

  const olderPoints = useMemo(
    () => (visibleValidPoints.length > 1 ? visibleValidPoints.slice(0, -1) : []),
    [visibleValidPoints]
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold tracking-widest text-slate-900">MAP</h2>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500">{tiles.name}</div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => onTileModeChange?.('street')}
              className={
                tileMode === 'street'
                  ? 'rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold tracking-widest text-emerald-700'
                  : 'rounded-md px-2 py-1 text-[11px] font-semibold tracking-widest text-slate-600 hover:text-slate-900'
              }
            >
              STREET
            </button>
            <button
              type="button"
              onClick={() => onTileModeChange?.('satellite')}
              className={
                tileMode === 'satellite'
                  ? 'rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold tracking-widest text-emerald-700'
                  : 'rounded-md px-2 py-1 text-[11px] font-semibold tracking-widest text-slate-600 hover:text-slate-900'
              }
            >
              SAT
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 h-[420px] w-full overflow-hidden rounded-lg border border-slate-200">
        <MapContainer
          center={center}
          zoom={17}
          maxZoom={22}
          scrollWheelZoom={enableScrollZoom}
          className="h-full w-full"
        >
          <Recenter center={latest ? center : null} />
          <TileLayer
            key={tileMode}
            attribution={tiles.attribution}
            url={tiles.url}
            maxNativeZoom={tiles.maxNativeZoom}
            maxZoom={22}
          />

          {mode === 'track' && path.length >= 2 ? <Polyline positions={path} /> : null}

          {mode === 'track'
            ? olderPoints.map((p) => (
            <Marker key={p.time} position={asLatLng(p)}>
              <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                <div className="text-xs">
                  <div>{p.time}</div>
                  <div>Acc: {Math.round(p.Accuracy)} m</div>
                </div>
              </Tooltip>
            </Marker>
              ))
            : null}

          {latest ? (
            <Marker key="latest" position={asLatLng(latest)} icon={latestIcon}>
              <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                <div className="text-xs">
                  <div className="font-semibold">Current</div>
                  <div>Acc: {Math.round(latest.Accuracy)} m</div>
                  <div>{latest.time}</div>
                </div>
              </Tooltip>
            </Marker>
          ) : null}

          {invalidMarkers.map((p) => (
            <Marker key={`invalid-${p.time}`} position={asLatLng(p)}>
              <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                <div className="text-xs">
                  <div className="font-semibold text-rose-500">Invalid point</div>
                  <div>Acc: {Number.isFinite(p.Accuracy) ? Math.round(p.Accuracy) : '—'} m</div>
                  <div>{p.time}</div>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
});

