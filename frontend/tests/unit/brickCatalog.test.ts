import { describe, it, expect } from 'vitest';
import { BRICK_CATALOG, COLOR_PALETTE } from '../../src/engine/brickCatalog';

describe('BrickCatalog', () => {
  it('contains 6 brick types', () => {
    expect(Object.keys(BRICK_CATALOG)).toHaveLength(6);
  });

  it('all bricks have required properties', () => {
    for (const brick of Object.values(BRICK_CATALOG)) {
      expect(brick.type).toBeDefined();
      expect(brick.name).toBeDefined();
      expect(brick.width).toBeGreaterThan(0);
      expect(brick.depth).toBeGreaterThan(0);
      expect(brick.height).toBeGreaterThan(0);
      expect(['brick', 'plate', 'slope']).toContain(brick.category);
    }
  });
});

describe('ColorPalette', () => {
  it('contains 10 colors', () => {
    expect(COLOR_PALETTE).toHaveLength(10);
  });

  it('all colors are valid hex codes', () => {
    for (const color of COLOR_PALETTE) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
