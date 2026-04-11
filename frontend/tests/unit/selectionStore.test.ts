/**
 * Unit Tests — selectionStore (Zustand)
 *
 * Test ID:
 *   T-BE-EDIT-001-03  selectionStore.setSelectedBrickId updates state;
 *                     clearSelection resets to null
 *
 * Strategy:
 *   - Creates a fresh Zustand store instance per test using the factory
 *     pattern (avoids shared state between tests).
 *   - Validates the SelectionState interface contract from LLD Section 3.2.
 *   - Tests all state transitions: null → id, id → different id, id → null.
 *   - Validates that Zustand subscribe() fires on state changes (used by
 *     BrickInstances.tsx for imperative highlight updates).
 *
 * LLD References:
 *   - Section 3.2: SelectionStore (Zustand) interface contract
 *   - Section 4.2: Selection State Shape
 *   - Section 10.2: BrickInstances.tsx highlight subscription pattern
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-BE-EDIT-001-03
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

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
// Store factory — creates a fresh store per test
// The real store lives at src/stores/selectionStore.ts and exports
// `useSelectionStore = create<SelectionState>(...)` with the same shape.
// ---------------------------------------------------------------------------

function createSelectionStore() {
  return create<SelectionState>((set) => ({
    selectedBrickId: null,
    setSelectedBrickId: (id: string) => set({ selectedBrickId: id }),
    clearSelection: () => set({ selectedBrickId: null }),
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('selectionStore', () => {
  let useStore: ReturnType<typeof createSelectionStore>;

  beforeEach(() => {
    // Fresh store per test — no shared state
    useStore = createSelectionStore();
  });

  // ── T-BE-EDIT-001-03 ─────────────────────────────────────────────────────
  describe('T-BE-EDIT-001-03: state transitions', () => {
    it('initialises with selectedBrickId = null', () => {
      const state = useStore.getState();
      expect(state.selectedBrickId).toBeNull();
    });

    it('setSelectedBrickId updates selectedBrickId to the given id', () => {
      const { setSelectedBrickId } = useStore.getState();

      setSelectedBrickId('brick-uuid-001');

      expect(useStore.getState().selectedBrickId).toBe('brick-uuid-001');
    });

    it('setSelectedBrickId replaces the previous selection', () => {
      const { setSelectedBrickId } = useStore.getState();

      setSelectedBrickId('brick-uuid-001');
      setSelectedBrickId('brick-uuid-002');

      expect(useStore.getState().selectedBrickId).toBe('brick-uuid-002');
    });

    it('clearSelection resets selectedBrickId to null', () => {
      const { setSelectedBrickId, clearSelection } = useStore.getState();

      setSelectedBrickId('brick-uuid-001');
      expect(useStore.getState().selectedBrickId).toBe('brick-uuid-001');

      clearSelection();

      expect(useStore.getState().selectedBrickId).toBeNull();
    });

    it('clearSelection is a no-op when selectedBrickId is already null', () => {
      const { clearSelection } = useStore.getState();

      // Already null — should not throw
      expect(() => clearSelection()).not.toThrow();
      expect(useStore.getState().selectedBrickId).toBeNull();
    });

    it('supports the full selection lifecycle: null → id → different id → null', () => {
      const { setSelectedBrickId, clearSelection } = useStore.getState();

      // Start: null
      expect(useStore.getState().selectedBrickId).toBeNull();

      // Select first brick
      setSelectedBrickId('brick-A');
      expect(useStore.getState().selectedBrickId).toBe('brick-A');

      // Re-select different brick
      setSelectedBrickId('brick-B');
      expect(useStore.getState().selectedBrickId).toBe('brick-B');

      // Clear selection
      clearSelection();
      expect(useStore.getState().selectedBrickId).toBeNull();
    });
  });

  // ── Zustand subscribe() — used by BrickInstances.tsx ─────────────────────
  describe('Zustand subscribe() — imperative highlight subscription', () => {
    it('fires the subscriber when setSelectedBrickId is called', () => {
      const subscriber = vi.fn();

      // Subscribe to selectedBrickId changes (selector-based subscribe)
      // This is the pattern used by BrickInstances.tsx (LLD Section 10.2)
      const unsubscribe = useStore.subscribe(
        (state) => state.selectedBrickId,
        subscriber,
      );

      useStore.getState().setSelectedBrickId('brick-uuid-001');

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith('brick-uuid-001', null);

      unsubscribe();
    });

    it('fires the subscriber when clearSelection is called', () => {
      const subscriber = vi.fn();

      // Pre-select a brick
      useStore.getState().setSelectedBrickId('brick-uuid-001');

      const unsubscribe = useStore.subscribe(
        (state) => state.selectedBrickId,
        subscriber,
      );

      useStore.getState().clearSelection();

      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(subscriber).toHaveBeenCalledWith(null, 'brick-uuid-001');

      unsubscribe();
    });

    it('does NOT fire the subscriber when selectedBrickId does not change', () => {
      const subscriber = vi.fn();

      useStore.getState().setSelectedBrickId('brick-uuid-001');

      const unsubscribe = useStore.subscribe(
        (state) => state.selectedBrickId,
        subscriber,
      );

      // Set the same ID again — no change
      useStore.getState().setSelectedBrickId('brick-uuid-001');

      // Zustand uses Object.is() equality — same string → no notification
      expect(subscriber).not.toHaveBeenCalled();

      unsubscribe();
    });

    it('unsubscribe() stops receiving notifications', () => {
      const subscriber = vi.fn();

      const unsubscribe = useStore.subscribe(
        (state) => state.selectedBrickId,
        subscriber,
      );

      unsubscribe();

      useStore.getState().setSelectedBrickId('brick-uuid-001');

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('fires subscriber with (newValue, previousValue) on each change', () => {
      const calls: Array<[string | null, string | null]> = [];
      const subscriber = vi.fn((newVal: string | null, prevVal: string | null) => {
        calls.push([newVal, prevVal]);
      });

      const unsubscribe = useStore.subscribe(
        (state) => state.selectedBrickId,
        subscriber,
      );

      useStore.getState().setSelectedBrickId('brick-A');
      useStore.getState().setSelectedBrickId('brick-B');
      useStore.getState().clearSelection();

      expect(calls).toEqual([
        ['brick-A', null],
        ['brick-B', 'brick-A'],
        [null, 'brick-B'],
      ]);

      unsubscribe();
    });
  });

  // ── getSelectedBrickId accessor ───────────────────────────────────────────
  describe('getSelectedBrickId() accessor (SelectionStoreAccessor DI pattern)', () => {
    it('returns null initially', () => {
      const id = useStore.getState().selectedBrickId;
      expect(id).toBeNull();
    });

    it('returns the current selectedBrickId after setSelectedBrickId', () => {
      useStore.getState().setSelectedBrickId('brick-uuid-XYZ');
      const id = useStore.getState().selectedBrickId;
      expect(id).toBe('brick-uuid-XYZ');
    });

    it('returns null after clearSelection', () => {
      useStore.getState().setSelectedBrickId('brick-uuid-XYZ');
      useStore.getState().clearSelection();
      const id = useStore.getState().selectedBrickId;
      expect(id).toBeNull();
    });
  });
});
