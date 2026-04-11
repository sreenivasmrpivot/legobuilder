# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 020_frontend_test_fr_scene_003_complete
**Date:** 2026-04-11
**Status:** complete
**Issue:** #9 — FR-SCENE-003 BVH-accelerated raycasting
**Branch:** feature/9-fr-scene-003-frontend-tests

---

## Work Completed

Frontend Test agent wrote 5 test files (22 test cases) covering all 8 test IDs
for FR-SCENE-003 — BVH-accelerated raycasting for brick placement and selection.

Tests are written **RED-first** against the `bvhManager` interface defined in
the LLD. They will pass (GREEN) once the coding agent implements the module.

---

## Key Findings

- `bvhManager` module does not yet exist — coding agent must create `frontend/src/engine/bvhManager.ts`
- `placementEngine.getHoverHit` must be added/updated to use `raycastWithBvh`
- `selectionManager.selectBrickAtPointer` and `getSelectedBrickId` must be added/updated
- `three-mesh-bvh` must be added to `frontend/package.json` dependencies
- Performance target: <2ms for 500-brick raycast (T-BE-SCENE-003-01) and ≥5× speedup vs naive (T-BE-SCENE-003-08)

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| bvhManager unit tests | `frontend/tests/unit/bvhManager.test.ts` | Core BVH build/dispose/raycast — T-BE-SCENE-003-01,02,03,04,05,08 |
| placementEngine BVH tests | `frontend/tests/unit/placementEngineBvh.test.ts` | getHoverHit uses BVH — T-BE-SCENE-003-06 |
| selectionManager BVH tests | `frontend/tests/unit/selectionManagerBvh.test.ts` | selectBrickAtPointer uses BVH — T-BE-SCENE-003-07 |
| BVH rebuild lifecycle tests | `frontend/tests/unit/bvhRebuild.test.ts` | BVH rebuilt on brick add/remove — T-BE-SCENE-003-02 |
| API contract tests | `frontend/tests/unit/bvhManager.types.test.ts` | TypeScript surface contract |
| Handoff JSON | `docs/handoffs/020_frontend_test_fr_scene_003_complete.json` | Machine-readable handoff |

---

## Test Coverage Map

| Test ID | File | Description |
|---------|------|-------------|
| T-BE-SCENE-003-01 | bvhManager.test.ts | <2ms for 500-brick raycast |
| T-BE-SCENE-003-02 | bvhManager.test.ts, bvhRebuild.test.ts | BVH rebuild on add/remove |
| T-BE-SCENE-003-03 | bvhManager.test.ts | Correct hit returned for placement |
| T-BE-SCENE-003-04 | bvhManager.test.ts | Correct hit returned for selection |
| T-BE-SCENE-003-05 | bvhManager.test.ts | Graceful fallback when BVH not built |
| T-BE-SCENE-003-06 | placementEngineBvh.test.ts | placementEngine uses BVH |
| T-BE-SCENE-003-07 | selectionManagerBvh.test.ts | selectionManager uses BVH |
| T-BE-SCENE-003-08 | bvhManager.test.ts | ≥5× speedup vs naive |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| bvhManager API surface | Tests import buildBvh, disposeBvh, raycastWithBvh, isBvhBuilt — coding agent must implement exactly this surface | medium |
| three-mesh-bvh version | Confirm version pinning in package.json is compatible with Three.js r160+ | low |

---

## Context for Next Agent

### Recommended Actions

1. Create `frontend/src/engine/bvhManager.ts` implementing `buildBvh`, `disposeBvh`, `raycastWithBvh`, `isBvhBuilt`
2. Update `frontend/src/engine/placementEngine.ts` to export `getHoverHit` using `raycastWithBvh`
3. Update `frontend/src/engine/selectionManager.ts` to export `selectBrickAtPointer` and `getSelectedBrickId` using `raycastWithBvh`
4. Add `three-mesh-bvh` to `frontend/package.json` dependencies
5. Run `vitest` to confirm all 22 test cases pass (RED → GREEN)
6. Ensure BVH is rebuilt in `placementEngine`/`selectionManager` when bricks are added or removed from the scene

### Files to Read

- `docs/features/FR-SCENE-003/LOW_LEVEL_DESIGN.md`
- `frontend/tests/unit/bvhManager.test.ts`
- `frontend/tests/unit/placementEngineBvh.test.ts`
- `frontend/tests/unit/selectionManagerBvh.test.ts`
- `frontend/tests/unit/bvhRebuild.test.ts`
- `frontend/src/engine/placementEngine.ts`
- `frontend/src/engine/selectionManager.ts`

---

## Workflow State

- **Current phase:** frontend_test_complete
- **Completed:** research, design, frontend_test
- **Remaining:** frontend_coding, review, release

---

*Created by Spectra Framework — frontend-test agent*
