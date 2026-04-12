import { describe, it, expect } from 'vitest';
import { calculateOccupiedCells, snapToGrid, canPlaceBrick } from '../../src/engine/placement';
import { OccupancyMap } from '../../src/engine/occupancyMap';

describe('Placement Engine', () => {
  describe('calculateOccupiedCells', () => {
    it('should calculate cells for a 1x1 brick', () => {
      const cells = calculateOccupiedCells('1x1', [0, 0, 0], 0);
      expect(cells).toEqual([[0, 0, 0]]);
    });
    it('should calculate cells for a 2x4 brick', () => {
      const cells = calculateOccupiedCells('2x4', [0, 0, 0], 0);
      expect(cells).toHaveLength(8);
    });
  });

  describe('snapToGrid', () => {
    it('should snap to nearest integer', () => {
      expect(snapToGrid(1.3, 2.7, [32, 32])).toEqual([1, 3]);
    });
  });

  describe('canPlaceBrick', () => {
    it('should allow placement on empty grid', () => {
      const map = new OccupancyMap();
      expect(canPlaceBrick('2x4', [0, 0, 0], 0, map, [32, 32])).toBe(true);
    });
    it('should reject placement on occupied cells', () => {
      const map = new OccupancyMap();
      map.occupy('existing', [[0, 0, 0], [1, 0, 0]]);
      expect(canPlaceBrick('1x1', [0, 0, 0], 0, map, [32, 32])).toBe(false);
    });
    it('should reject placement outside grid bounds', () => {
      const map = new OccupancyMap();
      expect(canPlaceBrick('2x4', [30, 0, 0], 0, map, [32, 32])).toBe(false);
    });
  });
});
