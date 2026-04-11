# Handoff: Frontend Review → Frontend Coding (Changes Requested)

**Handoff ID:** 009_frontend_review_complete
**Date:** 2026-04-11
**Status:** changes_requested
**App ID:** app-legobuilder-20260410
**Target Repo:** sreenivasmrpivot/legobuilder

---

## Review Verdict: ⚠️ REQUEST CHANGES

Frontend Review Agent (Gate 8) reviewed PR #77 for **NFR-REL-001 — Auto-Save Crash Durability**.

**Branch:** `feature/18-nfr-rel-001-frontend-tests`
**PR:** #77

---

## 🔴 Blocking Issues (must fix)

### BLOCK-001: useAutoSave passes hardcoded empty data
**File:** `frontend/src/hooks/useAutoSave.ts` (lines 42-46)

The `triggerAutoSave()` call passes `bricks: []`, hardcoded camera state, and placeholder `'Untitled'` metadata. Auto-save will **always save an empty scene** regardless of user work. E2E tests T-BE-REL-001-01 and T-BE-REL-001-02 will fail.

**Fix:** Read actual bricks from `sceneStore` (e.g., `useSceneStore.getState().bricks`) or accept a getter function as a hook parameter.

### BLOCK-002: package.json has unrelated breaking changes
**File:** `frontend/package.json`

Removes `immer`, `three-mesh-bvh`, `@vitest/coverage-v8`. Bumps `zustand` v4→v5 and `vite` v5→v6 (major versions). Removes useful scripts (`lint:fix`, `format`, `type-check`, etc.). Changes package name.

**Fix:** Revert to original `package.json` and only add `idb` (production), `fake-indexeddb` (devDependency), and `globals` (devDependency).

---

## 🟡 Medium Concerns (should fix)

### MED-001: Test files use inline stubs instead of real imports
All 4 test files define their own inline implementations rather than importing production code. Tests provide zero coverage of actual implementation. Now that production code exists, tests should import real modules.

### MED-002: markSessionClosed() is async fire-and-forget in beforeunload
Browser may terminate before IDB write completes. Consider synchronous `localStorage` fallback or `navigator.sendBeacon` pattern.

### MED-003: ResumePrompt lacks focus trap and Escape key handler
Modal lacks keyboard accessibility features for WCAG 2.1 AA. Can be addressed in a follow-up PR.

---

## ✅ Passed Checks

- idb library used (not raw IndexedDB) per LLD Section 13
- Atomic dual-store transaction in saveSnapshot()
- PersistenceError class with typed error codes
- data-testid attributes match E2E selectors
- Accessible modal (role=dialog, aria-modal, aria-labelledby)
- beforeunload listener with cleanup on unmount
- Overlap guard prevents concurrent saves
- fake-indexeddb in devDependencies
- Validation-first crash recovery with auto-purge
- All 10 test IDs from LLD Section 12 covered

---

## Context for Next Agent

### Required Actions

1. Fix `useAutoSave.ts` to read actual scene state from sceneStore
2. Revert `package.json` to original, only add `idb` + `fake-indexeddb` + `globals`
3. Update test files to import real production modules
4. Re-request frontend-review after fixes

### Files to Fix

- `frontend/src/hooks/useAutoSave.ts`
- `frontend/package.json`

---

## Workflow State

- **Current phase:** frontend_review_changes_requested
- **Completed:** design, frontend_test, frontend_coding, frontend_review
- **Remaining:** frontend_coding_fix, frontend_review_recheck, release

---

*Created by Spectra Framework — frontend-review agent*
