/**
 * Persistence Store — NFR-REL-001
 *
 * Zustand store that bridges the persistence and crash recovery services
 * to the React component tree. Manages auto-save status, recovery state,
 * and provides actions for the UI.
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
  getSessionId,
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
  saveCount: number;
  sessionId: string | null;

  // Recovery
  recoveryCandidate: RecoveryCandidate | null;
  isRecoveryPromptVisible: boolean;

  // Actions
  triggerAutoSave: (input: SaveSnapshotInput) => Promise<void>;
  markSessionClosed: () => Promise<void>;
  checkForCrashRecovery: () => Promise<void>;
  acceptRecovery: () => Promise<SceneSnapshot | null>;
  discardRecoveryAction: () => Promise<void>;
  dismissRecoveryPrompt: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePersistenceStore = create<PersistenceState>((set, get) => ({
  // Initial state
  autoSaveStatus: 'idle',
  lastSavedAt: null,
  saveCount: 0,
  sessionId: null,

  recoveryCandidate: null,
  isRecoveryPromptVisible: false,

  // ---------------------------------------------------------------------------
  // triggerAutoSave
  // ---------------------------------------------------------------------------
  triggerAutoSave: async (input: SaveSnapshotInput) => {
    set({ autoSaveStatus: 'saving' });

    try {
      await saveSnapshot(input);
      const sessionId = getSessionId();
      set((state) => ({
        autoSaveStatus: 'saved',
        lastSavedAt: Date.now(),
        saveCount: state.saveCount + 1,
        sessionId,
      }));
    } catch (error) {
      console.error('[persistenceStore] Auto-save failed:', error);
      set({ autoSaveStatus: 'error' });
    }
  },

  // ---------------------------------------------------------------------------
  // markSessionClosed — called from beforeunload
  // ---------------------------------------------------------------------------
  markSessionClosed: async () => {
    try {
      await closeSession();
    } catch (error) {
      // Best-effort on unload — don't throw
      console.error('[persistenceStore] Failed to close session:', error);
    }
  },

  // ---------------------------------------------------------------------------
  // checkForCrashRecovery — called on app boot
  // ---------------------------------------------------------------------------
  checkForCrashRecovery: async () => {
    try {
      const candidate = await detectCrash();
      if (candidate) {
        set({
          recoveryCandidate: candidate,
          isRecoveryPromptVisible: true,
        });
      }
    } catch (error) {
      console.error('[persistenceStore] Crash detection failed:', error);
    }
  },

  // ---------------------------------------------------------------------------
  // acceptRecovery — user clicks "Resume"
  // ---------------------------------------------------------------------------
  acceptRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return null;

    try {
      const snapshot = await loadSnapshot(recoveryCandidate.snapshotId);

      // Mark the old session as closed so it won't trigger recovery again
      await closeSession(recoveryCandidate.sessionId);

      set({
        isRecoveryPromptVisible: false,
        recoveryCandidate: null,
      });

      return snapshot;
    } catch (error) {
      console.error('[persistenceStore] Recovery failed:', error);
      set({ isRecoveryPromptVisible: false });
      return null;
    }
  },

  // ---------------------------------------------------------------------------
  // discardRecoveryAction — user clicks "Discard"
  // ---------------------------------------------------------------------------
  discardRecoveryAction: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return;

    try {
      await discardRecovery(recoveryCandidate.sessionId);
    } catch (error) {
      console.error('[persistenceStore] Discard failed:', error);
    }

    resetSession();
    set({
      isRecoveryPromptVisible: false,
      recoveryCandidate: null,
    });
  },

  // ---------------------------------------------------------------------------
  // dismissRecoveryPrompt
  // ---------------------------------------------------------------------------
  dismissRecoveryPrompt: () => {
    set({ isRecoveryPromptVisible: false });
  },
}));
