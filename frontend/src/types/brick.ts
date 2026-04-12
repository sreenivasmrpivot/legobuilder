export type BrickType = '1x1' | '2x1' | '2x2' | '2x4' | '4x2';

export interface BrickDefinition {
  type: BrickType;
  studsX: number;
  studsZ: number;
  height: number;
  label: string;
}

export interface Brick {
  id: string;
  type: BrickType;
  position: [number, number, number];
  rotation: number;
  color: string;
}
