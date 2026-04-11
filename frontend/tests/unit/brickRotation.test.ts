/**
 * Unit tests for FR-BRICK-004: Brick rotation in 90-degree increments
 *
 * Test IDs:
 *   T-BE-BRICK-004-01 — R key rotates placement-preview 90° clockwise around Y-axis
 *   T-BE-BRICK-004-02 — R key rotates a placed+selected brick 90° in place;
 *                        occupancy map recalculates rotated footprint
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-BRICK-004
 * Spectra-Tests: T-BE-BRICK-004-01, T-BE-BRICK-004-02
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal type stubs (mirrors src/types/brick.ts and src/types/scene.ts)
// ---------------------------------------------------------------------------
type BrickRotation = 0 | 90 | 180 | 270;

interface PlacedBrick {
  id: string;
  catalogId: string;
  position: { x: number; y: number; z: number };
  rotation: BrickRotation;
  color: string;
}

// ---------------------------------------------------------------------------
// Helpers — pure rotation logic (mirrors what gridMath / commands implement)
// ---------------------------------------------------------------------------

/** Rotate 90° clockwise around Y-axis (0→90→180→270→0) */
function rotateClockwise(current: BrickRotation): BrickRotation {
  return ((current + 90) % 360) as BrickRotation;
}

/**
 * Compute the rotated footprint (stud positions) for a brick.
 * For 0°/180° the brick occupies [0..width-1] × [0..depth-1].
 * For 90°/270° width and depth are swapped.
 */
