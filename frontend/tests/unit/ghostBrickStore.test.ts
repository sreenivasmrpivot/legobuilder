/**
 * T-FE-UI-003-01 (partial) — ghostBrickStore unit tests
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * These tests are intentionally RED (TDD). The implementation module
 * `frontend/src/stores/ghostBrickStore.ts` does not yet exist.
 * The frontend-coding agent must implement it to make these pass.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module under test (does NOT exist yet — TDD RED phase)
// ---------------------------------------------------------------------------
// import { useGhostBrickStore } from '../../src/stores/ghostBrickStore';

// ---------------------------------------------------------------------------
// Type contract expected from the implementation
// ---------------------------------------------------------------------------
type GhostBrickState = {
  /** Grid-snapped world position of the ghost brick, or null when hidden */
  position: { x: number; y: number; z: number } | null;
  /** Whether the current position is a valid placement location */
  isValid: boolean;
  /** The brick type ID being previewed */
  brickTypeId: string | null;
  /** Actions */
  setGhostBrick: (position: { x: number; y: number; z: number } | null, isValid: boolean, brickTypeId: string | null) => void;
  clearGhostBrick: () => void;
};

// ---------------------------------------------------------------------------
// Lazy import helper — resolves after implementation exists
// ---------------------------------------------------------------------------
async function getStore(): Promise<() => GhostBrickState> {
  // This dynamic import will fail until the implementation is created.
  // That is intentional — TDD RED phase.
  const mod = await import('../../src/stores/ghostBrickStore');
  return mod.useGhostBrickStore;
}

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: Ghost brick appears at valid position
// ---------------------------------------------------------------------------
describe('ghostBrickStore — T-FE-UI-003-01: valid placement', () => {
  it('should export useGhostBrickStore', async () => {
    const mod = await import('../../src/stores/ghostBrickStore').catch(() => null);
    expect(mod, 'ghostBrickStore module must exist').not.toBeNull();
    expect(typeof mod?.useGhostBrickStore, 'useGhostBrickStore must be a function').toBe('function');
  });

  it('should initialise with null position and isValid=false', async () => {
    const useStore = await getStore();
    const state = useStore.getState();
    expect(state.position).toBeNull();
    expect(state.isValid).toBe(false);
    expect(state.brickTypeId).toBeNull();
  });

  it('setGhostBrick() should update position and mark isValid=true for a free cell', async () => {
    const useStore = await getStore();
    const { setGhostBrick } = useStore.getState();

    setGhostBrick({ x: 0, y: 0, z: 0 }, true, 'brick-1x1');

    const state = useStore.getState();
    expect(state.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(state.isValid).toBe(true);
    expect(state.brickTypeId).toBe('brick-1x1');
  });

  it('setGhostBrick() should snap position to integer grid coordinates', async () => {
    const useStore = await getStore();
    const { setGhostBrick } = useStore.getState();

    // The store should accept pre-snapped coordinates from the hook
    setGhostBrick({ x: 2, y: 0, z: -3 }, true, 'brick-2x4');

    const state = useStore.getState();
    expect(state.position).toEqual({ x: 2, y: 0, z: -3 });
    expect(state.isValid).toBe(true);
  });

  it('clearGhostBrick() should reset position to null', async () => {
    const useStore = await getStore();
    const { setGhostBrick, clearGhostBrick } = useStore.getState();

    setGhostBrick({ x: 1, y: 0, z: 1 }, true, 'brick-1x1');
    clearGhostBrick();

    const state = useStore.getState();
    expect(state.position).toBeNull();
    expect(state.isValid).toBe(false);
    expect(state.brickTypeId).toBeNull();
  });

  it('should support multiple sequential setGhostBrick calls (pointer moves)', async () => {
    const useStore = await getStore();
    const { setGhostBrick } = useStore.getState();

    setGhostBrick({ x: 0, y: 0, z: 0 }, true, 'brick-1x1');
    setGhostBrick({ x: 1, y: 0, z: 0 }, true, 'brick-1x1');
    setGhostBrick({ x: 2, y: 0, z: 0 }, true, 'brick-1x1');

    const state = useStore.getState();
    expect(state.position).toEqual({ x: 2, y: 0, z: 0 });
    expect(state.isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: Ghost brick turns red on invalid position
// ---------------------------------------------------------------------------
describe('ghostBrickStore — T-FE-UI-003-02: invalid placement', () => {
  it('setGhostBrick() should mark isValid=false for an occupied cell', async () => {
    const useStore = await getStore();
    const { setGhostBrick } = useStore.getState();

    // Simulate pointer over an occupied cell — caller passes isValid=false
    setGhostBrick({ x: 3, y: 0, z: 3 }, false, 'brick-1x1');

    const state = useStore.getState();
    expect(state.position).toEqual({ x: 3, y: 0, z: 3 });
    expect(state.isValid).toBe(false);
  });

  it('should transition from valid to invalid when pointer moves to occupied cell', async () => {
    const useStore = await getStore();
    const { setGhostBrick } = useStore.getState();

    setGhostBrick({ x: 0, y: 0, z: 0 }, true, 'brick-1x1');
    expect(useStore.getState().isValid).toBe(true);

    setGhostBrick({ x: 1, y: 0, z: 0 }, false, 'brick-1x1');
    expect(useStore.getState().isValid).toBe(false);
    expect(useStore.getState().position).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('should transition from invalid to valid when pointer moves to free cell', async () => {
    const useStore = await getStore();
    const { setGhostBrick } = useStore.getState();

    setGhostBrick({ x: 5, y: 0, z: 5 }, false, 'brick-1x1');
    expect(useStore.getState().isValid).toBe(false);

    setGhostBrick({ x: 6, y: 0, z: 5 }, true, 'brick-1x1');
    expect(useStore.getState().isValid).toBe(true);
  });

  it('clearGhostBrick() should hide ghost brick regardless of validity state', async () => {
    const useStore = await getStore();
    const { setGhostBrick, clearGhostBrick } = useStore.getState();

    setGhostBrick({ x: 2, y: 0, z: 2 }, false, 'brick-2x4');
    clearGhostBrick();

    const state = useStore.getState();
    expect(state.position).toBeNull();
    expect(state.isValid).toBe(false);
    expect(state.brickTypeId).toBeNull();
  });

  it('isValid should be false when position is null (ghost hidden)', async () => {
    const useStore = await getStore();
    const state = useStore.getState();
    // Initial state
    expect(state.position).toBeNull();
    expect(state.isValid).toBe(false);
  });
});
