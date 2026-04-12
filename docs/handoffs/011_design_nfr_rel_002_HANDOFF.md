# Handoff: Design Agent → Frontend Test Agent

**Handoff ID:** 011_design_nfr_rel_002_complete
**Date:** 2026-04-12
**Status:** complete
**FR-ID:** NFR-REL-002
**Issue:** #36
**App ID:** app-legobuilder-20260410

---

## Work Completed

The Low-Level Design for **NFR-REL-002** (Graceful Recovery from WebGL Context Loss) has been authored, reviewed at Gate 6a, and merged to `main` via **PR #47**. The LLD is the authoritative design document for all downstream agents (frontend-test, frontend-coding).

The design covers the complete WebGL context loss recovery lifecycle:
- Detecting `webglcontextlost` / `webglcontextrestored` browser events on the R3F `<Canvas>` element
- Pausing the render loop and showing a `ContextLossOverlay` recovery UI
- Reinitializing the Three.js renderer with exponential backoff (3 attempts)
- Rebuilding the `InstancedMesh` scene from Zustand `sceneStore` state
- Hard-failure "Reload Page" UI after 3 failed restoration attempts

---

## Key Findings

- **`WebGLContextGuard`** is a pure behavior R3F component (renders `null`) that attaches DOM event listeners via `useThree()`, keeping context recovery logic decoupled from scene rendering
- **`contextRecoveryStore`** (new Zustand slice) tracks `status: 'normal' | 'lost' | 'restoring' | 'restored'`, timestamps, and retry count — drives `ContextLossOverlay` visibility reactively
- **Scene reconstruction** reads from `sceneStore` (Zustand) — GPU state loss does not destroy application state; rebuild is a pure O(n) read
- **Exponential backoff retry**: 3 attempts at 0ms / 500ms / 1000ms before showing hard-failure UI
- **`event.preventDefault()`** is mandatory in `handleContextLost` — without it, the browser permanently discards the context

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| Low-Level Design | `docs/features/NFR-REL-002/LOW_LEVEL_DESIGN.md` | Full LLD: component specs, Zustand store schema, browser event contracts, 3 Mermaid sequence diagrams, exponential backoff retry, error handling, security, accessibility, integration test design |
| Design PR | PR #47 (merged) | Gate 6a design review — approved and merged to main |
| Handoff JSON | `docs/handoffs/011_design_nfr_rel_002_complete.json` | Machine-readable handoff for frontend-test agent |
| Handoff Markdown | `docs/handoffs/011_design_nfr_rel_002_HANDOFF.md` | This document |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| None | Design was reviewed and approved at Gate 6a (PR #47 merged) | — |

---

## Context for Next Agent

### Recommended Actions

1. **Read `docs/features/NFR-REL-002/LOW_LEVEL_DESIGN.md`** — this is the authoritative design for all test authoring. Pay special attention to:
   - Section 4: Component Architecture (`WebGLContextGuard`, `ContextLossOverlay`)
   - Section 5: `contextRecoveryStore` Zustand slice schema and state machine
   - Section 6: Browser event contracts (`handleContextLost`, `handleContextRestored`)
   - Section 8: Error handling and retry backoff schedule
   - Section 12: Test case mapping (TC-01, TC-02, TC-03)
2. **Write integration test** at `frontend/tests/integration/webglContextLoss.test.ts` using the `WEBGL_lose_context` WebGL extension to simulate context loss:
   - **TC-01**: Given a scene with bricks, when `loseContext()` is called, then the app does not crash and `contextRecoveryStore.status` becomes `'lost'`
   - **TC-02**: Given context is restored via `restoreContext()`, when the scene re-renders, then all bricks appear in original positions with correct colors
   - **TC-03**: Given context loss occurs, when the user sees the canvas, then `ContextLossOverlay` is visible with a loading indicator
3. **Write unit tests for `WebGLContextGuard`**: verify `handleContextLost` calls `event.preventDefault()`, pauses render loop, sets `contextRecoveryStore.status` to `'lost'`
4. **Write unit tests for `contextRecoveryStore`**: verify state transitions `normal→lost→restoring→restored` and retry counter increments correctly
5. **Write unit tests for `ContextLossOverlay`**: verify renders when `status='lost'|'restoring'`, shows "Reload Page" button after 3 failed retries, ARIA live region is present
6. **Map all tests to `T-BE-REL-002-01`** and the 3 acceptance criteria from issue #36
7. **Create branch**: `feature/36-nfr-rel-002-frontend-tests`

### Files to Read

- `docs/features/NFR-REL-002/LOW_LEVEL_DESIGN.md`

---

## Workflow State

- **Current phase:** design (complete)
- **Completed:** research, architecture, planning, design
- **Remaining:** frontend-test, frontend-coding, frontend-review, release

---

*Created by Spectra Framework — design-agent | NFR-REL-002 | Issue #36 | app-legobuilder-20260410*
