/**
 * T-FE-BUG-88-06: Ghost brick appears on hover over valid position
 *
 * Root Cause: RC-1 — useBrickPlacement hook not mounted; handlePointerMove
 * not wired to canvas; ghost brick state never updated.
 *
 * MUST FAIL before fix (RC-1), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-06
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBrickPlacement } from '../../src/hooks/useBrickPlacement';

// ---------------------------------------------------------------------------
// Mock stores and engine
// ---------------------------------------------------------------------------
const mockSnapToGrid = vi.fn();
const mockValidatePlacement = vi.fn();

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: (selector: (s: unknown) => unknown) => {
    const state = {
      bricks: [],
      occupancyMap: new Map(),
      addBrick: vi.fn(),
    };
    return selector(state);
  },
}));

vi.mock('../../src/stores/historyStore', () => ({
  useHistoryStore: (selector: (s: unknown) => unknown) => {
    const state = { pushSnapshot: vi.fn() };
    return selector(state);
  },
}));

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (s: unknown) => unknown) => {
    const state = {
      activeBrickType: '2x4',
      activeColor: '#00FF00',
      activeTool: 'place',
      rotation: 0,
    };
    return selector(state);
  },
}));

vi.mock('../../src/engine/placementEngine', () => ({
  placementEngine: {
    snapToGrid: mockSnapToGrid,
    validatePlacement: mockValidatePlacement,
    getOccupiedCells: vi.fn().mockReturnValue([]),
  },
}));

function makePointerMoveEvent(point = { x: 4, y: 0, z: 6 }) {
  return {
    point,
    stopPropagation: vi.fn(),
    nativeEvent: new PointerEvent('pointermove'),
  } as unknown as import('@react-three/fiber').ThreeEvent<PointerEvent>;
}

describe('T-FE-BUG-88-06 — Ghost brick appears on hover (RC-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSnapToGrid.mockReturnValue([4, 0, 6]);
    mockValidatePlacement.mockReturnValue(true);
  });

  it('ghostBrick is null before any pointer move', () => {
    const { result } = renderHook(() => useBrickPlacement());

    expect(result.current.ghostBrick).toBeNull();
  });

  it('ghostBrick is set after handlePointerMove over valid position', () => {
    const { result } = renderHook(() => useBrickPlacement());

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent({ x: 4, y: 0, z: 6 }));
    });

    // RC-1 fix: ghostBrick must be populated
    expect(result.current.ghostBrick).not.toBeNull();
  });

  it('ghostBrick has correct position matching snapped grid coordinates', () => {
    mockSnapToGrid.mockReturnValue([4, 0, 6]);
    const { result } = renderHook(() => useBrickPlacement());

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent({ x: 4, y: 0, z: 6 }));
    });

    expect(result.current.ghostBrick?.position).toEqual([4, 0, 6]);
  });

  it('ghostBrick has correct type from uiStore.activeBrickType', () => {
    const { result } = renderHook(() => useBrickPlacement());

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent());
    });

    expect(result.current.ghostBrick?.type).toBe('2x4');
  });

  it('ghostBrick has correct color from uiStore.activeColor', () => {
    const { result } = renderHook(() => useBrickPlacement());

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent());
    });

    expect(result.current.ghostBrick?.color).toBe('#00FF00');
  });

  it('ghostBrick.isValid=true when position is free', () => {
    mockValidatePlacement.mockReturnValue(true);
    const { result } = renderHook(() => useBrickPlacement());

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent());
    });

    expect(result.current.ghostBrick?.isValid).toBe(true);
  });

  it('ghostBrick.isValid=false when position is occupied', () => {
    mockValidatePlacement.mockReturnValue(false);
    const { result } = renderHook(() => useBrickPlacement());

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent());
    });

    expect(result.current.ghostBrick?.isValid).toBe(false);
  });

  it('ghostBrick updates position on subsequent pointer moves', () => {
    mockSnapToGrid
      .mockReturnValueOnce([0, 0, 0])
      .mockReturnValueOnce([4, 0, 6]);

    const { result } = renderHook(() => useBrickPlacement());

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent({ x: 0, y: 0, z: 0 }));
    });
    expect(result.current.ghostBrick?.position).toEqual([0, 0, 0]);

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent({ x: 4, y: 0, z: 6 }));
    });
    expect(result.current.ghostBrick?.position).toEqual([4, 0, 6]);
  });

  it('ghostBrick is cleared when snapToGrid returns null (out of bounds)', () => {
    mockSnapToGrid.mockReturnValue(null);
    const { result } = renderHook(() => useBrickPlacement());

    // First set a ghost brick
    mockSnapToGrid.mockReturnValueOnce([0, 0, 0]).mockReturnValueOnce(null);

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent({ x: 0, y: 0, z: 0 }));
    });

    act(() => {
      result.current.handlePointerMove(makePointerMoveEvent({ x: 999, y: 999, z: 999 }));
    });

    expect(result.current.ghostBrick).toBeNull();
  });
});