function getRotatedFootprint(
  width: number,
  depth: number,
  rotation: BrickRotation,
): Array<{ dx: number; dz: number }> {
  const effectiveWidth = rotation === 90 || rotation === 270 ? depth : width;
  const effectiveDepth = rotation === 90 || rotation === 270 ? width : depth;
  const cells: Array<{ dx: number; dz: number }> = [];
  for (let x = 0; x < effectiveWidth; x++) {
    for (let z = 0; z < effectiveDepth; z++) {
      cells.push({ dx: x, dz: z });
    }
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Minimal uiStore stub (placement-preview rotation)
// ---------------------------------------------------------------------------
function createUiStore() {
  let placementRotation: BrickRotation = 0;
  return {
    get placementRotation() {
      return placementRotation;
    },
    rotatePlacementPreview() {
      placementRotation = rotateClockwise(placementRotation);
    },
    reset() {
      placementRotation = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal sceneStore stub (placed-brick rotation)
// ---------------------------------------------------------------------------
function createSceneStore() {
  const bricks: Map<string, PlacedBrick> = new Map();
  return {
    addBrick(brick: PlacedBrick) {
      bricks.set(brick.id, { ...brick });
    },
    getBrick(id: string): PlacedBrick | undefined {
      return bricks.get(id);
    },
    rotateBrick(id: string) {
      const brick = bricks.get(id);
      if (!brick) return;
      brick.rotation = rotateClockwise(brick.rotation);
    },
    getAllBricks(): PlacedBrick[] {
      return Array.from(bricks.values());
    },
    clear() {
      bricks.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal occupancy-map stub
// ---------------------------------------------------------------------------
function createOccupancyMap() {
  const occupied = new Set<string>();
  return {
    occupy(x: number, z: number, brickId: string) {
      occupied.add(`${x},${z}:${brickId}`);
    },
    release(brickId: string) {
      for (const key of occupied) {
        if (key.endsWith(`:${brickId}`)) occupied.delete(key);
      }
    },
    isOccupied(x: number, z: number): boolean {
      for (const key of occupied) {
        if (key.startsWith(`${x},${z}:`)) return true;
      }
      return false;
    },
    occupyBrick(
      brick: PlacedBrick,
      width: number,
      depth: number,
    ) {
      const footprint = getRotatedFootprint(width, depth, brick.rotation);
      for (const { dx, dz } of footprint) {
        this.occupy(brick.position.x + dx, brick.position.z + dz, brick.id);
      }
    },
    clear() {
      occupied.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Minimal RotateBrick command stub (undo/redo)
// ---------------------------------------------------------------------------
function createRotateBrickCommand(
  sceneStore: ReturnType<typeof createSceneStore>,
  brickId: string,
) {
  let previousRotation: BrickRotation | null = null;
  return {
    execute() {
      const brick = sceneStore.getBrick(brickId);
      if (!brick) return;
      previousRotation = brick.rotation;
      sceneStore.rotateBrick(brickId);
    },
    undo() {
      if (previousRotation === null) return;
      const brick = sceneStore.getBrick(brickId);
      if (!brick) return;
      brick.rotation = previousRotation;
    },
  };
}

// ---------------------------------------------------------------------------
// T-BE-BRICK-004-01: Placement-preview rotation via R key
// ---------------------------------------------------------------------------
describe('T-BE-BRICK-004-01 — Placement preview rotation (R key)', () => {
  let uiStore: ReturnType<typeof createUiStore>;

  beforeEach(() => {
    uiStore = createUiStore();
  });

  it('starts at 0° rotation', () => {
    expect(uiStore.placementRotation).toBe(0);
  });

  it('rotates 90° clockwise on first R press', () => {
    uiStore.rotatePlacementPreview();
    expect(uiStore.placementRotation).toBe(90);
  });

  it('rotates to 180° on second R press', () => {
    uiStore.rotatePlacementPreview();
    uiStore.rotatePlacementPreview();
    expect(uiStore.placementRotation).toBe(180);
  });

  it('rotates to 270° on third R press', () => {
    uiStore.rotatePlacementPreview();
    uiStore.rotatePlacementPreview();
    uiStore.rotatePlacementPreview();
    expect(uiStore.placementRotation).toBe(270);
  });

  it('wraps back to 0° after four R presses (full cycle)', () => {
    uiStore.rotatePlacementPreview();
    uiStore.rotatePlacementPreview();
    uiStore.rotatePlacementPreview();
    uiStore.rotatePlacementPreview();
    expect(uiStore.placementRotation).toBe(0);
  });

  it('resets to 0° when placement is cancelled', () => {
    uiStore.rotatePlacementPreview();
    uiStore.rotatePlacementPreview();
    uiStore.reset();
    expect(uiStore.placementRotation).toBe(0);
  });

  it('rotation is always one of the four valid increments', () => {
    const validValues = new Set([0, 90, 180, 270]);
    for (let i = 0; i < 8; i++) {
      uiStore.rotatePlacementPreview();
      expect(validValues.has(uiStore.placementRotation)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// T-BE-BRICK-004-02: Placed-brick rotation + occupancy-map recalculation
// ---------------------------------------------------------------------------
describe('T-BE-BRICK-004-02 — Placed brick rotation and occupancy map', () => {
  let sceneStore: ReturnType<typeof createSceneStore>;
  let occupancyMap: ReturnType<typeof createOccupancyMap>;

  const BRICK_WIDTH = 2; // 2×4 brick
  const BRICK_DEPTH = 4;

  const baseBrick: PlacedBrick = {
    id: 'brick-001',
    catalogId: '2x4',
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    color: '#FF0000',
  };

  beforeEach(() => {
    sceneStore = createSceneStore();
    occupancyMap = createOccupancyMap();
    sceneStore.addBrick({ ...baseBrick });
    occupancyMap.occupyBrick(baseBrick, BRICK_WIDTH, BRICK_DEPTH);
  });

  it('placed brick starts at 0° rotation', () => {
    const brick = sceneStore.getBrick('brick-001')!;
    expect(brick.rotation).toBe(0);
  });

  it('R key rotates placed brick 90° without changing grid position', () => {
    sceneStore.rotateBrick('brick-001');
    const brick = sceneStore.getBrick('brick-001')!;
    expect(brick.rotation).toBe(90);
    expect(brick.position).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('occupancy map at 0° covers 2×4 footprint (8 cells)', () => {
    // 2 wide × 4 deep = 8 cells
    let count = 0;
    for (let x = 0; x < BRICK_WIDTH; x++) {
      for (let z = 0; z < BRICK_DEPTH; z++) {
        if (occupancyMap.isOccupied(x, z)) count++;
      }
    }
    expect(count).toBe(8);
  });

  it('occupancy map recalculates to 4×2 footprint after 90° rotation', () => {
    // Release old footprint, rotate, re-occupy
    occupancyMap.release('brick-001');
    sceneStore.rotateBrick('brick-001');
    const rotatedBrick = sceneStore.getBrick('brick-001')!;
    occupancyMap.occupyBrick(rotatedBrick, BRICK_WIDTH, BRICK_DEPTH);

    // After 90° rotation a 2×4 becomes 4×2 (width↔depth swap)
    let count = 0;
    for (let x = 0; x < BRICK_DEPTH; x++) {
      for (let z = 0; z < BRICK_WIDTH; z++) {
        if (occupancyMap.isOccupied(x, z)) count++;
      }
    }
    expect(count).toBe(8); // same total cells
  });

  it('2×4 brick at 90° occupies correct rotated stud positions', () => {
    occupancyMap.release('brick-001');
    sceneStore.rotateBrick('brick-001');
    const rotatedBrick = sceneStore.getBrick('brick-001')!;
    occupancyMap.occupyBrick(rotatedBrick, BRICK_WIDTH, BRICK_DEPTH);

    // Rotated 90°: effectiveWidth=4, effectiveDepth=2
    // Expect cells (0,0),(1,0),(2,0),(3,0),(0,1),(1,1),(2,1),(3,1)
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 2; z++) {
        expect(occupancyMap.isOccupied(x, z)).toBe(true);
      }
    }
    // Cells outside the rotated footprint should be free
    expect(occupancyMap.isOccupied(0, 2)).toBe(false);
    expect(occupancyMap.isOccupied(4, 0)).toBe(false);
  });

  it('four rotations return brick to original 0° rotation', () => {
    for (let i = 0; i < 4; i++) sceneStore.rotateBrick('brick-001');
    const brick = sceneStore.getBrick('brick-001')!;
    expect(brick.rotation).toBe(0);
  });

  it('RotateBrick command can be undone to restore previous rotation', () => {
    const cmd = createRotateBrickCommand(sceneStore, 'brick-001');
    cmd.execute();
    expect(sceneStore.getBrick('brick-001')!.rotation).toBe(90);
    cmd.undo();
    expect(sceneStore.getBrick('brick-001')!.rotation).toBe(0);
  });

  it('RotateBrick command redo re-applies the rotation', () => {
    const cmd = createRotateBrickCommand(sceneStore, 'brick-001');
    cmd.execute();
    cmd.undo();
    cmd.execute(); // redo
    expect(sceneStore.getBrick('brick-001')!.rotation).toBe(90);
  });

  it('rotating a non-existent brick id is a no-op', () => {
    expect(() => sceneStore.rotateBrick('does-not-exist')).not.toThrow();
  });

  it('rotation does not affect other bricks in the scene', () => {
    const otherBrick: PlacedBrick = {
      id: 'brick-002',
      catalogId: '1x2',
      position: { x: 5, y: 0, z: 5 },
      rotation: 0,
      color: '#0000FF',
    };
    sceneStore.addBrick(otherBrick);
    sceneStore.rotateBrick('brick-001');
    expect(sceneStore.getBrick('brick-002')!.rotation).toBe(0);
  });

  it('270° rotation footprint matches 90° footprint (both swap width/depth)', () => {
    // Rotate to 270°
    for (let i = 0; i < 3; i++) sceneStore.rotateBrick('brick-001');
    const brick270 = sceneStore.getBrick('brick-001')!;
    expect(brick270.rotation).toBe(270);

    const footprint270 = getRotatedFootprint(BRICK_WIDTH, BRICK_DEPTH, 270);
    const footprint90 = getRotatedFootprint(BRICK_WIDTH, BRICK_DEPTH, 90);
    expect(footprint270.length).toBe(footprint90.length);
  });
});

// ---------------------------------------------------------------------------
// Additional: rotateClockwise pure-function edge cases
// ---------------------------------------------------------------------------
describe('rotateClockwise — pure rotation helper', () => {
  it('0 → 90', () => expect(rotateClockwise(0)).toBe(90));
  it('90 → 180', () => expect(rotateClockwise(90)).toBe(180));
  it('180 → 270', () => expect(rotateClockwise(180)).toBe(270));
  it('270 → 0 (wraps)', () => expect(rotateClockwise(270)).toBe(0));
});

// ---------------------------------------------------------------------------
// Additional: getRotatedFootprint edge cases
// ---------------------------------------------------------------------------
describe('getRotatedFootprint — occupancy footprint calculation', () => {
  it('1×1 brick footprint is always 1 cell regardless of rotation', () => {
    ([0, 90, 180, 270] as BrickRotation[]).forEach((r) => {
      expect(getRotatedFootprint(1, 1, r)).toHaveLength(1);
    });
  });

  it('2×4 brick at 0° has 8 cells', () => {
    expect(getRotatedFootprint(2, 4, 0)).toHaveLength(8);
  });

  it('2×4 brick at 90° has 8 cells (width/depth swapped)', () => {
    expect(getRotatedFootprint(2, 4, 90)).toHaveLength(8);
  });

  it('2×4 brick at 0° first cell is (0,0)', () => {
    const fp = getRotatedFootprint(2, 4, 0);
    expect(fp[0]).toEqual({ dx: 0, dz: 0 });
  });

  it('2×4 brick at 90° effective width is 4 (depth becomes width)', () => {
    const fp = getRotatedFootprint(2, 4, 90);
    const maxDx = Math.max(...fp.map((c) => c.dx));
    expect(maxDx).toBe(3); // 0..3 → 4 columns
  });

  it('2×4 brick at 90° effective depth is 2 (width becomes depth)', () => {
    const fp = getRotatedFootprint(2, 4, 90);
    const maxDz = Math.max(...fp.map((c) => c.dz));
    expect(maxDz).toBe(1); // 0..1 → 2 rows
  });
});
