# Handoff: Frontend Review → Frontend Coding (Revision)

**Handoff ID:** 009_frontend_review_complete
**Date:** 2026-04-11
**Status:** changes_requested
**App ID:** app-legobuilder-20260410
**Target Repo:** sreenivasmrpivot/legobuilder

---

## Review Verdict: ❌ REQUEST CHANGES

Frontend Review Agent (Gate 8) reviewed PR #77 for **NFR-REL-001 — Auto-Save Crash Durability**.

**2 blocking issues** must be resolved before approval. **3 medium issues** should be addressed.

**Branch:** `feature/18-nfr-rel-001-frontend-tests`
**PR:** #77

---

## 🔴 Blocking Issues

### B1. `useAutoSave.ts` passes hardcoded empty data — auto-save is a no-op

**File:** `frontend/src/hooks/useAutoSave.ts`, lines 42-46

The interval callback passes `bricks: []`, hardcoded camera state, and placeholder metadata. No actual user work is ever saved. E2E tests T-BE-REL-001-01 and T-BE-REL-001-02 will fail.

**Fix:** Read actual bricks/camera/metadata from `sceneStore` inside the hook, or accept them as parameters.

### B2. `package.json` has out-of-scope breaking changes

**File:** `frontend/package.json`

- Removed `immer`, `three-mesh-bvh`, `@vitest/coverage-v8`
- Bumped `zustand` 4→5 and `vite` 5→6 (major versions)
- Removed scripts: `lint:fix`, `format`, `format:check`, `type-check`, `test:e2e:ui`
- Renamed package from `legobuilder` to `legobuilder-frontend`

**Fix:** Revert to main branch version, only add `idb` and `fake-indexeddb`.

---

## 🟡 Medium Issues

### M1. Tests use inline stubs instead of importing production code

All 4 test files define their own implementations rather than importing the real production modules. Tests provide zero coverage of actual production code.

### M2. Empty catch block silently swallows errors

`persistenceService.ts:80-82` — Add `console.warn` for debuggability.

### M3. ResumePrompt lacks focus trap and Escape key handling

Missing WCAG 2.1 AA keyboard accessibility. Track as follow-up issue.

---

## ✅ What's Good

- `idb` library used correctly per LLD Section 13
- Atomic dual-store transactions in `saveSnapshot()`
- Validation-first crash recovery with schema version check
- `PersistenceError` class with typed error codes
- All `data-testid` attributes match E2E selectors
- Accessible modal (`role=dialog`, `aria-modal`, `aria-labelledby`)
- `beforeunload` listener with cleanup on unmount
- Overlap guard (ref-based) prevents concurrent saves
- Clean module separation and JSDoc documentation

---

## Test ID Coverage

| Test ID | Status |
|---------|--------|
| T-BE-REL-001-01 | ⚠️ Will fail (B1) |
| T-BE-REL-001-02 | ⚠️ Will fail (B1) |
| T-UNIT-REL-001-01 | ✅ Contract met |
| T-UNIT-REL-001-02 | ✅ Contract met |
| T-UNIT-REL-001-03 | ✅ Contract met |
| T-UNIT-REL-001-04 | ✅ Contract met |
| T-UNIT-REL-001-05 | ✅ Contract met |
| T-UNIT-REL-001-06 | ✅ Contract met |
| T-UNIT-REL-001-07 | ✅ Contract met |
| T-UNIT-REL-001-08 | ✅ Contract met |

---

## Required Actions

1. **[B1] Fix `useAutoSave.ts`** — Read actual scene state from `sceneStore`
2. **[B2] Revert `package.json`** — Only add `idb` and `fake-indexeddb`
3. **[M1] Update test imports** — Replace inline stubs with real production module imports
4. **[M2] Add warning log** — Replace empty catch in `persistenceService.ts:80-82`
5. **[M3] Create follow-up issue** — Focus trap + Escape key for ResumePrompt

---

## Workflow State

- **Current phase:** frontend_review_changes_requested
- **Completed:** design, frontend_test, frontend_coding, frontend_review
- **Remaining:** frontend_coding_revision, frontend_review_re-review, release

---

*Created by Spectra Framework — frontend-review agent*
