/**
 * Persistence Store (Zustand) — NFR-REL-001 Auto-Save Crash Durability
 *
 * Manages the UI state for auto-save status, crash recovery snapshots,
 * and the resume prompt visibility.
 *
 * State machine transitions:
 *   saveStatus: idle → saving → saved | error
 *   showResumePrompt: false → true (on orphaned session detected)
 *   dismissResumePrompt: clears recoverySnapshot and hides prompt
 *
 * @see docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md Section 4
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface RecoverySnapshot {
  sessionId: string;
  timestamp: number;
  brickCount: number;
}

export interface PersistenceState {
  /** Current session identifier */
  sessionId: string;
  /** Current save status for the auto-save indicator */
  saveStatus: SaveStatus;
  /** Timestamp of the last successful save */
  lastSavedAt: number | null;
  /** Recovery snapshot data from a crashed session */
  recoverySnapshot: RecoverySnapshot | null;
  /** Whether to show the resume prompt dialog */
  showResumePrompt: boolean;

  // Actions
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (ts: number) => void;
  setRecoverySnapshot: (snap: RecoverySnapshot | null) => void;
  setShowResumePrompt: (show: boolean) => void;
  dismissResumePrompt: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Creates a new persistence store instance.
 * Exported as a factory for testing (each test gets a fresh store).
 */
export function createPersistenceStore(sessionId = `session-${Date.now()}`) {
  return create<PersistenceState>((set) => ({
    sessionId,
    saveStatus: 'idle',
    lastSavedAt: null,
    recoverySnapshot: null,
    showResumePrompt: false,

    setSaveStatus: (status) => set({ saveStatus: status }),
    setLastSavedAt: (ts) => set({ lastSavedAt: ts }),
    setRecoverySnapshot: (snap) => set({ recoverySnapshot: snap }),
    setShowResumePrompt: (show) => set({ showResumePrompt: show }),
    dismissResumePrompt: () =>
      set({ showResumePrompt: false, recoverySnapshot: null }),
  }));
}

/**
 * Singleton persistence store for the application.
 */
export const usePersistenceStore = createPersistenceStore();
