# Handoff: Design Agent → Gate 6a Design Review

**Handoff ID:** 009_design_fr_edit_001_complete  
**Feature:** FR-EDIT-001  
**Issue:** #13  
**Date:** 2026-04-11  
**Status:** complete

---

## Work Completed

The Design Agent produced the Low-Level Design for FR-EDIT-001 — Implement brick selection by click with visual highlight. The LLD defines the full component architecture, interface contracts, data models, sequence diagrams, selection and highlight algorithms, error handling, security considerations, and performance budget for the brick selection feature.

## Key Findings

- **SelectionManagerInterface** is the authoritative contract for `selectionManager.ts`; it accepts a `Raycaster` and `Scene` and returns the selected `brickId | null`.
- **Imperative highlight strategy** (color multiply on `InstancedMesh.instanceColor`) avoids React re-renders on every selection change — critical for 60 fps performance.
- **Drag-vs-click disambiguation** (`DRAG_THRESHOLD_PX = 4`) is required because OrbitControls and selection share the same R3F canvas.
- **BVH raycast** (from FR-SCENE-003) reduces hit detection from O(N) to O(log N) — must be confirmed as an existing dependency.
- **Two new files** are required: `BrickInstances.tsx` (InstancedMesh renderer + highlight) and `useSelection.ts` (React hook).

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| Low-Level Design | `docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md` | Full LLD: architecture, interfaces, data models, 4 sequence diagrams, algorithms, error handling, security, performance budget, test mapping |
| Handoff JSON | `docs/handoffs/009_design_fr_edit_001_complete.json` | Machine-readable handoff for gate router |
| Handoff Markdown | `docs/handoffs/009_design_fr_edit_001_HANDOFF.md` | This file |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Gate 6a Design Review — approve Draft PR | LLD defines the SelectionManagerInterface and imperative highlight strategy that coding agent must follow | high |
| Confirm FR-SCENE-003 InstancedMesh ownership | BrickInstances.tsx vs scene-level mesh — affects interface contract | medium |
| Confirm three-mesh-bvh is in package.json | Required for BVH raycast; referenced in FR-SCENE-003 notes | medium |
| Confirm PlacedBrick.rotation representation | Integer step (0–3) vs radian — must align with FR-SCENE-002 LLD | low |
| Validate DRAG_THRESHOLD_PX=4 | Sufficient to disambiguate orbit from click on shared canvas | low |

## Context for Next Agent

### Recommended Actions
1. Review Draft PR on branch `feature/13-fr-edit-001-design` — this is Gate 6a (Design Review).
2. Verify LLD at `docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md` is consistent with `docs/TECHNICAL_ARCHITECTURE.md` and `docs/PRD.md`.
3. Confirm FR-SCENE-003 (#9) InstancedMesh ownership — `BrickInstances.tsx` vs scene-level mesh.
4. Confirm `three-mesh-bvh` is in `package.json` before implementation.
5. Resolve open question #6: `PlacedBrick.rotation` as integer step vs radian — must match FR-SCENE-002 LLD.
6. Approve and merge PR to `main` to unblock `frontend-test` and frontend coding agents.
7. On approval, `frontend-test` agent should read the merged LLD from `main` before writing tests for T-BE-EDIT-001-01 through -03 and T-E2E-EDIT-001-01.

### Files to Read
- `docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `frontend/src/engine/selectionManager.ts`
- `frontend/src/stores/selectionStore.ts`
- `frontend/src/components/viewport/Viewport.tsx`

## Workflow State

- **Current phase:** design_complete
- **Completed:** design
- **Remaining:** test, implementation, review, release
