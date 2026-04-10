import { describe, it, expect, beforeEach } from 'vitest';
import { OccupancyMap } from '../../src/engine/occupancyMap';
import type { Brick } from '../../src/types/brick';

describe('OccupancyMap', () => {
  let map: OccupancyMap;

  beforeEach(() => {
    map = new OccupancyMap();
  });

  it('allows placement on empty grid', () => {
    expect(map.canPlace('brick-2x4', [0, 0, 0])).toBe(true);
  });

  it('rejects placement on occupied cells', () => {
    const brick: Brick = {
      id: '1',
      type: 'brick-2x4',
      position: [0, 0, 0],
      rotation: 0,
      color: '#D01012',
    };
    map.occupy(brick);
    expect(map.canPlace('brick-1x1', [0, 0, 0])).toBe(false);
  });

  it('allows placement on adjacent cells', () => {
    const brick: Brick = {
      id: '1',
      type: 'brick-1x1',
      position: [0, 0, 0],
      rotation: 0,
      color: '#D01012',
    };
    map.occupy(brick);
    expect(map.canPlace('brick-1x1', [1, 0, 0])).toBe(true);
  });

  it('frees cells on release', () => {
    const brick: Brick = {
      id: '1',
      type: 'brick-2x4',
      position: [0, 0, 0],
      rotation: 0,
      color: '#D01012',
    };
    map.occupy(brick);
    map.release(brick);
    expect(map.canPlace('brick-2x4', [0, 0, 0])).toBe(true);
  });

  it('clears all cells', () => {
    const brick: Brick = {
      id: '1',
      type: 'brick-2x4',
      position: [0, 0, 0],
      rotation: 0,
      color: '#D01012',
    };
    map.occupy(brick);
    map.clear();
    expect(map.size).toBe(0);
  });
});
