/**
 * brickFixtures.ts
 * NFR-SCALE-001 — Pre-computed deterministic brick position data.
 *
 * Provides static fixture data for 100, 250, and 500 brick scenes.
 * All positions are on a 25×20 grid with 2-unit spacing to avoid
 * occupancy map collisions.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SCALE-001
 * Spectra-Tests: T-PERF-SCALE-001-01, T-PERF-SCALE-001-02
 */

export interface BrickFixture {
  id: string;
  type: '2x4';
  color: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

const GRID_WIDTH = 25;
const BRICK_SPACING = 2;
const BRICK_COLOR = '#FF0000';

/**
 * Generate a deterministic array of brick fixtures for a given count.
 * Bricks are placed on a 25-column grid at y=0 (ground plane).
 */
export function generateBrickFixtures(count: number): BrickFixture[] {
  const fixtures: BrickFixture[] = [];
  for (let i = 0; i < count; i++) {
    fixtures.push({
      id: `perf-brick-${i}`,
      type: '2x4',
      color: BRICK_COLOR,
      position: {
        x: (i % GRID_WIDTH) * BRICK_SPACING,
        y: 0,
        z: Math.floor(i / GRID_WIDTH) * BRICK_SPACING,
      },
      rotation: { x: 0, y: 0, z: 0 },
    });
  }
  return fixtures;
}

/** Pre-computed fixture sets for each test tier */
export const FIXTURES_100 = generateBrickFixtures(100);
export const FIXTURES_250 = generateBrickFixtures(250);
export const FIXTURES_500 = generateBrickFixtures(500);

/**
 * Verify no duplicate positions exist in a fixture set.
 * Throws if any two bricks share the same (x, y, z) position.
 */
export function assertNoDuplicatePositions(fixtures: BrickFixture[]): void {
  const seen = new Set<string>();
  for (const brick of fixtures) {
    const key = `${brick.position.x},${brick.position.y},${brick.position.z}`;
    if (seen.has(key)) {
      throw new Error(
        `Duplicate position detected in fixtures: ${key} (brick id: ${brick.id})`
      );
    }
    seen.add(key);
  }
}
