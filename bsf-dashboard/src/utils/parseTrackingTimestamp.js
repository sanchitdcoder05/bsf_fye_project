// Parses timestamps like "2026-04-20_01-57-21_123456" to a JS Date.
// Returns null if the input is invalid.
export function parseTrackingTimestamp(timestampKey) {
  if (!timestampKey || typeof timestampKey !== 'string') return null;

  const [datePart, timePart] = timestampKey.split('_');
  if (!datePart || !timePart) return null;

  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hourStr, minuteStr, secondStr] = timePart.split('-');

  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const second = Number(secondStr);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return null;
  }

  // JS Date months are 0-based.
  const date = new Date(year, month - 1, day, hour, minute, second);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatTimestamp(timestampKey) {
  const date = parseTrackingTimestamp(timestampKey);
  if (!date) return timestampKey;
  return date.toLocaleString();
}
