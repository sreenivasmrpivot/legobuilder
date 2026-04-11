/**
 * useAutoSave Hook — NFR-REL-001
 *
 * Interval-based auto-save with beforeunload listener for graceful close.
 * Uses the persistenceStore to trigger saves and mark sessions closed.
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
 * 1. Sets up an interval to trigger auto-save every `intervalMs` milliseconds.
 * 2. Registers a `beforeunload` listener that marks the session as closed
 *    for graceful tab/browser close detection.
 * 3. Cleans up both on unmount.
 *
 * @param intervalMs - Auto-save interval in milliseconds (default: 5000)
 */
export function useAutoSave(intervalMs = AUTO_SAVE_INTERVAL_MS): void {
  const isSavingRef = useRef(false);
  const { triggerAutoSave, markSessionClosed } = usePersistenceStore();

  useEffect(() => {
    // --- beforeunload handler ---
    const handleBeforeUnload = (): void => {
      markSessionClosed();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // --- Interval-based auto-save ---
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
