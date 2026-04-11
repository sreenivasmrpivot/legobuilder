/**
 * useAutoSave Hook — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements the auto-save interval and beforeunload handler
 * defined in LLD Section 6.
 *
 * - Saves scene snapshot to IndexedDB every 30 seconds (configurable)
 * - Registers beforeunload handler to mark session as 'closed'
 * - Cleans up interval and event listener on unmount
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { useEffect, useRef, useCallback } from 'react';
import { persistenceService } from '../services/persistenceService';

const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds per LLD Section 9

export interface UseAutoSaveOptions {
  /** Unique session identifier */
  sessionId: string;
  /** Function that returns the current scene state to persist */
  getSceneSnapshot: () => object;
  /** Optional error callback for save failures */
  onSaveError?: (error: Error) => void;
  /** Override the default 30s interval (mainly for testing) */
  intervalMs?: number;
}

export function useAutoSave(options: UseAutoSaveOptions) {
  const {
    sessionId,
    getSceneSnapshot,
    onSaveError,
    intervalMs = AUTO_SAVE_INTERVAL_MS,
  } = options;

  const saveCountRef = useRef(0);
  const lastSaveRef = useRef<number | null>(null);

  const triggerSave = useCallback(async () => {
    try {
      const snapshot = getSceneSnapshot();
      await persistenceService.saveSnapshot(sessionId, snapshot);
      saveCountRef.current += 1;
      lastSaveRef.current = Date.now();
    } catch (e) {
      onSaveError?.(e as Error);
    }
  }, [sessionId, getSceneSnapshot, onSaveError]);

  // Set up the auto-save interval
  useEffect(() => {
    const id = setInterval(triggerSave, intervalMs);
    return () => clearInterval(id);
  }, [triggerSave, intervalMs]);

  // Register beforeunload handler to mark session as closed on graceful exit
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistenceService.markSessionClosed(sessionId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId]);

  return {
    triggerSave,
    saveCount: saveCountRef,
    lastSave: lastSaveRef,
  };
}

export default useAutoSave;
