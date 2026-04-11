# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 020_frontend_test_complete
**Date:** 2026-04-11
**Status:** complete
**FR-ID:** NFR-REL-001
**Issue:** #26 (tests) / #35 (feature)
**Branch:** feature/26-nfr-rel-001-tests
**PR:** (pending — see below)

---

## Work Completed

Wrote the complete test suite for NFR-REL-001 (Auto-Save Crash Durability) based on the merged LLD at `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md`. All 10 test cases from LLD Section 12 are implemented:

| Test ID | Type | Description |
|---------|------|-------------|
| T-BE-REL-001-01 | E2E (Playwright) | Browser crash → data survives → ResumePrompt shown |
| T-BE-REL-001-02 | E2E (Playwright) | Graceful close → ResumePrompt NOT shown |
| T-BE-REL-001-03 | Unit (Vitest) | persistenceService: atomic IndexedDB write |
| T-BE-REL-001-04 | Unit (Vitest) | persistenceService: private-mode / quota-exceeded fallback |
| T-BE-REL-001-05 | Unit (Vitest) | crashRecoveryService: detects active (crashed) session |
| T-BE-REL-001-06 | Unit (Vitest) | crashRecoveryService: graceful close suppresses prompt |
| T-BE-REL-001-07 | Unit (Vitest) | useAutoSave: 30s interval triggers save |
| T-BE-REL-001-08 | Unit (Vitest) | useAutoSave: beforeunload marks session closed |
| T-BE-REL-001-09 | Unit (Vitest) | persistenceStore: Zustand state machine transitions |
| T-BE-REL-001-10 | Unit (Vitest) | ResumePrompt: ARIA, focus, keyboard, interactions |

## Key Findings

- Tests are **contract-driven** (written before implementation) — they define the exact API the coding agent must implement
- `fake-indexeddb` is required as a devDependency for unit tests (not yet in package.json)
- E2E tests use Playwright **persistent context** to preserve IndexedDB across page loads
- `page.clock.install()` + `page.clock.fastForward()` controls the 30s auto-save interval in E2E tests
- `data-testid` attributes (`brick-catalog-item`, `scene-viewport`, `scene-brick`) must be added to real components

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| persistenceService unit tests | `frontend/tests/unit/persistenceService.test.ts` | T-BE-REL-001-03/04 |
| crashRecoveryService unit tests | `frontend/tests/unit/crashRecoveryService.test.ts` | T-BE-REL-001-05/06 |
| useAutoSave hook unit tests | `frontend/tests/unit/useAutoSave.test.ts` | T-BE-REL-001-07/08 |
| persistenceStore Zustand tests | `frontend/tests/unit/persistenceStore.test.ts` | T-BE-REL-001-09 |
| ResumePrompt component tests | `frontend/tests/unit/ResumePrompt.test.tsx` | T-BE-REL-001-10 |
| E2E crash recovery tests | `frontend/tests/e2e/auto-save-crash-recovery.spec.ts` | T-BE-REL-001-01/02 |
| Shared TypeScript types | `frontend/tests/unit/persistenceService.types.ts` | LLD schema + service interfaces |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| `fake-indexeddb` devDependency | Must be added to `frontend/package.json` before unit tests run | high |
| `@testing-library/react` + `user-event` | Verify present or add for ResumePrompt tests | medium |
| `data-testid` selectors | Coding agent must add to real components for E2E tests | medium |
| Playwright `clock.install()` API | Requires Playwright >= 1.45 | low |

## Context for Next Agent

### Recommended Actions
1. Add `fake-indexeddb` to `frontend/package.json` devDependencies
2. Implement `src/services/persistenceService.ts` matching `IPersistenceService` in `persistenceService.types.ts`
3. Implement `src/services/crashRecoveryService.ts` matching `ICrashRecoveryService`
4. Implement `src/stores/persistenceStore.ts` as Zustand store matching `PersistenceStoreState`
5. Implement `src/hooks/useAutoSave.ts` matching the contract in `useAutoSave.test.ts`
6. Implement `src/components/ui/ResumePrompt.tsx` matching the contract in `ResumePrompt.test.tsx`
7. Add `data-testid` attributes to scene components for E2E selectors
8. Run `vitest` — all unit tests must pass
9. Run `playwright test` — E2E tests must pass against running dev server

### Files to Read
- `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md`
- `frontend/tests/unit/persistenceService.types.ts`
- `frontend/tests/unit/persistenceService.test.ts`
- `frontend/tests/unit/crashRecoveryService.test.ts`
- `frontend/tests/unit/useAutoSave.test.ts`
- `frontend/tests/unit/persistenceStore.test.ts`
- `frontend/tests/unit/ResumePrompt.test.tsx`
- `frontend/tests/e2e/auto-save-crash-recovery.spec.ts`
- `frontend/src/services/persistenceService.ts`
- `frontend/src/hooks/useAutoSave.ts`
- `frontend/src/stores/sceneStore.ts`

## Workflow State
- **Current phase:** implementation
- **Completed:** entry, research, planning, architecture, design, frontend-test
- **Remaining:** frontend-coding, review, release

---
*Created by Spectra Framework — frontend-test agent*
