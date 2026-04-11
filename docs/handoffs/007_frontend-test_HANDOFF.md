# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 007_frontend-test_complete
**Date:** 2026-04-11
**Status:** complete
**Branch:** `feature/30-nfr-rel-001-tests`
**Issue:** #35 — NFR-REL-001 Auto-Save Crash Durability

---

## Work Completed

Frontend Test agent wrote the complete NFR-REL-001 test suite covering all 10 test cases from the LLD:

- **2 E2E Playwright tests** (already on branch): `crashRecovery.spec.ts` — T-BE-REL-001-01 (crash + recovery) and T-BE-REL-001-02 (graceful close)
- **4 unit test files** (new): `persistenceService.test.ts`, `crashRecoveryService.test.ts`, `useAutoSave.test.ts`, `persistenceStore.test.ts`
- **1 component test file** (new): `ResumePrompt.test.tsx`

All tests are written as **red-green contracts** — they will fail until the coding agent implements the production code to spec.

---

## Key Findings

- The LLD defines a single-transaction atomicity contract (both `scene-snapshots` and `auto-save-meta` written in one `readwrite` tx). Tests enforce this via `mockDb.transaction` call count assertions.
- The `beforeunload` graceful-close marker is the critical signal that distinguishes a crash (status=`active`) from a clean close (status=`closed`). Tests validate both paths.
- `ResumePrompt` must have `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `autoFocus` on the Resume button per LLD Section 9 (Accessibility).
- The 5-second debounce in `useAutoSave` is tested with `vi.useFakeTimers()` — timer reset on scene change is explicitly covered.
- `persistenceStore` Zustand state machine covers: `idle → saving → saved`, `idle → saving → error`, recovery snapshot lifecycle, and `dismissResumePrompt`.

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| E2E Crash Recovery | `frontend/tests/e2e/crashRecovery.spec.ts` | T-BE-REL-001-01/02 (pre-existing on branch) |
| Unit: persistenceService | `frontend/tests/unit/persistenceService.test.ts` | T-UNIT-REL-001-01 to 04 |
| Unit: crashRecoveryService | `frontend/tests/unit/crashRecoveryService.test.ts` | T-UNIT-REL-001-05 to 08 |
| Unit: useAutoSave | `frontend/tests/unit/useAutoSave.test.ts` | Debounce, beforeunload, timer reset |
| Unit: persistenceStore | `frontend/tests/unit/persistenceStore.test.ts` | Zustand state transitions |
| Component: ResumePrompt | `frontend/tests/component/ResumePrompt.test.tsx` | ARIA, keyboard, resume/discard |
| Test PR | `https://github.com/sreenivasmrpivot/legobuilder/pull/49` | Draft PR — Gate 7 |
| Handoff JSON | `docs/handoffs/007_frontend-test_complete.json` | Machine-readable handoff |
| Handoff MD | `docs/handoffs/007_frontend-test_HANDOFF.md` | This file |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Gate 7 — Frontend Test Review | PR #49 must be approved before coding agent begins. Tests define the acceptance contract. | high |
| E2E baseURL in CI | `crashRecovery.spec.ts` requires app running — verify `playwright.config.ts` baseURL for CI environment | medium |
| useAutoSave import path | Test uses inline stub; update import to `src/hooks/useAutoSave.ts` once implemented | low |

---

## Context for Next Agent

### Recommended Actions
1. Read all test files on branch `feature/30-nfr-rel-001-tests` to understand the acceptance contract
2. Implement `src/services/persistenceService.ts` per LLD Section 5 (`saveSnapshot`, `markSessionClosed`, `getActiveSessions`, `initDb`)
3. Implement `src/services/crashRecoveryService.ts` per LLD Section 5 (`detectCrashedSessions`, `loadLatestSnapshot`)
4. Implement `src/stores/persistenceStore.ts` per LLD Section 4 (Zustand store)
5. Implement `src/hooks/useAutoSave.ts` per LLD Section 6 (5s debounce, `beforeunload` handler)
6. Implement `src/components/ui/ResumePrompt.tsx` per LLD Section 8 (ARIA dialog, `autoFocus`, `onResume`, `onDiscard`)
7. Run `vitest` to confirm all unit/component tests pass
8. Run `playwright` to confirm E2E crash recovery tests pass
9. **Reuse branch `feature/30-nfr-rel-001-tests`** — do NOT create a new branch

### Files to Read
- `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md`
- `frontend/tests/e2e/crashRecovery.spec.ts`
- `frontend/tests/unit/persistenceService.test.ts`
- `frontend/tests/unit/crashRecoveryService.test.ts`
- `frontend/tests/unit/useAutoSave.test.ts`
- `frontend/tests/unit/persistenceStore.test.ts`
- `frontend/tests/component/ResumePrompt.test.tsx`
- `frontend/src/services/persistenceService.ts`
- `frontend/src/hooks/useAutoSave.ts`
- `frontend/src/stores/sceneStore.ts`

---

## Workflow State

- **Current phase:** frontend_test
- **Completed:** design, frontend_test
- **Remaining:** frontend_coding, frontend_review, release
