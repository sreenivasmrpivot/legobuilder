/**
 * T-FE-UI-003-01 & T-FE-UI-003-02 — Ghost Brick Integration tests
 * FR-UI-003: Ghost Brick Placement Preview
 *
 * Integration tests: ghostBrickStore + useGhostBrick hook interaction.
 * Tests the full state machine: activate → move (valid/invalid) → deactivate.
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding implements
 * src/stores/ghostBrickStore.ts and src/hooks/useGhostBrick.ts
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock placement engine
// ---------------------------------------------------------------------------
vi.mock('../../src/engine/placementEngine', () => ({
  isPositionValid: vi.fn(),
}));

import { isPositionValid } from '../../src/engine/placementEngine';
const mockIsPositionValid = vi.mocked(isPositionValid);

import { useGhostBrick } from '../../src/hooks/useGhostBrick';
import { useGhostBrickStore } from '../../src/stores/ghostBrickStore';

const BRICK_TYPE_ID = '2x4';
const POS_A = { x: 0, y: 0, z: 0 };
const POS_B = { x: 4, y: 0, z: 4 };
const POS_INVALID = { x: 99, y: 99, z: 99 };

function resetStore() {
  useGhostBrickStore.setState({
    position: null,
    brickTypeId: null,
    isValid: false,
    isVisible: false,
  });
}

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: Full valid placement flow
// ---------------------------------------------------------------------------
describe('Ghost Brick Integration — T-FE-UI-003-01: valid placement flow', () => {
  beforeEach(() => {
    resetStore();
    mockIsPositionValid.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('full flow: activate → move → deactivate with valid positions', () => {
    const { result } = renderHook(() => useGhostBrick());

    // Step 1: Activate
    act(() => {
      result.current.activateGhost({ position: POS_A, brickTypeId: BRICK_TYPE_ID });
    });
    expect(useGhostBrickStore.getState().isVisible).toBe(true);
    expect(useGhostBrickStore.getState().isValid).toBe(true);
    expect(useGhostBrickStore.getState().position).toEqual(POS_A);

    // Step 2: Move to another valid position
    act(() => {
      result.current.moveGhost({ position: POS_B });
    });
    expect(useGhostBrickStore.getState().position).toEqual(POS_B);
    expect(useGhostBrickStore.getState().isValid).toBe(true);
    expect(useGhostBrickStore.getState().isVisible).toBe(true);

    // Step 3: Deactivate
    act(() => {
      result.current.deactivateGhost();
    });
    expect(useGhostBrickStore.getState().isVisible).toBe(false);
    expect(useGhostBrickStore.getState().position).toBeNull();
  });

  it('isPositionValid is called with correct position on activate', () => {
    const { result } = renderHook(() => useGhostBrick());
    act(() => {
      result.current.activateGhost({ position: POS_A, brickTypeId: BRICK_TYPE_ID });
    });
    expect(mockIsPositionValid).toHaveBeenCalledWith(
      expect.objectContaining(POS_A),
      expect.anything()
    );
  });

  it('isPositionValid is called with correct position on move', () => {
    const { result } = renderHook(() => useGhostBrick());
    act(() => {
      result.current.activateGhost({ position: POS_A, brickTypeId: BRICK_TYPE_ID });
    });
    act(() => {
      result.current.moveGhost({ position: POS_B });
    });
    expect(mockIsPositionValid).toHaveBeenLastCalledWith(
      expect.objectContaining(POS_B),
      expect.anything()
    );
  });

  it('brickTypeId is preserved across multiple moveGhost() calls', () => {
    const { result } = renderHook(() => useGhostBrick());
    act(() => {
      result.current.activateGhost({ position: POS_A, brickTypeId: BRICK_TYPE_ID });
    });
    act(() => { result.current.moveGhost({ position: POS_B }); });
    act(() => { result.current.moveGhost({ position: { x: 1, y: 0, z: 1 } }); });
    expect(useGhostBrickStore.getState().brickTypeId).toBe(BRICK_TYPE_ID);
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: Full invalid placement flow
// ---------------------------------------------------------------------------
describe('Ghost Brick Integration — T-FE-UI-003-02: invalid placement flow', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('full flow: activate valid → move to invalid → ghost stays visible but red', () => {
    mockIsPositionValid.mockReturnValue(true);
    const { result } = renderHook(() => useGhostBrick());

    // Activate at valid position
    act(() => {
      result.current.activateGhost({ position: POS_A, brickTypeId: BRICK_TYPE_ID });
    });
    expect(useGhostBrickStore.getState().isValid).toBe(true);

    // Move to invalid position
    mockIsPositionValid.mockReturnValue(false);
    act(() => {
      result.current.moveGhost({ position: POS_INVALID });
    });

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(true);  // still visible
    expect(state.isValid).toBe(false);   // but red
    expect(state.position).toEqual(POS_INVALID);
  });

  it('full flow: activate invalid → move to valid → ghost turns green', () => {
    mockIsPositionValid.mockReturnValue(false);
    const { result } = renderHook(() => useGhostBrick());

    // Activate at invalid position
    act(() => {
      result.current.activateGhost({ position: POS_INVALID, brickTypeId: BRICK_TYPE_ID });
    });
    expect(useGhostBrickStore.getState().isValid).toBe(false);

    // Move to valid position
    mockIsPositionValid.mockReturnValue(true);
    act(() => {
      result.current.moveGhost({ position: POS_A });
    });

    const state = useGhostBrickStore.getState();
    expect(state.isValid).toBe(true);
    expect(state.isVisible).toBe(true);
  });

  it('deactivate after invalid state fully clears store', () => {
    mockIsPositionValid.mockReturnValue(false);
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: POS_INVALID, brickTypeId: BRICK_TYPE_ID });
    });
    act(() => {
      result.current.deactivateGhost();
    });

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(false);
    expect(state.isValid).toBe(false);
    expect(state.position).toBeNull();
    expect(state.brickTypeId).toBeNull();
  });

  it('rapid valid→invalid→valid transitions maintain correct isValid state', () => {
    const { result } = renderHook(() => useGhostBrick());

    mockIsPositionValid.mockReturnValue(true);
    act(() => { result.current.activateGhost({ position: POS_A, brickTypeId: BRICK_TYPE_ID }); });

    mockIsPositionValid.mockReturnValue(false);
    act(() => { result.current.moveGhost({ position: POS_INVALID }); });
    expect(useGhostBrickStore.getState().isValid).toBe(false);

    mockIsPositionValid.mockReturnValue(true);
    act(() => { result.current.moveGhost({ position: POS_B }); });
    expect(useGhostBrickStore.getState().isValid).toBe(true);

    mockIsPositionValid.mockReturnValue(false);
    act(() => { result.current.moveGhost({ position: POS_INVALID }); });
    expect(useGhostBrickStore.getState().isValid).toBe(false);
  });
});
