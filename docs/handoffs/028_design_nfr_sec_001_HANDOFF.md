# Handoff: Design Agent → Frontend Test Agent

**Handoff ID:** 028_design_nfr_sec_001_complete
**Date:** 2026-04-12
**Status:** complete
**FR-ID:** NFR-SEC-001
**Issue:** #32
**App ID:** app-legobuilder-20260410
**Retrigger:** #2 (advancing stalled pipeline)

## Work Completed

The Low-Level Design for **NFR-SEC-001** (Validate all imported JSON files against schema; prevent arbitrary code execution) was authored and merged to `main` via PR #45. This handoff (028) is a retrigger to advance the pipeline to the `frontend-test` agent. The LLD defines a complete security validation architecture for the LegoBuilder JSON import pipeline.

## Key Findings

- **Validation engine**: Pure `jsonValidator.ts` with hand-rolled validator — no `ajv` dependency, ≤8KB bundle increase
- **Fail-fast strategy**: `FILE_TOO_LARGE`, `INVALID_JSON_SYNTAX`, `DEPTH_LIMIT_EXCEEDED`, `PROTOTYPE_POLLUTION` all short-circuit immediately
- **Allowlist approach**: `catalogId` vs `BRICK_CATALOG`, rotation vs `{0,90,180,270}`, colors vs `#RRGGBB` regex, IDs vs UUID v4 regex
- **Defense-in-depth**: `structuredClone()` + `sanitizeString()` breaks prototype chain before passing to `sceneStore`
- **22 test cases**: 15 unit, 4 integration, 3 E2E — covering prototype pollution, JSON bombs, XSS, MIME spoofing, oversized file DoS

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| Low-Level Design | `docs/features/NFR-SEC-001/LOW_LEVEL_DESIGN.md` | Full LLD: threat model, validation architecture, 4 sequence diagrams, 15 error codes, 22 test cases (on `main` via PR #45) |
| Handoff JSON | `docs/handoffs/028_design_nfr_sec_001_complete.json` | Machine-readable handoff for frontend-test agent |
| Handoff Markdown | `docs/handoffs/028_design_nfr_sec_001_HANDOFF.md` | This document |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| OQ-2: Exact BRICK_CATALOG catalogId values | Allowlist validation requires complete catalog enumeration | high |
| OQ-1: zod vs hand-rolled validator | zod may already be a project dependency | medium |
| OQ-4: Partial imports allowed? | Product decision affects error handling strategy | medium |

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/NFR-SEC-001/LOW_LEVEL_DESIGN.md` from `main` — this is the approved design
2. Write TDD test suite (RED phase) for all 22 test cases:
   - Unit: `T-FE-SEC-001-01` through `T-FE-SEC-001-15` → `frontend/src/security/__tests__/jsonValidator.test.ts`, `sanitize.test.ts`, `security.test.ts`
   - Integration: `T-FE-SEC-001-INT-01` through `INT-04` → `frontend/src/services/__tests__/importService.security.test.ts`
   - E2E: `T-E2E-SEC-001-01` through `03` → `frontend/tests/e2e/jsonImportSecurity.spec.ts`
3. Create TDD stubs:
   - `frontend/src/security/jsonValidator.ts` — exports `ValidationErrorCode`, `ValidationError`, `ValidationResult`; `validateProjectJson` returns `{ ok: true }` (stub)
   - `frontend/src/security/sanitize.ts` — exports `sanitizeProjectJson` as no-op stub
   - `frontend/src/security/security.ts` — real constants: `MAX_BRICK_COUNT`, `MAX_JSON_DEPTH`, `MAX_FILE_SIZE_BYTES`, `ALLOWED_BRICK_TYPES`, `COLOR_HEX_REGEX`
   - `frontend/src/security/index.ts` — barrel export
4. Integration tests require `importProject(file: File): Promise<unknown>` exported from `importService.ts`
5. E2E tests use `input[type="file"]` selector — update if app uses custom drag-drop zone
6. Do NOT use `__proto__` directly in test fixtures — use `JSON.parse()` to avoid actual prototype pollution during test setup

### Files to Read

- `docs/features/NFR-SEC-001/LOW_LEVEL_DESIGN.md`

## Workflow State

- **Current phase:** design (complete)
- **Completed:** research, pm, architecture, design
- **Remaining:** frontend-test, frontend-coding, frontend-review, release
