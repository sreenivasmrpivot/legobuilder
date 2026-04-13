/**
 * T-FE-BUG-88-04: useKeyboardShortcuts hook wires keyboard events to stores
 *
 * Root Cause: RC-2 — useKeyboardShortcuts hook not called in App.tsx or
 * Viewport.tsx; keyboard events produce no response.
 *
 * MUST FAIL before fix (RC-2), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-04
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';

// ---------------------------------------------------------------------------
// Mock stores
// ---------------------------------------------------------------------------
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockRemoveBrick = vi.fn();
const mockClearSelection = vi.fn();
const mockRotatePlacementPreview = vi.fn();

vi.mock('../../src/stores/historyStore', () => ({
  useHistoryStore: (selector: (s: unknown) => unknown) => {
    const state = {
      undo: mockUndo,
      redo: mockRedo,
      canUndo: true,
      canRedo: true,
    };
    return selector(state);
  },
}));

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: (selector: (s: unknown) => unknown) => {
    const state = {
      removeBrick: mockRemoveBrick,
      bricks: [{ id: 'brick-001', type: '1x2', position: [0, 0, 0], rotation: 0, color: '#FF0000' }],
    };
    return selector(state);
  },
}));

vi.mock('../../src/stores/selectionStore', () => ({
  useSelectionStore: (selector: (s: unknown) => unknown) => {
    const state = {
      selectedBrickId: 'brick-001',
      clearSelection: mockClearSelection,
    };
    return selector(state);
  },
}));

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (s: unknown) => unknown) => {
    const state = {
      rotatePlacementPreview: mockRotatePlacementPreview,
    };
    return selector(state);
  },
}));

// ---------------------------------------------------------------------------
// Helper: fire a keyboard event on window
// ---------------------------------------------------------------------------
function fireKeydown(key: string, options: Partial<KeyboardEventInit> = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options,
  });
  window.dispatchEvent(event);
}

describe('T-FE-BUG-88-04 — useKeyboardShortcuts wires keyboard events (RC-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Ensure hook cleanup removes listeners
  });

  it('Ctrl+Z triggers historyStore.undo()', () => {
    renderHook(() => useKeyboardShortcuts());

    fireKeydown('z', { ctrlKey: true });

    // RC-2 fix: undo must be called
    expect(mockUndo).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Y triggers historyStore.redo()', () => {
    renderHook(() => useKeyboardShortcuts());

    fireKeydown('y', { ctrlKey: true });

    expect(mockRedo).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+Shift+Z triggers historyStore.redo()', () => {
    renderHook(() => useKeyboardShortcuts());

    fireKeydown('z', { ctrlKey: true, shiftKey: true });

    expect(mockRedo).toHaveBeenCalledTimes(1);
  });

  it('Delete key removes the selected brick', () => {
    renderHook(() => useKeyboardShortcuts());

    fireKeydown('Delete');

    expect(mockRemoveBrick).toHaveBeenCalledWith('brick-001');
  });

  it('Backspace key removes the selected brick', () => {
    renderHook(() => useKeyboardShortcuts());

    fireKeydown('Backspace');

    expect(mockRemoveBrick).toHaveBeenCalledWith('brick-001');
  });

  it('Escape key clears selection', () => {
    renderHook(() => useKeyboardShortcuts());

    fireKeydown('Escape');

    expect(mockClearSelection).toHaveBeenCalledTimes(1);
  });

  it('R key rotates placement preview 90°', () => {
    renderHook(() => useKeyboardShortcuts());

    fireKeydown('r');

    expect(mockRotatePlacementPreview).toHaveBeenCalledTimes(1);
  });

  it('keyboard events in input fields are NOT intercepted', () => {
    renderHook(() => useKeyboardShortcuts());

    // Simulate keydown from an input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: input });
    window.dispatchEvent(event);

    // undo should NOT be called when target is an input
    expect(mockUndo).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('hook registers event listener on mount and removes it on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useKeyboardShortcuts());

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
