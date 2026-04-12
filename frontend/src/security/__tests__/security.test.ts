/**
 * TDD Test Suite — security.ts (constants)
 * NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
 *
 * Test IDs: T-FE-SEC-001-14 through T-FE-SEC-001-15
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SEC-001
 */

import { describe, it, expect } from 'vitest';
import {
  MAX_BRICK_COUNT,
  MAX_JSON_DEPTH,
  MAX_STRING_LENGTH,
  MAX_BRICK_ID_LENGTH,
  MAX_COORDINATE,
  ALLOWED_BRICK_TYPES,
  DANGEROUS_KEYS,
  COLOR_HEX_REGEX,
  MAX_FILE_SIZE_BYTES,
} from '../security';

// ---------------------------------------------------------------------------
// T-FE-SEC-001-14: Security constants are within safe bounds
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-14 — security constants are within safe bounds', () => {
  it('MAX_BRICK_COUNT is a positive integer ≤ 10 000', () => {
    expect(Number.isInteger(MAX_BRICK_COUNT)).toBe(true);
    expect(MAX_BRICK_COUNT).toBeGreaterThan(0);
    expect(MAX_BRICK_COUNT).toBeLessThanOrEqual(10_000);
  });

  it('MAX_JSON_DEPTH is a positive integer ≤ 50', () => {
    expect(Number.isInteger(MAX_JSON_DEPTH)).toBe(true);
    expect(MAX_JSON_DEPTH).toBeGreaterThan(0);
    expect(MAX_JSON_DEPTH).toBeLessThanOrEqual(50);
  });

  it('MAX_STRING_LENGTH is a positive integer ≤ 1024', () => {
    expect(Number.isInteger(MAX_STRING_LENGTH)).toBe(true);
    expect(MAX_STRING_LENGTH).toBeGreaterThan(0);
    expect(MAX_STRING_LENGTH).toBeLessThanOrEqual(1024);
  });

  it('MAX_BRICK_ID_LENGTH is a positive integer ≤ 256', () => {
    expect(Number.isInteger(MAX_BRICK_ID_LENGTH)).toBe(true);
    expect(MAX_BRICK_ID_LENGTH).toBeGreaterThan(0);
    expect(MAX_BRICK_ID_LENGTH).toBeLessThanOrEqual(256);
  });

  it('MAX_COORDINATE is a positive finite number', () => {
    expect(Number.isFinite(MAX_COORDINATE)).toBe(true);
    expect(MAX_COORDINATE).toBeGreaterThan(0);
  });

  it('MAX_FILE_SIZE_BYTES is a positive integer (≤ 10 MB)', () => {
    expect(Number.isInteger(MAX_FILE_SIZE_BYTES)).toBe(true);
    expect(MAX_FILE_SIZE_BYTES).toBeGreaterThan(0);
    expect(MAX_FILE_SIZE_BYTES).toBeLessThanOrEqual(10 * 1024 * 1024);
  });

  it('ALLOWED_BRICK_TYPES is a non-empty frozen Set', () => {
    expect(ALLOWED_BRICK_TYPES).toBeInstanceOf(Set);
    expect(ALLOWED_BRICK_TYPES.size).toBeGreaterThan(0);
    // Frozen sets cannot be mutated
    expect(() => {
      (ALLOWED_BRICK_TYPES as Set<string>).add('EVIL_BRICK');
    }).toThrow();
  });

  it('DANGEROUS_KEYS includes __proto__, constructor, and prototype', () => {
    expect(DANGEROUS_KEYS).toContain('__proto__');
    expect(DANGEROUS_KEYS).toContain('constructor');
    expect(DANGEROUS_KEYS).toContain('prototype');
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-15: COLOR_HEX_REGEX correctly validates hex color strings
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-15 — COLOR_HEX_REGEX validates hex colors', () => {
  const validColors = ['#FF0000', '#00ff00', '#0000FF', '#FFF', '#abc', '#123456', '#AABBCC'];
  const invalidColors = [
    'red',
    'rgb(255,0,0)',
    'javascript:alert(1)',
    '#GGGGGG',
    '#12345',   // 5 digits
    '#1234567', // 7 digits
    '',
    'FF0000',   // missing #
  ];

  validColors.forEach(color => {
    it(`accepts valid color: ${color}`, () => {
      expect(COLOR_HEX_REGEX.test(color)).toBe(true);
    });
  });

  invalidColors.forEach(color => {
    it(`rejects invalid color: ${JSON.stringify(color)}`, () => {
      expect(COLOR_HEX_REGEX.test(color)).toBe(false);
    });
  });
});
