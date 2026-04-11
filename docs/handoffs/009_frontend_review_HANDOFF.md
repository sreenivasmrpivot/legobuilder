# Handoff: Frontend Review → Frontend Coding (Fix Cycle)

**Handoff ID:** 009_frontend_review_complete
**Date:** 2026-04-11
**Status:** changes_requested
**App ID:** app-legobuilder-20260410
**Target Repo:** sreenivasmrpivot/legobuilder

---

## Review Verdict: 🔴 CHANGES REQUESTED

Frontend review of PR #77 (NFR-REL-001 Auto-Save Crash Durability) found **1 high-severity blocking issue**, 2 medium issues, and 5 low suggestions.

**Branch:** `feature/18-nfr-rel-001-frontend-tests`
**PR:** #77

---

## Blocking Issues

### H1: `useAutoSave.ts` — Hardcoded empty data (HIGH)

**File:** `frontend/src/hooks/useAutoSave.ts` lines 40-47

The hook passes `bricks: []`, hardcoded camera state, and placeholder metadata to every `triggerAutoSave()` call. It never reads from sceneStore. Every auto-save persists an empty scene, defeating the entire feature.

**Fix:** Read actual scene state from `sceneStore` using `useSceneStore` selectors.

---

## Medium Issues

### M1: Tests use inline implementations (MEDIUM)

`ResumePrompt.test.tsx` and `useAutoSave.test.ts` define their own inline implementations instead of importing real source. Tests validate contract but not shipped code.

**Fix:** Update imports to use real implementations.

### M2: Silent error swallowing in persistenceService.ts (MEDIUM)

Empty `catch {}` block at line 74 silently resets `saveCount` to 1 on any error.

**Fix:** Add `console.warn` with error details.

---

## Low Suggestions

| ID | File | Issue |
|----|------|-------|
| L1 | dbSchema.ts | Add `closeDB()` for HMR cleanup |
| L2 | useAutoSave.ts | `markSessionClosed` async in sync `beforeunload` |
| L3 | persistenceStore.ts | Empty catch blocks need `console.warn` |
| L4 | ResumePrompt.tsx | No focus trap in modal |
| L5 | package.json | Scope creep: breaking version bumps, removed deps |

---

## Passing Checks

- ✅ idb library used (not raw IndexedDB)
- ✅ Atomic dual-store transaction in saveSnapshot()
- ✅ PersistenceError class with error codes
- ✅ data-testid attributes match E2E selectors
- ✅ Accessible modal (role, aria-modal, aria-labelledby)
- ✅ beforeunload listener with cleanup
- ✅ Overlap guard prevents concurrent saves
- ✅ fake-indexeddb in devDependencies
- ✅ All 10 test IDs from LLD Section 12 covered

---

## Required Actions

1. **[H1]** Fix `useAutoSave.ts` to read actual scene state from sceneStore
2. **[M1]** Update test imports to use real implementations
3. **[M2]** Add error logging to silent catch in `persistenceService.ts`
4. **[L5]** Clarify whether package.json scope changes are intentional

---

## Workflow State

- **Current phase:** frontend_review_complete (changes requested)
- **Completed:** design, frontend_test, frontend_coding, frontend_review
- **Remaining:** frontend_coding_fix, frontend_review_recheck, release

---

*Created by Spectra Framework — frontend-review agent*
