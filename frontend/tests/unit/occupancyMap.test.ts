import { describe, it, expect, beforeEach } from 'vitest';
import { OccupancyMap } from '../../src/engine/occupancyMap';

describe('OccupancyMap', () => {
  let map: OccupancyMap;
  beforeEach(() => { map = new OccupancyMap(); });

  it('should report unoccupied cells as available', () => {
    expect(map.isOccupied(0, 0, 0)).toBe(false);
    expect(map.canPlace([[0, 0, 0], [1, 0, 0]])).toBe(true);
  });

  it('should detect collisions after occupation', () => {
    map.occupy('brick-1', [[0, 0, 0], [1, 0, 0]]);
    expect(map.isOccupied(0, 0, 0)).toBe(true);
    expect(map.canPlace([[0, 0, 0]])).toBe(false);
  });

  it('should release cells on brick removal', () => {
    map.occupy('brick-1', [[0, 0, 0]]);
    map.release([[0, 0, 0]]);
    expect(map.isOccupied(0, 0, 0)).toBe(false);
  });

  it('should return brick ID at occupied position', () => {
    map.occupy('brick-42', [[5, 0, 3]]);
    expect(map.getBrickAt(5, 0, 3)).toBe('brick-42');
    expect(map.getBrickAt(0, 0, 0)).toBeUndefined();
  });

  it('should track size correctly', () => {
    expect(map.size).toBe(0);
    map.occupy('b1', [[0, 0, 0], [1, 0, 0]]);
    expect(map.size).toBe(2);
  });

  it('should clear all cells', () => {
    map.occupy('b1', [[0, 0, 0], [1, 0, 0], [2, 0, 0]]);
    map.clear();
    expect(map.size).toBe(0);
  });
});
