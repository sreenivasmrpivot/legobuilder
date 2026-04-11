# Handoff: Frontend-Test → Frontend-Coding

**Handoff ID:** 020_frontend_test_nfr_rel_001_complete
**Date:** 2026-04-11
**Status:** complete
**App ID:** app-legobuilder-20260410
**Issue:** [#35 — NFR-REL-001](https://github.com/sreenivasmrpivot/legobuilder/issues/35)
**Branch:** `feature/35-nfr-rel-001-tests`
**PR:** [#75](https://github.com/sreenivasmrpivot/legobuilder/pull/75)

---

## Work Completed

Frontend-test agent authored all **10 test cases** for NFR-REL-001 (Auto-Save Crash Durability) as specified in LLD Section 12. Tests are written against the LLD interface contracts and are intentionally **RED (failing)** until the coding agent implements the production code.

Test coverage:
- **2 E2E Playwright tests** (+ 1 discard path variant) — crash recovery (50 bricks survive SIGKILL), graceful close recovery, discard path
- **8 unit tests** — persistenceService (atomic transaction, closeSession, quota exceeded), crashRecoveryService (detectCrash null/candidate, corrupted data), ResumePrompt component (render, a11y, callbacks), useAutoSave hook (interval, beforeunload, cleanup, overlap guard)

Also scaffolded:
- `frontend/src/services/dbSchema.ts` — TypeScript interfaces for all IDB data shapes (single source of truth)
- `frontend/src/services/crashRecoveryService.ts` — Interface + NOT-YET-IMPLEMENTED stub for coding agent

---

## Key Findings

- LLD Section 7 (Transaction Atomicity Contract) is the critical implementation rule — both `scene-snapshots` and `auto-save-meta` must be written in a single `readwrite` transaction
- E2E tests use `browser.close({ runBeforeUnload: false })` to simulate a crash (skips `beforeunload`)
- All E2E selectors use `data-testid` attributes — coding agent must add these to production components
- `fake-indexeddb/auto` is used for unit tests — must be added to `devDependencies` if not already present
- `@testing-library/user-event` is required for ResumePrompt tests

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| E2E Crash Recovery Tests | `frontend/tests/e2e/crashRecovery.spec.ts` | T-BE-REL-001-01, T-BE-REL-001-02, T-BE-REL-001-01b |
| persistenceService Unit Tests | `frontend/src/services/persistenceService.test.ts` | T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07 |
| crashRecoveryService Unit Tests | `frontend/src/services/crashRecoveryService.test.ts` | T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08 |
| ResumePrompt Component Tests | `frontend/src/components/ResumePrompt/ResumePrompt.test.tsx` | T-UNIT-REL-001-05 |
| useAutoSave Hook Tests | `frontend/src/hooks/useAutoSave.test.ts` | T-UNIT-REL-001-06 |
| IndexedDB Schema Types | `frontend/src/services/dbSchema.ts` | Type-only scaffold |
| crashRecoveryService Stub | `frontend/src/services/crashRecoveryService.ts` | Interface + stub |
| Handoff JSON | `docs/handoffs/020_frontend_test_nfr_rel_001_complete.json` | Machine-readable handoff |
| Handoff Markdown | `docs/handoffs/020_frontend_test_nfr_rel_001_HANDOFF.md` | Human-readable handoff |
| Test PR | https://github.com/sreenivasmrpivot/legobuilder/pull/75 | Gate 7 review |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Gate 7 Test Review — PR #75 | Tests define the acceptance contract for NFR-REL-001; must be approved before coding begins | high |
| Design PR #48 must merge first | Coding agent needs the merged LLD on main | high |
| E2E data-testid selectors | Coding agent must add `data-testid` to production components | medium |
| E2E crash simulation approach | Verify `browser.close({ runBeforeUnload: false })` works in CI headless Chromium | medium |
| T-BE-REL-001-02 graceful close assumption | If product decides no prompt after graceful close, update this test | low |

---

## Context for Next Agent

### Recommended Actions

1. Read the LLD at `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md` (merge PR #48 first)
2. Implement `frontend/src/services/dbSchema.ts` (already scaffolded — verify types match LLD Section 3.1)
3. Implement `frontend/src/services/persistenceService.ts` — full idb-based implementation per LLD Sections 4.2 and 7
4. Implement `frontend/src/services/crashRecoveryService.ts` — replace NOT-YET-IMPLEMENTED stub per LLD Section 4.3
5. Implement `frontend/src/stores/persistenceStore.ts` — Zustand store per LLD Section 3.2
6. Implement `frontend/src/hooks/useAutoSave.ts` — per LLD Section 4.4
7. Implement `frontend/src/hooks/useRecoveryCheck.ts` — boot-time recovery check hook
8. Implement `frontend/src/components/ResumePrompt/ResumePrompt.tsx` — per LLD Section 4.5 with all `data-testid` attributes
9. Add `data-testid` attributes: `scene-canvas`, `brick-palette-item`, `scene-brick`, `resume-prompt`, `resume-prompt-brick-count`, `resume-prompt-resume-btn`, `resume-prompt-discard-btn`, `auto-save-indicator`
10. Run all tests: `npx vitest run` (unit) and `npx playwright test frontend/tests/e2e/crashRecovery.spec.ts` (E2E) — all 10 tests must pass GREEN

### Files to Read

- `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md`
- `frontend/tests/e2e/crashRecovery.spec.ts`
- `frontend/src/services/persistenceService.test.ts`
- `frontend/src/services/crashRecoveryService.test.ts`
- `frontend/src/components/ResumePrompt/ResumePrompt.test.tsx`
- `frontend/src/hooks/useAutoSave.test.ts`
- `frontend/src/services/dbSchema.ts`
- `frontend/src/services/crashRecoveryService.ts`

---

## Workflow State

- **Current phase:** test_authoring_complete
- **Completed:** research, pm, architecture, design, frontend_test
- **Remaining:** frontend_coding, review, release

---

*Created by Spectra Framework — frontend-test agent*
*NFR-REL-001 | Issue #35 | app-legobuilder-20260410*
