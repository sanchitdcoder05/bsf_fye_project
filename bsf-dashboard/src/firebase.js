import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration (Realtime Database project)
const firebaseConfig = {
  apiKey: 'AIzaSyC5ScLoV7U2TdIURCpzXh2hRNmq08CT-UA',
  authDomain: 'bsf-realtimedata.firebaseapp.com',
  databaseURL: 'https://bsf-realtimedata-default-rtdb.firebaseio.com',
  projectId: 'bsf-realtimedata',
  storageBucket: 'bsf-realtimedata.firebasestorage.app',
  messagingSenderId: '427687702049',
  appId: '1:427687702049:web:a806b7d9d8716363067d60',
  measurementId: 'G-5J4TJ6NFCZ',
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Analytics is optional and may not be supported in all environments.
// We keep it non-blocking so the dashboard works regardless.
export const analyticsPromise = isSupported()
  .then((supported) => (supported ? getAnalytics(app) : null))
  .catch(() => null);
