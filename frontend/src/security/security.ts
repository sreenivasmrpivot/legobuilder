/**
 * security.ts — STUB for TDD (RED phase)
 * NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
 *
 * Security constants used by jsonValidator.ts and sanitize.ts.
 * This file is intentionally minimal so that the test suite can import
 * the module without crashing. The frontend-coding agent will replace
 * this stub with the full implementation.
 *
 * DO NOT add business logic here — this is owned by frontend-coding.
 */

export const MAX_BRICK_COUNT = 10_000;
export const MAX_JSON_DEPTH = 20;
export const MAX_STRING_LENGTH = 256;
export const MAX_BRICK_ID_LENGTH = 128;
export const MAX_COORDINATE = 1_000_000;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Allowed brick type identifiers.
 * Frozen so that tests can verify immutability.
 */
export const ALLOWED_BRICK_TYPES: ReadonlySet<string> = Object.freeze(
  new Set([
    '1x1', '1x2', '1x3', '1x4', '1x6', '1x8',
    '2x2', '2x3', '2x4', '2x6', '2x8',
    '2x2-corner', '2x4-plate', '1x2-plate',
    'slope-45', 'slope-30', 'slope-18',
    'round-1x1', 'round-2x2',
    'technic-1x2', 'technic-1x4',
  ])
);

/**
 * Keys that indicate prototype pollution attempts.
 */
export const DANGEROUS_KEYS: readonly string[] = Object.freeze([
  '__proto__',
  'constructor',
  'prototype',
]);

/**
 * Regex that matches valid CSS hex color strings (#RGB or #RRGGBB).
 */
export const COLOR_HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
