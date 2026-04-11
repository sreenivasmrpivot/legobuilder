/**
 * Persistence Store (Zustand) — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements the state machine defined in LLD Section 5.
 *
 * Auto-save status transitions:
 *   idle → saving → saved → idle (normal cycle)
 *   idle → saving → error → saving → saved (retry after error)
 *
 * Recovery status transitions:
 *   none → pending → accepted (user resumes)
 *   none → pending → dismissed (user starts fresh)
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { create } from 'zustand';

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type RecoveryStatus = 'none' | 'pending' | 'accepted' | 'dismissed';

export interface PersistenceState {
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
  lastSavedAt: null as number | null,
  saveError: null as string | null,
  recoveryStatus: 'none' as RecoveryStatus,
  recoverySnapshot: null as object | null,
  sessionId: null as string | null,
};

export const usePersistenceStore = create<PersistenceState>((set) => ({
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

export default usePersistenceStore;
