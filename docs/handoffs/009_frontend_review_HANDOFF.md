# Handoff: Frontend Review → Frontend Coding (Fix Cycle)

**Handoff ID:** 009_frontend_review_complete
**Date:** 2026-04-11
**Status:** changes_requested
**App ID:** app-legobuilder-20260410
**Target Repo:** sreenivasmrpivot/legobuilder

---

## Review Verdict: 🔴 CHANGES REQUESTED

Authoritative Gate 8 frontend review of PR #77 (NFR-REL-001 Auto-Save Crash Durability) found **2 blocking issues**, 3 medium issues, and 5 low suggestions.

**Branch:** `feature/18-nfr-rel-001-frontend-tests`
**PR:** #77

---

## Blocking Issues

### B1: `useAutoSave.ts` — Hardcoded empty data (HIGH — Feature is a no-op)

**File:** `frontend/src/hooks/useAutoSave.ts` lines 42-46

The hook passes `bricks: []`, hardcoded camera state, and placeholder metadata to every `triggerAutoSave()` call. It never reads from sceneStore. Every auto-save persists an empty scene, defeating the entire feature.

**Impact:** E2E tests T-BE-REL-001-01 and T-BE-REL-001-02 will fail.

**Fix:** Read actual scene state from `sceneStore` using `useSceneStore.getState()` inside the interval callback.

### B2: `package.json` — Unscoped breaking changes (HIGH)

**File:** `frontend/package.json`

Changes beyond NFR-REL-001 scope:
- Package name changed: `legobuilder` → `legobuilder-frontend`
- Removed: `immer`, `three-mesh-bvh`, `@vitest/coverage-v8`
- Major bumps: `zustand` v4→v5, `vite` v5→v6
- Removed scripts: `lint:fix`, `format`, `format:check`, `type-check`, `test:e2e:ui`

**Fix:** Revert to base, only add `idb`, `fake-indexeddb`, `globals`.

---

## Medium Issues

### M1: Tests use inline implementations (MEDIUM)

All 4 test files (`ResumePrompt.test.tsx`, `useAutoSave.test.ts`, `crashRecoveryService.test.ts`, `persistenceService.test.ts`) define their own inline implementations instead of importing real source. Tests validate contract but not shipped code.

**Fix:** Update imports to use real implementations.

### M2: Silent error swallowing in persistenceService.ts (MEDIUM)

Empty `catch {}` block at line 80 silently resets `saveCount` to 1 on any error.

**Fix:** Add `console.warn` with error details.

### M3: Multiple empty catch blocks in persistenceStore.ts (MEDIUM)

Lines 100, 110, 122, 133 all silently swallow errors.

**Fix:** Add `console.warn` with error details.

---

## Low Suggestions

| ID | File | Issue |
|----|------|-------|
| L1 | dbSchema.ts | Add `closeDB()` for HMR cleanup |
| L2 | useAutoSave.ts | `markSessionClosed` async in sync `beforeunload` — consider localStorage fallback |
| L3 | ResumePrompt.tsx | No focus trap in modal — track as separate WCAG issue |
| L4 | persistenceService.ts | `purgeSession()` uses raw `IDBKeyRange.only()` — inconsistent with idb wrapper |
| L5 | persistenceService.ts | `existingMeta` read outside atomic transaction (TOCTOU on saveCount) |

---

## Passing Checks

- ✅ idb library used (not raw IndexedDB) per LLD Section 13
- ✅ Atomic dual-store transaction in saveSnapshot()
- ✅ PersistenceError class with typed error codes
- ✅ isValidSnapshot() validates bricks + schemaVersion
- ✅ data-testid attributes match E2E selectors
- ✅ Accessible modal (role, aria-modal, aria-labelledby)
- ✅ beforeunload listener with cleanup
- ✅ Overlap guard prevents concurrent saves
- ✅ fake-indexeddb in devDependencies
- ✅ All 10 test IDs from LLD Section 12 covered
- ✅ Clean module layering across 6 modules
- ✅ Singleton DB pattern with resetDBPromise()

---

## Required Actions

1. **[B1]** Fix `useAutoSave.ts` to read actual scene state from sceneStore
2. **[B2]** Revert `package.json` to base, only add idb/fake-indexeddb/globals
3. **[M1]** Update test imports to use real implementations
4. **[M2]** Add error logging to silent catch in `persistenceService.ts`
5. **[M3]** Add error logging to empty catch blocks in `persistenceStore.ts`

---

## Workflow State

- **Current phase:** frontend_review_complete (changes requested)
- **Completed:** design, frontend_test, frontend_coding, frontend_review
- **Remaining:** frontend_coding_fix, frontend_review_recheck, release

---

*Created by Spectra Framework — frontend-review agent*
