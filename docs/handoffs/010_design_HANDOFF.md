# Handoff: Design Agent → Gate 6a Design Review

**Handoff ID:** 010_design_complete
**Date:** 2026-04-11
**Status:** complete
**Feature:** FR-BRICK-002 — Brick Stacking with Vertical Snap-to-Top-Surface
**Issue:** #10
**Branch:** feature/10-fr-brick-002-design
**Area:** frontend

---

## Work Completed

The Design Agent produced a full Low-Level Design for FR-BRICK-002. The LLD specifies how the `placementEngine` resolves the correct vertical Y-position when a brick is placed on top of an existing brick, using BVH raycast top-face detection. It also upgrades the `occupancyMap` from 2D to 3D stud tracking to support multi-layer stacking.

---

## Key Findings

- **Core formula:** `resolvedY = hitSurfaceY + (newBrickDef.heightInPlates × PLATE_HEIGHT) / 2` — this is the single invariant that all stacking logic derives from.
- **3D occupancy map:** The existing 2D `"x,z"` key must be upgraded to `"x,y,z"` (plate-layer index) to prevent false collision negatives in multi-layer stacks.
- **Top-face guard:** BVH raycast face normal must be checked (`dot(worldNormal, UP) > 0.9`) to prevent placement on side/bottom faces.
- **Ghost brick:** A new `GhostBrick.tsx` component reads `ghostPosition` from `sceneStore` and renders a semi-transparent preview at the resolved Y height in real-time.
- **Hard dependencies:** FR-BRICK-001 (BrickMesh + BVH geometry + constants) and FR-SCENE-003 (Viewport canvas + Baseplate) must be merged before FR-BRICK-002 implementation begins.

---

## Artifacts Produced

| Artifact | Path | Description |
|---|---|---|
| Low-Level Design | `docs/features/FR-BRICK-002/LOW_LEVEL_DESIGN.md` | Full LLD: data models, component architecture, function interfaces, stacking formula, 4 sequence diagrams, error handling, security, performance, test mapping |
| Handoff JSON | `docs/handoffs/010_design_complete.json` | Machine-readable handoff for next agent |
| Handoff Markdown | `docs/handoffs/010_design_HANDOFF.md` | This file |

---

## Human Review Required

| Item | Reason | Severity |
|---|---|---|
| Gate 6a Design Review — approve Draft PR | LLD must be approved before implementation begins | HIGH |
| OQ-1: Confirm STUD_SPACING, PLATE_HEIGHT, BRICK_HEIGHT values | All Y calculations depend on these constants from FR-BRICK-001 | HIGH |
| OQ-2: Confirm BrickMesh userData convention | Raycast filter and hitBrick extraction depend on `userData.isBrick` and `userData.brickInstance` | HIGH |
| OQ-3: Confirm BVH geometry integration status | If not already integrated, FR-BRICK-002 must add BVH setup | HIGH |
| OQ-4: Ghost brick collision behaviour | Red ghost vs disappear on invalid placement — affects GhostBrick material logic | MEDIUM |
| OQ-5: crypto.randomUUID() availability | If unavailable, UUID utility must be added | LOW |

---

## Context for Next Agent

### Recommended Actions

1. Review Draft PR on branch `feature/10-fr-brick-002-design` — this is Gate 6a (Design Review).
2. Verify LLD at `docs/features/FR-BRICK-002/LOW_LEVEL_DESIGN.md` is consistent with `docs/TECHNICAL_ARCHITECTURE.md` and `docs/PRD.md`.
3. Confirm FR-BRICK-001 (Issue #12) and FR-SCENE-003 (Issue #9) are implemented before FR-BRICK-002 implementation begins.
4. Confirm exact `STUD_SPACING`, `PLATE_HEIGHT`, `BRICK_HEIGHT` values from FR-BRICK-001 LLD (OQ-1).
5. Confirm `BrickMesh` `userData` convention from FR-BRICK-001 (OQ-2).
6. Confirm BVH geometry integration status from FR-SCENE-003/FR-BRICK-001 (OQ-3).
7. Confirm ghost brick collision behaviour — red vs disappear (OQ-4).
8. Approve and merge Draft PR to main to unblock `frontend-test` and `frontend` coding agents.
9. On approval, `frontend-test` agent should read the merged LLD from `main` before writing tests.

### Files to Read

- `docs/features/FR-BRICK-002/LOW_LEVEL_DESIGN.md`
- `docs/features/FR-BRICK-001/LOW_LEVEL_DESIGN.md`
- `frontend/src/engine/occupancyMap.ts`
- `frontend/src/engine/placementEngine.ts`
- `frontend/src/engine/brickCatalog.ts`
- `frontend/src/types/brick.ts`
- `frontend/src/stores/sceneStore.ts`
- `frontend/src/hooks/useBrickPlacement.ts`

---

## Workflow State

- **Current phase:** design_complete
- **Completed:** design
- **Remaining:** gate-6a-design-review, frontend-test, frontend-coding, review, release
