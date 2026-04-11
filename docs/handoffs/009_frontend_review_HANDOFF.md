# Handoff: Frontend Review → Frontend Coding (Fix Cycle)

**Handoff ID:** 009_frontend_review_complete
**Date:** 2026-04-11
**Status:** changes_requested
**App ID:** app-legobuilder-20260410
**Target Repo:** sreenivasmrpivot/legobuilder

---

## Review Verdict: ❌ REQUEST CHANGES

Frontend review of PR #77 (NFR-REL-001 Auto-Save Crash Durability) found **2 high-severity blocking issues** that must be resolved before merge.

**Branch:** `feature/18-nfr-rel-001-frontend-tests`
**PR:** #77

---

## 🔴 Blocking Issues

### B1: `useAutoSave.ts` — Hardcoded empty bricks array
- **File:** `frontend/src/hooks/useAutoSave.ts` (lines 38-42)
- **Problem:** `triggerAutoSave([], ...)` always saves 0 bricks. Auto-save never persists actual user work.
- **Fix:** Use `useSceneStore.getState()` inside the interval callback to read current bricks, camera, and metadata at save time.

### B2: `package.json` — Unscoped breaking changes
- **File:** `frontend/package.json`
- **Problem:** Removed `immer`, `three-mesh-bvh`, `@vitest/coverage-v8`. Major bumps: `zustand` v4→v5, `vite` v5→v6. Removed scripts. Package name changed.
- **Fix:** Revert all changes except adding `idb` to dependencies and `fake-indexeddb` + `globals` to devDependencies.

---

## 🟡 Medium Issues

| ID | Issue | File |
|----|-------|------|
| M1 | Tests use inline stubs instead of production imports | All 4 test files |
| M2 | `purgeSession()` uses raw `IDBKeyRange.only()` | `persistenceService.ts` |
| M3 | `saveSnapshot()` TOCTOU race on `saveCount` | `persistenceService.ts` |

---

## 🟢 Positive Findings

- Excellent module architecture with clean separation of concerns
- Full `idb` library usage per LLD Section 13
- Atomic dual-store transactions in `saveSnapshot()`
- Robust snapshot validation in `isValidSnapshot()`
- WCAG-compliant ResumePrompt with proper ARIA attributes
- All 7 `data-testid` attributes match E2E selectors
- `PersistenceError` class with typed error codes
- All 10 test IDs from LLD Section 12 covered

---

## Required Actions

1. Fix `useAutoSave.ts` — read actual scene state from `sceneStore`
2. Revert `package.json` — only add `idb` and `fake-indexeddb`
3. Update test imports — import real production modules (recommended)
4. Address `purgeSession()` `IDBKeyRange` inconsistency (recommended)
5. Re-request review after fixes

---

## Workflow State

- **Current phase:** frontend_review_complete (changes_requested)
- **Completed:** design, frontend_test, frontend_coding, frontend_review
- **Remaining:** frontend_coding_fix, frontend_review_recheck, release

---

*Created by Spectra Framework — frontend-review agent*
