import { normalizeTrackingPoints } from './normalizeTrackingPoints';

test('normalizes the legacy timestamp-keyed shape', () => {
  expect(
    normalizeTrackingPoints({
      '2026-10-17_09-29-00': {
        Latitude: 21,
        Longitude: 78,
        Accuracy: 10,
      },
    })
  ).toEqual([
    {
      Latitude: 21,
      Longitude: 78,
      Accuracy: 10,
      time: '2026-10-17_09-29-00',
    },
  ]);
});

test('normalizes the direct Firebase record shape and preserves metadata', () => {
  expect(
    normalizeTrackingPoints({
      SoldierID: 'BSF001',
      Status: 'SAFE',
      Link: 'LORA',
      Latitude: 21.09482,
      Longitude: 78.97801,
      Accuracy: 25.281,
      LocationMode: 'RANDOM',
      Simulated: true,
      RSSI: -45,
      Timestamp: '2026-10-17_09-30-00_123456',
    })
  ).toEqual([
    {
      SoldierID: 'BSF001',
      Status: 'SAFE',
      Link: 'LORA',
      Latitude: 21.09482,
      Longitude: 78.97801,
      Accuracy: 25.281,
      LocationMode: 'RANDOM',
      Simulated: true,
      RSSI: -45,
      Timestamp: '2026-10-17_09-30-00_123456',
      time: '2026-10-17_09-30-00_123456',
    },
  ]);
});

test('normalizes mixed legacy and new records using each record timestamp', () => {
  const points = normalizeTrackingPoints({
    '2026-05-15_14-06-34': {
      Latitude: 21.0947455,
      Longitude: 78.9780607,
      Accuracy: 25.281,
    },
    '2026-10-17_10-07-31_12067': {
      SoldierID: 'BSF001',
      Latitude: 21.09374026,
      Longitude: 78.97776368,
      Timestamp: '2026-10-17_10-07-31_12067',
    },
  });

  expect(points.map((point) => point.time)).toEqual([
    '2026-05-15_14-06-34',
    '2026-10-17_10-07-31_12067',
  ]);
});
