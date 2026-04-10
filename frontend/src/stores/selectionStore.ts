/**
 * Store: selectionStore
 *
 * Manages the set of currently selected brick IDs and the active
 * transform mode (translate, rotate).
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import { create } from 'zustand';

interface SelectionState {
  selectedIds: Set<string>;
  select: (id: string) => void;
  deselect: (id: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedIds: new Set<string>(),

  select: (id) =>
    set((state) => ({
      selectedIds: new Set(state.selectedIds).add(id),
    })),

  deselect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      next.delete(id);
      return { selectedIds: next };
    }),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: (ids) =>
    set(() => ({
      selectedIds: new Set(ids),
    })),

  clearSelection: () =>
    set(() => ({
      selectedIds: new Set<string>(),
    })),
}));
