# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 012_frontend-test_complete
**Date:** 2026-04-12
**Status:** complete
**Issue:** #32 — NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
**Branch:** `feature/32-nfr-sec-001-frontend-tests`

---

## Work Completed

Created branch `feature/32-nfr-sec-001-frontend-tests` from `main` and authored a complete TDD test suite (RED phase) for NFR-SEC-001. All 22 test cases from the LLD are implemented. Implementation stubs are provided so the test runner can resolve imports without crashing — tests will fail (RED) until the coding agent provides real implementations.

---

## Key Findings

- All 22 LLD test IDs are covered: T-FE-SEC-001-01 through 15 (unit), T-FE-SEC-001-INT-01 through 04 (integration), T-E2E-SEC-001-01 through 03 (E2E).
- Stubs are intentionally minimal — the `validateProjectJson` stub always returns `ok:true`, so unit tests will fail RED until the real implementation is in place.
- `security.ts` constants are already set to correct values and are tested for bounds — coding agent must not change them without updating tests.
- Integration tests assume `importProject(file: File): Promise<unknown>` is exported from `importService.ts` — this API must be added/aligned by the coding agent.
- E2E tests use `input[type="file"]` selector — if the app uses a custom drag-drop zone, the selector must be updated.

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| jsonValidator unit tests | `frontend/src/security/__tests__/jsonValidator.test.ts` | 10 unit tests (T-FE-SEC-001-01 to 10) |
| sanitize unit tests | `frontend/src/security/__tests__/sanitize.test.ts` | 3 unit tests (T-FE-SEC-001-11 to 13) |
| security constants unit tests | `frontend/src/security/__tests__/security.test.ts` | 2 unit tests (T-FE-SEC-001-14 to 15) |
| importService integration tests | `frontend/src/services/__tests__/importService.security.test.ts` | 4 integration tests (T-FE-SEC-001-INT-01 to 04) |
| E2E security tests | `frontend/tests/e2e/jsonImportSecurity.spec.ts` | 3 Playwright E2E tests (T-E2E-SEC-001-01 to 03) |
| jsonValidator stub | `frontend/src/security/jsonValidator.ts` | TDD stub with full type exports |
| sanitize stub | `frontend/src/security/sanitize.ts` | TDD stub |
| security constants | `frontend/src/security/security.ts` | Correct constant values (not a stub) |
| security barrel | `frontend/src/security/index.ts` | Barrel export |
| Handoff JSON | `docs/handoffs/012_frontend-test_complete.json` | Machine-readable handoff |
| Handoff Markdown | `docs/handoffs/012_frontend-test_HANDOFF.md` | This file |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| `importService.ts` public API | Integration tests assume `importProject(file: File): Promise<unknown>` is exported. Current file may not export this signature. | medium |
| E2E file input selector | Tests use `input[type="file"]` — update if app uses custom drag-drop zone. | low |
| `ALLOWED_BRICK_TYPES` completeness | Stub lists 21 types. Verify against product spec. | low |

---

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/NFR-SEC-001/LOW_LEVEL_DESIGN.md` for the full implementation spec.
2. Implement `frontend/src/security/jsonValidator.ts` — replace the stub with the 15-error-code validation engine.
3. Implement `frontend/src/security/sanitize.ts` — replace the stub with `structuredClone()` + HTML encoding + dangerous-key removal.
4. Update `frontend/src/services/importService.ts` to export `importProject(file: File): Promise<unknown>` and wire the full pipeline: readFile → parseJson → validateProjectJson → sanitizeProjectJson → sceneStore.loadScene.
5. Update `frontend/eslint.config.js` to add `no-eval`, `no-new-func`, `no-implied-eval`, `no-script-url` rules.
6. Run `vitest` to confirm all 19 unit + integration tests pass (GREEN phase).
7. Run `playwright` to confirm all 3 E2E tests pass against the running app.

### Files to Read

- `docs/features/NFR-SEC-001/LOW_LEVEL_DESIGN.md`
- `frontend/src/security/jsonValidator.ts`
- `frontend/src/security/sanitize.ts`
- `frontend/src/security/security.ts`
- `frontend/src/security/__tests__/jsonValidator.test.ts`
- `frontend/src/security/__tests__/sanitize.test.ts`
- `frontend/src/security/__tests__/security.test.ts`
- `frontend/src/services/__tests__/importService.security.test.ts`
- `frontend/tests/e2e/jsonImportSecurity.spec.ts`
- `frontend/src/services/importService.ts`
- `frontend/eslint.config.js`

---

## Workflow State

- **Current phase:** implementation
- **Completed:** entry, research, planning, architecture, design, frontend-test
- **Remaining:** frontend-coding, review, release
