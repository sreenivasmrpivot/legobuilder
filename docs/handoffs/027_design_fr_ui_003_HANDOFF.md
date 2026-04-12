# Handoff: Design Agent → Frontend Test Agent

**Handoff ID:** 027_design_fr_ui_003_complete
**FR-ID:** FR-UI-003
**Issue:** #25
**Date:** 2026-04-12
**Status:** complete
**Retrigger:** Design retrigger to unblock stalled pipeline

## Work Completed

The Low-Level Design for FR-UI-003 (Ghost Brick Placement Preview with Valid/Invalid Position Indication) was authored and merged to `main` via PR #53. This retrigger creates fresh handoff artifacts (027) to advance the pipeline to the `frontend-test` agent, which has not yet run for this feature.

## Key Findings

- LLD at `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md` is complete and approved (merged via PR #53)
- Ghost brick: separate Three.js mesh with `opacity: 0.5, transparent: true` material
- Position updated on every `onPointerMove` event via `PointerEventCapture` component
- `ghostBrickStore` (Zustand) holds `position`, `isValid`, `brickTypeId` state
- `useGhostBrick` hook wires pointer events to store; `GhostBrick` component renders the preview mesh
- Ghost mesh uses `raycast: () => null` to avoid interfering with BVH raycasting
- Performance budget: ghost brick position update must complete within one frame (≤16.7ms)

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| Low-Level Design | `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md` | Full LLD: component architecture, data models, sequence diagrams, error handling, security (already on main via PR #53) |
| Handoff JSON | `docs/handoffs/027_design_fr_ui_003_complete.json` | Machine-readable handoff for frontend-test agent |
| Handoff Markdown | `docs/handoffs/027_design_fr_ui_003_HANDOFF.md` | Human-readable handoff summary |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| None | LLD was previously approved at Gate 6a (PR #53) | — |

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md` from `main` branch
2. Create branch `feature/25-fr-ui-003-frontend-tests`
3. Write TDD test suite for **T-FE-UI-003-01**: Ghost brick appears at valid position (green, semi-transparent)
4. Write TDD test suite for **T-FE-UI-003-02**: Ghost brick turns red on invalid/occupied position
5. Test files to create:
   - `frontend/tests/unit/ghostBrickStore.test.ts` — Zustand store state management
   - `frontend/tests/unit/useGhostBrick.test.ts` — Hook pointer-event wiring, grid snapping, occupancy check
   - `frontend/tests/component/GhostBrick.test.tsx` — R3F component: null when hidden, green when valid, red when invalid
   - `frontend/tests/component/PointerEventCapture.test.tsx` — Invisible mesh pointer capture
6. After tests are written (RED phase), hand off to `frontend-coding` agent

### Files to Read

- `docs/features/FR-UI-003/LOW_LEVEL_DESIGN.md`

## Workflow State

- **Current phase:** design (retrigger)
- **Completed:** research, pm, architecture, design
- **Remaining:** frontend-test, frontend-coding, frontend-review, release
