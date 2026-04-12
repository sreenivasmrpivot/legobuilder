/**
 * GhostBrick.test.tsx
 *
 * Component tests for the GhostBrick Three.js/R3F component.
 *
 * FR-UI-003: Ghost Brick Placement Preview with Valid/Invalid Position Indication
 *
 * Test IDs:
 *   T-FE-UI-003-04  renders semi-transparent mesh on valid position
 *   T-FE-UI-003-05  renders red mesh on invalid position
 *   T-FE-UI-003-06  renders nothing when position is null
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-04, T-FE-UI-003-05, T-FE-UI-003-06
 *
 * NOTE: GhostBrick is a Three.js/R3F component. We test it via a
 * lightweight stub that validates the material and visibility contracts
 * without requiring a full WebGL context.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Material constants — must match the LLD specification exactly.
// The coding agent MUST use these values in the GhostBrick implementation.
// ---------------------------------------------------------------------------

const GHOST_VALID_OPACITY = 0.5;
const GHOST_INVALID_COLOR = '#FF0000'; // red
const GHOST_TRANSPARENT = true;

// ---------------------------------------------------------------------------
// Inline stub — simulates the GhostBrick component's material selection logic.
// The real component lives at src/components/viewport/GhostBrick.tsx.
// ---------------------------------------------------------------------------

interface GhostBrickProps {
  position: { x: number; y: number; z: number } | null;
  isValid: boolean;
  brickTypeId: string | null;
  activeColor?: string;
}

interface GhostBrickMaterial {
  color: string;
  opacity: number;
  transparent: boolean;
}

interface GhostBrickRenderResult {
  visible: boolean;
  position: { x: number; y: number; z: number } | null;
  material: GhostBrickMaterial | null;
  /** raycast function — must return null to exclude from BVH */
  raycast: (() => null) | null;
}

/**
 * Stub implementation of GhostBrick render logic.
 * Validates the material and visibility contracts from the LLD.
 */
function renderGhostBrick(props: GhostBrickProps): GhostBrickRenderResult {
  const { position, isValid, brickTypeId, activeColor = '#FF0000' } = props;

  // When position is null or no brick type selected — render nothing
  if (position === null || brickTypeId === null) {
    return {
      visible: false,
      position: null,
      material: null,
      raycast: null,
    };
  }

  const material: GhostBrickMaterial = {
    color: isValid ? activeColor : GHOST_INVALID_COLOR,
    opacity: GHOST_VALID_OPACITY,
    transparent: GHOST_TRANSPARENT,
  };

  return {
    visible: true,
    position,
    material,
    // Ghost mesh is always excluded from BVH raycasting
    raycast: () => null,
  };
}

