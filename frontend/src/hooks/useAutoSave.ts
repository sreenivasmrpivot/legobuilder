/**
 * useAutoSave Hook — NFR-REL-001
 *
 * Interval-based auto-save with beforeunload listener for graceful
 * session close. Reads actual scene state from sceneStore on each
 * interval tick and persists via the persistenceStore.
 *
 * Contract tested by:
 *   T-UNIT-REL-001-06  beforeunload listener registration and cleanup
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-06
 */
import { useEffect, useRef } from 'react';
import { usePersistenceStore } from '../stores/persistenceStore';
import { useSceneStore } from '../stores/sceneStore';

export const AUTO_SAVE_INTERVAL_MS = 5_000;

/**
 * Hook that sets up:
 * 1. An interval that triggers auto-save at the configured frequency
 * 2. A beforeunload listener that marks the session as closed on graceful exit
 *
 * Both are cleaned up on unmount.
 *
 * @param intervalMs - Auto-save interval in milliseconds (default: 5000)
 */
export function useAutoSave(intervalMs = AUTO_SAVE_INTERVAL_MS): void {
  const isSavingRef = useRef(false);
  const { triggerAutoSave, markSessionClosed } = usePersistenceStore();

  useEffect(() => {
    // --- beforeunload: mark session closed on graceful exit ---
    const handleBeforeUnload = (): void => {
      markSessionClosed();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // --- Interval: periodic auto-save ---
    const intervalId = setInterval(async () => {
      // Overlap guard: skip if a save is already in progress
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        // B1 FIX: Read actual scene state from sceneStore
        const sceneState = useSceneStore.getState();
        const bricks = sceneState.bricks ?? [];
        const cameraState = sceneState.cameraState ?? {
          position: [0, 10, 20] as [number, number, number],
          target: [0, 0, 0] as [number, number, number],
          zoom: 1,
        };
        const sceneMetadata = sceneState.sceneMetadata ?? {
          name: 'Untitled',
          createdAt: Date.now(),
          lastModifiedAt: Date.now(),
        };

        await triggerAutoSave(bricks, cameraState, sceneMetadata);
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
