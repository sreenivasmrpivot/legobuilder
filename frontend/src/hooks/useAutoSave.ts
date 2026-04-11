/**
 * useAutoSave Hook — Interval-based auto-save with beforeunload
 *
 * Registers a periodic auto-save interval and a beforeunload
 * listener to mark the session as closed on graceful tab close.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-06
 */
import { useEffect, useRef } from 'react';
import { usePersistenceStore } from '../stores/persistenceStore';

export const AUTO_SAVE_INTERVAL_MS = 5_000;

/**
 * Hook that manages automatic scene persistence.
 *
 * - Sets up a periodic interval to trigger auto-save
 * - Registers a `beforeunload` listener to mark the session as closed
 * - Cleans up both on unmount
 *
 * @param intervalMs - Auto-save interval in milliseconds (default: 5000)
 */
export function useAutoSave(intervalMs = AUTO_SAVE_INTERVAL_MS): void {
  const isSavingRef = useRef(false);
  const { triggerAutoSave, markSessionClosed } = usePersistenceStore();

  useEffect(() => {
    // Register beforeunload handler for graceful close detection
    const handleBeforeUnload = (): void => {
      markSessionClosed();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set up periodic auto-save interval
    const intervalId = setInterval(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        await triggerAutoSave([], { position: [0, 0, 0], target: [0, 0, 0], zoom: 1 }, { name: '', createdAt: 0, lastModifiedAt: 0 });
      } finally {
        isSavingRef.current = false;
      }
    }, intervalMs);

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [intervalMs, triggerAutoSave, markSessionClosed]);
}

export default useAutoSave;