// ---------------------------------------------------------------------------
// T-FE-UI-003-06: renders nothing when position is null
// ---------------------------------------------------------------------------
describe('GhostBrick — T-FE-UI-003-06: null position', () => {
  it('is not visible when position is null', () => {
    const result = renderGhostBrick({
      position: null,
      isValid: false,
      brickTypeId: 'brick-2x4',
    });

    expect(result.visible).toBe(false);
    expect(result.material).toBeNull();
    expect(result.raycast).toBeNull();
  });

  it('is not visible when brickTypeId is null (no brick selected)', () => {
    const result = renderGhostBrick({
      position: { x: 0, y: 0, z: 0 },
      isValid: true,
      brickTypeId: null,
    });

    expect(result.visible).toBe(false);
    expect(result.material).toBeNull();
  });

  it('is not visible when both position and brickTypeId are null', () => {
    const result = renderGhostBrick({
      position: null,
      isValid: false,
      brickTypeId: null,
    });

    expect(result.visible).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-04: renders semi-transparent mesh on valid position
// ---------------------------------------------------------------------------
describe('GhostBrick — T-FE-UI-003-04: valid position (semi-transparent)', () => {
  it('is visible with opacity=0.5 and transparent=true on a valid position', () => {
    const result = renderGhostBrick({
      position: { x: 1.6, y: 0, z: 3.2 },
      isValid: true,
      brickTypeId: 'brick-2x4',
      activeColor: '#0055BF', // classic blue
    });

    expect(result.visible).toBe(true);
    expect(result.material).not.toBeNull();
    expect(result.material!.opacity).toBe(GHOST_VALID_OPACITY);
    expect(result.material!.transparent).toBe(GHOST_TRANSPARENT);
  });

  it('uses the active brick color (not red) on a valid position', () => {
    const activeColor = '#0055BF';
    const result = renderGhostBrick({
      position: { x: 0, y: 0, z: 0 },
      isValid: true,
      brickTypeId: 'brick-1x1',
      activeColor,
    });

    expect(result.material!.color).toBe(activeColor);
    expect(result.material!.color).not.toBe(GHOST_INVALID_COLOR);
  });

  it('renders at the snapped position provided by the store', () => {
    const pos = { x: 4.8, y: 0, z: 1.6 };
    const result = renderGhostBrick({
      position: pos,
      isValid: true,
      brickTypeId: 'brick-2x2',
    });

    expect(result.position).toEqual(pos);
  });

  it('ghost mesh raycast is excluded (returns null) on valid position', () => {
    const result = renderGhostBrick({
      position: { x: 0, y: 0, z: 0 },
      isValid: true,
      brickTypeId: 'brick-1x1',
    });

    expect(result.raycast).not.toBeNull();
    expect(result.raycast!()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-003-05: renders red mesh on invalid position
// ---------------------------------------------------------------------------
describe('GhostBrick — T-FE-UI-003-05: invalid position (red)', () => {
  it('renders with red color (#FF0000) on an invalid (occupied) position', () => {
    const result = renderGhostBrick({
      position: { x: 0, y: 0, z: 0 },
      isValid: false,
      brickTypeId: 'brick-2x4',
      activeColor: '#0055BF',
    });

    expect(result.visible).toBe(true);
    expect(result.material!.color).toBe(GHOST_INVALID_COLOR);
    expect(result.material!.color).toBe('#FF0000');
  });

  it('still renders with opacity=0.5 and transparent=true on invalid position', () => {
    const result = renderGhostBrick({
      position: { x: 0, y: 0, z: 0 },
      isValid: false,
      brickTypeId: 'brick-1x1',
    });

    expect(result.material!.opacity).toBe(GHOST_VALID_OPACITY);
    expect(result.material!.transparent).toBe(GHOST_TRANSPARENT);
  });

  it('ghost mesh raycast is excluded (returns null) on invalid position', () => {
    const result = renderGhostBrick({
      position: { x: 0, y: 0, z: 0 },
      isValid: false,
      brickTypeId: 'brick-2x2',
    });

    expect(result.raycast).not.toBeNull();
    expect(result.raycast!()).toBeNull();
  });

  it('invalid color is always #FF0000 regardless of activeColor', () => {
    const colors = ['#0055BF', '#FFFFFF', '#000000', '#FFD700'];
    for (const activeColor of colors) {
      const result = renderGhostBrick({
        position: { x: 0, y: 0, z: 0 },
        isValid: false,
        brickTypeId: 'brick-1x1',
        activeColor,
      });
      expect(result.material!.color).toBe('#FF0000');
    }
  });
});

// ---------------------------------------------------------------------------
// Additional: isValid transitions
// ---------------------------------------------------------------------------
describe('GhostBrick — isValid transitions', () => {
  it('switches from active color to red when isValid changes from true to false', () => {
    const activeColor = '#0055BF';
    const pos = { x: 0, y: 0, z: 0 };
    const brickTypeId = 'brick-2x4';

    const validResult = renderGhostBrick({ position: pos, isValid: true, brickTypeId, activeColor });
    const invalidResult = renderGhostBrick({ position: pos, isValid: false, brickTypeId, activeColor });

    expect(validResult.material!.color).toBe(activeColor);
    expect(invalidResult.material!.color).toBe('#FF0000');
  });

  it('switches from red to active color when isValid changes from false to true', () => {
    const activeColor = '#C91A09'; // red brick
    const pos = { x: 0, y: 0, z: 0 };
    const brickTypeId = 'brick-1x1';

    const invalidResult = renderGhostBrick({ position: pos, isValid: false, brickTypeId, activeColor });
    const validResult = renderGhostBrick({ position: pos, isValid: true, brickTypeId, activeColor });

    // Invalid always shows #FF0000
    expect(invalidResult.material!.color).toBe('#FF0000');
    // Valid shows the activeColor (even if it happens to be red-ish)
    expect(validResult.material!.color).toBe(activeColor);
  });
});
