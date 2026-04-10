import type { BrickType, BrickDefinition } from '@/types/brick';

export const BRICK_CATALOG: Record<BrickType, BrickDefinition> = {
  'brick-2x4': { type: 'brick-2x4', name: '2×4 Brick', width: 2, depth: 4, height: 3, category: 'brick' },
  'brick-2x2': { type: 'brick-2x2', name: '2×2 Brick', width: 2, depth: 2, height: 3, category: 'brick' },
  'brick-1x1': { type: 'brick-1x1', name: '1×1 Brick', width: 1, depth: 1, height: 3, category: 'brick' },
  'brick-1x2': { type: 'brick-1x2', name: '1×2 Brick', width: 1, depth: 2, height: 3, category: 'brick' },
  'slope-2x2': { type: 'slope-2x2', name: '2×2 Slope', width: 2, depth: 2, height: 3, category: 'slope' },
  'plate-1x4': { type: 'plate-1x4', name: '1×4 Plate', width: 1, depth: 4, height: 1, category: 'plate' },
};

export const COLOR_PALETTE = [
  '#D01012', // Red
  '#0057A8', // Blue
  '#00852B', // Green
  '#FFD700', // Yellow
  '#FFFFFF', // White
  '#1B1B1B', // Black
  '#FF7E14', // Orange
  '#6B5A5A', // Dark Gray
  '#A0A0A0', // Light Gray
  '#8B4513', // Brown
] as const;
