/**
 * TDD Test Suite — jsonValidator.ts
 * NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
 *
 * Test IDs: T-FE-SEC-001-01 through T-FE-SEC-001-10
 *
 * These tests are written RED-first. The implementation module
 * (src/security/jsonValidator.ts) is a stub that will be filled in
 * by the frontend-coding agent.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SEC-001
 */

import { describe, it, expect } from 'vitest';
import {
  validateProjectJson,
  ValidationResult,
  ValidationErrorCode,
} from '../jsonValidator';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_PROJECT = {
  version: '1.0',
  name: 'My Lego Project',
  bricks: [
    {
      id: 'brick-001',
      type: '2x4',
      color: '#FF0000',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  ],
};

function makeBricks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `brick-${i}`,
    type: '2x4',
    color: '#FF0000',
    position: { x: i, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  }));
}

function makeDeepObject(depth: number): unknown {
  let obj: Record<string, unknown> = { leaf: true };
  for (let i = 0; i < depth; i++) {
    obj = { child: obj };
  }
  return obj;
}

// ---------------------------------------------------------------------------
// T-FE-SEC-001-01: Valid project passes validation
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-01 — valid project passes validation', () => {
  it('returns ok:true for a well-formed project JSON', () => {
    const result: ValidationResult = validateProjectJson(VALID_PROJECT);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-02: Missing required top-level fields
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-02 — missing required fields', () => {
  it('returns MISSING_REQUIRED_FIELD when version is absent', () => {
    const input = { name: 'Test', bricks: [] };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.MISSING_REQUIRED_FIELD)).toBe(true);
  });

  it('returns MISSING_REQUIRED_FIELD when bricks array is absent', () => {
    const input = { version: '1.0', name: 'Test' };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.MISSING_REQUIRED_FIELD)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-03: Non-object / null input
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-03 — non-object input', () => {
  it('returns INVALID_TYPE for null input', () => {
    const result = validateProjectJson(null);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_TYPE)).toBe(true);
  });

  it('returns INVALID_TYPE for string input', () => {
    const result = validateProjectJson('not an object');
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_TYPE)).toBe(true);
  });

  it('returns INVALID_TYPE for array input', () => {
    const result = validateProjectJson([]);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_TYPE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-04: Brick count limit (JSON bomb — array size)
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-04 — brick count limit', () => {
  it('rejects projects with more than 10 000 bricks', () => {
    const input = { version: '1.0', name: 'Big', bricks: makeBricks(10_001) };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.ARRAY_TOO_LARGE)).toBe(true);
  });

  it('accepts projects with exactly 10 000 bricks', () => {
    const input = { version: '1.0', name: 'Max', bricks: makeBricks(10_000) };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-05: Nesting depth limit (JSON bomb — deep nesting)
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-05 — nesting depth limit', () => {
  it('rejects objects nested deeper than 20 levels', () => {
    const deep = makeDeepObject(21);
    const input = { version: '1.0', name: 'Deep', bricks: [], meta: deep };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.DEPTH_EXCEEDED)).toBe(true);
  });

  it('accepts objects nested at exactly 20 levels', () => {
    const deep = makeDeepObject(20);
    const input = { version: '1.0', name: 'Deep', bricks: [], meta: deep };
    const result = validateProjectJson(input);
    // meta is an extra field — validator should not reject on depth alone
    // (depth 20 is within limit)
    expect(result.errors.every(e => e.code !== ValidationErrorCode.DEPTH_EXCEEDED)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-06: Invalid brick type
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-06 — invalid brick type', () => {
  it('returns INVALID_BRICK_TYPE for an unrecognised brick type', () => {
    const input = {
      ...VALID_PROJECT,
      bricks: [
        {
          id: 'b1',
          type: 'UNKNOWN_BRICK_XYZ',
          color: '#FF0000',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
    };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_BRICK_TYPE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-07: Invalid color format
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-07 — invalid color format', () => {
  it('returns INVALID_COLOR for a non-hex color string', () => {
    const input = {
      ...VALID_PROJECT,
      bricks: [
        {
          id: 'b1',
          type: '2x4',
          color: 'javascript:alert(1)',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
    };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_COLOR)).toBe(true);
  });

  it('accepts valid 6-digit hex colors', () => {
    const result = validateProjectJson(VALID_PROJECT);
    expect(result.ok).toBe(true);
  });

  it('accepts valid 3-digit hex colors', () => {
    const input = {
      ...VALID_PROJECT,
      bricks: [
        {
          id: 'b1',
          type: '2x4',
          color: '#F00',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
    };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-08: Out-of-range numeric coordinates
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-08 — out-of-range coordinates', () => {
  it('returns OUT_OF_RANGE for position.x > MAX_COORDINATE', () => {
    const input = {
      ...VALID_PROJECT,
      bricks: [
        {
          id: 'b1',
          type: '2x4',
          color: '#FF0000',
          position: { x: 1_000_001, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
    };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.OUT_OF_RANGE)).toBe(true);
  });

  it('returns OUT_OF_RANGE for NaN coordinate', () => {
    const input = {
      ...VALID_PROJECT,
      bricks: [
        {
          id: 'b1',
          type: '2x4',
          color: '#FF0000',
          position: { x: NaN, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
    };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.OUT_OF_RANGE)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-09: Prototype pollution via __proto__ key
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-09 — prototype pollution detection', () => {
  it('returns PROTOTYPE_POLLUTION when __proto__ key is present', () => {
    // Build the object without triggering actual pollution
    const input = JSON.parse('{"version":"1.0","name":"x","bricks":[],"__proto__":{"isAdmin":true}}');
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.PROTOTYPE_POLLUTION)).toBe(true);
  });

  it('returns PROTOTYPE_POLLUTION when constructor key is present', () => {
    const input = JSON.parse('{"version":"1.0","name":"x","bricks":[],"constructor":{"prototype":{"isAdmin":true}}}');
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.PROTOTYPE_POLLUTION)).toBe(true);
  });

  it('returns PROTOTYPE_POLLUTION when prototype key is present', () => {
    const input = JSON.parse('{"version":"1.0","name":"x","bricks":[],"prototype":{"isAdmin":true}}');
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.PROTOTYPE_POLLUTION)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-10: String field length limits
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-10 — string field length limits', () => {
  it('returns STRING_TOO_LONG when project name exceeds 256 characters', () => {
    const input = {
      version: '1.0',
      name: 'A'.repeat(257),
      bricks: [],
    };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.STRING_TOO_LONG)).toBe(true);
  });

  it('returns STRING_TOO_LONG when brick id exceeds 128 characters', () => {
    const input = {
      version: '1.0',
      name: 'Test',
      bricks: [
        {
          id: 'x'.repeat(129),
          type: '2x4',
          color: '#FF0000',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
    };
    const result = validateProjectJson(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some(e => e.code === ValidationErrorCode.STRING_TOO_LONG)).toBe(true);
  });
});
