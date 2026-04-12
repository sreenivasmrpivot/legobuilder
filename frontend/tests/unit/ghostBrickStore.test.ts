/**
 * T-FE-UI-003-01 (partial) — ghostBrickStore unit tests
 * FR-UI-003: Ghost Brick Placement Preview
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding implements
 * src/stores/ghostBrickStore.ts
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */
import { describe, it, expect, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module under test (does NOT exist yet — will be created by frontend-coding)
// ---------------------------------------------------------------------------
import {
  useGhostBrickStore,
  type GhostBrickState,
} from '../../src/stores/ghostBrickStore';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VALID_POSITION = { x: 0, y: 0, z: 0 } as const;
const INVALID_POSITION = { x: 99, y: 99, z: 99 } as const;
const BRICK_TYPE_ID = '2x4';

function resetStore() {
  useGhostBrickStore.setState({
    position: null,
    brickTypeId: null,
    isValid: false,
    isVisible: false,
  });
}

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: Ghost brick appears at valid position
// ---------------------------------------------------------------------------
describe('ghostBrickStore — T-FE-UI-003-01: valid placement position', () => {
  beforeEach(() => {
    resetStore();
  });

  it('initial state: ghost brick is not visible', () => {
    const state: GhostBrickState = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(false);
    expect(state.position).toBeNull();
    expect(state.brickTypeId).toBeNull();
    expect(state.isValid).toBe(false);
  });

  it('setGhostBrick() makes ghost visible with correct position and brickTypeId', () => {
    const { setGhostBrick } = useGhostBrickStore.getState();
    setGhostBrick({ position: VALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: true });

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(true);
    expect(state.position).toEqual(VALID_POSITION);
    expect(state.brickTypeId).toBe(BRICK_TYPE_ID);
    expect(state.isValid).toBe(true);
  });

  it('setGhostBrick() with isValid=true sets isValid to true', () => {
    const { setGhostBrick } = useGhostBrickStore.getState();
    setGhostBrick({ position: VALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: true });
    expect(useGhostBrickStore.getState().isValid).toBe(true);
  });

  it('clearGhostBrick() hides the ghost brick and resets all fields', () => {
    const { setGhostBrick, clearGhostBrick } = useGhostBrickStore.getState();
    setGhostBrick({ position: VALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: true });
    clearGhostBrick();

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(false);
    expect(state.position).toBeNull();
    expect(state.brickTypeId).toBeNull();
    expect(state.isValid).toBe(false);
  });

  it('updatePosition() updates position without changing brickTypeId', () => {
    const { setGhostBrick, updatePosition } = useGhostBrickStore.getState();
    setGhostBrick({ position: VALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: true });
    const newPos = { x: 2, y: 0, z: 4 };
    updatePosition({ position: newPos, isValid: true });

    const state = useGhostBrickStore.getState();
    expect(state.position).toEqual(newPos);
    expect(state.brickTypeId).toBe(BRICK_TYPE_ID); // unchanged
    expect(state.isValid).toBe(true);
  });

  it('updatePosition() keeps ghost visible after position update', () => {
    const { setGhostBrick, updatePosition } = useGhostBrickStore.getState();
    setGhostBrick({ position: VALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: true });
    updatePosition({ position: { x: 1, y: 0, z: 1 }, isValid: true });
    expect(useGhostBrickStore.getState().isVisible).toBe(true);
  });

  it('multiple setGhostBrick() calls overwrite previous state', () => {
    const { setGhostBrick } = useGhostBrickStore.getState();
    setGhostBrick({ position: VALID_POSITION, brickTypeId: '1x1', isValid: true });
    setGhostBrick({ position: { x: 4, y: 0, z: 4 }, brickTypeId: '2x2', isValid: true });

    const state = useGhostBrickStore.getState();
    expect(state.brickTypeId).toBe('2x2');
    expect(state.position).toEqual({ x: 4, y: 0, z: 4 });
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: Ghost brick turns red on invalid position
// ---------------------------------------------------------------------------
describe('ghostBrickStore — T-FE-UI-003-02: invalid placement position', () => {
  beforeEach(() => {
    resetStore();
  });

  it('setGhostBrick() with isValid=false marks ghost as invalid', () => {
    const { setGhostBrick } = useGhostBrickStore.getState();
    setGhostBrick({ position: INVALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: false });

    const state = useGhostBrickStore.getState();
    expect(state.isValid).toBe(false);
    expect(state.isVisible).toBe(true); // still visible, just red
    expect(state.position).toEqual(INVALID_POSITION);
  });

  it('updatePosition() with isValid=false marks ghost as invalid', () => {
    const { setGhostBrick, updatePosition } = useGhostBrickStore.getState();
    setGhostBrick({ position: VALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: true });
    updatePosition({ position: INVALID_POSITION, isValid: false });

    const state = useGhostBrickStore.getState();
    expect(state.isValid).toBe(false);
    expect(state.isVisible).toBe(true);
  });

  it('transitioning from invalid to valid updates isValid correctly', () => {
    const { setGhostBrick, updatePosition } = useGhostBrickStore.getState();
    setGhostBrick({ position: INVALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: false });
    updatePosition({ position: VALID_POSITION, isValid: true });

    expect(useGhostBrickStore.getState().isValid).toBe(true);
  });

  it('clearGhostBrick() after invalid state fully resets store', () => {
    const { setGhostBrick, clearGhostBrick } = useGhostBrickStore.getState();
    setGhostBrick({ position: INVALID_POSITION, brickTypeId: BRICK_TYPE_ID, isValid: false });
    clearGhostBrick();

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(false);
    expect(state.isValid).toBe(false);
    expect(state.position).toBeNull();
  });
});
