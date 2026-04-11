/**
 * Persistence Store — Zustand store bridging persistence services to React
 *
 * Manages auto-save status, crash recovery state, and provides
 * actions for triggering saves and session lifecycle.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { create } from 'zustand';
import {
  saveSnapshot,
  closeSession,
  loadSnapshot,
  purgeSession,
  resetSession,
  type SaveSnapshotInput,
} from '../services/persistenceService';
import {
  detectCrash,
  discardRecovery,
} from '../services/crashRecoveryService';
import type { RecoveryCandidate, SceneSnapshot } from '../services/dbSchema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface PersistenceState {
  // Auto-save
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;

  // Recovery
  recoveryCandidate: RecoveryCandidate | null;
  isCheckingRecovery: boolean;

  // Actions
  triggerAutoSave: (input: SaveSnapshotInput) => Promise<void>;
  markSessionClosed: () => Promise<void>;
  checkForRecovery: () => Promise<RecoveryCandidate | null>;
  acceptRecovery: () => Promise<SceneSnapshot | null>;
  rejectRecovery: () => Promise<void>;
  resetAutoSaveStatus: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePersistenceStore = create<PersistenceState>((set, get) => ({
  // Initial state
  autoSaveStatus: 'idle',
  lastSavedAt: null,
  saveError: null,
  recoveryCandidate: null,
  isCheckingRecovery: false,

  /**
   * Triggers an auto-save of the current scene state.
   */
  triggerAutoSave: async (input: SaveSnapshotInput) => {
    set({ autoSaveStatus: 'saving', saveError: null });
    try {
      await saveSnapshot(input);
      set({ autoSaveStatus: 'saved', lastSavedAt: Date.now() });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown save error';
      set({ autoSaveStatus: 'error', saveError: message });
      console.error('[persistenceStore] Auto-save failed:', error);
    }
  },

  /**
   * Marks the current session as closed (graceful shutdown).
   */
  markSessionClosed: async () => {
    try {
      await closeSession();
    } catch {
      // Best-effort — don't block beforeunload
    }
  },

  /**
   * Checks for a crash recovery candidate on app startup.
   */
  checkForRecovery: async () => {
    set({ isCheckingRecovery: true });
    try {
      const candidate = await detectCrash();
      set({ recoveryCandidate: candidate, isCheckingRecovery: false });
      return candidate;
    } catch {
      set({ isCheckingRecovery: false });
      return null;
    }
  },

  /**
   * User accepted recovery — load the snapshot and return it.
   */
  acceptRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return null;

    try {
      const snapshot = await loadSnapshot(recoveryCandidate.snapshotId);
      // Mark the recovered session as closed so it doesn't trigger again
      const db = await import('../services/dbSchema').then((m) => m.getDB());
      const tx = db.transaction('auto-save-meta', 'readwrite');
      const store = tx.objectStore('auto-save-meta');
      const meta = await store.get(recoveryCandidate.sessionId);
      if (meta) {
        await store.put({ ...meta, status: 'closed' });
      }
      await tx.done;

      set({ recoveryCandidate: null });
      resetSession(); // Start a fresh session for new work
      return snapshot ?? null;
    } catch (error) {
      console.error('[persistenceStore] Failed to accept recovery:', error);
      set({ recoveryCandidate: null });
      return null;
    }
  },

  /**
   * User rejected recovery — discard the saved session.
   */
  rejectRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return;

    try {
      await discardRecovery(recoveryCandidate);
    } catch {
      // Best-effort discard
    }
    set({ recoveryCandidate: null });
    resetSession();
  },

  /**
   * Reset auto-save status to idle.
   */
  resetAutoSaveStatus: () => {
    set({ autoSaveStatus: 'idle', saveError: null });
  },
}));
