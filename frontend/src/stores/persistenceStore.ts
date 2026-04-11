/**
 * Persistence Store — Zustand state for auto-save and crash recovery
 *
 * Manages auto-save status, session lifecycle, and recovery state.
 * Integrates with persistenceService and crashRecoveryService.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { create } from 'zustand';
import type { RecoveryCandidate, SceneSnapshot } from '../services/dbSchema';
import {
  closeSession as closeSessionInDB,
  saveSnapshot,
} from '../services/persistenceService';
import {
  acceptRecovery,
  detectCrash,
  discardRecovery,
} from '../services/crashRecoveryService';

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
  triggerAutoSave: () => Promise<void>;
  markSessionClosed: () => Promise<void>;
  checkForCrashRecovery: () => Promise<void>;
  acceptCrashRecovery: () => Promise<SceneSnapshot | null>;
  discardCrashRecovery: () => Promise<void>;
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

  /**
   * Trigger an auto-save of the current scene state.
   * Reads bricks and camera from the scene/camera stores.
   */
  triggerAutoSave: async () => {
    const { sessionId, saveCount } = get();
    set({ autoSaveStatus: 'saving', lastError: null });

    try {
      // Import scene and camera stores dynamically to avoid circular deps
      const { useSceneStore } = await import('./sceneStore');
      const { useCameraStore } = await import('./cameraStore');

      const sceneState = useSceneStore.getState();
      const cameraState = useCameraStore.getState();

      const bricks = (sceneState.bricks || []).map((brick: { id: string; type?: string; position: [number, number, number]; rotation?: [number, number, number, number]; color?: string }) => ({
        id: brick.id,
        type: brick.type || '2x4',
        position: brick.position,
        rotation: brick.rotation || [0, 0, 0, 1] as [number, number, number, number],
        color: brick.color || '#FF0000',
      }));

      const camera = {
        position: cameraState.position || [0, 10, 20] as [number, number, number],
        target: cameraState.target || [0, 0, 0] as [number, number, number],
        zoom: cameraState.zoom || 1,
      };

      const newSaveCount = saveCount + 1;

      await saveSnapshot(sessionId, bricks, camera, {
        name: 'Untitled Scene',
        createdAt: Date.now(),
        lastModifiedAt: Date.now(),
      }, newSaveCount);

      set({
        saveCount: newSaveCount,
        autoSaveStatus: 'saved',
        lastSavedAt: Date.now(),
      });
    } catch (error) {
      set({
        autoSaveStatus: 'error',
        lastError: error instanceof Error ? error.message : 'Auto-save failed',
      });
    }
  },

  /**
   * Mark the current session as closed (graceful shutdown).
   */
  markSessionClosed: async () => {
    const { sessionId } = get();
    try {
      await closeSessionInDB(sessionId);
    } catch {
      // Best-effort during shutdown — don't throw
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
   * Accept the crash recovery candidate and restore the scene.
   */
  acceptCrashRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return null;

    try {
      const snapshot = await acceptRecovery(recoveryCandidate);
      set({
        isRecoveryPromptVisible: false,
        recoveryCandidate: null,
      });
      return snapshot;
    } catch {
      set({ isRecoveryPromptVisible: false, recoveryCandidate: null });
      return null;
    }
  },

  /**
   * Discard the crash recovery candidate.
   */
  discardCrashRecovery: async () => {
    const { recoveryCandidate } = get();
    if (!recoveryCandidate) return;

    try {
      await discardRecovery(recoveryCandidate);
    } catch {
      // Best-effort
    }
    set({
      isRecoveryPromptVisible: false,
      recoveryCandidate: null,
    });
  },
}));
