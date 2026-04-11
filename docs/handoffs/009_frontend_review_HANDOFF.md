# Handoff: Frontend Review → Frontend Coding (Fix Cycle)

**Handoff ID:** 009_frontend_review_complete
**Date:** 2026-04-11
**Status:** changes_requested
**App ID:** app-legobuilder-20260410
**Target Repo:** sreenivasmrpivot/legobuilder

---

## Review Verdict: ❌ CHANGES REQUESTED

Frontend Review Agent completed Gate 8 review of PR #77 for **NFR-REL-001 — Auto-Save Crash Durability**.

**Branch:** `feature/18-nfr-rel-001-frontend-tests`
**PR:** #77

---

## 🔴 Blocking Issues (Must Fix)

### BLOCK-001: useAutoSave.ts — Hardcoded placeholder data
- **File:** `frontend/src/hooks/useAutoSave.ts` (lines 41-46)
- **Problem:** Auto-save interval passes `[]` for bricks, hardcoded camera state `{ position: [0, 10, 20], target: [0, 0, 0], zoom: 1 }`, and hardcoded metadata. This means auto-save never persists actual scene data in production.
- **Fix:** Read bricks, camera state, and scene metadata from `sceneStore` (or accept as hook parameters).

### BLOCK-002: package.json — Out-of-scope dependency changes
- **File:** `frontend/package.json`
- **Problem:** Multiple unrelated changes:
  - Package name changed: `legobuilder` → `legobuilder-frontend`
  - Removed: `immer`, `three-mesh-bvh`, `@vitest/coverage-v8`
  - Major bumps: `zustand` 4→5, `vite` 5→6
  - Removed scripts: `lint:fix`, `format`, `format:check`, `type-check`, `test:e2e:ui`
- **Fix:** Revert to original `package.json` and only add `idb` to dependencies and `fake-indexeddb` to devDependencies.

---

## ⚠️ Non-Blocking Issues (Recommended)

| ID | File | Issue |
|----|------|-------|
| NB-001 | `dbSchema.ts` | No `closeDB()` function for connection cleanup |
| NB-002 | `persistenceService.ts` | Empty catch block swallows errors silently |
| NB-003 | `persistenceService.ts` | `closeSession()` silently no-ops if session missing |
| NB-004 | `persistenceService.ts` | Cursor-based deletion could be optimized |
| NB-005 | `persistenceStore.ts` | Redundant overlap guard (also in useAutoSave) |
| NB-006 | `ResumePrompt.tsx` | Missing focus trap and Escape key for WCAG |

---

## ⚠️ Should-Fix Issues

| ID | File | Issue |
|----|------|-------|
| SF-001 | `ResumePrompt.test.tsx` | Tests use inline component copy instead of importing actual implementation |

---

## ✅ Positive Findings

- Atomic dual-store transaction pattern correctly implemented
- Validation-first crash recovery with schema version checking
- Quota exceeded handling with purge-and-retry
- PersistenceError class with typed error codes
- Accessible modal with correct ARIA attributes
- All 10 test IDs from LLD Section 12 satisfied
- All data-testid attributes match E2E selectors
- idb library used per LLD Section 13
- Clean code organization with JSDoc and Spectra traceability headers

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Gate 8 human review | Confirm blocking issues assessment | high |
| package.json revert scope | Verify which changes are intentional vs accidental | high |
| Accessibility follow-up | Decide if focus trap should be tracked as separate issue | medium |

---

## Context for Next Agent

### Recommended Actions

1. Fix BLOCK-001: Update `useAutoSave.ts` to read scene data from `sceneStore`
2. Fix BLOCK-002: Revert `package.json` to original, only add `idb` + `fake-indexeddb`
3. Consider SF-001: Update `ResumePrompt.test.tsx` to import actual component
4. Re-submit for review after fixes

### Files to Modify

- `frontend/src/hooks/useAutoSave.ts`
- `frontend/package.json`
- `frontend/tests/component/ResumePrompt.test.tsx`

---

## Workflow State

- **Current phase:** frontend_review_changes_requested
- **Completed:** design, frontend_test, frontend_coding, frontend_review
- **Remaining:** frontend_coding_fix, frontend_review_re, release

---

*Created by Spectra Framework — frontend-review agent*
