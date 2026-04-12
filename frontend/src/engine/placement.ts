import type { BrickType } from '../types/brick';
import { BRICK_CATALOG } from './brickCatalog';
import { OccupancyMap } from './occupancyMap';

export function calculateOccupiedCells(
  type: BrickType,
  position: [number, number, number],
  rotation: number,
): [number, number, number][] {
  const def = BRICK_CATALOG[type];
  const cells: [number, number, number][] = [];
  const [px, py, pz] = position;
  const isRotated = rotation === 90 || rotation === 270;
  const sx = isRotated ? def.studsZ : def.studsX;
  const sz = isRotated ? def.studsX : def.studsZ;

  for (let dx = 0; dx < sx; dx++) {
    for (let dz = 0; dz < sz; dz++) {
      cells.push([px + dx, py, pz + dz]);
    }
  }
  return cells;
}

export function snapToGrid(
  worldX: number,
  worldZ: number,
  _gridSize: [number, number],
): [number, number] {
  return [Math.round(worldX), Math.round(worldZ)];
}

export function canPlaceBrick(
  type: BrickType,
  position: [number, number, number],
  rotation: number,
  occupancyMap: OccupancyMap,
  gridSize: [number, number],
): boolean {
  const cells = calculateOccupiedCells(type, position, rotation);
  for (const [x, _y, z] of cells) {
    if (x < 0 || x >= gridSize[0] || z < 0 || z >= gridSize[1]) return false;
  }
  return occupancyMap.canPlace(cells);
}
