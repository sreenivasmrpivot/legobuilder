/**
 * Store: cameraStore
 *
 * Manages camera state: position, target, zoom level, and preset tracking.
 *
 * This is a scaffold stub. Feature implementation will be done in
 * feature branches per the PM-Issues agent's issue plan.
 */

import { create } from 'zustand';

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  setPosition: (pos: [number, number, number]) => void;
  setTarget: (target: [number, number, number]) => void;
  setZoom: (zoom: number) => void;
  resetCamera: () => void;
}

const DEFAULT_POSITION: [number, number, number] = [20, 20, 20];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];
const DEFAULT_ZOOM = 1;

export const useCameraStore = create<CameraState>()((set) => ({
  position: DEFAULT_POSITION,
  target: DEFAULT_TARGET,
  zoom: DEFAULT_ZOOM,

  setPosition: (position) => set({ position }),
  setTarget: (target) => set({ target }),
  setZoom: (zoom) => set({ zoom }),
  resetCamera: () =>
    set({
      position: DEFAULT_POSITION,
      target: DEFAULT_TARGET,
      zoom: DEFAULT_ZOOM,
    }),
}));
