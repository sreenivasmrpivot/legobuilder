# Handoff: Design Agent → Gate 6a Design Review

**Handoff ID:** 010_design_nfr_perf_002_complete  
**Date:** 2026-04-11  
**Status:** complete  
**Issue:** #27 — [NFR-PERF-002] Enforce <2ms raycast latency in 500-brick scenes via instrumented timing  
**FR-ID:** NFR-PERF-002  
**Branch:** feature/27-nfr-perf-002-design  
**PR:** #54 (Draft) — https://github.com/sreenivasmrpivot/legobuilder/pull/54  

---

## Work Completed

The design agent authored the complete Low-Level Design for NFR-PERF-002, which mandates that every raycast in a 500-brick scene completes in <2ms (p95). The LLD specifies a BVH-accelerated raycast engine, an instrumented timing wrapper active only in non-production builds, a p95 statistical aggregator, and a CI-enforced Vitest performance test. No production code was written — this is a design artifact only.

## Key Findings

- **BVH via `three-mesh-bvh`** is the primary optimization — monkey-patches `Mesh.prototype.raycast` with `acceleratedRaycast` once at init (idempotent). Provides the required ≥5× speedup over naive raycasting at 500 bricks.
- **Instrumentation is production-safe** — `import.meta.env.PROD` guard ensures `performance.now()` timing code is dead-code-eliminated by Vite in production builds; zero runtime overhead for end users.
- **p95 is the primary SLA metric** — 100 raycasts sampled per test run; p95 must be <2ms. Single constant `NFR_PERF_002_THRESHOLD_MS = 2.0` is the source of truth.
- **Incremental BVH rebuild** — `rebuildBvhIncremental()` recomputes only changed geometries on brick add/remove, keeping rebuild latency ≤5ms for single-brick mutations.
- **8 test cases** cover the full acceptance criteria: p95 threshold, speedup ratio, BVH build time, incremental rebuild, idempotency, reset, production guard, and p95 computation correctness.

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| Low-Level Design | `docs/features/NFR-PERF-002/LOW_LEVEL_DESIGN.md` | Full LLD: module map, interface contracts, data models, 4 sequence diagrams, algorithms, 8 test cases, error handling, security, CI integration |
| Design PR #54 | https://github.com/sreenivasmrpivot/legobuilder/pull/54 | Draft PR on branch feature/27-nfr-perf-002-design — awaiting Gate 6a |
| Handoff JSON | `docs/handoffs/010_design_nfr_perf_002_complete.json` | Machine-readable handoff artifact |
| Handoff Markdown | `docs/handoffs/010_design_nfr_perf_002_HANDOFF.md` | This document |

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| Gate 6a Design Review — PR #54 | LLD must be approved before implementation begins | high |
| FR-SCENE-003 bvhManager.ts module structure | NFR-PERF-002 extends it — confirm export shape | medium |
| `three-mesh-bvh` in package.json | Required dependency — confirm before coding | medium |
| CI trigger strategy for performance tests | Every push vs PRs to main only | low |
| jsdom vs perf_hooks.performance | Test environment resolution for performance.now() | low |

## Context for Next Agent

### Recommended Actions
1. Review Draft PR #54 at https://github.com/sreenivasmrpivot/legobuilder/pull/54 — this is Gate 6a (Design Review)
2. Verify LLD at `docs/features/NFR-PERF-002/LOW_LEVEL_DESIGN.md` is consistent with `docs/TECHNICAL_ARCHITECTURE.md` and `docs/PRD.md`
3. Confirm FR-SCENE-003 (#9) `bvhManager.ts` module structure — affects whether NFR-PERF-002 extends or creates the module
4. Confirm `three-mesh-bvh` is in `package.json` before implementation
5. Resolve OQ-3: CI trigger strategy for performance tests (every push vs PRs to main)
6. Resolve OQ-4: jsdom vs `perf_hooks.performance` for test environment
7. Approve and merge PR #54 to main to unblock frontend-test and frontend coding agents
8. On approval, frontend-test agent should read the merged LLD from main before writing tests for T-PERF-PERF-002-01 through -08

### Files to Read
- `docs/features/NFR-PERF-002/LOW_LEVEL_DESIGN.md`
- `https://github.com/sreenivasmrpivot/legobuilder/pull/54`
- `docs/handoffs/010_design_nfr_perf_002_complete.json`
- `docs/handoffs/010_design_nfr_perf_002_HANDOFF.md`

## Workflow State
- **Current phase:** design_complete
- **Completed:** design
- **Remaining:** gate-6a-design-review, frontend-test, frontend-coding, frontend-review, release
