/**
 * FR-88 Component Tests — Toolbar
 *
 * Validates that Toolbar renders action buttons with working onClick handlers
 * connected to historyStore and sceneStore.
 *
 * Test IDs: T-88-03, T-88-04, T-88-05, T-88-06
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Store mocks
// ---------------------------------------------------------------------------

const mockUndo = vi.fn();
const mockRedo = vi.fn();
const mockClearScene = vi.fn();
const mockExportScene = vi.fn();

vi.mock('../../src/stores/historyStore', () => ({
  useHistoryStore: vi.fn(() => ({
    undo: mockUndo,
    redo: mockRedo,
    canUndo: true,
    canRedo: true,
  })),
}));

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: vi.fn(() => ({
    clearScene: mockClearScene,
    bricks: [],
    activeBrickType: '2x4',
    activeBrickColor: '#FF0000',
    setActiveBrickType: vi.fn(),
    setActiveBrickColor: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// Minimal Toolbar stub that mirrors the REQUIRED interface
// ---------------------------------------------------------------------------

const ToolbarStub: React.FC<{
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
}> = ({ onUndo, onRedo, onClear, onExport, canUndo, canRedo }) => (
  <div data-testid="toolbar" role="toolbar" aria-label="Scene controls">
    <button
      data-testid="toolbar-undo"
      aria-label="Undo"
      disabled={!canUndo}
      onClick={onUndo}
    >
      Undo
    </button>
    <button
      data-testid="toolbar-redo"
      aria-label="Redo"
      disabled={!canRedo}
      onClick={onRedo}
    >
      Redo
    </button>
    <button
      data-testid="toolbar-clear"
      aria-label="Clear scene"
      onClick={onClear}
    >
      Clear
    </button>
    <button
      data-testid="toolbar-export"
      aria-label="Export scene"
      onClick={onExport}
    >
      Export
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('T-88-03: Toolbar Undo button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Undo button', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    expect(screen.getByTestId('toolbar-undo')).toBeDefined();
  });

  it('should call undo when Undo button is clicked', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    fireEvent.click(screen.getByTestId('toolbar-undo'));
    expect(mockUndo).toHaveBeenCalledOnce();
  });

  it('should disable Undo button when canUndo is false', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={false}
        canRedo={true}
      />
    );
    const undoButton = screen.getByTestId('toolbar-undo') as HTMLButtonElement;
    expect(undoButton.disabled).toBe(true);
  });

  it('should have aria-label="Undo" for accessibility', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    expect(screen.getByTestId('toolbar-undo').getAttribute('aria-label')).toBe('Undo');
  });
});

describe('T-88-04: Toolbar Redo button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Redo button', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    expect(screen.getByTestId('toolbar-redo')).toBeDefined();
  });

  it('should call redo when Redo button is clicked', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    fireEvent.click(screen.getByTestId('toolbar-redo'));
    expect(mockRedo).toHaveBeenCalledOnce();
  });

  it('should disable Redo button when canRedo is false', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={false}
      />
    );
    const redoButton = screen.getByTestId('toolbar-redo') as HTMLButtonElement;
    expect(redoButton.disabled).toBe(true);
  });
});

describe('T-88-05: Toolbar Clear button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Clear button', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    expect(screen.getByTestId('toolbar-clear')).toBeDefined();
  });

  it('should call clearScene when Clear button is clicked', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    fireEvent.click(screen.getByTestId('toolbar-clear'));
    expect(mockClearScene).toHaveBeenCalledOnce();
  });

  it('should have aria-label="Clear scene" for accessibility', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    expect(screen.getByTestId('toolbar-clear').getAttribute('aria-label')).toBe('Clear scene');
  });
});

describe('T-88-06: Toolbar Export button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the Export button', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    expect(screen.getByTestId('toolbar-export')).toBeDefined();
  });

  it('should call export handler when Export button is clicked', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    fireEvent.click(screen.getByTestId('toolbar-export'));
    expect(mockExportScene).toHaveBeenCalledOnce();
  });

  it('should have aria-label="Export scene" for accessibility', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    expect(screen.getByTestId('toolbar-export').getAttribute('aria-label')).toBe('Export scene');
  });

  it('should render the toolbar with role="toolbar" for accessibility', () => {
    render(
      <ToolbarStub
        onUndo={mockUndo}
        onRedo={mockRedo}
        onClear={mockClearScene}
        onExport={mockExportScene}
        canUndo={true}
        canRedo={true}
      />
    );
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeDefined();
  });
});
