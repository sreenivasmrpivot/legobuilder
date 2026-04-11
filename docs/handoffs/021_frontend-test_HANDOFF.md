# Handoff: Frontend Test → Frontend Coding

**Handoff ID:** 021_frontend-test_complete
**Date:** 2026-04-11
**Status:** complete
**FR-ID:** FR-EDIT-001
**Issue:** #13
**App ID:** app-legobuilder-20260410
**Branch:** feature/13-fr-edit-001-frontend-tests

---

## Work Completed

The frontend-test agent authored the complete test suite for **FR-EDIT-001 — Brick Selection by Click with Visual Highlight**. All 4 test cases from the LLD test mapping (`docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md` Section 11) are implemented across 3 test files. Draft PR is open on branch `feature/13-fr-edit-001-frontend-tests` awaiting Gate 7 human review.

The tests follow a **contract-first design**: they define the exact interface contracts (function signatures, return shapes, error conditions, Zustand store shape) that the frontend coding agent must implement against. All unit tests use inline stubs that mirror the LLD interface contracts exactly.

---

## Key Findings

- `SelectionManagerInterface` uses DI (`SelectionStoreAccessor`) — unit tests mock the store accessor to verify correct method calls without a real Zustand store
- `selectByRaycast()` must handle 5 error conditions from LLD Section 7.1 (undefined instanceId, missing brickId, null mesh, stale map, instanceColor not initialized)
- `selectionStore` Zustand `subscribe()` pattern is validated — `BrickInstances.tsx` uses selector-based subscribe for imperative highlight updates (0 React re-renders)
- E2E test uses multi-strategy selection detection (data-selected, aria-selected, CSS class, `window.__legoApp.selectionStore`) to be robust against implementation choices
- `DRAG_THRESHOLD_PX=4` disambiguation is not directly testable in unit tests — covered by E2E test via real pointer events on the canvas

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| selectionManager unit tests | `frontend/tests/unit/selectionManager.test.ts` | T-BE-EDIT-001-01 (hit) and T-BE-EDIT-001-02 (miss + error conditions) |
| selectionStore unit tests | `frontend/tests/unit/selectionStore.test.ts` | T-BE-EDIT-001-03: state transitions + Zustand subscribe() validation |
| brickSelection E2E spec | `frontend/tests/e2e/brickSelection.spec.ts` | T-E2E-EDIT-001-01: all 3 acceptance criteria (click → highlight, re-click → swap, empty → clear) |
| Handoff JSON | `docs/handoffs/021_frontend-test_complete.json` | Machine-readable handoff |
| Handoff Markdown | `docs/handoffs/021_frontend-test_HANDOFF.md` | This file |

---

## Test Coverage Map

| Test ID | File | Type | Covers |
|---------|------|------|--------|
| T-BE-EDIT-001-01 | `tests/unit/selectionManager.test.ts` | Unit | selectByRaycast returns correct brickId on hit |
| T-BE-EDIT-001-02 | `tests/unit/selectionManager.test.ts` | Unit | selectByRaycast returns null + clears on miss |
| T-BE-EDIT-001-03 | `tests/unit/selectionStore.test.ts` | Unit | setSelectedBrickId / clearSelection state transitions |
| T-E2E-EDIT-001-01 | `tests/e2e/brickSelection.spec.ts` | E2E | Click brick → highlight; re-click → swap; empty → clear |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Gate 6a: PR #66 (LLD design) is still a Draft | Must be approved and merged before coding agent begins | high |
| Gate 7: This PR (test suite) awaits human review | Tests define the contract; human must approve before coding agent implements | medium |
| Confirm three-mesh-bvh in package.json | Required for BVH raycast in selectionManager.ts | medium |
| Confirm FR-SCENE-003 InstancedMesh ownership | LLD Open Question #1 — affects SelectionManagerInterface contract | medium |

---

## Context for Next Agent

### Recommended Actions

1. Read the LLD at `docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md` (from PR #66 branch `feature/13-fr-edit-001-design` or main after merge)
2. Read all 3 test files on branch `feature/13-fr-edit-001-frontend-tests` to understand the interface contracts
3. Implement `src/engine/selectionManager.ts` — `selectByRaycast(raycaster, instancedMesh, instanceIndexMap)` and `clearSelection()`
4. Implement `src/stores/selectionStore.ts` — Zustand store with `selectedBrickId`, `setSelectedBrickId`, `clearSelection`
5. Create `src/components/viewport/BrickInstances.tsx` — InstancedMesh renderer with imperative highlight subscription (`HIGHLIGHT_FACTOR=1.8`)
6. Create `src/hooks/useSelection.ts` — React hook bridging `selectionStore` to components
7. Modify `src/components/viewport/Viewport.tsx` — add `onPointerDown` handler with `DRAG_THRESHOLD_PX=4` disambiguation
8. Run `vitest` to confirm all unit tests pass before submitting PR
9. **Reuse branch `feature/13-fr-edit-001-frontend-tests`** — do NOT create a new branch

### Files to Read

- `docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md`
- `frontend/tests/unit/selectionManager.test.ts`
- `frontend/tests/unit/selectionStore.test.ts`
- `frontend/tests/e2e/brickSelection.spec.ts`
- `frontend/src/engine/selectionManager.ts`
- `frontend/src/stores/selectionStore.ts`
- `frontend/src/components/viewport/Viewport.tsx`
- `frontend/package.json`

---

## Workflow State

- **Current phase:** frontend_test
- **Completed:** entry, research, planning, architecture, design, frontend_test
- **Remaining:** frontend_coding, review, release

---

*Created by Spectra Framework — frontend-test agent*
*FR-EDIT-001 | Issue #13 | app-legobuilder-20260410*
