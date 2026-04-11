# Handoff: Frontend Test Agent → Frontend Coding Agent

**Handoff ID:** 020_frontend-test_fr_scene_001_complete
**Date:** 2026-04-11
**Status:** complete
**Issue:** #8 — FR-SCENE-001: Render 3D scene with Three.js and visible ground grid plane
**App ID:** app-legobuilder-20260410

---

## Work Completed

Authored the complete frontend test suite for **FR-SCENE-001** (Render 3D scene with Three.js and visible ground grid plane). The test suite covers all 3 test cases from Issue #8 (T-BE-SCENE-001-01, T-BE-SCENE-001-02, T-E2E-SCENE-001-01) plus 8 additional design-derived test cases, totalling **11 test cases** across **5 test files**.

All tests are **contract-first** — they define the interface the coding agent must implement against. Tests will fail (red) until the coding agent implements the production code.

---

## Key Findings

- LLD at `docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md` (PR #40) specifies `SceneViewport` + `GroundGrid` components with `cameraStore` and `sceneStore`
- The scaffolded `frontend/src/components/viewport/` directory already has `Viewport.tsx`, `GridOverlay.tsx`, and `Baseplate.tsx` — the coding agent should align these with the LLD's `SceneViewport.tsx` and `GroundGrid.tsx` naming
- Unit tests use Vitest with jsdom; component tests mock `@react-three/fiber` Canvas
- E2E test uses Playwright RAF-based FPS sampler with 60-frame warmup discard
- FPS threshold is configurable via `PLAYWRIGHT_FPS_THRESHOLD` env var for CI (default 30 for SwiftShader)

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| sceneStore unit tests | `frontend/tests/unit/sceneStore.test.ts` | T-UNIT-SCENE-001-01/02/03: default state, setGridVisible, setBackgroundColor |
| cameraStore unit tests | `frontend/tests/unit/cameraStore.test.ts` | T-UNIT-SCENE-001-04/05: isometric defaults [20,20,20], resetCamera |
| ViewportCanvas component tests | `frontend/tests/component/ViewportCanvas.test.tsx` | T-COMP-SCENE-001-01/02/03: canvas renders, error boundary, camera props |
| GroundGrid component tests | `frontend/tests/component/GroundGrid.test.tsx` | T-COMP-SCENE-001-04/05: GridHelper size=32, hidden when gridVisible=false |
| E2E Playwright test | `frontend/tests/e2e/scene001.spec.ts` | T-E2E-SCENE-001-01: full scene renders with grid at ≥60 FPS |
| Frontend test PR | https://github.com/sreenivasmrpivot/legobuilder/pull/72 | Draft PR for Gate 7 review |

---

## Test Coverage Map

| Test ID | File | Type | Covers |
|---------|------|------|--------|
| T-BE-SCENE-001-01 (mapped as T-COMP-SCENE-001-04) | `tests/component/GroundGrid.test.tsx` | Component | GridHelper size=32, divisions=32 |
| T-BE-SCENE-001-02 (mapped as T-UNIT-SCENE-001-04) | `tests/unit/cameraStore.test.ts` | Unit | cameraStore defaults [20,20,20], fov=50 |
| T-E2E-SCENE-001-01 | `tests/e2e/scene001.spec.ts` | E2E | Full scene renders at ≥60 FPS |
| T-UNIT-SCENE-001-01 | `tests/unit/sceneStore.test.ts` | Unit | sceneStore default state |
| T-UNIT-SCENE-001-02 | `tests/unit/sceneStore.test.ts` | Unit | setGridVisible action |
| T-UNIT-SCENE-001-03 | `tests/unit/sceneStore.test.ts` | Unit | setBackgroundColor action |
| T-UNIT-SCENE-001-05 | `tests/unit/cameraStore.test.ts` | Unit | resetCamera restores defaults |
| T-COMP-SCENE-001-01 | `tests/component/ViewportCanvas.test.tsx` | Component | Canvas element renders |
| T-COMP-SCENE-001-02 | `tests/component/ViewportCanvas.test.tsx` | Component | Error boundary catches WebGL failure |
| T-COMP-SCENE-001-03 | `tests/component/ViewportCanvas.test.tsx` | Component | Camera props passed to Canvas |
| T-COMP-SCENE-001-05 | `tests/component/GroundGrid.test.tsx` | Component | Grid hidden when gridVisible=false |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Design PR #40 (FR-SCENE-001 LLD) is still a Draft | Must be approved and merged before coding agent implements | high |
| FPS threshold in E2E test defaults to 30 FPS for CI | CI runners use SwiftShader software rendering; confirm if 60 FPS should be enforced in CI | medium |

---

## Context for Next Agent

### Recommended Actions

1. Read the approved LLD at `docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md` before implementing
2. Implement `SceneViewport.tsx`, `GroundGrid.tsx`, `SceneErrorBoundary.tsx` per LLD Section 2
3. Implement `cameraStore.ts` and `sceneStore.ts` per LLD Sections 3–4
4. Implement `SceneErrors.ts` (`SceneInitError` class) per LLD Section 3.3
5. Run `vitest` to verify all unit and component tests pass
6. Run `playwright` to verify `T-E2E-SCENE-001-01` passes
7. Reuse branch `feature/8-fr-scene-001-frontend-tests` (do not create a new branch)

### Files to Read

- `docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md`
- `frontend/tests/unit/sceneStore.test.ts`
- `frontend/tests/unit/cameraStore.test.ts`
- `frontend/tests/component/ViewportCanvas.test.tsx`
- `frontend/tests/component/GroundGrid.test.tsx`
- `frontend/tests/e2e/scene001.spec.ts`
- `frontend/src/stores/sceneStore.ts`
- `frontend/src/stores/cameraStore.ts`
- `frontend/src/components/viewport/Viewport.tsx`

---

## Workflow State

- **Current phase:** implementation
- **Completed:** entry, research, architecture, planning, design, frontend-test
- **Remaining:** frontend-coding, review, evaluation, release

---

*Created by Spectra Framework — frontend-test agent*
*FR-SCENE-001 | Issue #8 | app-legobuilder-20260410*
