/**
 * Store: uiStore
 *
 * Manages UI state: active tool, sidebar visibility, modal state,
 * and notification messages.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import { create } from 'zustand';

export type ActiveTool = 'place' | 'select' | 'delete';

interface UIState {
  activeTool: ActiveTool;
  sidebarOpen: boolean;
  setActiveTool: (tool: ActiveTool) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTool: 'place',
  sidebarOpen: true,

  setActiveTool: (tool) => set({ activeTool: tool }),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
