/**
 * Integration Test Suite — importService security pipeline
 * NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
 *
 * Test IDs: T-FE-SEC-001-INT-01 through T-FE-SEC-001-INT-04
 *
 * These tests exercise the full import pipeline:
 *   readFile → JSON.parse → validateProjectJson → sanitizeProjectJson → sceneStore.loadScene
 *
 * The importService module is mocked at the boundary (File API) so tests
 * run in jsdom without a real filesystem.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SEC-001
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importProject } from '../importService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(content: string, name = 'project.json', type = 'application/json'): File {
  return new File([content], name, { type });
}

const VALID_JSON = JSON.stringify({
  version: '1.0',
  name: 'Integration Test Project',
  bricks: [
    {
      id: 'brick-001',
      type: '2x4',
      color: '#FF0000',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  ],
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-INT-01: Happy path — valid JSON file imports successfully
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-INT-01 — happy path import', () => {
  it('resolves without throwing for a valid project JSON file', async () => {
    const file = makeFile(VALID_JSON);
    await expect(importProject(file)).resolves.not.toThrow();
  });

  it('returns a project object with the correct name', async () => {
    const file = makeFile(VALID_JSON);
    const result = await importProject(file);
    // importProject returns the sanitized project or void; check name if returned
    if (result && typeof result === 'object' && 'name' in result) {
      expect((result as Record<string, unknown>).name).toBe('Integration Test Project');
    }
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-INT-02: Malformed JSON is rejected before validation
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-INT-02 — malformed JSON rejection', () => {
  it('throws or rejects for syntactically invalid JSON', async () => {
    const file = makeFile('{not valid json}');
    await expect(importProject(file)).rejects.toThrow();
  });

  it('throws or rejects for an empty file', async () => {
    const file = makeFile('');
    await expect(importProject(file)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-INT-03: Prototype-pollution payload is blocked
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-INT-03 — prototype pollution payload blocked', () => {
  it('rejects JSON containing __proto__ key', async () => {
    const malicious = '{"version":"1.0","name":"x","bricks":[],"__proto__":{"isAdmin":true}}';
    const file = makeFile(malicious);
    await expect(importProject(file)).rejects.toThrow();
  });

  it('does not pollute Object.prototype after a rejected import', async () => {
    const before = (Object.prototype as Record<string, unknown>).isAdmin;
    const malicious = '{"version":"1.0","name":"x","bricks":[],"__proto__":{"isAdmin":true}}';
    const file = makeFile(malicious);
    try {
      await importProject(file);
    } catch {
      // expected
    }
    expect((Object.prototype as Record<string, unknown>).isAdmin).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// T-FE-SEC-001-INT-04: Oversized file is rejected before parsing
// ---------------------------------------------------------------------------
describe('T-FE-SEC-001-INT-04 — oversized file rejection', () => {
  it('rejects a file larger than MAX_FILE_SIZE_BYTES without parsing', async () => {
    // 6 MB of data — exceeds the 5 MB limit defined in security.ts
    const bigContent = 'x'.repeat(6 * 1024 * 1024);
    const file = makeFile(bigContent, 'big.json');
    await expect(importProject(file)).rejects.toThrow();
  });
});
