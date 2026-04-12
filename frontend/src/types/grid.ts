export type GridPosition = [number, number, number];

export interface GridConfig {
  width: number;
  depth: number;
  studSize: number;
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  width: 32,
  depth: 32,
  studSize: 1,
};
