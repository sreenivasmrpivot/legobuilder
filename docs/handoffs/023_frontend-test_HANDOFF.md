# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 023_frontend-test_complete
**Date:** 2026-04-11
**Status:** complete

## Work Completed

Wrote the full TDD test suite for FR-UI-003 (Ghost Brick Placement Preview) on branch
`feature/25-fr-ui-003-frontend-tests`. All tests are intentionally RED — the implementation
modules do not yet exist. The frontend-coding agent must implement the four modules below
to make the tests pass.

## Key Findings

- LLD at `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md` is the authoritative design source.
- No existing GhostBrick, PointerEventCapture, ghostBrickStore, or useGhostBrick code exists in the repo.
- Existing test patterns use Vitest + @testing-library/react; all new tests follow the same conventions.
- The `occupancyMap` module (`frontend/src/engine/occupancyMap.ts`) is expected to export `isCellOccupied`.
- Tests cover both T-FE-UI-003-01 (valid placement — green ghost) and T-FE-UI-003-02 (invalid placement — red ghost).

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| ghostBrickStore unit tests | `frontend/tests/unit/ghostBrickStore.test.ts` | Zustand store state management tests (T-FE-UI-003-01, T-FE-UI-003-02) |
| ghostBrickStore integration tests | `frontend/tests/unit/ghostBrickStore.integration.test.ts` | Subscription and reactivity tests |
| useGhostBrick hook tests | `frontend/tests/unit/useGhostBrick.test.ts` | Hook pointer-event-to-store wiring tests |
| GhostBrick component tests | `frontend/tests/component/GhostBrick.test.tsx` | R3F component render tests (valid=green, invalid=red) |
| PointerEventCapture component tests | `frontend/tests/component/PointerEventCapture.test.tsx` | Invisible mesh pointer capture tests |
| Handoff JSON | `docs/handoffs/023_frontend-test_complete.json` | Machine-readable handoff |
| Handoff Markdown | `docs/handoffs/023_frontend-test_HANDOFF.md` | This file |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| None | All tests follow established patterns | — |

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md` for the full design spec.
2. Implement `frontend/src/stores/ghostBrickStore.ts` — Zustand store with `position`, `isValid`, `brickTypeId`, `setGhostBrick`, `clearGhostBrick`.
3. Implement `frontend/src/hooks/useGhostBrick.ts` — hook accepting `{ brickTypeId }`, returning `{ onPointerMove, onPointerLeave }`. Must call `isCellOccupied` from `frontend/src/engine/occupancyMap.ts` and snap pointer world position to integer grid.
4. Implement `frontend/src/components/GhostBrick.tsx` — R3F component reading from `useGhostBrickStore`. Renders `null` when `position` is null. Renders semi-transparent green mesh when `isValid=true`, semi-transparent red mesh when `isValid=false`.
5. Implement `frontend/src/components/PointerEventCapture.tsx` — invisible R3F mesh covering the ground plane, wiring `onPointerMove` and `onPointerLeave` from `useGhostBrick`.
6. Ensure `frontend/src/engine/occupancyMap.ts` exports `isCellOccupied(position: {x,y,z}): boolean`.
7. Run `vitest run frontend/tests/unit/ghostBrickStore.test.ts frontend/tests/unit/useGhostBrick.test.ts frontend/tests/component/GhostBrick.test.tsx frontend/tests/component/PointerEventCapture.test.tsx` — all tests must pass GREEN.
8. Open a PR from `feature/25-fr-ui-003-frontend-coding` targeting `main`.

### Files to Read

- `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md`
- `frontend/tests/unit/ghostBrickStore.test.ts`
- `frontend/tests/unit/ghostBrickStore.integration.test.ts`
- `frontend/tests/unit/useGhostBrick.test.ts`
- `frontend/tests/component/GhostBrick.test.tsx`
- `frontend/tests/component/PointerEventCapture.test.tsx`
- `frontend/src/engine/occupancyMap.ts` (check if isCellOccupied exists)
- `frontend/vitest.config.ts`
- `frontend/package.json`

## Workflow State

- **Current phase:** implementation
- **Completed:** entry, research, planning, architecture, design, frontend-test (FR-UI-003)
- **Remaining:** frontend-coding (FR-UI-003), frontend-review (FR-UI-003), release
