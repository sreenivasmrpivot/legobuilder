/**
 * T-FE-BUG-88-01b: Viewport.tsx mounts useBrickPlacement and useSelection (RC-1)
 *
 * Verifies that Viewport.tsx calls useBrickPlacement() and useSelection()
 * so that pointer events are active when the viewport is rendered.
 *
 * MUST FAIL before fix (RC-1), MUST PASS after fix.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-88
 * Spectra-Tests: T-FE-BUG-88-01
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Spy on hooks to verify they are called by Viewport
// ---------------------------------------------------------------------------
const mockUseBrickPlacement = vi.fn().mockReturnValue({
  handlePointerDown: vi.fn(),
  handlePointerMove: vi.fn(),
  handlePointerUp: vi.fn(),
  ghostBrick: null,
});

const mockUseSelection = vi.fn().mockReturnValue({
  handleBrickClick: vi.fn(),
});

vi.mock('../../src/hooks/useBrickPlacement', () => ({
  useBrickPlacement: mockUseBrickPlacement,
}));

vi.mock('../../src/hooks/useSelection', () => ({
  useSelection: mockUseSelection,
}));

// Stub out heavy 3D dependencies
vi.mock('../../src/components/viewport/ViewportCanvas', () => ({
  ViewportCanvas: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="viewport-canvas">{children}</div>,
}));

vi.mock('../../src/components/viewport/BrickInstances', () => ({
  BrickInstances: () => null,
}));

vi.mock('../../src/components/viewport/GroundGrid', () => ({
  GroundGrid: () => null,
}));

vi.mock('../../src/components/viewport/Baseplate', () => ({
  Baseplate: () => null,
}));

describe('T-FE-BUG-88-01b — Viewport.tsx mounts placement and selection hooks (RC-1)', () => {
  it('Viewport renders and calls useBrickPlacement()', () => {
    const { Viewport } = require('../../src/components/viewport/Viewport');

    render(<Viewport />);

    // RC-1 fix: useBrickPlacement must be called when Viewport mounts
    expect(mockUseBrickPlacement).toHaveBeenCalledTimes(1);
  });

  it('Viewport renders and calls useSelection()', () => {
    const { Viewport } = require('../../src/components/viewport/Viewport');

    render(<Viewport />);

    // RC-1 fix: useSelection must be called when Viewport mounts
    expect(mockUseSelection).toHaveBeenCalledTimes(1);
  });
});
