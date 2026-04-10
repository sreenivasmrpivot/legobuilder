import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Brick, BrickType } from '@/types/brick';

export interface SceneState {
  bricks: Map<string, Brick>;
  baseplate: { width: number; depth: number };
  activeBrickType: BrickType | null;
  activeColor: string;
  addBrick: (brick: Brick) => void;
  removeBrick: (id: string) => void;
  updateBrick: (id: string, updates: Partial<Brick>) => void;
  clearScene: () => void;
  setActiveBrickType: (type: BrickType | null) => void;
  setActiveColor: (color: string) => void;
}

export const useSceneStore = create<SceneState>()(
  immer((set) => ({
    bricks: new Map(),
    baseplate: { width: 32, depth: 32 },
    activeBrickType: null,
    activeColor: '#D01012',

    addBrick: (brick) =>
      set((state) => {
        state.bricks.set(brick.id, brick);
      }),

    removeBrick: (id) =>
      set((state) => {
        state.bricks.delete(id);
      }),

    updateBrick: (id, updates) =>
      set((state) => {
        const brick = state.bricks.get(id);
        if (brick) Object.assign(brick, updates);
      }),

    clearScene: () =>
      set((state) => {
        state.bricks.clear();
      }),

    setActiveBrickType: (type) =>
      set((state) => {
        state.activeBrickType = type;
      }),

    setActiveColor: (color) =>
      set((state) => {
        state.activeColor = color;
      }),
  }))
);
