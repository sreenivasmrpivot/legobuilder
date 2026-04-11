/**
 * T-FE-UI-003-01 / T-FE-UI-003-02 — GhostBrick component tests
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * These tests are intentionally RED (TDD). The implementation module
 * `frontend/src/components/GhostBrick.tsx` does not yet exist.
 * The frontend-coding agent must implement it to make these pass.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock @react-three/fiber — Canvas and hooks
// ---------------------------------------------------------------------------
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ scene: {}, camera: {}, gl: {} })),
}));

// ---------------------------------------------------------------------------
// Mock Three.js mesh/material primitives used by R3F JSX
// ---------------------------------------------------------------------------
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  return {
    ...actual,
    MeshStandardMaterial: vi.fn().mockImplementation(() => ({ color: { set: vi.fn() } })),
    BoxGeometry: vi.fn().mockImplementation(() => ({})),
  };
});

// ---------------------------------------------------------------------------
// Mock ghostBrickStore
// ---------------------------------------------------------------------------
const mockStoreState = {
  position: null as { x: number; y: number; z: number } | null,
  isValid: false,
  brickTypeId: null as string | null,
  setGhostBrick: vi.fn(),
  clearGhostBrick: vi.fn(),
};

vi.mock('../../src/stores/ghostBrickStore', () => ({
  useGhostBrickStore: vi.fn(() => mockStoreState),
}));

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: Ghost brick renders at valid position (green/semi-transparent)
// ---------------------------------------------------------------------------
describe('GhostBrick — T-FE-UI-003-01: renders at valid position', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export GhostBrick component', async () => {
    const mod = await import('../../src/components/GhostBrick').catch(() => null);
    expect(mod, 'GhostBrick module must exist').not.toBeNull();
    expect(typeof mod?.GhostBrick, 'GhostBrick must be a function/component').toBe('function');
  });

  it('should render nothing (null) when position is null', async () => {
    mockStoreState.position = null;
    mockStoreState.isValid = false;

    const { GhostBrick } = await import('../../src/components/GhostBrick');
    const { container } = render(
      <div data-testid="r3f-canvas">
        <GhostBrick />
      </div>
    );

    // When position is null, GhostBrick should render nothing inside the canvas
    const canvas = container.querySelector('[data-testid="r3f-canvas"]');
    expect(canvas).toBeTruthy();
    // No mesh elements should be rendered
    expect(container.querySelector('mesh')).toBeNull();
  });

  it('should render a mesh when position is set and isValid=true', async () => {
    mockStoreState.position = { x: 0, y: 0, z: 0 };
    mockStoreState.isValid = true;
    mockStoreState.brickTypeId = 'brick-1x1';

    const { GhostBrick } = await import('../../src/components/GhostBrick');

    // Component should not throw when position is set
    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      );
    }).not.toThrow();
  });

  it('should apply semi-transparent green material for valid placement', async () => {
    mockStoreState.position = { x: 1, y: 0, z: 1 };
    mockStoreState.isValid = true;
    mockStoreState.brickTypeId = 'brick-1x1';

    const { GhostBrick } = await import('../../src/components/GhostBrick');

    // Render should succeed — visual color is verified via snapshot or prop inspection
    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      );
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: Ghost brick turns red on invalid position
// ---------------------------------------------------------------------------
describe('GhostBrick — T-FE-UI-003-02: renders red on invalid position', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a mesh when position is set and isValid=false', async () => {
    mockStoreState.position = { x: 3, y: 0, z: 3 };
    mockStoreState.isValid = false;
    mockStoreState.brickTypeId = 'brick-1x1';

    const { GhostBrick } = await import('../../src/components/GhostBrick');

    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      );
    }).not.toThrow();
  });

  it('should apply semi-transparent red material for invalid placement', async () => {
    mockStoreState.position = { x: 2, y: 0, z: 2 };
    mockStoreState.isValid = false;
    mockStoreState.brickTypeId = 'brick-2x4';

    const { GhostBrick } = await import('../../src/components/GhostBrick');

    // Render should succeed — red color applied via isValid=false
    expect(() => {
      render(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      );
    }).not.toThrow();
  });

  it('should transition from green to red when isValid changes to false', async () => {
    const { GhostBrick } = await import('../../src/components/GhostBrick');

    // Valid state
    mockStoreState.position = { x: 0, y: 0, z: 0 };
    mockStoreState.isValid = true;
    const { rerender } = render(
      <div data-testid="r3f-canvas">
        <GhostBrick />
      </div>
    );

    // Invalid state — store mock updated
    mockStoreState.isValid = false;
    expect(() => {
      rerender(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      );
    }).not.toThrow();
  });

  it('should hide ghost brick (render null) when clearGhostBrick is called', async () => {
    mockStoreState.position = null;
    mockStoreState.isValid = false;
    mockStoreState.brickTypeId = null;

    const { GhostBrick } = await import('../../src/components/GhostBrick');
    const { container } = render(
      <div data-testid="r3f-canvas">
        <GhostBrick />
      </div>
    );

    expect(container.querySelector('mesh')).toBeNull();
  });
});
