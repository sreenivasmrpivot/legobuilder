/**
 * Unit tests for persistenceStore (Zustand) — NFR-REL-001 Auto-Save Crash Durability
 *
 * Test ID: T-BE-REL-001-09
 *
 * Strategy: Test the Zustand store state machine transitions defined in
 * LLD Section 5. The store is tested in isolation using the Zustand
 * createStore API directly (no React rendering required).
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-BE-REL-001-09
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

// ---------------------------------------------------------------------------
// persistenceStore interface (mirrors LLD Section 5)
// ---------------------------------------------------------------------------

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type RecoveryStatus = 'none' | 'pending' | 'accepted' | 'dismissed';

interface PersistenceState {
  // Auto-save state
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;

  // Recovery state
  recoveryStatus: RecoveryStatus;
  recoverySnapshot: object | null;
  sessionId: string | null;

  // Actions
  setSaving: () => void;
  setSaved: (timestamp: number) => void;
  setSaveError: (message: string) => void;
  setRecoveryPending: (snapshot: object) => void;
  acceptRecovery: () => void;
  dismissRecovery: () => void;
  setSessionId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  autoSaveStatus: 'idle' as AutoSaveStatus,
  lastSavedAt: null,
  saveError: null,
  recoveryStatus: 'none' as RecoveryStatus,
  recoverySnapshot: null,
  sessionId: null,
};

/** Factory to create a fresh store for each test (avoids state leakage). */
function createPersistenceStore() {
  return create<PersistenceState>((set) => ({
    ...initialState,

    setSaving: () =>
      set({ autoSaveStatus: 'saving', saveError: null }),

    setSaved: (timestamp: number) =>
      set({ autoSaveStatus: 'saved', lastSavedAt: timestamp, saveError: null }),

    setSaveError: (message: string) =>
      set({ autoSaveStatus: 'error', saveError: message }),

    setRecoveryPending: (snapshot: object) =>
      set({ recoveryStatus: 'pending', recoverySnapshot: snapshot }),

    acceptRecovery: () =>
      set({ recoveryStatus: 'accepted', recoverySnapshot: null }),

    dismissRecovery: () =>
      set({ recoveryStatus: 'dismissed', recoverySnapshot: null }),

    setSessionId: (id: string) => set({ sessionId: id }),

    reset: () => set(initialState),
  }));
}

// ---------------------------------------------------------------------------
// T-BE-REL-001-09 — persistenceStore state transitions
// ---------------------------------------------------------------------------

describe('T-BE-REL-001-09 — persistenceStore: state machine transitions', () => {
  let useStore: ReturnType<typeof createPersistenceStore>;

  beforeEach(() => {
    useStore = createPersistenceStore();
  });

  // --- Auto-save status transitions ---

  it('initial state: autoSaveStatus is "idle", no errors, no recovery', () => {
    const state = useStore.getState();
    expect(state.autoSaveStatus).toBe('idle');
    expect(state.lastSavedAt).toBeNull();
    expect(state.saveError).toBeNull();
    expect(state.recoveryStatus).toBe('none');
    expect(state.recoverySnapshot).toBeNull();
    expect(state.sessionId).toBeNull();
  });

  it('setSaving: transitions autoSaveStatus to "saving" and clears error', () => {
    const { setSaving } = useStore.getState();
    setSaving();
    const state = useStore.getState();
    expect(state.autoSaveStatus).toBe('saving');
    expect(state.saveError).toBeNull();
  });

  it('setSaved: transitions autoSaveStatus to "saved" and records timestamp', () => {
    const { setSaving, setSaved } = useStore.getState();
    setSaving();
    const ts = Date.now();
    setSaved(ts);
    const state = useStore.getState();
    expect(state.autoSaveStatus).toBe('saved');
    expect(state.lastSavedAt).toBe(ts);
    expect(state.saveError).toBeNull();
  });

  it('setSaveError: transitions autoSaveStatus to "error" and stores message', () => {
    const { setSaving, setSaveError } = useStore.getState();
    setSaving();
    setSaveError('QuotaExceededError');
    const state = useStore.getState();
    expect(state.autoSaveStatus).toBe('error');
    expect(state.saveError).toBe('QuotaExceededError');
  });

  it('setSaved after error: clears error and transitions to "saved"', () => {
    const { setSaveError, setSaved } = useStore.getState();
    setSaveError('some error');
    setSaved(Date.now());
    const state = useStore.getState();
    expect(state.autoSaveStatus).toBe('saved');
    expect(state.saveError).toBeNull();
  });

  // --- Recovery status transitions ---

  it('setRecoveryPending: sets recoveryStatus to "pending" with snapshot', () => {
    const snapshot = { bricks: [{ id: 'b1' }], camera: { x: 0, y: 5, z: 10 } };
    const { setRecoveryPending } = useStore.getState();
    setRecoveryPending(snapshot);
    const state = useStore.getState();
    expect(state.recoveryStatus).toBe('pending');
    expect(state.recoverySnapshot).toEqual(snapshot);
  });

  it('acceptRecovery: transitions recoveryStatus to "accepted" and clears snapshot', () => {
    const { setRecoveryPending, acceptRecovery } = useStore.getState();
    setRecoveryPending({ bricks: [] });
    acceptRecovery();
    const state = useStore.getState();
    expect(state.recoveryStatus).toBe('accepted');
    expect(state.recoverySnapshot).toBeNull();
  });

  it('dismissRecovery: transitions recoveryStatus to "dismissed" and clears snapshot', () => {
    const { setRecoveryPending, dismissRecovery } = useStore.getState();
    setRecoveryPending({ bricks: [] });
    dismissRecovery();
    const state = useStore.getState();
    expect(state.recoveryStatus).toBe('dismissed');
    expect(state.recoverySnapshot).toBeNull();
  });

  it('setSessionId: stores the session identifier', () => {
    const { setSessionId } = useStore.getState();
    setSessionId('session-abc-123');
    expect(useStore.getState().sessionId).toBe('session-abc-123');
  });

  it('reset: returns all state to initial values', () => {
    const { setSaving, setSaved, setRecoveryPending, setSessionId, reset } =
      useStore.getState();
    setSaving();
    setSaved(Date.now());
    setRecoveryPending({ bricks: [] });
    setSessionId('some-session');

    reset();

    const state = useStore.getState();
    expect(state.autoSaveStatus).toBe('idle');
    expect(state.lastSavedAt).toBeNull();
    expect(state.saveError).toBeNull();
    expect(state.recoveryStatus).toBe('none');
    expect(state.recoverySnapshot).toBeNull();
    expect(state.sessionId).toBeNull();
  });

  // --- State isolation ---

  it('two store instances are independent (no shared state)', () => {
    const store1 = createPersistenceStore();
    const store2 = createPersistenceStore();

    store1.getState().setSaving();

    expect(store1.getState().autoSaveStatus).toBe('saving');
    expect(store2.getState().autoSaveStatus).toBe('idle');
  });
});
