import type { BrickType } from '@/types/brick';
import { OccupancyMap } from './occupancyMap';
import { BRICK_CATALOG } from './brickCatalog';

export interface PlacementResult {
  success: boolean;
  reason?: string;
}

export function validatePlacement(
  occupancyMap: OccupancyMap,
  type: BrickType,
  position: [number, number, number],
  baseplateWidth: number,
  baseplateDepth: number
): PlacementResult {
  const def = BRICK_CATALOG[type];
  if (!def) {
    return { success: false, reason: 'Unknown brick type' };
  }

  const [x, y, z] = position;
  if (x < 0 || z < 0 || x + def.width > baseplateWidth || z + def.depth > baseplateDepth) {
    return { success: false, reason: 'Out of baseplate bounds' };
  }

  if (y < 0) {
    return { success: false, reason: 'Cannot place below ground' };
  }

  if (!occupancyMap.canPlace(type, position)) {
    return { success: false, reason: 'Position occupied' };
  }

  return { success: true };
}
