function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTrackingRecord(value) {
  return isObject(value) && ('Latitude' in value || 'Longitude' in value || 'Accuracy' in value);
}

/**
 * Supports both the original `{ timestamp: { ... } }` history shape and a
 * direct tracking record containing its own `Timestamp` field.
 */
export function normalizeTrackingPoints(raw) {
  if (!isObject(raw)) return [];

  const entries = isTrackingRecord(raw)
    ? [[raw.Timestamp, raw]]
    : Object.entries(raw);

  return entries
    .filter(([, value]) => isObject(value))
    .map(([key, value]) => ({
      ...value,
      time: value.Timestamp || key,
    }));
}
