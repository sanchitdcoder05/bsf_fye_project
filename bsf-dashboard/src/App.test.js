import { render, screen } from '@testing-library/react';

// CRA/Jest can't parse some ESM-only dependencies in node_modules (e.g. react-leaflet).
// For this smoke test we mock map/chart + the realtime hook.
jest.mock('./hooks/useTrackingData', () => ({
  useTrackingData: () => ({
    loading: false,
    error: null,
    validPoints: [],
    invalidPoints: [],
    latestValid: null,
  }),
}));

jest.mock('./components/MapView', () => ({
  MapView: () => <div>Map</div>,
}));

jest.mock('./components/AccuracyChart', () => ({
  AccuracyChart: () => <div>Chart</div>,
}));

import App from './App';

test('renders dashboard title', () => {
  render(<App />);
  expect(screen.getByText(/real-time location dashboard/i)).toBeInTheDocument();
});