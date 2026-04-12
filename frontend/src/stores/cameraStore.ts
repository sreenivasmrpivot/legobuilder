import { create } from 'zustand';

export type CameraPreset = 'isometric' | 'top' | 'front' | 'right';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  activePreset: CameraPreset | null;
}

export interface CameraActions {
  setPosition: (position: [number, number, number]) => void;
  setTarget: (target: [number, number, number]) => void;
  applyPreset: (preset: CameraPreset) => void;
}

const PRESETS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  isometric: { position: [20, 20, 20], target: [0, 0, 0] },
  top: { position: [0, 30, 0], target: [0, 0, 0] },
  front: { position: [0, 10, 30], target: [0, 0, 0] },
  right: { position: [30, 10, 0], target: [0, 0, 0] },
};

export const useCameraStore = create<CameraState & CameraActions>()((set) => ({
  position: [20, 20, 20],
  target: [0, 0, 0],
  activePreset: 'isometric',
  setPosition: (position) => set({ position, activePreset: null }),
  setTarget: (target) => set({ target }),
  applyPreset: (preset) => set({ position: PRESETS[preset].position, target: PRESETS[preset].target, activePreset: preset }),
}));
