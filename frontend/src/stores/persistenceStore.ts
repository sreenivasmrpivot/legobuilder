/**
 * Persistence Store — NFR-REL-001
 *
 * Zustand store that bridges the scene state (from sceneStore) to the
 * IndexedDB persistence layer. Manages session lifecycle, auto-save
 * status, and recovery flow.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */
import { create } from 'zustand';
import {
  saveSnapshot,
  closeSession,
  type BrickRecord,
  type CameraState,
  type SceneMetadata,
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
  // Session
  sessionId: string;
  saveCount: number;

  // Auto-save status
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  lastError: string | null;

  // Recovery
  recoveryCandidate: RecoveryCandidate | null;
  isRecoveryPromptVisible: boolean;

  // Actions
  triggerAutoSave: (
    bricks: BrickRecord[],
    cameraState: CameraState,
    sceneMetadata: SceneMetadata,
  ) => Promise<void>;
  markSessionClosed: () => Promise<void>;
  checkForCrashRecovery: () => Promise<void>;
  resumeSession: () => Promise<SceneSnapshot | null>;
  discardSession: () => Promise<void>;
  dismissRecoveryPrompt: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePersistenceStore = create<PersistenceState>((set, get) => ({
  // Initial state
  sessionId: crypto.randomUUID(),
  saveCount: 0,
  autoSaveStatus: 'idle',
  lastSavedAt: null,
  lastError: null,
  recoveryCandidate: null,
  isRecoveryPromptVisible: false,

  triggerAutoSave: async (bricks, cameraState, sceneMetadata) => {
    const { sessionId, autoSaveStatus } = get();

    // Guard against overlapping saves
    if (autoSaveStatus === 'saving') return;

    set({ autoSaveStatus: 'saving', lastError: null });

    try {
      await saveSnapshot({
        sessionId,
        bricks,
        cameraState,
        sceneMetadata,
      });

      set((state) => ({
        autoSaveStatus: 'saved',
        saveCount: state.saveCount + 1,
        lastSavedAt: Date.now(),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown save error';
      set({ autoSaveStatus: 'error', lastError: message });
    }
  },

  markSessionClosed: async () => {
    const { sessionId } = get();
    try {
      await closeSession(sessionId);
    } catch {
      // Best-effort on unload — don't throw
    }
  },

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

  resumeSession: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return null;

    try {
      const snapshot = await acceptRecovery(recoveryCandidate);
      set({
        isRecoveryPromptVisible: false,
        recoveryCandidate: null,
        // Use the recovered session's ID for future saves
        sessionId: recoveryCandidate.sessionId,
      });
      return snapshot;
    } catch {
      set({ isRecoveryPromptVisible: false, recoveryCandidate: null });
      return null;
    }
  },

  discardSession: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return;

    try {
      await discardRecovery(recoveryCandidate);
    } catch {
      // Best-effort purge
    }
    set({ isRecoveryPromptVisible: false, recoveryCandidate: null });
  },

  dismissRecoveryPrompt: () => {
    set({ isRecoveryPromptVisible: false });
  },
}));
