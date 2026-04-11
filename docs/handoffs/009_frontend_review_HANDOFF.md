# Handoff: Frontend Review → Frontend Coding

**Handoff ID:** 009_frontend_review_complete
**Date:** 2026-04-11
**Status:** changes_requested
**App ID:** app-legobuilder-20260410
**Target Repo:** sreenivasmrpivot/legobuilder

---

## Review Verdict: ⛔ REQUEST CHANGES

Frontend Review Agent (Gate 8) reviewed PR #77 for **NFR-REL-001 — Auto-Save Crash Durability**.

**3 blocking issues** must be resolved before approval.

---

## Blocking Issues

### B1. `useAutoSave` passes hardcoded empty data (Critical)
- **File:** `frontend/src/hooks/useAutoSave.ts:39-44`
- The interval callback passes `bricks: []`, hardcoded camera state, and placeholder metadata
- Auto-save will always persist an empty scene regardless of user state
- E2E test T-BE-REL-001-01 (50 bricks survive crash) will fail
- **Fix:** Read actual scene state from `sceneStore` using `useSceneStore.getState()`

### B2. `package.json` has out-of-scope breaking changes (High)
- **File:** `frontend/package.json`
- Removed: `immer`, `three-mesh-bvh`, `@vitest/coverage-v8`
- Major bumps: `zustand` 4→5, `vite` 5→6
- Removed scripts: `lint:fix`, `format`, `format:check`, `type-check`, `test:e2e:ui`
- Package name changed: `legobuilder` → `legobuilder-frontend`
- **Fix:** Revert to base `package.json`, only add `idb` and `fake-indexeddb`

### B3. All test files use inline stubs (High)
- **Files:** All 4 test files
- Every test defines its own inline implementation instead of importing production code
- Tests provide false confidence — bugs in production code would not be caught
- **Fix:** Update imports to use real production modules; use `resetDBPromise()` for isolation

---

## Medium Concerns (non-blocking)

| ID | Concern | File |
|----|---------|------|
| M1 | `markSessionClosed()` async but fire-and-forget in beforeunload | `useAutoSave.ts:33` |
| M2 | `existingMeta` read outside atomic transaction (TOCTOU) | `persistenceService.ts:80-82` |
| M3 | `purgeSession()` uses raw `IDBKeyRange` instead of `idb` wrapper | `persistenceService.ts:155-161` |
| M4 | Missing focus trap and Escape key in ResumePrompt | `ResumePrompt.tsx:42` |
| M5 | `resetDBPromise()` doesn't close existing connection | `dbSchema.ts:130-132` |

---

## Strengths Confirmed

- ✅ `idb` library usage per LLD Section 13
- ✅ Atomic dual-store transaction in `saveSnapshot()`
- ✅ Validation-first crash recovery with `isValidSnapshot()`
- ✅ Quota exceeded purge-and-retry with `PersistenceError`
- ✅ All `data-testid` attributes match E2E selectors
- ✅ Accessible modal (role=dialog, aria-modal, aria-labelledby)
- ✅ Clean module separation and JSDoc documentation
- ✅ Overlap guard with `isSavingRef` in `useAutoSave`

---

## Required Actions

1. Fix `useAutoSave.ts` — read actual scene state from `sceneStore`
2. Revert `package.json` — only add `idb`, `fake-indexeddb`, `globals`
3. Update all 4 test files to import real production modules
4. Re-run all tests after fixes

---

## Workflow State

- **Current phase:** frontend_review_changes_requested
- **Completed:** design, frontend_test, frontend_coding, frontend_review
- **Remaining:** frontend_coding_fix, frontend_review_re, release

---

*Created by Spectra Framework — frontend-review agent*
