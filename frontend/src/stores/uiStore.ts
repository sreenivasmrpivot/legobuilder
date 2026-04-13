import { create } from 'zustand';

export interface UiState {
  activeBrickType: string;
  activeColor: string;
  activeTool: string;
  rotation: number;
  setActiveBrickType: (type: string) => void;
  setActiveColor: (color: string) => void;
  setActiveTool: (tool: string) => void;
  rotatePlacementPreview: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeBrickType: '2x4',
  activeColor: '#FF0000',
  activeTool: 'place',
  rotation: 0,
  setActiveBrickType: (type) => set({ activeBrickType: type }),
  setActiveColor: (color) => set({ activeColor: color }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  rotatePlacementPreview: () =>
    set((state) => ({ rotation: (state.rotation + 90) % 360 })),
}));
