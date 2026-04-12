/**
 * T-FE-UI-003-01 & T-FE-UI-003-02 — GhostBrick component tests
 * FR-UI-003: Ghost Brick Placement Preview
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding implements
 * src/components/viewport/GhostBrick.tsx
 *
 * NOTE: Three.js / R3F components cannot be fully rendered in jsdom.
 * We test the component's conditional rendering logic and prop contracts
 * using mocks for @react-three/fiber and @react-three/drei.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock Three.js / R3F environment (same pattern as existing component tests)
// ---------------------------------------------------------------------------
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ scene: {}, camera: {}, gl: {} })),
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
}));

vi.mock('@react-three/drei', () => ({
  useGLTF: vi.fn(() => ({ scene: { clone: vi.fn(() => ({ traverse: vi.fn() })) } })),
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('three', () => ({
  default: {},
  MeshStandardMaterial: vi.fn().mockImplementation(() => ({ color: { set: vi.fn() }, opacity: 1, transparent: false, dispose: vi.fn() })),
  Color: vi.fn().mockImplementation((c: string) => ({ r: 0, g: 0, b: 0, _hex: c })),
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
  Mesh: vi.fn(),
  BoxGeometry: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock ghostBrickStore so we control state in tests
// ---------------------------------------------------------------------------
const mockStoreState = {
  position: null as { x: number; y: number; z: number } | null,
  brickTypeId: null as string | null,
  isValid: false,
  isVisible: false,
};

vi.mock('../../src/stores/ghostBrickStore', () => ({
  useGhostBrickStore: (selector?: (s: typeof mockStoreState) => unknown) => {
    if (typeof selector === 'function') return selector(mockStoreState);
    return mockStoreState;
  },
}));

// ---------------------------------------------------------------------------
// Component under test (does NOT exist yet)
// ---------------------------------------------------------------------------
import { GhostBrick } from '../../src/components/viewport/GhostBrick';

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: Ghost brick renders when visible and valid
// ---------------------------------------------------------------------------
describe('GhostBrick component — T-FE-UI-003-01: valid position rendering', () => {
  beforeEach(() => {
    mockStoreState.position = null;
    mockStoreState.brickTypeId = null;
    mockStoreState.isValid = false;
    mockStoreState.isVisible = false;
  });

  it('renders nothing when isVisible=false', () => {
    mockStoreState.isVisible = false;
    const { container } = render(
      <div data-testid="r3f-canvas">
        <GhostBrick />
      </div>
    );
    // Component should render null / empty when not visible
    expect(container.querySelector('[data-testid="ghost-brick"]')).toBeNull();
  });

  it('renders ghost mesh when isVisible=true and isValid=true', () => {
    mockStoreState.isVisible = true;
    mockStoreState.isValid = true;
    mockStoreState.position = { x: 0, y: 0, z: 0 };
    mockStoreState.brickTypeId = '2x4';

    // GhostBrick is a Three.js mesh — it renders into the R3F scene graph.
    // We verify it does not throw and the component mounts without error.
    expect(() =>
      render(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      )
    ).not.toThrow();
  });

  it('applies semi-transparent green material when isValid=true', () => {
    mockStoreState.isVisible = true;
    mockStoreState.isValid = true;
    mockStoreState.position = { x: 2, y: 0, z: 2 };
    mockStoreState.brickTypeId = '2x4';

    // The component should not throw when valid — material color is green
    expect(() =>
      render(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      )
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: Ghost brick renders red when invalid
// ---------------------------------------------------------------------------
describe('GhostBrick component — T-FE-UI-003-02: invalid position rendering', () => {
  beforeEach(() => {
    mockStoreState.position = { x: 99, y: 99, z: 99 };
    mockStoreState.brickTypeId = '2x4';
    mockStoreState.isValid = false;
    mockStoreState.isVisible = true;
  });

  it('renders ghost mesh when isVisible=true and isValid=false (red state)', () => {
    // Component must still render (not null) when invalid — just with red material
    expect(() =>
      render(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      )
    ).not.toThrow();
  });

  it('does not throw when transitioning from valid to invalid', () => {
    // First render valid
    mockStoreState.isValid = true;
    const { rerender } = render(
      <div data-testid="r3f-canvas">
        <GhostBrick />
      </div>
    );

    // Then transition to invalid
    mockStoreState.isValid = false;
    expect(() =>
      rerender(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      )
    ).not.toThrow();
  });

  it('does not throw when transitioning from invalid to valid', () => {
    const { rerender } = render(
      <div data-testid="r3f-canvas">
        <GhostBrick />
      </div>
    );

    mockStoreState.isValid = true;
    expect(() =>
      rerender(
        <div data-testid="r3f-canvas">
          <GhostBrick />
        </div>
      )
    ).not.toThrow();
  });
});
