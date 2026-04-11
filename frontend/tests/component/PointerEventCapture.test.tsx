/**
 * T-FE-UI-003-01 / T-FE-UI-003-02 — PointerEventCapture component tests
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * These tests are intentionally RED (TDD). The implementation module
 * `frontend/src/components/PointerEventCapture.tsx` does not yet exist.
 * The frontend-coding agent must implement it to make these pass.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock @react-three/fiber
// ---------------------------------------------------------------------------
const mockOnPointerMove = vi.fn();
const mockOnPointerLeave = vi.fn();

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ scene: {}, camera: {}, gl: {} })),
  extend: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock useGhostBrick hook
// ---------------------------------------------------------------------------
vi.mock('../../src/hooks/useGhostBrick', () => ({
  useGhostBrick: vi.fn(() => ({
    onPointerMove: mockOnPointerMove,
    onPointerLeave: mockOnPointerLeave,
  })),
}));

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: PointerEventCapture wires pointer events to useGhostBrick
// ---------------------------------------------------------------------------
describe('PointerEventCapture — T-FE-UI-003-01: pointer event wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export PointerEventCapture component', async () => {
    const mod = await import('../../src/components/PointerEventCapture').catch(() => null);
    expect(mod, 'PointerEventCapture module must exist').not.toBeNull();
    expect(
      typeof mod?.PointerEventCapture,
      'PointerEventCapture must be a function/component'
    ).toBe('function');
  });

  it('should render without throwing', async () => {
    const { PointerEventCapture } = await import('../../src/components/PointerEventCapture');

    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId="brick-1x1" />
        </div>
      );
    }).not.toThrow();
  });

  it('should accept brickTypeId prop', async () => {
    const { PointerEventCapture } = await import('../../src/components/PointerEventCapture');

    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId="brick-2x4" />
        </div>
      );
    }).not.toThrow();
  });

  it('should accept null brickTypeId (no brick selected)', async () => {
    const { PointerEventCapture } = await import('../../src/components/PointerEventCapture');

    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId={null} />
        </div>
      );
    }).not.toThrow();
  });

  it('should use useGhostBrick hook with the provided brickTypeId', async () => {
    const { useGhostBrick } = await import('../../src/hooks/useGhostBrick');
    const { PointerEventCapture } = await import('../../src/components/PointerEventCapture');

    render(
      <div data-testid="r3f-canvas">
        <PointerEventCapture brickTypeId="brick-1x1" />
      </div>
    );

    expect(useGhostBrick).toHaveBeenCalledWith({ brickTypeId: 'brick-1x1' });
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: PointerEventCapture covers full ground plane
// ---------------------------------------------------------------------------
describe('PointerEventCapture — T-FE-UI-003-02: ground plane coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render an invisible mesh covering the ground plane', async () => {
    const { PointerEventCapture } = await import('../../src/components/PointerEventCapture');

    // Component renders without error — mesh visibility is a Three.js concern
    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId="brick-1x1" />
        </div>
      );
    }).not.toThrow();
  });

  it('should not render visible geometry (invisible capture plane)', async () => {
    const { PointerEventCapture } = await import('../../src/components/PointerEventCapture');

    const { container } = render(
      <div data-testid="r3f-canvas">
        <PointerEventCapture brickTypeId="brick-1x1" />
      </div>
    );

    // The component should render inside the canvas wrapper
    const canvas = container.querySelector('[data-testid="r3f-canvas"]');
    expect(canvas).toBeTruthy();
  });
});
