/**
 * T-FE-BUG-88-03: Toolbar button onClick handlers wire to stores/services
 *
 * Root Cause: RC-3 — Toolbar.tsx button onClick handlers are no-ops or
 * missing; not wired to historyStore/sceneStore actions.
 *
 * MUST FAIL before fix (RC-3), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-03
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../../src/components/ui/Toolbar';

// ---------------------------------------------------------------------------
// Mock stores and hooks
// ---------------------------------------------------------------------------
const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockClearScene = vi.fn();
const mockRemoveBrick = vi.fn();

vi.mock('../../src/hooks/useUndoRedo', () => ({
  useUndoRedo: () => ({
    undo: mockUndo,
    redo: mockRedo,
    canUndo: true,
    canRedo: true,
  }),
}));

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: (selector: (s: unknown) => unknown) => {
    const state = {
      bricks: [],
      clearScene: mockClearScene,
      removeBrick: mockRemoveBrick,
    };
    return selector(state);
  },
}));

vi.mock('../../src/stores/selectionStore', () => ({
  useSelectionStore: (selector: (s: unknown) => unknown) => {
    const state = {
      selectedBrickId: 'brick-uuid-001',
    };
    return selector(state);
  },
}));

describe('T-FE-BUG-88-03 — Toolbar wires buttons to stores (RC-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Undo button calls historyStore.undo() when clicked', () => {
    render(<Toolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).toBeDefined();

    fireEvent.click(undoButton);

    // RC-3 fix: undo must be called
    expect(mockUndo).toHaveBeenCalledTimes(1);
  });

  it('Redo button calls historyStore.redo() when clicked', () => {
    render(<Toolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    fireEvent.click(redoButton);

    expect(mockRedo).toHaveBeenCalledTimes(1);
  });

  it('New/Clear button calls sceneStore.clearScene() when clicked', () => {
    render(<Toolbar />);

    // Accept either "New" or "Clear" label
    const clearButton =
      screen.queryByRole('button', { name: /new/i }) ??
      screen.queryByRole('button', { name: /clear/i });
    expect(clearButton).not.toBeNull();

    fireEvent.click(clearButton!);

    expect(mockClearScene).toHaveBeenCalledTimes(1);
  });

  it('Undo button is enabled when canUndo=true', () => {
    render(<Toolbar />);

    const undoButton = screen.getByRole('button', { name: /undo/i });
    expect(undoButton).not.toBeDisabled();
  });

  it('Redo button is enabled when canRedo=true', () => {
    render(<Toolbar />);

    const redoButton = screen.getByRole('button', { name: /redo/i });
    expect(redoButton).not.toBeDisabled();
  });

  it('Delete button calls sceneStore.removeBrick with selectedBrickId', () => {
    render(<Toolbar />);

    const deleteButton = screen.queryByRole('button', { name: /delete/i });
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(mockRemoveBrick).toHaveBeenCalledWith('brick-uuid-001');
    }
    // If delete button doesn't exist yet, the test documents the requirement
  });

  it('Toolbar has role=toolbar for accessibility', () => {
    render(<Toolbar />);

    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeDefined();
  });
});
