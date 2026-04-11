/**
 * Persistence Store — Zustand state management for auto-save
 *
 * Manages auto-save status, session lifecycle, and crash recovery state.
 * Integrates persistenceService and crashRecoveryService with the UI.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */
import { create } from 'zustand';
import {
  saveSnapshot,
  closeSession,
  type SaveSnapshotInput,
} from '../services/persistenceService';
import {
  detectCrash,
  restoreSession,
  discardRecovery,
  type RecoveryCandidate,
} from '../services/crashRecoveryService';
import type { SceneSnapshot } from '../services/dbSchema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface PersistenceState {
  // Auto-save state
  sessionId: string;
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveCount: number;
  error: string | null;

  // Recovery state
  recoveryCandidate: RecoveryCandidate | null;
  isRecoveryPromptVisible: boolean;

  // Actions
  initSession: () => void;
  triggerAutoSave: (input: Omit<SaveSnapshotInput, 'sessionId'>) => Promise<void>;
  markSessionClosed: () => Promise<void>;
  checkForCrashRecovery: () => Promise<void>;
  acceptRecovery: () => Promise<SceneSnapshot | null>;
  rejectRecovery: () => Promise<void>;
  dismissRecoveryPrompt: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePersistenceStore = create<PersistenceState>((set, get) => ({
  // Initial state
  sessionId: crypto.randomUUID(),
  autoSaveStatus: 'idle',
  lastSavedAt: null,
  saveCount: 0,
  error: null,
  recoveryCandidate: null,
  isRecoveryPromptVisible: false,

  /**
   * Initialize a new session with a fresh UUID.
   */
  initSession: () => {
    set({ sessionId: crypto.randomUUID(), saveCount: 0, lastSavedAt: null });
  },

  /**
   * Trigger an auto-save of the current scene state.
   * Updates status through idle → saving → saved/error.
   */
  triggerAutoSave: async (input) => {
    const { sessionId } = get();
    set({ autoSaveStatus: 'saving', error: null });

    try {
      await saveSnapshot({ ...input, sessionId });
      const { saveCount } = get();
      set({
        autoSaveStatus: 'saved',
        lastSavedAt: Date.now(),
        saveCount: saveCount + 1,
      });
    } catch (error) {
      set({
        autoSaveStatus: 'error',
        error: error instanceof Error ? error.message : 'Auto-save failed',
      });
    }
  },

  /**
   * Mark the current session as closed (graceful tab close).
   * Called from the beforeunload handler.
   */
  markSessionClosed: async () => {
    const { sessionId } = get();
    try {
      await closeSession(sessionId);
    } catch {
      // Best-effort during unload — don't throw
      console.warn('Failed to mark session as closed');
    }
  },

  /**
   * Check for crash recovery candidates at boot time.
   * If found, shows the recovery prompt.
   */
  checkForCrashRecovery: async () => {
    try {
      const candidate = await detectCrash();
      if (candidate) {
        set({
          recoveryCandidate: candidate,
          isRecoveryPromptVisible: true,
        });
      }
    } catch {
      console.warn('Crash recovery check failed');
    }
  },

  /**
   * Accept recovery — load the snapshot and return it.
   * The caller is responsible for loading the data into the scene store.
   */
  acceptRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return null;

    try {
      const snapshot = await restoreSession(recoveryCandidate.snapshotId);
      set({ isRecoveryPromptVisible: false, recoveryCandidate: null });
      return snapshot;
    } catch {
      console.warn('Failed to restore session');
      set({ isRecoveryPromptVisible: false, recoveryCandidate: null });
      return null;
    }
  },

  /**
   * Reject recovery — discard the orphaned session data.
   */
  rejectRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return;

    try {
      await discardRecovery(recoveryCandidate.sessionId);
    } catch {
      console.warn('Failed to discard recovery data');
    }

    set({ isRecoveryPromptVisible: false, recoveryCandidate: null });
  },

  /**
   * Dismiss the recovery prompt without action.
   */
  dismissRecoveryPrompt: () => {
    set({ isRecoveryPromptVisible: false });
  },
}));
