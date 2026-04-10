import type { Brick, BrickType } from '@/types/brick';
import { BRICK_CATALOG } from './brickCatalog';

type GridKey = `${number},${number},${number}`;

export class OccupancyMap {
  private grid: Map<GridKey, string> = new Map();

  canPlace(type: BrickType, position: [number, number, number]): boolean {
    const cells = this.getCells(type, position);
    return cells.every((cell) => !this.grid.has(cell));
  }

  occupy(brick: Brick): void {
    const cells = this.getCells(brick.type, brick.position);
    cells.forEach((cell) => this.grid.set(cell, brick.id));
  }

  release(brick: Brick): void {
    const cells = this.getCells(brick.type, brick.position);
    cells.forEach((cell) => this.grid.delete(cell));
  }

  getBrickAt(position: [number, number, number]): string | undefined {
    const key: GridKey = `${position[0]},${position[1]},${position[2]}`;
    return this.grid.get(key);
  }

  clear(): void {
    this.grid.clear();
  }

  get size(): number {
    return this.grid.size;
  }

  private getCells(type: BrickType, position: [number, number, number]): GridKey[] {
    const def = BRICK_CATALOG[type];
    if (!def) return [];

    const cells: GridKey[] = [];
    const [x, y, z] = position;

    for (let dx = 0; dx < def.width; dx++) {
      for (let dz = 0; dz < def.depth; dz++) {
        for (let dy = 0; dy < def.height; dy++) {
          cells.push(`${x + dx},${y + dy},${z + dz}`);
        }
      }
    }

    return cells;
  }
}
