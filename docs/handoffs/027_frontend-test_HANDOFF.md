# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 027_frontend-test_complete
**Date:** 2026-04-12
**Status:** complete
**Issue:** #33 — NFR-A11Y-001
**FR-ID:** NFR-A11Y-001
**Branch:** `feature/33-nfr-a11y-001-frontend-tests`
**PR:** #114

---

## Work Completed

Authored a complete TDD test suite (4 files, 63 test cases) for **NFR-A11Y-001: Keyboard Navigation for Toolbar & BrickPalette** (Issue #33). All tests are intentionally **RED** — the implementation modules do not exist yet. Tests follow the existing repo conventions (Vitest + @testing-library/react + jest-axe).

## Key Findings

- **T-A11Y-A11Y-001-01**: 8 tests verify all 7 toolbar buttons are reachable via Tab in DOM order using `userEvent.tab()`
- **T-A11Y-A11Y-001-02**: 20 hook tests + 15 component tests verify arrow key navigation in BrickPalette via `useRovingTabIndex` hook
- **T-A11Y-A11Y-001-03**: 8 tests verify Enter/Space key activates focused toolbar buttons and BrickPalette options
- **T-A11Y-A11Y-001-04**: 5 `jest-axe` tests verify zero WCAG 2.1 AA violations on Toolbar and BrickPalette
- `src/utils/a11y.ts` utility module tested: `KEYBOARD_KEYS` constants, `isNavigationKey()`, `getListboxItemProps()`

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| useRovingTabIndex hook tests | `frontend/tests/unit/useRovingTabIndex.test.ts` | 20 unit tests for roving tabIndex hook — T-A11Y-A11Y-001-02 |
| Toolbar a11y component tests | `frontend/tests/component/Toolbar.a11y.test.tsx` | 18 tests — T-A11Y-A11Y-001-01, -03, -04 |
| BrickPalette a11y component tests | `frontend/tests/component/BrickPalette.a11y.test.tsx` | 20 tests — T-A11Y-A11Y-001-02, -03, -04 |
| a11y utility helpers tests | `frontend/tests/unit/a11yHelpers.test.ts` | 20 unit tests for src/utils/a11y.ts |
| Handoff JSON | `docs/handoffs/027_frontend-test_complete.json` | Machine-readable handoff |
| Handoff Markdown | `docs/handoffs/027_frontend-test_HANDOFF.md` | This document |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Gate 7: PR #114 (test suite) | Tests define the acceptance contract; human must verify coverage before coding begins | medium |
| jest-axe + @axe-core/react in package.json | Frontend-coding must add these devDependencies before tests can run | medium |

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/NFR-A11Y-001/LOW_LEVEL_DESIGN.md` for the full implementation spec
2. Implement `src/hooks/useRovingTabIndex.ts` — roving tabIndex hook per LLD Section 2.2
3. Implement `src/utils/a11y.ts` — `KEYBOARD_KEYS` constants, `isNavigationKey()`, `getListboxItemProps()`
4. Update `src/components/ui/Toolbar.tsx` — add `role="toolbar"`, `aria-label` on container and all 7 buttons, `type="button"`
5. Update `src/components/ui/BrickPalette.tsx` — add `role="listbox"`, `aria-orientation="vertical"`, `role="option"` on items, roving tabIndex, `onKeyDown` handler
6. Update `src/components/App.tsx` — mount `@axe-core/react` in development mode (dynamic import guard)
7. Add `jest-axe` and `@axe-core/react` to `devDependencies` in `frontend/package.json`
8. Run all 63 tests to GREEN: `cd frontend && npx vitest run tests/unit/useRovingTabIndex.test.ts tests/unit/a11yHelpers.test.ts tests/component/Toolbar.a11y.test.tsx tests/component/BrickPalette.a11y.test.tsx`
9. **Reuse branch `feature/33-nfr-a11y-001-frontend-tests`** — do NOT create a new branch

### Files to Read

- `docs/features/NFR-A11Y-001/LOW_LEVEL_DESIGN.md`
- `frontend/tests/unit/useRovingTabIndex.test.ts`
- `frontend/tests/unit/a11yHelpers.test.ts`
- `frontend/tests/component/Toolbar.a11y.test.tsx`
- `frontend/tests/component/BrickPalette.a11y.test.tsx`
- `frontend/src/components/ui/Toolbar.tsx`
- `frontend/src/components/ui/BrickPalette.tsx`
- `frontend/src/components/App.tsx`
- `frontend/package.json`

## Workflow State

- **Current phase:** frontend_test
- **Completed:** entry, research, planning, architecture, design, frontend_test
- **Remaining:** frontend_coding, frontend_review, release

---

*Created by Spectra Framework — frontend-test agent*
*NFR-A11Y-001 | Issue #33 | app-legobuilder-bugfix-20260412-gold*
