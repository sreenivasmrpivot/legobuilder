/**
 * T-FE-UI-003-01 (partial) — useGhostBrick hook unit tests
 * FR-UI-003: Ghost Brick Placement Preview
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding implements
 * src/hooks/useGhostBrick.ts
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Modules under test (do NOT exist yet — created by frontend-coding)
// ---------------------------------------------------------------------------
import { useGhostBrick } from '../../src/hooks/useGhostBrick';
import { useGhostBrickStore } from '../../src/stores/ghostBrickStore';

// ---------------------------------------------------------------------------
// Mock the occupancy / placement validation
// ---------------------------------------------------------------------------
vi.mock('../../src/engine/placementEngine', () => ({
  isPositionValid: vi.fn(),
}));

import { isPositionValid } from '../../src/engine/placementEngine';
const mockIsPositionValid = vi.mocked(isPositionValid);

const BRICK_TYPE_ID = '2x4';
const VALID_POS = { x: 0, y: 0, z: 0 };
const INVALID_POS = { x: 99, y: 99, z: 99 };

function resetStore() {
  useGhostBrickStore.setState({
    position: null,
    brickTypeId: null,
    isValid: false,
    isVisible: false,
  });
}

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: Hook activates ghost on valid position
// ---------------------------------------------------------------------------
describe('useGhostBrick — T-FE-UI-003-01: valid position', () => {
  beforeEach(() => {
    resetStore();
    mockIsPositionValid.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('activateGhost() sets ghost visible with isValid=true when position is valid', () => {
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: VALID_POS, brickTypeId: BRICK_TYPE_ID });
    });

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(true);
    expect(state.isValid).toBe(true);
    expect(state.position).toEqual(VALID_POS);
    expect(state.brickTypeId).toBe(BRICK_TYPE_ID);
  });

  it('moveGhost() updates position and keeps isValid=true for valid position', () => {
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: VALID_POS, brickTypeId: BRICK_TYPE_ID });
    });

    const newPos = { x: 2, y: 0, z: 2 };
    act(() => {
      result.current.moveGhost({ position: newPos });
    });

    const state = useGhostBrickStore.getState();
    expect(state.position).toEqual(newPos);
    expect(state.isValid).toBe(true);
  });

  it('deactivateGhost() clears the ghost brick store', () => {
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: VALID_POS, brickTypeId: BRICK_TYPE_ID });
    });
    act(() => {
      result.current.deactivateGhost();
    });

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(false);
    expect(state.position).toBeNull();
  });

  it('hook exposes isGhostVisible derived from store', () => {
    const { result } = renderHook(() => useGhostBrick());
    expect(result.current.isGhostVisible).toBe(false);

    act(() => {
      result.current.activateGhost({ position: VALID_POS, brickTypeId: BRICK_TYPE_ID });
    });
    expect(result.current.isGhostVisible).toBe(true);
  });

  it('hook exposes isGhostValid derived from store', () => {
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: VALID_POS, brickTypeId: BRICK_TYPE_ID });
    });
    expect(result.current.isGhostValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: Hook marks ghost red on invalid position
// ---------------------------------------------------------------------------
describe('useGhostBrick — T-FE-UI-003-02: invalid position', () => {
  beforeEach(() => {
    resetStore();
    mockIsPositionValid.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('activateGhost() sets isValid=false when position is invalid', () => {
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: INVALID_POS, brickTypeId: BRICK_TYPE_ID });
    });

    const state = useGhostBrickStore.getState();
    expect(state.isVisible).toBe(true);  // still visible
    expect(state.isValid).toBe(false);   // but invalid (red)
  });

  it('moveGhost() sets isValid=false when new position is invalid', () => {
    // Start valid
    mockIsPositionValid.mockReturnValueOnce(true);
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: VALID_POS, brickTypeId: BRICK_TYPE_ID });
    });

    // Move to invalid
    mockIsPositionValid.mockReturnValue(false);
    act(() => {
      result.current.moveGhost({ position: INVALID_POS });
    });

    const state = useGhostBrickStore.getState();
    expect(state.isValid).toBe(false);
    expect(state.isVisible).toBe(true);
  });

  it('hook exposes isGhostValid=false when position is invalid', () => {
    const { result } = renderHook(() => useGhostBrick());

    act(() => {
      result.current.activateGhost({ position: INVALID_POS, brickTypeId: BRICK_TYPE_ID });
    });
    expect(result.current.isGhostValid).toBe(false);
  });

  it('moving from invalid to valid position updates isGhostValid to true', () => {
    // Start invalid
    const { result } = renderHook(() => useGhostBrick());
    act(() => {
      result.current.activateGhost({ position: INVALID_POS, brickTypeId: BRICK_TYPE_ID });
    });
    expect(result.current.isGhostValid).toBe(false);

    // Move to valid
    mockIsPositionValid.mockReturnValue(true);
    act(() => {
      result.current.moveGhost({ position: VALID_POS });
    });
    expect(result.current.isGhostValid).toBe(true);
  });
});
