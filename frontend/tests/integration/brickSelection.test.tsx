/**
 * T-FE-BUG-88-05: Click on instanced brick sets selectionStore.selectedBrickId
 *
 * Root Cause: RC-5 — BrickInstances.tsx not wiring onClick to
 * selectionManager / selectionStore.
 *
 * MUST FAIL before fix (RC-5), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-05
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelection } from '../../src/hooks/useSelection';

// ---------------------------------------------------------------------------
// Mock stores and selectionManager
// ---------------------------------------------------------------------------
const mockSetSelectedBrick = vi.fn();
const mockSelectBrick = vi.fn();

vi.mock('../../src/stores/selectionStore', () => ({
  useSelectionStore: (selector: (s: unknown) => unknown) => {
    const state = {
      selectedBrickId: null,
      setSelectedBrick: mockSetSelectedBrick,
      clearSelection: vi.fn(),
    };
    return selector(state);
  },
}));

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: (selector: (s: unknown) => unknown) => {
    const state = {
      bricks: [
        { id: 'brick-001', type: '1x2', position: [0, 0, 0], rotation: 0, color: '#FF0000' },
        { id: 'brick-002', type: '2x4', position: [2, 0, 0], rotation: 0, color: '#0000FF' },
      ],
    };
    return selector(state);
  },
}));

vi.mock('../../src/engine/selectionManager', () => ({
  selectionManager: {
    selectBrick: mockSelectBrick,
    clearSelection: vi.fn(),
    getSelectedBrickId: vi.fn().mockReturnValue(null),
  },
}));

// ---------------------------------------------------------------------------
// Helper: create a minimal ThreeEvent-like mouse event
// ---------------------------------------------------------------------------
function makeClickEvent(instanceId?: number) {
  return {
    instanceId,
    stopPropagation: vi.fn(),
    nativeEvent: new MouseEvent('click'),
  } as unknown as import('@react-three/fiber').ThreeEvent<MouseEvent>;
}

describe('T-FE-BUG-88-05 — useSelection wires brick click to selectionStore (RC-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hook returns handleBrickClick function', () => {
    const { result } = renderHook(() => useSelection());

    // RC-5 fix: hook must return handleBrickClick
    expect(typeof result.current.handleBrickClick).toBe('function');
  });

  it('handleBrickClick with valid brickId calls selectionManager.selectBrick', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.handleBrickClick('brick-001', makeClickEvent(0));
    });

    // RC-5 fix: selectionManager.selectBrick must be called
    expect(mockSelectBrick).toHaveBeenCalledWith('brick-001');
  });

  it('handleBrickClick calls event.stopPropagation to prevent canvas handler', () => {
    const { result } = renderHook(() => useSelection());
    const event = makeClickEvent(0);

    act(() => {
      result.current.handleBrickClick('brick-001', event);
    });

    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('handleBrickClick with brick-002 selects brick-002', () => {
    const { result } = renderHook(() => useSelection());

    act(() => {
      result.current.handleBrickClick('brick-002', makeClickEvent(1));
    });

    expect(mockSelectBrick).toHaveBeenCalledWith('brick-002');
  });

  it('handleBrickClick with unknown brickId does not crash', () => {
    const { result } = renderHook(() => useSelection());

    expect(() => {
      act(() => {
        result.current.handleBrickClick('nonexistent-brick', makeClickEvent());
      });
    }).not.toThrow();
  });
});
