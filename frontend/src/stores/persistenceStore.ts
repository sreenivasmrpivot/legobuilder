/**
 * Persistence Store — Zustand state management for auto-save
 *
 * Manages auto-save status, session lifecycle, and crash recovery
 * state. Integrates with persistenceService and crashRecoveryService.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */
import { create } from 'zustand';
import {
  saveSnapshot,
  closeSession,
  type SaveSnapshotParams,
} from '../services/persistenceService';
import {
  detectCrash,
  acceptRecovery,
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
  autoSaveStatus: AutoSaveStatus;
  sessionId: string;
  saveCount: number;
  lastSavedAt: number | null;
  error: string | null;

  // Recovery state
  recoveryCandidate: RecoveryCandidate | null;
  isRecoveryPromptVisible: boolean;

  // Actions
  triggerAutoSave: (bricks: SaveSnapshotParams['bricks'], cameraState: SaveSnapshotParams['cameraState'], sceneMetadata: SaveSnapshotParams['sceneMetadata']) => Promise<void>;
  markSessionClosed: () => Promise<void>;
  checkForCrashRecovery: () => Promise<void>;
  handleResumeRecovery: () => Promise<SceneSnapshot | null>;
  handleDiscardRecovery: () => Promise<void>;
  dismissRecoveryPrompt: () => void;
  initSession: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePersistenceStore = create<PersistenceState>((set, get) => ({
  // Initial state
  autoSaveStatus: 'idle',
  sessionId: crypto.randomUUID(),
  saveCount: 0,
  lastSavedAt: null,
  error: null,
  recoveryCandidate: null,
  isRecoveryPromptVisible: false,

  /**
   * Initialize a new session with a fresh UUID.
   */
  initSession: () => {
    set({
      sessionId: crypto.randomUUID(),
      saveCount: 0,
      lastSavedAt: null,
      autoSaveStatus: 'idle',
      error: null,
    });
  },

  /**
   * Trigger an auto-save of the current scene state.
   */
  triggerAutoSave: async (bricks, cameraState, sceneMetadata) => {
    const { sessionId, saveCount } = get();

    set({ autoSaveStatus: 'saving', error: null });

    try {
      await saveSnapshot({
        sessionId,
        bricks,
        cameraState,
        sceneMetadata,
        saveCount: saveCount + 1,
      });

      set({
        autoSaveStatus: 'saved',
        saveCount: saveCount + 1,
        lastSavedAt: Date.now(),
      });
    } catch (error) {
      set({
        autoSaveStatus: 'error',
        error: error instanceof Error ? error.message : 'Auto-save failed',
      });
    }
  },

  /**
   * Mark the current session as closed (called on beforeunload).
   */
  markSessionClosed: async () => {
    const { sessionId } = get();
    try {
      await closeSession(sessionId);
    } catch {
      // Best-effort on unload — don't throw
    }
  },

  /**
   * Check for crash recovery candidates on app boot.
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
      // Silently fail — don't block app startup
    }
  },

  /**
   * Accept crash recovery — load the snapshot.
   */
  handleResumeRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return null;

    try {
      const snapshot = await acceptRecovery(
        recoveryCandidate.snapshotId,
        recoveryCandidate.sessionId,
      );

      set({
        isRecoveryPromptVisible: false,
        recoveryCandidate: null,
      });

      return snapshot;
    } catch {
      set({
        isRecoveryPromptVisible: false,
        recoveryCandidate: null,
      });
      return null;
    }
  },

  /**
   * Discard crash recovery — purge the crashed session.
   */
  handleDiscardRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return;

    try {
      await discardRecovery(
        recoveryCandidate.sessionId,
        recoveryCandidate.snapshotId,
      );
    } catch {
      // Best-effort purge
    }

    set({
      isRecoveryPromptVisible: false,
      recoveryCandidate: null,
    });
  },

  /**
   * Dismiss the recovery prompt without action.
   */
  dismissRecoveryPrompt: () => {
    set({
      isRecoveryPromptVisible: false,
    });
  },
}));
