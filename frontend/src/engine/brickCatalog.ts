import type { BrickType, BrickDefinition } from '../types/brick';

export const BRICK_CATALOG: Record<BrickType, BrickDefinition> = {
  '1x1': { type: '1x1', studsX: 1, studsZ: 1, height: 1, label: '1\u00d71 Brick' },
  '2x1': { type: '2x1', studsX: 2, studsZ: 1, height: 1, label: '2\u00d71 Brick' },
  '2x2': { type: '2x2', studsX: 2, studsZ: 2, height: 1, label: '2\u00d72 Brick' },
  '2x4': { type: '2x4', studsX: 2, studsZ: 4, height: 1, label: '2\u00d74 Brick' },
  '4x2': { type: '4x2', studsX: 4, studsZ: 2, height: 1, label: '4\u00d72 Brick' },
};

export const COLOR_PALETTE: string[] = [
  '#D01012', '#0057A8', '#237841', '#FEC400', '#FFFFFF',
  '#1B1B1B', '#F57D20', '#6B327B', '#00BCD4', '#8D7452',
];
