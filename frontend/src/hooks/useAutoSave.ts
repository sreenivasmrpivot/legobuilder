/**
 * Hook: useAutoSave
 *
 * Debounced auto-save (5s interval) that persists the current scene
 * to IndexedDB whenever bricks change.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import { useEffect, useRef } from 'react';

const AUTO_SAVE_INTERVAL_MS = 5000;

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // TODO: Implement in feature branch
    // 1. Subscribe to scene store changes
    // 2. Debounce with AUTO_SAVE_INTERVAL_MS
    // 3. Serialize scene and save via persistenceService
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { autoSaveInterval: AUTO_SAVE_INTERVAL_MS };
}
