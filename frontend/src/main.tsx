/**
 * Application entry point
 *
 * Renders the React application and exposes dev-mode utilities
 * for E2E testing (window.__legoApp).
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-EDIT-001
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './index.css';
import { useSelectionStore } from './stores/selectionStore';

// ---------------------------------------------------------------------------
// Dev mode: expose stores on window for E2E test access
// (T-E2E-EDIT-001-01 detection strategy 4)
// ---------------------------------------------------------------------------

if (import.meta.env.DEV) {
  (window as unknown as { __legoApp: Record<string, unknown> }).__legoApp = {
    selectionStore: useSelectionStore,
  };
}

// ---------------------------------------------------------------------------
// Mount React application
// ---------------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
