# Handoff: Design Agent → Gate 6a Design Review

**Handoff ID:** 007_design_nfr_perf_001_complete
**Date:** 2026-04-12
**Status:** complete
**FR-ID:** NFR-PERF-001
**Issue:** #29
**App ID:** app-legobuilder-20260410
**Area:** frontend

---

## Work Completed

The Low-Level Design for **NFR-PERF-001** (Enforce ≥60 FPS frame rate with 500 bricks via automated performance tests) has been authored and merged to `main` via **PR #51** (merged 2026-04-11T06:56:16Z).

This is an idempotent re-trigger — the design artifact already exists on `main` at `docs/features/NFR-PERF-001/LOW_LEVEL_DESIGN.md`.

## Key Findings

- **LLD merged via PR #51** — Design review gate was already passed; LLD is on `main`
- **performanceMonitor.ts** — Dev/test-only utility attaches to `window.__perfMonitor`; zero production bundle impact via Vite tree-shaking
- **SwiftShader WebGL** — `--use-gl=swiftshader` enables Three.js WebGL rendering in headless CI without a physical GPU
- **60-frame warmup discard** — First 60 RAF samples (~1 second) excluded from p95 to eliminate scene initialization overhead
- **Separate Jest project** — `jest.performance.config.ts` with 30s timeout isolates perf tests from unit/integration suite

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| Low-Level Design | `docs/features/NFR-PERF-001/LOW_LEVEL_DESIGN.md` | Full LLD: Puppeteer test harness, performanceMonitor utility, p95 algorithm, CI integration, SwiftShader config, test case mapping |
| Handoff JSON | `docs/handoffs/007_design_nfr_perf_001_complete.json` | Machine-readable handoff for gate-6a-design-review |
| Handoff Markdown | `docs/handoffs/007_design_nfr_perf_001_HANDOFF.md` | This document |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| 30 FPS floor assertion | Issue specifies minimum frame time never below 33.3ms (30 FPS floor) — confirm if this is a hard CI failure or advisory warning | medium |
| SwiftShader threshold calibration | CI runners use software rendering; 16.7ms threshold may need adjustment if SwiftShader cannot sustain 60 FPS | medium |

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/NFR-PERF-001/LOW_LEVEL_DESIGN.md` for the full test harness specification
2. Write TDD test suite for:
   - **T-PERF-PERF-001-01**: 500 bricks → p95 frame time < 16.7ms (≥60 FPS)
   - **T-PERF-PERF-001-02**: 100/250/500 brick scenarios all pass ≥60 FPS threshold
   - **T-PERF-PERF-001-03**: CI build fails when threshold is breached
3. Create `frontend/tests/performance/frameRate.test.ts` using Puppeteer + `requestAnimationFrame` timestamps
4. Configure `jest.performance.config.ts` with 30s timeout, isolated from unit test suite
5. Implement `performanceMonitor` utility stub (dev/test-only, `window.__perfMonitor`) for test harness
6. Ensure SwiftShader WebGL flags are set in Puppeteer launch config for CI compatibility

### Files to Read

- `docs/features/NFR-PERF-001/LOW_LEVEL_DESIGN.md`
- `docs/TECHNICAL_ARCHITECTURE.md`
- `docs/TEST_PLAN.md`

## Workflow State

- **Current phase:** design (complete)
- **Completed:** research, pm, architecture, planning, design
- **Remaining:** gate-6a-design-review, frontend-test, frontend-coding, frontend-review, release

---

*Created by Spectra Framework — design-agent | 2026-04-12*
