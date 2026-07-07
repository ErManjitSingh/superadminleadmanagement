import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

window.addEventListener('vite:preloadError', () => {
  try {
    const key = 'sa-chunk-reload-at';
    const now = Date.now();
    const last = Number(window.sessionStorage.getItem(key) || 0);
    if (now - last > 10000) {
      window.sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  } catch {
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
