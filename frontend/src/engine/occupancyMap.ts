export class OccupancyMap {
  private grid: Map<string, string>;

  constructor() {
    this.grid = new Map();
  }

  private key(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  occupy(brickId: string, positions: [number, number, number][]): void {
    for (const [x, y, z] of positions) {
      this.grid.set(this.key(x, y, z), brickId);
    }
  }

  release(positions: [number, number, number][]): void {
    for (const [x, y, z] of positions) {
      this.grid.delete(this.key(x, y, z));
    }
  }

  isOccupied(x: number, y: number, z: number): boolean {
    return this.grid.has(this.key(x, y, z));
  }

  canPlace(positions: [number, number, number][]): boolean {
    return positions.every(([x, y, z]) => !this.isOccupied(x, y, z));
  }

  getBrickAt(x: number, y: number, z: number): string | undefined {
    return this.grid.get(this.key(x, y, z));
  }

  clear(): void {
    this.grid.clear();
  }

  get size(): number {
    return this.grid.size;
  }
}
