export type BrickType =
  | 'brick-2x4'
  | 'brick-2x2'
  | 'brick-1x1'
  | 'brick-1x2'
  | 'slope-2x2'
  | 'plate-1x4';

export type BrickCategory = 'brick' | 'plate' | 'slope';

export interface BrickDefinition {
  type: BrickType;
  name: string;
  width: number;
  depth: number;
  height: number;
  category: BrickCategory;
}

export interface Brick {
  id: string;
  type: BrickType;
  position: [number, number, number];
  rotation: number; // 0, 90, 180, 270
  color: string;
}
