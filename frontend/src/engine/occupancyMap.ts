/**
 * occupancyMap.ts — Grid occupancy tracking for brick placement
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * Tracks which grid cells are occupied by placed bricks. Used by the
 * ghost brick system to determine placement validity.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

/** Position in 3D grid space */
export interface GridPosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Generates a unique string key for a grid position.
 * Used as the key in the occupancy map Set.
 */
function positionKey(position: GridPosition): string {
  return `${position.x},${position.y},${position.z}`;
}

/** Set of occupied cell keys */
const occupiedCells = new Set<string>();

/**
 * Checks whether a grid cell at the given position is occupied.
 *
 * @param position - The grid position to check
 * @returns true if the cell is occupied, false if free
 */
export function isCellOccupied(position: GridPosition): boolean {
  return occupiedCells.has(positionKey(position));
}

/**
 * Marks a grid cell as occupied.
 *
 * @param position - The grid position to mark as occupied
 */
export function occupyCell(position: GridPosition): void {
  occupiedCells.add(positionKey(position));
}

/**
 * Marks a grid cell as free (unoccupied).
 *
 * @param position - The grid position to free
 */
export function freeCell(position: GridPosition): void {
  occupiedCells.delete(positionKey(position));
}

/**
 * Clears all occupied cells. Useful for scene reset.
 */
export function clearOccupancy(): void {
  occupiedCells.clear();
}

/**
 * Returns the count of occupied cells.
 */
export function getOccupiedCount(): number {
  return occupiedCells.size;
}
