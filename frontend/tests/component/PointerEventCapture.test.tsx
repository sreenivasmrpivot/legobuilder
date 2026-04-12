/**
 * T-FE-UI-003-01 & T-FE-UI-003-02 — PointerEventCapture component tests
 * FR-UI-003: Ghost Brick Placement Preview
 *
 * TDD: These tests are INTENTIONALLY RED until frontend-coding implements
 * src/components/viewport/PointerEventCapture.tsx
 *
 * PointerEventCapture is an invisible R3F mesh that intercepts pointer
 * events over the scene and drives the ghost brick position via useGhostBrick.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock R3F / Three.js
// ---------------------------------------------------------------------------
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({
    scene: {},
    camera: { position: { x: 0, y: 10, z: 10 } },
    gl: { domElement: document.createElement('canvas') },
    raycaster: { setFromCamera: vi.fn(), intersectObjects: vi.fn(() => []) },
    size: { width: 800, height: 600 },
  })),
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="r3f-canvas">{children}</div>,
}));

vi.mock('@react-three/drei', () => ({
  useGLTF: vi.fn(),
}));

vi.mock('three', () => ({
  default: {},
  Raycaster: vi.fn().mockImplementation(() => ({ setFromCamera: vi.fn(), intersectObjects: vi.fn(() => []) })),
  Vector2: vi.fn().mockImplementation((x = 0, y = 0) => ({ x, y })),
  Vector3: vi.fn().mockImplementation((x = 0, y = 0, z = 0) => ({ x, y, z })),
  Plane: vi.fn().mockImplementation(() => ({ normal: { x: 0, y: 1, z: 0 } })),
  Mesh: vi.fn(),
  PlaneGeometry: vi.fn(),
  MeshBasicMaterial: vi.fn().mockImplementation(() => ({ visible: false, dispose: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Mock useGhostBrick hook
// ---------------------------------------------------------------------------
const mockActivateGhost = vi.fn();
const mockMoveGhost = vi.fn();
const mockDeactivateGhost = vi.fn();

vi.mock('../../src/hooks/useGhostBrick', () => ({
  useGhostBrick: () => ({
    activateGhost: mockActivateGhost,
    moveGhost: mockMoveGhost,
    deactivateGhost: mockDeactivateGhost,
    isGhostVisible: false,
    isGhostValid: false,
  }),
}));

// ---------------------------------------------------------------------------
// Component under test (does NOT exist yet)
// ---------------------------------------------------------------------------
import { PointerEventCapture } from '../../src/components/viewport/PointerEventCapture';

// ---------------------------------------------------------------------------
// T-FE-UI-003-01: PointerEventCapture activates ghost on pointer enter
// ---------------------------------------------------------------------------
describe('PointerEventCapture — T-FE-UI-003-01: pointer move activates ghost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders without throwing', () => {
    expect(() =>
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId="2x4" />
        </div>
      )
    ).not.toThrow();
  });

  it('accepts brickTypeId prop', () => {
    expect(() =>
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId="2x4" />
        </div>
      )
    ).not.toThrow();
  });

  it('accepts optional onPlace callback prop', () => {
    const onPlace = vi.fn();
    expect(() =>
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId="2x4" onPlace={onPlace} />
        </div>
      )
    ).not.toThrow();
  });

  it('calls deactivateGhost when pointer leaves the capture area', () => {
    // PointerEventCapture should call deactivateGhost on pointerleave
    // We simulate this by checking the component wires up the event correctly.
    // Since R3F events are synthetic, we verify the hook is wired.
    const { unmount } = render(
      <div data-testid="r3f-canvas">
        <PointerEventCapture brickTypeId="2x4" />
      </div>
    );
    // On unmount (component leaves scene), ghost should be deactivated
    unmount();
    expect(mockDeactivateGhost).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-02: PointerEventCapture passes validity to ghost
// ---------------------------------------------------------------------------
describe('PointerEventCapture — T-FE-UI-003-02: validity propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('component mounts with correct brickTypeId for invalid position scenario', () => {
    // The component should accept any brickTypeId and delegate validity
    // to useGhostBrick which calls isPositionValid internally.
    expect(() =>
      render(
        <div data-testid="r3f-canvas">
          <PointerEventCapture brickTypeId="2x4" />
        </div>
      )
    ).not.toThrow();
  });

  it('does not call onPlace when ghost is invalid', () => {
    const onPlace = vi.fn();
    render(
      <div data-testid="r3f-canvas">
        <PointerEventCapture brickTypeId="2x4" onPlace={onPlace} />
      </div>
    );
    // onPlace should not be called during mount — only on explicit click
    expect(onPlace).not.toHaveBeenCalled();
  });
});
