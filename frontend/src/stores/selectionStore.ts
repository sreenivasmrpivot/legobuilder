/**
 * Selection Store — Zustand state for brick selection
 *
 * Implements the SelectionState interface from LLD Section 3.2.
 * Provides selectedBrickId state with setSelectedBrickId and clearSelection
 * actions. Supports selector-based subscribe() for imperative highlight
 * updates in BrickInstances.tsx (zero React re-renders).
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md Section 3.2, 4.2
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-BE-EDIT-001-03
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// SelectionState interface (LLD Section 3.2)
// ---------------------------------------------------------------------------

export interface SelectionState {
  /** The ID of the currently selected brick, or null if nothing is selected */
  selectedBrickId: string | null;

  /** Select a brick by its ID. Replaces any existing selection. */
  setSelectedBrickId: (id: string) => void;

  /** Clear the current selection. */
  clearSelection: () => void;
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

/**
 * Zustand store for selection state.
 *
 * Uses `subscribeWithSelector` middleware to enable selector-based
 * subscribe() calls. This is critical for BrickInstances.tsx which
 * subscribes to `state.selectedBrickId` changes and performs imperative
 * InstancedMesh color updates without triggering React re-renders.
 *
 * Usage in components:
 *   const selectedBrickId = useSelectionStore((s) => s.selectedBrickId);
 *
 * Usage for imperative subscription (BrickInstances.tsx):
 *   useSelectionStore.subscribe(
 *     (state) => state.selectedBrickId,
 *     (selectedBrickId, previousBrickId) => { ... }
 *   );
 */
export const useSelectionStore = create<SelectionState>()(
  subscribeWithSelector((set) => ({
    selectedBrickId: null,

    setSelectedBrickId: (id: string) => set({ selectedBrickId: id }),

    clearSelection: () => set({ selectedBrickId: null }),
  })),
);

// ---------------------------------------------------------------------------
// SelectionStoreAccessor — DI interface for selectionManager (LLD Section 3.1)
// ---------------------------------------------------------------------------

export interface SelectionStoreAccessor {
  getSelectedBrickId(): string | null;
  setSelectedBrickId(id: string): void;
  clearSelection(): void;
}

/**
 * Creates a SelectionStoreAccessor that delegates to the Zustand store.
 * Used by selectionManager.ts for dependency injection — enables unit
 * testing with mock accessors (no real Zustand store needed in tests).
 */
export function createSelectionStoreAccessor(): SelectionStoreAccessor {
  return {
    getSelectedBrickId: () => useSelectionStore.getState().selectedBrickId,
    setSelectedBrickId: (id: string) =>
      useSelectionStore.getState().setSelectedBrickId(id),
    clearSelection: () => useSelectionStore.getState().clearSelection(),
  };
}
