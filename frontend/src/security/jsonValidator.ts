/**
 * jsonValidator.ts — STUB for TDD (RED phase)
 * NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
 *
 * This file is intentionally minimal so that the test suite can import
 * the module without crashing. The frontend-coding agent will replace
 * this stub with the full implementation.
 *
 * DO NOT add business logic here — this is owned by frontend-coding.
 */

export enum ValidationErrorCode {
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_TYPE = 'INVALID_TYPE',
  ARRAY_TOO_LARGE = 'ARRAY_TOO_LARGE',
  DEPTH_EXCEEDED = 'DEPTH_EXCEEDED',
  INVALID_BRICK_TYPE = 'INVALID_BRICK_TYPE',
  INVALID_COLOR = 'INVALID_COLOR',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  PROTOTYPE_POLLUTION = 'PROTOTYPE_POLLUTION',
  STRING_TOO_LONG = 'STRING_TOO_LONG',
  UNKNOWN_FIELD = 'UNKNOWN_FIELD',
  INVALID_VERSION = 'INVALID_VERSION',
  INVALID_ROTATION = 'INVALID_ROTATION',
  INVALID_POSITION = 'INVALID_POSITION',
  DUPLICATE_ID = 'DUPLICATE_ID',
  INVALID_BRICK_SCHEMA = 'INVALID_BRICK_SCHEMA',
}

export interface ValidationError {
  code: ValidationErrorCode;
  field?: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
}

/**
 * Validates a parsed JSON object against the LegoBuilder project schema.
 * Returns a ValidationResult with ok:true and empty errors on success,
 * or ok:false with one or more ValidationError entries on failure.
 *
 * STUB — implementation pending (frontend-coding agent).
 */
export function validateProjectJson(_input: unknown): ValidationResult {
  // Stub: always returns ok to allow import resolution.
  // Tests will FAIL (RED) until the real implementation is provided.
  return { ok: true, errors: [] };
}
