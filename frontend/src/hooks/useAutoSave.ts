/**
 * useAutoSave Hook — Interval-based auto-save with beforeunload cleanup
 *
 * Registers a periodic auto-save interval and a beforeunload listener
 * that marks the session as closed on graceful shutdown.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-06
 */

import { useEffect, useRef } from 'react';
import { usePersistenceStore } from '../stores/persistenceStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUTO_SAVE_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Auto-save hook that:
 * 1. Sets up a periodic interval to trigger auto-save.
 * 2. Registers a `beforeunload` listener to mark the session as closed
 *    on graceful tab/window close.
 * 3. Cleans up both on unmount.
 *
 * @param intervalMs - Auto-save interval in milliseconds (default: 5000)
 */
export function useAutoSave(intervalMs = AUTO_SAVE_INTERVAL_MS): void {
  const isSavingRef = useRef(false);
  const { triggerAutoSave, markSessionClosed } = usePersistenceStore();

  useEffect(() => {
    // --- beforeunload listener ---
    const handleBeforeUnload = (): void => {
      markSessionClosed();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // --- Auto-save interval ---
    const intervalId = setInterval(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        await triggerAutoSave();
      } finally {
        isSavingRef.current = false;
      }
    }, intervalMs);

    // --- Cleanup ---
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [intervalMs, triggerAutoSave, markSessionClosed]);
}

export default useAutoSave;
