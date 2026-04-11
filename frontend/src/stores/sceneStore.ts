/**
 * Store: sceneStore
 *
 * Manages scene-level state: grid visibility, background color,
 * lighting intensities, and brick collection.
 *
 * FR: FR-SCENE-001
 * LLD: docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md §3.2, §4.2
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

import { create } from 'zustand';
import type { Brick } from '@/types/brick';

export interface SceneState {
  /** Whether the ground grid is visible */
  showGrid: boolean;
  /** Background color of the canvas (CSS hex string) */
  backgroundColor: string;
  /** Ambient light intensity (0.0 – 1.0) */
  ambientIntensity: number;
  /** Directional light intensity (0.0 – 1.0) */
  directionalIntensity: number;
  /** Collection of bricks in the scene */
  bricks: Brick[];
}

export interface SceneActions {
  toggleGrid: () => void;
  setBackgroundColor: (color: string) => void;
  setAmbientIntensity: (intensity: number) => void;
  setDirectionalIntensity: (intensity: number) => void;
  addBrick: (brick: Brick) => void;
  removeBrick: (id: string) => void;
  clearScene: () => void;
}

export type SceneStore = SceneState & SceneActions;

const DEFAULT_SCENE: SceneState = {
  showGrid: true,
  backgroundColor: '#1a1a2e',
  ambientIntensity: 0.4,
  directionalIntensity: 0.8,
  bricks: [],
};

export const useSceneStore = create<SceneStore>()((set) => ({
  ...DEFAULT_SCENE,

  toggleGrid: () =>
    set((state) => ({ showGrid: !state.showGrid })),

  setBackgroundColor: (backgroundColor) =>
    set({ backgroundColor }),

  setAmbientIntensity: (ambientIntensity) =>
    set({ ambientIntensity }),

  setDirectionalIntensity: (directionalIntensity) =>
    set({ directionalIntensity }),

  addBrick: (brick) =>
    set((state) => ({ bricks: [...state.bricks, brick] })),

  removeBrick: (id) =>
    set((state) => ({ bricks: state.bricks.filter((b) => b.id !== id) })),

  clearScene: () =>
    set({ bricks: [] }),
}));
