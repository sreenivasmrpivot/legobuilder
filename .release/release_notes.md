# Release v1.0.1

**Date:** 2026-04-13  
**Type:** Patch (Bug Fix)  
**Risk Level:** Medium  
**Previous Version:** v1.0.0  
**Closes:** Issue #88

---

## Summary

LegoBuilder v1.0.1 is a critical patch release that restores full interactivity to the application. In v1.0.0, the 3D canvas, toolbar, brick palette, and keyboard shortcuts all rendered visually but were completely non-functional — no clicks, drags, or keyboard events produced any response. This release fixes all six root causes of that integration wiring failure across 11 production files, backed by 9 regression tests and 15 E2E tests.

---

## Bug Fixes

| Issue | Description | Root Cause |
|-------|-------------|------------|
| #88 | All interactive elements non-functional — cannot click, drag, or drop bricks | RC-1: `useBrickPlacement` not mounted; pointer handlers not spread onto R3F Canvas |
| #88 | BrickPalette brick type / color selection had no effect | RC-4: `BrickPalette.tsx` not calling `uiStore.setActiveBrickType()` / `setActiveColor()` on click |
| #88 | Toolbar Undo, Redo, Clear, Export buttons were inert | RC-3: `Toolbar.tsx` onClick handlers were no-ops; not wired to `historyStore` / `sceneStore` |
| #88 | Keyboard shortcuts (R, Delete, Escape, Ctrl+Z/Y) had no effect | RC-2: `useKeyboardShortcuts` hook not mounted in `App.tsx` |
| #88 | Clicking existing bricks in 3D scene did not select them | RC-5: `useSelection` hook not wired; `BrickInstances` onClick not connected to `selectionManager` |
| #88 | All pointer events blocked at DOM level | RC-6: `pointer-events: none` on `.canvas-container` in `index.css` intercepting all events |

---

## Features

*No new features in this patch release.*

---

## Improvements

| NFR ID | Description | Before | After |
|--------|-------------|--------|-------|
| NFR-PERF-001 | Pointer event latency | N/A (events blocked) | < 16ms per event handler invocation |
| NFR-A11Y-001 | Keyboard accessibility | Non-functional | `aria-pressed` on BrickPalette; `role=toolbar` on Toolbar; input field guard on shortcuts |

---

## Component Impact

| Component | Changes | Risk Level |
|-----------|---------|------------|
| `frontend/src/index.css` | Removed `pointer-events: none` from `.canvas-container`; added `pointer-events: auto` to canvas | Low |
| `frontend/src/components/App.tsx` | Mounted `useKeyboardShortcuts()` hook globally | Low |
| `frontend/src/components/viewport/Viewport.tsx` | Mounted `useBrickPlacement` + `useSelection`; spread pointer handlers onto `ViewportCanvas` | Medium |
| `frontend/src/components/viewport/ViewportCanvas.tsx` | Accepts and forwards `onPointerDown/Move/Up` props to R3F `Canvas` | Low |
| `frontend/src/hooks/useBrickPlacement.ts` | Full implementation: `handlePointerDown`, `handlePointerMove`, `handlePointerUp`, ghost brick state | Medium |
| `frontend/src/hooks/useSelection.ts` | `handleBrickClick` calls `selectionManager.selectBrick` with `stopPropagation` | Low |
| `frontend/src/hooks/useKeyboardShortcuts.ts` | Ctrl+Z/Y undo/redo, Delete/Backspace remove, Escape clear, R rotate; input field guard; cleanup on unmount | Low |
| `frontend/src/hooks/useUndoRedo.ts` | Exposes `undo/redo/canUndo/canRedo` from `historyStore` | Low |
| `frontend/src/components/ui/BrickPalette.tsx` | Click handlers wired to `uiStore.setActiveBrickType/setActiveColor`; `aria-pressed` added | Low |
| `frontend/src/components/ui/Toolbar.tsx` | Buttons wired to `undo/redo/clearScene/removeBrick`; `role=toolbar` added | Low |
| `frontend/src/stores/uiStore.ts` | Added `rotatePlacementPreview` action for R key rotation | Low |

---

## Test Coverage

| Category | Test IDs | Pass Rate |
|----------|----------|-----------|
| Unit — Pointer event wiring | T-FE-BUG-88-01, T-FE-BUG-88-01b | 100% |
| Unit — BrickPalette click wiring | T-FE-BUG-88-02 | 100% |
| Unit — Toolbar button wiring | T-FE-BUG-88-03 | 100% |
| Unit — Keyboard shortcut wiring | T-FE-BUG-88-04, T-FE-BUG-88-04b | 100% |
| Unit — Selection wiring | T-FE-BUG-88-05 | 100% |
| Unit — Ghost brick hover | T-FE-BUG-88-06 | 100% |
| Unit — CSS pointer-events audit | T-FE-BUG-88-06b | 100% |
| E2E — Full interaction flows | T-E2E-BUG-88-01 through T-E2E-BUG-88-15 | 100% |
| Integration — Cross-component | sceneHistory, persistenceAutoSave, toolbarStoreWiring, paletteUiStoreWiring | 100% |

---

## Known Issues

- Full raycasting-based brick placement (precise 3D cursor position) is implemented as sequential grid placement in this patch. Precise raycasting refinement is tracked in a follow-up issue.
- WebGL context loss recovery (Issue #36) and crash recovery (Issue #35) are separate features not included in this patch.

---

## Rollback Instructions

**Rollback strategy:** `revert-pr` (single PR #123 contains all changes)

**Decision flow:**
1. No feature flag exists for this fix (it is a wiring correction, not a feature) → `feature-flag-disable` ruled out
2. Changes span 11 files across a single PR → `revert-commit` ruled out (multiple commits)
3. All changes are in PR #123 → **`revert-pr` selected**
4. Risk level: **Medium** (11 files changed, but all are wiring-only; no business logic modified)

**Steps:**
```bash
# 1. Create a revert branch
git checkout main
git checkout -b revert/bug-88-fix

# 2. Revert the merge commit for PR #123
git revert -m 1 22e28c0066e2b05517bc1a3b00ebdd433ad1fbf2

# 3. Push and open a PR
git push origin revert/bug-88-fix
# Open PR: revert/bug-88-fix → main

# 4. After merge, tag the rollback
git tag -a v1.0.0-rollback -m "Rollback to v1.0.0 state (pre BUG-88 fix)"
git push origin v1.0.0-rollback
```

**Expected result:** Application returns to v1.0.0 state (renders visually, all interactions non-functional).

---

## Full Changelog

Diff: `v1.0.0...v1.0.1` — https://github.com/sreenivasmrpivot/legobuilder/compare/v1.0.0...v1.0.1

**Merged PRs in this release:**
- PR #123: `[area:frontend] BUG-88: Fix all interactive elements non-functional` — frontend-coding agent
- PR #122: `[area:docs] BUG-88: Low-Level Design` — design agent

**Commits since v1.0.0:**
- `22e28c0` — fix(BUG-88): Fix all interactive elements non-functional (#123)
- `b15f0b6` — docs: LLD for BUG-88 (#122)
- `b1ef542` — chore(release): bump version to 1.0.1 and update CHANGELOG
- `4f289d1` — chore(release): add v1.0.1 release notes
- `937d847` — test(e2e): Add E2E test report for BUG-88
- `28232df` — test(integration): add cross-component integration tests for BUG-88
