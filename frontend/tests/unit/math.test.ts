import { describe, it, expect } from 'vitest';
import { degToRad, radToDeg, clamp } from '../../src/utils/math';

describe('Math utilities', () => {
  it('degToRad', () => { expect(degToRad(90)).toBeCloseTo(Math.PI / 2); });
  it('radToDeg', () => { expect(radToDeg(Math.PI)).toBeCloseTo(180); });
  it('clamp', () => { expect(clamp(-5, 0, 10)).toBe(0); expect(clamp(15, 0, 10)).toBe(10); });
});
