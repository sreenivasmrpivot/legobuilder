/**
 * T-FE-UI-003-01 / T-FE-UI-003-02 — useGhostBrick hook unit tests
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * These tests are intentionally RED (TDD). The implementation module
 * `frontend/src/hooks/useGhostBrick.ts` does not yet exist.
 * The frontend-coding agent must implement it to make these pass.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — ghostBrickStore and occupancy utilities
// ---------------------------------------------------------------------------
const mockSetGhostBrick = vi.fn();
const mockClearGhostBrick = vi.fn();
const mockGetState = vi.fn(() => ({
  position: null,
  isValid: false,
  brickTypeId: null,
  setGhostBrick: mockSetGhostBrick,
  clearGhostBrick: mockClearGhostBrick,
}));

vi.mock('../../src/stores/ghostBrickStore', () => ({
  useGhostBrickStore: Object.assign(
    vi.fn(() => ({
      position: null,
      isValid: false,
      brickTypeId: null,
      setGhostBrick: mockSetGhostBrick,
      clearGhostBrick: mockClearGhostBrick,
    })),
    { getState: mockGetState }
  ),
}));

// Mock occupancy check — default: cell is free
const mockIsCellOccupied = vi.fn(() => false);
vi.mock('../../src/engine/occupancyMap', () => ({
  isCellOccupied: mockIsCellOccupied,
}));

// ---------------------------------------------------------------------------
// Helper: build a synthetic Three.js intersection object
// ---------------------------------------------------------------------------
function makeIntersection(x: number, y: number, z: number) {
  return {
    point: { x, y, z },
    face: { normal: { x: 0, y: 1, z: 0 } },
    object: { name: 'ground' },
  };
}

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: Ghost brick appears at valid position
// ---------------------------------------------------------------------------
describe('useGhostBrick — T-FE-UI-003-01: valid placement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsCellOccupied.mockReturnValue(false);
  });

  it('should export useGhostBrick hook', async () => {
    const mod = await import('../../src/hooks/useGhostBrick').catch(() => null);
    expect(mod, 'useGhostBrick module must exist').not.toBeNull();
    expect(typeof mod?.useGhostBrick, 'useGhostBrick must be a function').toBe('function');
  });

  it('should call setGhostBrick with snapped position and isValid=true on pointer move over free cell', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-1x1' }));

    act(() => {
      result.current.onPointerMove(makeIntersection(0.4, 0, 0.6));
    });

    expect(mockSetGhostBrick).toHaveBeenCalledWith(
      { x: 0, y: 0, z: 1 }, // snapped to nearest integer
      true,
      'brick-1x1'
    );
  });

  it('should snap pointer world position to nearest grid unit', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-2x4' }));

    act(() => {
      result.current.onPointerMove(makeIntersection(2.7, 0, -1.3));
    });

    expect(mockSetGhostBrick).toHaveBeenCalledWith(
      { x: 3, y: 0, z: -1 },
      true,
      'brick-2x4'
    );
  });

  it('should call clearGhostBrick on pointer leave', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-1x1' }));

    act(() => {
      result.current.onPointerLeave();
    });

    expect(mockClearGhostBrick).toHaveBeenCalledTimes(1);
  });

  it('should return onPointerMove and onPointerLeave handlers', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-1x1' }));

    expect(typeof result.current.onPointerMove).toBe('function');
    expect(typeof result.current.onPointerLeave).toBe('function');
  });

  it('should not call setGhostBrick when brickTypeId is null (no brick selected)', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: null }));

    act(() => {
      result.current.onPointerMove(makeIntersection(1, 0, 1));
    });

    expect(mockSetGhostBrick).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: Ghost brick turns red on invalid position
// ---------------------------------------------------------------------------
describe('useGhostBrick — T-FE-UI-003-02: invalid placement (occupied cell)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call setGhostBrick with isValid=false when cell is occupied', async () => {
    mockIsCellOccupied.mockReturnValue(true);
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-1x1' }));

    act(() => {
      result.current.onPointerMove(makeIntersection(3, 0, 3));
    });

    expect(mockSetGhostBrick).toHaveBeenCalledWith(
      expect.objectContaining({ x: 3, z: 3 }),
      false, // isValid must be false
      'brick-1x1'
    );
  });

  it('should transition isValid from true to false when pointer moves to occupied cell', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-1x1' }));

    // First move: free cell
    mockIsCellOccupied.mockReturnValue(false);
    act(() => {
      result.current.onPointerMove(makeIntersection(0, 0, 0));
    });
    expect(mockSetGhostBrick).toHaveBeenLastCalledWith({ x: 0, y: 0, z: 0 }, true, 'brick-1x1');

    // Second move: occupied cell
    mockIsCellOccupied.mockReturnValue(true);
    act(() => {
      result.current.onPointerMove(makeIntersection(1, 0, 0));
    });
    expect(mockSetGhostBrick).toHaveBeenLastCalledWith({ x: 1, y: 0, z: 0 }, false, 'brick-1x1');
  });

  it('should transition isValid from false to true when pointer moves to free cell', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-1x1' }));

    // First move: occupied
    mockIsCellOccupied.mockReturnValue(true);
    act(() => {
      result.current.onPointerMove(makeIntersection(5, 0, 5));
    });
    expect(mockSetGhostBrick).toHaveBeenLastCalledWith({ x: 5, y: 0, z: 5 }, false, 'brick-1x1');

    // Second move: free
    mockIsCellOccupied.mockReturnValue(false);
    act(() => {
      result.current.onPointerMove(makeIntersection(6, 0, 5));
    });
    expect(mockSetGhostBrick).toHaveBeenLastCalledWith({ x: 6, y: 0, z: 5 }, true, 'brick-1x1');
  });

  it('should call clearGhostBrick on pointer leave regardless of validity', async () => {
    mockIsCellOccupied.mockReturnValue(true);
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');

    const { result } = renderHook(() => useGhostBrick({ brickTypeId: 'brick-1x1' }));

    act(() => {
      result.current.onPointerMove(makeIntersection(2, 0, 2));
      result.current.onPointerLeave();
    });

    expect(mockClearGhostBrick).toHaveBeenCalledTimes(1);
  });
});
