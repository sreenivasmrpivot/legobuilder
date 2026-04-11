/**
 * useSelection — React hook bridging selectionStore to components
 *
 * Provides a clean API for React components to read and modify the
 * current brick selection. Wraps the Zustand selectionStore with
 * a stable interface.
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md Section 3.3
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-BE-EDIT-001-03
 */

import { useCallback } from 'react';
import { useSelectionStore } from '../stores/selectionStore';

// ---------------------------------------------------------------------------
// Types (LLD Section 3.3)
// ---------------------------------------------------------------------------

export interface UseSelectionReturn {
  /** Currently selected brick ID, or null */
  selectedBrickId: string | null;
  /** Select a brick by ID */
  selectBrick: (id: string) => void;
  /** Clear the selection */
  clearSelection: () => void;
  /** Check if a specific brick is selected */
  isBrickSelected: (id: string) => boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook for brick selection state.
 *
 * Usage:
 * ```tsx
 * const { selectedBrickId, selectBrick, clearSelection } = useSelection();
 * ```
 *
 * For imperative (non-React) usage, prefer useSelectionStore.subscribe()
 * directly — see BrickInstances.tsx for the pattern.
 */
export function useSelection(): UseSelectionReturn {
  const selectedBrickId = useSelectionStore((state) => state.selectedBrickId);
  const setSelectedBrickId = useSelectionStore(
    (state) => state.setSelectedBrickId,
  );
  const clearSelectionAction = useSelectionStore(
    (state) => state.clearSelection,
  );

  const selectBrick = useCallback(
    (id: string) => {
      setSelectedBrickId(id);
    },
    [setSelectedBrickId],
  );

  const clearSelection = useCallback(() => {
    clearSelectionAction();
  }, [clearSelectionAction]);

  const isBrickSelected = useCallback(
    (id: string) => selectedBrickId === id,
    [selectedBrickId],
  );

  return {
    selectedBrickId,
    selectBrick,
    clearSelection,
    isBrickSelected,
  };
}
