# Handoff: Frontend-Review Agent → Frontend-Coding Agent

**Handoff ID:** 007_frontend_review_complete
**Date:** 2026-04-13
**Status:** changes_requested

## Review Summary

Frontend-review agent completed Gate 8 code review of PR #123 for BUG-88.
Verdict: **REQUEST CHANGES**.

The implementation correctly addresses all 6 root causes (RC-1 through RC-6)
and the hook-based architecture is clean and testable. However, 1 blocking
issue and 8 medium issues were identified.

## Blocking Issues (1)

| # | File | Issue |
|---|------|-------|
| 1 | `Viewport.tsx:36` | `selectedBrickId` hardcoded to `null` — BrickInstances never shows visual selection feedback. Must read from `useSelectionStore`. |

## Medium Issues (8)

| # | File | Issue |
|---|------|-------|
| 2 | `Viewport.tsx:8` | `useCameraControls` imported but never called — dead import |
| 3 | `Viewport.tsx:14` | OrbitControls removed — users cannot rotate/pan/zoom the 3D scene |
| 4 | `useBrickPlacement.ts:55` | `activeTool` in dependency array but not used — no tool-mode guard |
| 5 | `useSelection.ts:5-7` | Unused store subscriptions cause unnecessary re-renders |
| 6 | `uiStore.ts:15` | Breaking rename `useUIStore` → `useUiStore` + `ActiveTool` type widened |
| 7 | `App.tsx:14` | `StatusBar` removed, `data-testid="viewport-container"` removed |
| 8 | `ViewportCanvas.tsx` | WebGL detection and `isValidPosition` safety check removed |
| 9 | `useUndoRedo.ts` | API contract changed, guard removed |

## Nits (2)

| # | File | Issue |
|---|------|-------|
| 10 | `useKeyboardShortcuts.ts:47` | Missing `e.preventDefault()` on Escape |
| 11 | `index.css` | Tailwind directives removed |

## What's Good

- All 6 root causes addressed
- Hook architecture is clean and testable
- Accessibility attributes (aria-pressed, role=toolbar) correct
- Keyboard shortcuts comprehensive with input field guard
- 9 regression tests well-structured

## Required Actions

1. Fix `selectedBrickId={null}` in Viewport.tsx — read from useSelectionStore
2. Restore OrbitControls or call useCameraControls()
3. Remove dead imports in useSelection.ts and Viewport.tsx
4. Add activeTool guard in useBrickPlacement.handlePointerDown
5. Verify existing tests pass (App.test.tsx, ViewportCanvas.test.tsx)
6. Confirm StatusBar removal is intentional or restore it

## Artifacts

| Artifact | Path | Description |
|----------|------|-------------|
| PR Review | PR #123 | 13 inline review comments |

## Workflow State
- **Current phase:** code_review_changes_requested
- **Completed:** design, test_authoring, implementation, code_review (iteration 1)
- **Remaining:** code_review (iteration 2), release
