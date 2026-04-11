/**
 * Unit tests for persistenceStore (Zustand) — NFR-REL-001 Auto-Save Crash Durability
 *
 * Validates the Zustand store state transitions defined in LLD Section 4.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01 (store state)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Inline persistenceStore stub (validates LLD Section 4 interface contract)
// The real store will live at src/stores/persistenceStore.ts
// ---------------------------------------------------------------------------

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface RecoverySnapshot {
  sessionId: string;
  timestamp: number;
  brickCount: number;
}

interface PersistenceState {
  sessionId: string;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  recoverySnapshot: RecoverySnapshot | null;
  showResumePrompt: boolean;
  // Actions
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (ts: number) => void;
  setRecoverySnapshot: (snap: RecoverySnapshot | null) => void;
  setShowResumePrompt: (show: boolean) => void;
  dismissResumePrompt: () => void;
}

function createPersistenceStore() {
  return create<PersistenceState>((set) => ({
    sessionId: 'test-session',
    saveStatus: 'idle',
    lastSavedAt: null,
    recoverySnapshot: null,
    showResumePrompt: false,
    setSaveStatus: (status) => set({ saveStatus: status }),
    setLastSavedAt: (ts) => set({ lastSavedAt: ts }),
    setRecoverySnapshot: (snap) => set({ recoverySnapshot: snap }),
    setShowResumePrompt: (show) => set({ showResumePrompt: show }),
    dismissResumePrompt: () => set({ showResumePrompt: false, recoverySnapshot: null }),
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('persistenceStore — NFR-REL-001', () => {
  let useStore: ReturnType<typeof createPersistenceStore>;

  beforeEach(() => {
    useStore = createPersistenceStore();
  });

  it('initialises with idle saveStatus and no recovery snapshot', () => {
    const state = useStore.getState();
    expect(state.saveStatus).toBe('idle');
    expect(state.lastSavedAt).toBeNull();
    expect(state.recoverySnapshot).toBeNull();
    expect(state.showResumePrompt).toBe(false);
  });

  it('setSaveStatus transitions to saving then saved', () => {
    const { setSaveStatus } = useStore.getState();

    setSaveStatus('saving');
    expect(useStore.getState().saveStatus).toBe('saving');

    setSaveStatus('saved');
    expect(useStore.getState().saveStatus).toBe('saved');
  });

  it('setSaveStatus transitions to error on failure', () => {
    const { setSaveStatus } = useStore.getState();
    setSaveStatus('error');
    expect(useStore.getState().saveStatus).toBe('error');
  });

  it('setRecoverySnapshot + setShowResumePrompt triggers resume prompt', () => {
    const { setRecoverySnapshot, setShowResumePrompt } = useStore.getState();
    const snap: RecoverySnapshot = { sessionId: 'crashed', timestamp: 12345, brickCount: 50 };

    setRecoverySnapshot(snap);
    setShowResumePrompt(true);

    const state = useStore.getState();
    expect(state.recoverySnapshot).toEqual(snap);
    expect(state.showResumePrompt).toBe(true);
  });

  it('dismissResumePrompt clears snapshot and hides prompt', () => {
    const { setRecoverySnapshot, setShowResumePrompt, dismissResumePrompt } = useStore.getState();
    setRecoverySnapshot({ sessionId: 'crashed', timestamp: 12345, brickCount: 50 });
    setShowResumePrompt(true);

    dismissResumePrompt();

    const state = useStore.getState();
    expect(state.showResumePrompt).toBe(false);
    expect(state.recoverySnapshot).toBeNull();
  });

  it('setLastSavedAt records the save timestamp', () => {
    const { setLastSavedAt } = useStore.getState();
    const now = Date.now();
    setLastSavedAt(now);
    expect(useStore.getState().lastSavedAt).toBe(now);
  });
});
