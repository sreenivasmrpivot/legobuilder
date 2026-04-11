/**
 * ghostBrickStore.ts — Zustand store for ghost brick placement preview
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * Manages the transient state of the ghost brick that follows the user's
 * pointer across the build grid. The ghost brick shows a semi-transparent
 * preview of where a brick will be placed.
 *
 * State:
 *   - position: Grid-snapped world position {x, y, z} or null when hidden
 *   - isValid: Whether the current position is a valid placement location
 *   - brickTypeId: The brick type ID being previewed
 *
 * Actions:
 *   - setGhostBrick(position, isValid, brickTypeId): Update ghost brick state
 *   - clearGhostBrick(): Reset all state to initial values (hide ghost)
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import { create } from 'zustand';

/** Position in 3D grid space */
export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

/** Ghost brick store state shape */
export interface GhostBrickState {
  /** Grid-snapped world position of the ghost brick, or null when hidden */
  position: GridPosition | null;
  /** Whether the current position is a valid placement location */
  isValid: boolean;
  /** The brick type ID being previewed */
  brickTypeId: string | null;
  /** Update ghost brick position, validity, and brick type */
  setGhostBrick: (
    position: GridPosition | null,
    isValid: boolean,
    brickTypeId: string | null
  ) => void;
  /** Reset ghost brick state — hides the ghost brick */
  clearGhostBrick: () => void;
}

/**
 * Zustand store for ghost brick placement preview state.
 *
 * Usage in React components:
 *   const { position, isValid } = useGhostBrickStore();
 *
 * Usage outside React (imperative):
 *   const state = useGhostBrickStore.getState();
 *   useGhostBrickStore.subscribe(listener);
 */
export const useGhostBrickStore = create<GhostBrickState>((set) => ({
  position: null,
  isValid: false,
  brickTypeId: null,

  setGhostBrick: (
    position: GridPosition | null,
    isValid: boolean,
    brickTypeId: string | null
  ) =>
    set({
      position,
      isValid,
      brickTypeId,
    }),

  clearGhostBrick: () =>
    set({
      position: null,
      isValid: false,
      brickTypeId: null,
    }),
}));
