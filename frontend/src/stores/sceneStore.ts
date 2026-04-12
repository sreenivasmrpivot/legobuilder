import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Brick } from '../types/brick';

export interface SceneState {
  bricks: Record<string, Brick>;
  gridSize: [number, number];
  sceneName: string;
  sceneId: string | null;
  isDirty: boolean;
  brickCount: number;
}

export interface SceneActions {
  addBrick: (brick: Brick) => void;
  removeBrick: (id: string) => void;
  updateBrick: (id: string, updates: Partial<Brick>) => void;
  loadScene: (scene: SceneState) => void;
  clearScene: () => void;
  setDirty: (dirty: boolean) => void;
}

export const useSceneStore = create<SceneState & SceneActions>()(
  immer((set) => ({
    bricks: {},
    gridSize: [32, 32],
    sceneName: 'Untitled',
    sceneId: null,
    isDirty: false,
    brickCount: 0,
    addBrick: (brick) => set((state) => { state.bricks[brick.id] = brick; state.brickCount += 1; state.isDirty = true; }),
    removeBrick: (id) => set((state) => { delete state.bricks[id]; state.brickCount -= 1; state.isDirty = true; }),
    updateBrick: (id, updates) => set((state) => { Object.assign(state.bricks[id], updates); state.isDirty = true; }),
    loadScene: (scene) => set(() => ({ ...scene, isDirty: false })),
    clearScene: () => set(() => ({ bricks: {}, brickCount: 0, sceneName: 'Untitled', sceneId: null, isDirty: false })),
    setDirty: (dirty) => set({ isDirty: dirty }),
  })),
);
