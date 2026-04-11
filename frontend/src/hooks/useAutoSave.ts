/**
 * useAutoSave Hook — NFR-REL-001 Auto-Save Crash Durability
 *
 * Subscribes to sceneStore changes via Zustand subscribe() and
 * debounces saves with a 30-second interval. Includes a concurrent
 * write guard to prevent overlapping IndexedDB transactions.
 *
 * Contract (from NFR-REL-001 LLD Section 6):
 *   - AUTO_SAVE_INTERVAL_MS = 30_000 (30 seconds)
 *   - Subscribes to sceneStore changes
 *   - Debounces saves — resets timer on each scene change
 *   - Guards against concurrent writes with isSaving ref
 *   - Cancels debounce timer on unmount
 *   - Unsubscribes from sceneStore on unmount
 *
 * @see docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md Section 6
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { useEffect, useRef } from 'react';
import { persistenceService } from '../services/persistenceService';
import { useSceneStore } from '../stores/sceneStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Auto-save hook that persists scene state to IndexedDB on a debounced
 * interval. Subscribes to the sceneStore and saves snapshots after
 * 30 seconds of inactivity.
 */
export function useAutoSave(): void {
  const isSavingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleAutoSave = () => {
      // Clear any pending debounce timer
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        // Concurrent write guard — skip if a save is already in-flight
        if (isSavingRef.current) {
          return;
        }

        isSavingRef.current = true;
        try {
          const state = useSceneStore.getState();
          const snapshot = {
            bricks: Array.from(state.bricks?.values?.() ?? []),
            version: 1,
            savedAt: Date.now(),
          };
          await persistenceService.saveSnapshot(snapshot as never);
        } finally {
          isSavingRef.current = false;
        }
      }, AUTO_SAVE_INTERVAL_MS);
    };

    // Subscribe to sceneStore changes
    const unsubscribe = useSceneStore.subscribe(scheduleAutoSave);

    // Cleanup: unsubscribe and cancel pending timer
    return () => {
      unsubscribe();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
}

export default useAutoSave;
