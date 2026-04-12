# Handoff: Design Agent → Frontend Test Agent

**Handoff ID:** 026_design_nfr_rel_001_complete  
**Date:** 2026-04-12  
**Status:** complete  
**FR-ID:** NFR-REL-001  
**Issue:** #35  
**App ID:** app-legobuilder-20260410  

---

## Work Completed

The design agent produced **LLD v2.0** for NFR-REL-001 (Auto-Save Crash Durability). This is a post-implementation verified design document that incorporates all learnings from the full implementation cycle (PRs #48, #75, #77, #80–#84). The LLD supersedes the original v1.0 (PR #48) with verified API names, confirmed intervals, and corrected interface contracts.

---

## Key Findings

- **Correct API name:** `detectOrphanedSession()` — NOT `detectCrash()` (earlier LLD drafts used the wrong name)
- **Auto-save interval:** 30,000 ms (30 seconds) — confirmed from implementation
- **Crash simulation:** `browser.close({ runBeforeUnload: false })` — the ONLY correct Playwright approach
- **IDB library:** `idb` must be in `dependencies` (not `devDependencies`) — required at runtime by `dbSchema.ts`
- **Unit test IDB:** `fake-indexeddb/auto` in `devDependencies` — provides in-memory IDB for Vitest
- **Atomicity:** Both `scene-snapshots` and `auto-save-meta` written in a single `readwrite` transaction

---

## Artifacts Produced

| Artifact | Path | Description |
|----------|------|-------------|
| LLD v2.0 | `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md` | Full design: schema, interfaces, sequence diagrams, error handling, security, test mapping |
| Handoff JSON | `docs/handoffs/026_design_nfr_rel_001_complete.json` | Machine-readable handoff |
| Handoff MD | `docs/handoffs/026_design_nfr_rel_001_HANDOFF.md` | This document |

---

## Human Review Required

| Item | Reason | Severity |
|------|--------|----------|
| LLD v2.0 design review | Gate 6a — design must be approved before implementation proceeds | high |

---

## Context for Next Agent

### Recommended Actions

1. Read `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md` for full interface contracts
2. Use `detectOrphanedSession()` (NOT `detectCrash()`) as the crash detection API
3. Use 30s auto-save interval (`AUTO_SAVE_INTERVAL_MS = 30_000`)
4. Use `fake-indexeddb/auto` for Vitest unit tests (devDependency)
5. Use `browser.close({ runBeforeUnload: false })` for Playwright crash simulation
6. Ensure `idb` is in `dependencies` (not `devDependencies`) — required at runtime
7. All `data-testid` selectors: `resume-prompt`, `resume-prompt-brick-count`, `resume-btn`, `discard-btn`, `add-brick-btn`, `brick-instance`, `auto-save-status`

### Files to Read

- `docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md`
- `docs/features/FR-PERS-001/LOW_LEVEL_DESIGN.md`
- `docs/features/FR-PERS-002/LOW_LEVEL_DESIGN.md`

---

## Workflow State

- **Current phase:** design
- **Completed:** research, pm, architecture, design
- **Remaining:** frontend-test, frontend-coding, frontend-review, release
