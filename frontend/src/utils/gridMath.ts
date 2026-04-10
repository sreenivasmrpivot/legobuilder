/**
 * Utility: gridMath
 *
 * Grid coordinate math for snapping world positions to the LEGO stud grid.
 * One stud unit = 8mm in LEGO scale. Grid origin is at baseplate center.
 */

/** Size of one stud unit in world coordinates */
export const STUD_SIZE = 0.8;

/** Height of one plate in world coordinates (1/3 of a brick) */
export const PLATE_HEIGHT = 0.32;

/** Height of one brick in world coordinates (3 plates) */
export const BRICK_HEIGHT = PLATE_HEIGHT * 3;

/**
 * Snap a world-space coordinate to the nearest grid position.
 */
export function snapToGrid(x: number, z: number): [number, number] {
  return [
    Math.round(x / STUD_SIZE) * STUD_SIZE,
    Math.round(z / STUD_SIZE) * STUD_SIZE,
  ];
}

/**
 * Convert grid coordinates to a string key for the occupancy map.
 */
export function toGridKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}
