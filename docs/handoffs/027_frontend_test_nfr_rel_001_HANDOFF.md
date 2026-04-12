# Handoff: Frontend Test Agent → Frontend Coding Agent

**Handoff ID:** 027_frontend_test_nfr_rel_001_complete
**Date:** 2026-04-12
**Status:** complete
**FR-ID:** NFR-REL-001
**Issue:** #35
**App ID:** app-legobuilder-20260410

---

## Work Completed

The Frontend Test agent produced **11 TDD test cases** for NFR-REL-001 (Auto-Save Crash Durability), fully aligned to LLD v2.0 verified interface contracts. All tests are written RED-first (TDD) — they define the exact interface the implementation must satisfy.

---

## Key Findings

- **Correct API name:** `detectOrphanedSession()` — NOT `detectCrash()` (LLD v2.0 verified)
- **Auto-save interval:** `AUTO_SAVE_INTERVAL_MS = 30_000` (30 seconds, confirmed from implementation)
- **Crash simulation:** `browser.close({ runBeforeUnload: false })` — the ONLY correct Playwright approach
- **IDB test library:** `fake-indexeddb/auto` imported at top of each unit test file
- **IDB runtime library:** `idb` must be in `dependencies` (not `devDependencies`)
- **Atomic write:** Both `scene-snapshots` and `auto-save-meta` must be written in a single `readwrite` transaction
- **data-testid selectors confirmed:** `resume-prompt`, `resume-prompt-brick-count`, `resume-btn`, `discard-btn`, `add-brick-btn`, `brick-instance`, `auto-save-status`

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| persistenceService.test.ts | `frontend/src/services/persistenceService.test.ts` | T-UNIT-REL-001-01, -04, -07 |
| crashRecoveryService.test.ts | `frontend/src/services/crashRecoveryService.test.ts` | T-UNIT-REL-001-02, -03, -08 |
| useAutoSave.test.ts | `frontend/src/hooks/useAutoSave.test.ts` | T-UNIT-REL-001-06 |
| ResumePrompt.test.tsx | `frontend/tests/component/ResumePrompt.test.tsx` | T-UNIT-REL-001-05 |
| crashRecovery.spec.ts | `frontend/tests/e2e/crashRecovery.spec.ts` | T-BE-REL-001-01, -02, -01b |
| Handoff JSON | `docs/handoffs/027_frontend_test_nfr_rel_001_complete.json` | Machine-readable handoff |
| Handoff MD | `docs/handoffs/027_frontend_test_nfr_rel_001_HANDOFF.md` | This document |

---

## Test Coverage Summary

| Test ID | Type | Description | File |
|---------|------|-------------|------|
| T-BE-REL-001-01 | E2E (Playwright) | 50 bricks survive crash, resume prompt shown | `frontend/tests/e2e/crashRecovery.spec.ts` |
| T-BE-REL-001-02 | E2E (Playwright) | Graceful close: no resume prompt on reopen | `frontend/tests/e2e/crashRecovery.spec.ts` |
| T-BE-REL-001-01b | E2E (Playwright) | Discard path: prompt dismissed, scene empty | `frontend/tests/e2e/crashRecovery.spec.ts` |
| T-UNIT-REL-001-01 | Unit (Vitest) | `saveSnapshot()` atomic dual-store write | `frontend/src/services/persistenceService.test.ts` |
| T-UNIT-REL-001-02 | Unit (Vitest) | `detectOrphanedSession()` returns null (no active sessions) | `frontend/src/services/crashRecoveryService.test.ts` |
| T-UNIT-REL-001-03 | Unit (Vitest) | `detectOrphanedSession()` returns candidate (active session) | `frontend/src/services/crashRecoveryService.test.ts` |
| T-UNIT-REL-001-04 | Unit (Vitest) | `closeSession()` marks status='closed' | `frontend/src/services/persistenceService.test.ts` |
| T-UNIT-REL-001-05 | Component (Vitest) | `ResumePrompt` renders with correct ARIA attributes | `frontend/tests/component/ResumePrompt.test.tsx` |
| T-UNIT-REL-001-06 | Unit (Vitest) | `useAutoSave` registers beforeunload listener | `frontend/src/hooks/useAutoSave.test.ts` |
| T-UNIT-REL-001-07 | Unit (Vitest) | Quota exceeded triggers purge-and-retry | `frontend/src/services/persistenceService.test.ts` |
| T-UNIT-REL-001-08 | Unit (Vitest) | Corrupted recovery data discarded gracefully | `frontend/src/services/crashRecoveryService.test.ts` |

---

## Human Review Required

None — tests are TDD scaffolding, no human review required before implementation proceeds.

---

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md` for full interface contracts
2. Implement `frontend/src/services/dbSchema.ts` — IDB schema, types, PersistenceError, constants
3. Implement `frontend/src/services/persistenceService.ts` — `saveSnapshot()`, `closeSession()`, `loadSnapshot()`, `purgeOldSnapshots()`, `purgeSession()`
4. Implement `frontend/src/services/crashRecoveryService.ts` — `detectOrphanedSession()`, `discardRecovery()`, `validateSnapshot()`
5. Implement `frontend/src/stores/persistenceStore.ts` — Zustand store with session lifecycle
6. Implement `frontend/src/hooks/useAutoSave.ts` — 30s interval + beforeunload handler
7. Implement `frontend/src/components/ResumePrompt/ResumePrompt.tsx` — accessible modal with all data-testid attributes
8. Implement `frontend/src/components/AutoSaveStatus.tsx` — status indicator with `data-testid=auto-save-status`
9. Ensure `idb` is in `dependencies` (not `devDependencies`) in `frontend/package.json`
10. Ensure `fake-indexeddb` is in `devDependencies` in `frontend/package.json`
11. All 11 tests must pass GREEN after implementation

### Files to Read

- `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md`
- `frontend/src/services/persistenceService.test.ts`
- `frontend/src/services/crashRecoveryService.test.ts`
- `frontend/src/hooks/useAutoSave.test.ts`
- `frontend/tests/component/ResumePrompt.test.tsx`
- `frontend/tests/e2e/crashRecovery.spec.ts`

---

## Workflow State

- **Current phase:** frontend-test
- **Completed:** research, pm, architecture, design, frontend-test
- **Remaining:** frontend-coding, frontend-review, release
