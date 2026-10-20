import { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../firebase';
import { normalizeTrackingPoints } from '../utils/normalizeTrackingPoints';
import { parseTrackingTimestamp } from '../utils/parseTrackingTimestamp';

const TRACKING_NODE = 'Tracking';
const EMERGENCY_NODE = 'Emergency';
const MAX_VALID_ACCURACY = 1000;
export const ACTIVE_REPORT_WINDOW_SECONDS = 15;

function normalizeNumber(value) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function sortByTimestampAscending(a, b) {
  const da = parseTrackingTimestamp(a.time);
  const db_ = parseTrackingTimestamp(b.time);
  const ta = da ? da.getTime() : Number.POSITIVE_INFINITY;
  const tb = db_ ? db_.getTime() : Number.POSITIVE_INFINITY;
  return ta - tb;
}

export function useTrackingData() {
  // `raw` holds the latest snapshot from Realtime Database.
  // We keep it separate from derived arrays to avoid re-parsing on every render.
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emergency, setEmergency] = useState({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const trackingRef = ref(db, TRACKING_NODE);
    const emergencyRef = ref(db, EMERGENCY_NODE);
    setLoading(true);
    setError(null);

    // Realtime listener: this fires whenever `/Tracking` changes.
    const unsubscribe = onValue(
      trackingRef,
      (snapshot) => {
        setRaw(snapshot.val() || {});
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    const unsubscribeEmergency = onValue(
      emergencyRef,
      (snapshot) => setEmergency(snapshot.val() || {}),
      (err) => setError(err)
    );

    return () => {
      unsubscribe();
      unsubscribeEmergency();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const { allPoints, validPoints, invalidPoints } = useMemo(() => {
    // Convert either the legacy timestamp-keyed history or a direct record
    // with a Timestamp field into a sorted array of points.
    const points = normalizeTrackingPoints(raw).map((value) => {
      const latitude = normalizeNumber(value?.Latitude);
      const longitude = normalizeNumber(value?.Longitude);
      const accuracy = normalizeNumber(value?.Accuracy);

      return {
        ...value,
        Latitude: latitude,
        Longitude: longitude,
        Accuracy: accuracy,
      };
    });

    points.sort(sortByTimestampAscending);

    const isValid = (p) =>
      Number.isFinite(p.Latitude) &&
      Number.isFinite(p.Longitude) &&
      // Newer records may not include Accuracy. They are still valid
      // locations; retain the limit when accuracy is available.
      (!Number.isFinite(p.Accuracy) || p.Accuracy <= MAX_VALID_ACCURACY);

    const valids = [];
    const invalids = [];
    for (const p of points) {
      if (isValid(p)) valids.push(p);
      else invalids.push(p);
    }

    return {
      allPoints: points,
      validPoints: valids,
      invalidPoints: invalids,
    };
  }, [raw]);

  const latestValid = validPoints.length ? validPoints[validPoints.length - 1] : null;
  const latestAny = allPoints.length ? allPoints[allPoints.length - 1] : null;
  const soldiers = useMemo(() => {
    const bySoldier = new Map();
    for (const point of allPoints) {
      const id = String(point.SoldierID || 'BSF001');
      const current = bySoldier.get(id);
      if (!current || (parseTrackingTimestamp(point.time)?.getTime() || 0) > (parseTrackingTimestamp(current.time)?.getTime() || 0)) {
        bySoldier.set(id, point);
      }
    }

    return [...bySoldier.entries()]
      .map(([id, latestPoint]) => {
        const reportedAt = parseTrackingTimestamp(latestPoint.time);
        const ageSeconds = reportedAt ? Math.max(0, (now - reportedAt.getTime()) / 1000) : Infinity;
        const emergencyRecord = emergency?.[id];
        const isEmergency =
          emergencyRecord === true ||
          String(emergencyRecord?.Emergency ?? emergencyRecord?.emergency).toLowerCase() === 'true' ||
          String(latestPoint.Status).toLowerCase() === 'emergency';
        return {
          id,
          latestPoint,
          ageSeconds,
          isActive: ageSeconds <= ACTIVE_REPORT_WINDOW_SECONDS,
          isEmergency,
          emergencyTimestamp: emergencyRecord?.Timestamp,
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [allPoints, emergency, now]);

  return {
    loading,
    error,
    allPoints,
    validPoints,
    invalidPoints,
    latestValid,
    latestAny,
    soldiers,
  };
}
