/**
 * TDD Test Suite — sanitize.ts
 * NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
 *
 * Test IDs: T-FE-SEC-001-11 through T-FE-SEC-001-13
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SEC-001
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeProjectJson } from '../sanitize';

// ---------------------------------------------------------------------------
// T-FE-SEC-001-11: sanitizeProjectJson returns a deep clone (no reference sharing)
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-11 — deep clone isolation', () => {
  it('returns a new object that is not the same reference as the input', () => {
    const input = {
      version: '1.0',
      name: 'Test',
      bricks: [{ id: 'b1', type: '2x4', color: '#FF0000', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }],
    };
    const output = sanitizeProjectJson(input);
    expect(output).not.toBe(input);
  });

  it('nested brick array is a new reference', () => {
    const input = {
      version: '1.0',
      name: 'Test',
      bricks: [{ id: 'b1', type: '2x4', color: '#FF0000', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }],
    };
    const output = sanitizeProjectJson(input);
    expect(output.bricks).not.toBe(input.bricks);
  });

  it('mutating the output does not affect the input', () => {
    const input = {
      version: '1.0',
      name: 'Original',
      bricks: [],
    };
    const output = sanitizeProjectJson(input);
    (output as Record<string, unknown>).name = 'Mutated';
    expect(input.name).toBe('Original');
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-12: HTML-encodes dangerous characters in string fields
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-12 — HTML encoding of dangerous characters', () => {
  it('encodes < and > in project name', () => {
    const input = {
      version: '1.0',
      name: '<script>alert(1)</script>',
      bricks: [],
    };
    const output = sanitizeProjectJson(input);
    expect((output as Record<string, unknown>).name).not.toContain('<script>');
    expect((output as Record<string, unknown>).name).not.toContain('</script>');
  });

  it('encodes & in project name', () => {
    const input = { version: '1.0', name: 'A & B', bricks: [] };
    const output = sanitizeProjectJson(input);
    expect((output as Record<string, unknown>).name).not.toContain('&');
  });

  it('encodes " in string fields', () => {
    const input = { version: '1.0', name: 'Say "hello"', bricks: [] };
    const output = sanitizeProjectJson(input);
    expect((output as Record<string, unknown>).name).not.toContain('"');
  });

  it('encodes dangerous characters in brick id', () => {
    const input = {
      version: '1.0',
      name: 'Test',
      bricks: [
        {
          id: '<img src=x onerror=alert(1)>',
          type: '2x4',
          color: '#FF0000',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
        },
      ],
    };
    const output = sanitizeProjectJson(input);
    const brick = (output as Record<string, unknown[]>).bricks[0] as Record<string, unknown>;
    expect(brick.id).not.toContain('<img');
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-13: Strips dangerous prototype-polluting keys
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-13 — prototype-polluting key removal', () => {
  it('removes __proto__ key from sanitized output', () => {
    // Use JSON.parse to avoid actual prototype pollution during test setup
    const input = JSON.parse('{"version":"1.0","name":"x","bricks":[],"__proto__":{"isAdmin":true}}');
    const output = sanitizeProjectJson(input) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(output, '__proto__')).toBe(false);
  });

  it('removes constructor key from sanitized output', () => {
    const input = JSON.parse('{"version":"1.0","name":"x","bricks":[],"constructor":{"prototype":{}}}');
    const output = sanitizeProjectJson(input) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(output, 'constructor')).toBe(false);
  });

  it('removes prototype key from sanitized output', () => {
    const input = JSON.parse('{"version":"1.0","name":"x","bricks":[],"prototype":{}}');
    const output = sanitizeProjectJson(input) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(output, 'prototype')).toBe(false);
  });

  it('does not pollute Object.prototype after sanitization', () => {
    const before = (Object.prototype as Record<string, unknown>).isAdmin;
    const input = JSON.parse('{"version":"1.0","name":"x","bricks":[],"__proto__":{"isAdmin":true}}');
    sanitizeProjectJson(input);
    expect((Object.prototype as Record<string, unknown>).isAdmin).toBe(before);
  });
});
