# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 028_frontend-test_fr_ui_003_complete
**Date:** 2026-04-12
**Status:** complete
**FR:** FR-UI-003 — Ghost Brick Placement Preview with Valid/Invalid Position Indication
**Issue:** #25

## Work Completed

Authored 8 contract-first test cases for FR-UI-003 across 3 test files. Tests define the interface contracts for `ghostBrickStore`, `useGhostBrick` hook, and `GhostBrick` component that the frontend-coding agent must implement. All tests are written as red (failing) stubs — they will pass once the coding agent implements the production modules.

## Key Findings

- `ghostBrickStore` must expose `setGhostBrick(position, isValid, brickTypeId)` and `clearGhostBrick()` following the Zustand pattern used by `sceneStore` and `selectionStore`
- `useGhostBrick` hook must snap pointer hit to grid (`gridSize=1.6`), check `occupancyMap.isOccupied()`, and call store — must be a no-op when no brick type is selected
- `GhostBrick` component must use `opacity: 0.5, transparent: true`; active brick color for valid positions, `#FF0000` for invalid positions
- Ghost mesh **MUST** set `raycast: () => null` to exclude from BVH hit-testing (LLD requirement)
- `onPointerLeave` must call `clearGhostBrick()` to hide ghost when cursor exits the placement surface

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| ghostBrickStore unit tests | `frontend/tests/unit/ghostBrickStore.test.ts` | T-FE-UI-003-01, T-FE-UI-003-03: store state machine |
| useGhostBrick hook unit tests | `frontend/tests/unit/useGhostBrick.test.ts` | T-FE-UI-003-02, T-FE-UI-003-07, T-FE-UI-003-08: hook logic |
| GhostBrick component tests | `frontend/tests/component/GhostBrick.test.tsx` | T-FE-UI-003-04, T-FE-UI-003-05, T-FE-UI-003-06: material/visibility |
| Handoff JSON | `docs/handoffs/028_frontend-test_fr_ui_003_complete.json` | Machine-readable handoff |
| Handoff Markdown | `docs/handoffs/028_frontend-test_fr_ui_003_HANDOFF.md` | This file |

## Human Review Required

_None — test-only PR, no production code modified._

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md` for the full architecture
2. Implement `src/stores/ghostBrickStore.ts` — Zustand store with `position: Vector3|null`, `isValid: boolean`, `brickTypeId: string|null`, `setGhostBrick()`, `clearGhostBrick()`
3. Implement `src/hooks/useGhostBrick.ts` — wires R3F `onPointerMove`/`onPointerLeave` events to `ghostBrickStore`; snaps to grid (`gridSize=1.6`); calls `placementEngine.validatePlacement()` for occupancy check
4. Implement `src/components/viewport/GhostBrick.tsx` — Three.js mesh with `MeshStandardMaterial(opacity=0.5, transparent=true)`; active color for valid, `#FF0000` for invalid; `raycast: () => null`
5. Implement `src/components/viewport/PointerEventCapture.tsx` — invisible R3F mesh covering ground plane that captures `onPointerMove`/`onPointerLeave` and wires to `useGhostBrick`
6. Mount `GhostBrick` and `PointerEventCapture` inside `Viewport.tsx` scene graph
7. Run `npm run test` in `frontend/` to confirm all 8 test cases pass

### Files to Read

- `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md`
- `docs/handoffs/027_design_fr_ui_003_HANDOFF.md`
- `frontend/tests/unit/ghostBrickStore.test.ts`
- `frontend/tests/unit/useGhostBrick.test.ts`
- `frontend/tests/component/GhostBrick.test.tsx`
- `frontend/src/stores/sceneStore.ts`
- `frontend/src/stores/selectionStore.ts`
- `frontend/src/engine/occupancyMap.ts`
- `frontend/src/engine/placementEngine.ts`
- `frontend/src/components/viewport/Viewport.tsx`

## Workflow State

- **Current phase:** implementation
- **Completed:** entry, research, planning, architecture, design
- **Remaining:** implementation (coding), review, release
