import { create } from 'zustand';
import type { BrickType } from '../types/brick';

export type Tool = 'place' | 'select' | 'move' | 'rotate' | 'delete';

export interface UIState {
  activeTool: Tool;
  selectedBrickType: BrickType;
  selectedColor: string;
  selectedBrickIds: string[];
  sidebarOpen: boolean;
  sceneListOpen: boolean;
}

export interface UIActions {
  setTool: (tool: Tool) => void;
  setBrickType: (type: BrickType) => void;
  setColor: (color: string) => void;
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  clearSelection: () => void;
  toggleSidebar: () => void;
  toggleSceneList: () => void;
}

export const useUIStore = create<UIState & UIActions>()((set) => ({
  activeTool: 'place',
  selectedBrickType: '2x4',
  selectedColor: '#D01012',
  selectedBrickIds: [],
  sidebarOpen: true,
  sceneListOpen: false,
  setTool: (tool) => set({ activeTool: tool }),
  setBrickType: (type) => set({ selectedBrickType: type }),
  setColor: (color) => set({ selectedColor: color }),
  setSelection: (ids) => set({ selectedBrickIds: ids }),
  addToSelection: (id) => set((s) => ({ selectedBrickIds: [...s.selectedBrickIds, id] })),
  clearSelection: () => set({ selectedBrickIds: [] }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSceneList: () => set((s) => ({ sceneListOpen: !s.sceneListOpen })),
}));
