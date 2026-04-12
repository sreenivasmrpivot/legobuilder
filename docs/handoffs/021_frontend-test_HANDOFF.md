# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 021_frontend-test_complete
**Date:** 2026-04-12
**Status:** complete
**Branch:** feature/25-fr-ui-003-frontend-tests
**PR:** (to be opened)

## Work Completed

Wrote a complete TDD test suite (5 files, 42 test cases) for **FR-UI-003: Ghost Brick Placement Preview** (Issue #25). All tests are intentionally **RED** — the implementation modules do not exist yet. Tests follow the existing repo conventions (Vitest + @testing-library/react, vi.mock for Three.js/R3F).

## Key Findings

- **T-FE-UI-003-01** (ghost brick on valid position): 22 test cases across store, hook, component, and integration layers
- **T-FE-UI-003-02** (ghost brick red on invalid position): 20 test cases covering invalid state, transitions, and cleanup
- Existing `placementEngine.ts` needs `isPositionValid()` export — tests mock it via `vi.mock`
- R3F component tests use the same mock pattern as `GroundGrid.test.tsx` and `ViewportCanvas.test.tsx`
- `PointerEventCapture` must call `deactivateGhost()` on unmount (verified in test)

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| ghostBrickStore unit tests | `frontend/tests/unit/ghostBrickStore.test.ts` | 12 tests for Zustand store state machine |
| useGhostBrick hook unit tests | `frontend/tests/unit/useGhostBrick.test.ts` | 9 tests for hook API and store integration |
| GhostBrick component tests | `frontend/tests/component/GhostBrick.test.tsx` | 7 tests for R3F mesh rendering |
| PointerEventCapture component tests | `frontend/tests/component/PointerEventCapture.test.tsx` | 7 tests for pointer event wiring |
| Ghost Brick integration tests | `frontend/tests/unit/ghostBrickIntegration.test.ts` | 9 tests for full state machine flows |
| Handoff JSON | `docs/handoffs/021_frontend-test_complete.json` | Machine-readable handoff |
| Handoff Markdown | `docs/handoffs/021_frontend-test_HANDOFF.md` | This document |

## Human Review Required

*(none — TDD test files require no human gate before coding begins)*

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md` for full design spec
2. Implement `src/stores/ghostBrickStore.ts` — Zustand store with `GhostBrickState` interface, `setGhostBrick()`, `updatePosition()`, `clearGhostBrick()` actions
3. Implement `src/hooks/useGhostBrick.ts` — hook exposing `activateGhost()`, `moveGhost()`, `deactivateGhost()`, `isGhostVisible`, `isGhostValid`; calls `isPositionValid` from `placementEngine`
4. Implement `src/components/viewport/GhostBrick.tsx` — R3F mesh reading `ghostBrickStore`; renders green (valid) or red (invalid) semi-transparent brick
5. Implement `src/components/viewport/PointerEventCapture.tsx` — invisible R3F plane mesh intercepting pointer events; drives `useGhostBrick`; calls `deactivateGhost` on unmount
6. Extend `src/engine/placementEngine.ts` to export `isPositionValid(position, brickTypeId)` if not already present
7. Wire `GhostBrick` and `PointerEventCapture` into `Viewport.tsx` scene graph
8. Run all 42 tests to GREEN: `cd frontend && npx vitest run tests/unit/ghostBrickStore.test.ts tests/unit/useGhostBrick.test.ts tests/unit/ghostBrickIntegration.test.ts tests/component/GhostBrick.test.tsx tests/component/PointerEventCapture.test.tsx`
9. Open PR targeting `main` for `frontend-review`

### Files to Read

- `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md`
- `frontend/tests/unit/ghostBrickStore.test.ts`
- `frontend/tests/unit/useGhostBrick.test.ts`
- `frontend/tests/unit/ghostBrickIntegration.test.ts`
- `frontend/tests/component/GhostBrick.test.tsx`
- `frontend/tests/component/PointerEventCapture.test.tsx`
- `frontend/src/stores/sceneStore.ts`
- `frontend/src/engine/placementEngine.ts`
- `frontend/src/engine/occupancyMap.ts`
- `frontend/src/components/viewport/Viewport.tsx`
- `frontend/src/hooks/useBrickPlacement.ts`

## Workflow State

- **Current phase:** implementation
- **Completed:** entry, research, planning, architecture, design, lld, frontend-test
- **Remaining:** frontend-coding, frontend-review, release
