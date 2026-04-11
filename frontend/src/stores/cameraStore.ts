/**
 * Store: cameraStore
 *
 * Manages camera state: position, target, fov, clipping planes, and zoom.
 * Default isometric camera position per LLD §3.1.
 *
 * FR: FR-SCENE-001
 * LLD: docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md §3.1, §4.1
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

import { create } from 'zustand';

export interface CameraState {
  /** Camera position in world space [x, y, z] */
  position: [number, number, number];
  /** Camera look-at target [x, y, z] */
  target: [number, number, number];
  /** Vertical field of view in degrees */
  fov: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
  /** Zoom level */
  zoom: number;
}

export interface CameraActions {
  setPosition: (position: [number, number, number]) => void;
  setTarget: (target: [number, number, number]) => void;
  setFov: (fov: number) => void;
  setZoom: (zoom: number) => void;
  resetCamera: () => void;
}

export type CameraStore = CameraState & CameraActions;

const DEFAULT_CAMERA: CameraState = {
  position: [10, 10, 10],
  target: [0, 0, 0],
  fov: 50,
  near: 0.1,
  far: 1000,
  zoom: 1,
};

export const useCameraStore = create<CameraStore>()((set) => ({
  ...DEFAULT_CAMERA,

  setPosition: (position) => set({ position }),
  setTarget: (target) => set({ target }),
  setFov: (fov) => set({ fov }),
  setZoom: (zoom) => set({ zoom }),
  resetCamera: () => set({ ...DEFAULT_CAMERA }),
}));
