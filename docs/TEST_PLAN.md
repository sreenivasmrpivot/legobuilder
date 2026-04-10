---
artifact_type: test_plan
artifact_id: "legobuilder-test-plan"
version: "1.0.0"
classification:
  industry: [consumer, gaming, education]
  domain: [3d-modeling, creative-tools]
  compliance: [none]
  scale_tier: "small"
tech_summary:
  backend: "none (client-only MVP)"
  frontend: "React 18 + TypeScript + Vite"
  database: "IndexedDB (local persistence)"
spectra_config:
  governance_depth: "lightweight"
  maturity_lever: 2
production_telemetry:
  status: pre_production
  test_pass_rate: null
  human_validated: false
recommendation:
  score: null
  times_reused: 0
privacy:
  shareable: false
  anonymization_level: metadata_only
---

# Test Plan — LegoBuilder

This document specifies test cases for the LegoBuilder browser-based 3D brick-building application. Each test has a unique ID that can be referenced in code, issues, and PRs.

**PRD Version Tested Against:** 1.0 (2026-04-10)
**Governance Depth:** Lightweight
**Total FR Count:** 20
**Total NFR Count:** 12
**Total Test Case Count:** 82
**Coverage:** Every FR and NFR has at least one test case.

---

## Document Version

| Version | Date | Changes | OpenSpec Change |
|---------|------|---------|-----------------|
| 1.0 | 2026-04-10 | Initial test plan | `initial-mvp` |

---

## 1. Test ID Convention

| Prefix | Area |
|--------|------|
| `T-BE-*` | Backend / state logic tests |
| `T-FE-*` | Frontend component tests |
| `T-PERF-*` | Performance tests |
| `T-SEC-*` | Security tests |
| `T-E2E-*` | End-to-end tests |
| `T-A11Y-*` | Accessibility tests |

---

## 2. Test Categories and Scope

### 2.1 In-Scope Categories

| Category | Prefix | Tools/Frameworks | Coverage Target |
|----------|--------|-----------------|-----------------|
| Backend Unit (State Logic) | T-BE-* | Vitest | ≥60% |
| Frontend Unit (Components) | T-FE-* | Vitest + React Testing Library | ≥50% |
| E2E Integration | T-E2E-* | Playwright | Key user journeys |
| Performance | T-PERF-* | Puppeteer + custom instrumentation | Per NFR metric |
| Security | T-SEC-* | Vitest + manual audit | Input validation, CSP |
| Accessibility | T-A11Y-* | axe-core + manual screen reader | WCAG 2.1 AA (non-3D UI) |

### 2.2 Out-of-Scope Categories

| Category | Justification |
|----------|---------------|
| EDD (Eval-Driven Development) | No AI/ML/LLM components in MVP |
| Load/Stress Testing | Client-only app; no server to stress test |
| Penetration Testing | No backend, no user accounts, no sensitive data in MVP |

---

## 3. Backend / State Logic Test Specs

### 3.1 Scene Management Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-BE-SCENE-001-01 | Scene initializes with ground grid plane | Unit | None | 1. Create new scene store 2. Read grid state | Grid plane exists with 1-stud interval lines, extending ≥32×32 studs | FR-SCENE-001 | P0 |
| T-BE-SCENE-001-02 | Scene initializes with correct default camera position | Unit | None | 1. Create new scene store 2. Read camera state | Camera is at default isometric position | FR-SCENE-001 | P0 |
| T-BE-SCENE-002-01 | InstancedMesh groups identical brick geometries | Unit | Scene with 100 identical 2×4 bricks | 1. Query instanced mesh state 2. Count draw calls | All 100 bricks in single InstancedMesh; draw calls = number of unique geometries | FR-SCENE-002 | P0 |
| T-BE-SCENE-002-02 | Single brick color change updates only instance attribute | Unit | Scene with 50 identical bricks | 1. Change color of brick at index 25 2. Verify update scope | Only instance 25's color attribute changes; no full re-render triggered | FR-SCENE-002 | P0 |
| T-BE-SCENE-003-01 | BVH-accelerated raycast completes within latency budget | Unit | Scene with 500 bricks, BVH built | 1. Perform raycast 2. Measure time | Raycast completes in <2ms | FR-SCENE-003 | P0 |

### 3.2 Brick Placement & Manipulation Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-BE-BRICK-001-01 | Brick snaps to nearest stud position | Unit | Empty scene with grid | 1. Place brick at arbitrary coordinates 2. Read final position | Position aligns to nearest stud (within 0.01 stud units) | FR-BRICK-001 | P0 |
| T-BE-BRICK-001-02 | Occupied position rejects placement | Unit | Scene with brick at (4,0,4) | 1. Attempt to place same-size brick at (4,0,4) | Placement rejected; occupancy map unchanged | FR-BRICK-001 | P0 |
| T-BE-BRICK-001-03 | 2×4 brick occupies exactly 8 stud positions | Unit | Empty scene | 1. Place 2×4 brick 2. Query occupancy map | Exactly 8 stud positions marked as occupied | FR-BRICK-001 | P0 |
| T-BE-BRICK-002-01 | Brick stacks at correct vertical position | Unit | Scene with one brick on grid | 1. Place brick on top of existing brick 2. Read Y position | New brick Y = existing brick top surface height | FR-BRICK-002 | P0 |
| T-BE-BRICK-002-02 | Stack of N bricks has correct cumulative height | Unit | Empty scene | 1. Stack 5 bricks 2. Read top brick Y position | Top brick Y = 4 × brick height (0-indexed from grid) | FR-BRICK-002 | P0 |
| T-BE-BRICK-003-01 | Brick palette contains minimum required types | Unit | None | 1. Query brick palette state | At least 6 types: 1×1, 1×2, 2×2, 2×4, 1×4, 2×3 | FR-BRICK-003 | P0 |
| T-BE-BRICK-003-02 | Color palette contains minimum required colors | Unit | None | 1. Query color palette state | At least 12 distinct colors available | FR-BRICK-003 | P0 |
| T-BE-BRICK-004-01 | Brick rotates 90° around Y-axis | Unit | Brick selected for placement | 1. Apply rotation command | Brick rotation increments by 90° clockwise | FR-BRICK-004 | P1 |
| T-BE-BRICK-004-02 | Rotated brick occupies correct stud positions | Unit | Empty scene | 1. Select 2×4 brick 2. Rotate 90° 3. Place on grid 4. Query occupancy map | Occupancy map reflects rotated footprint (4×2 instead of 2×4) | FR-BRICK-004 | P1 |

### 3.3 Editing Operations Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-BE-EDIT-001-01 | Selecting a brick sets selection state | Unit | Scene with 3 bricks | 1. Select brick at index 1 | Selection state contains brick 1; highlight flag set | FR-EDIT-001 | P0 |
| T-BE-EDIT-001-02 | Selecting new brick clears previous selection | Unit | Scene with 3 bricks, brick 0 selected | 1. Select brick at index 2 | Only brick 2 is selected; brick 0 deselected | FR-EDIT-001 | P0 |
| T-BE-EDIT-001-03 | Clicking empty space clears selection | Unit | Scene with selected brick | 1. Trigger deselect action | No brick selected | FR-EDIT-001 | P0 |
| T-BE-EDIT-002-01 | Deleting brick removes from scene and occupancy map | Unit | Scene with brick at (4,0,4) selected | 1. Execute delete command | Brick removed from scene array; occupancy map positions freed | FR-EDIT-002 | P0 |
| T-BE-EDIT-002-02 | Delete is undoable | Unit | Scene with brick deleted | 1. Execute undo | Brick reappears at original position with original color | FR-EDIT-002 | P0 |
| T-BE-EDIT-003-01 | Undo reverses last placement | Unit | Scene with 1 brick just placed | 1. Execute undo | Brick removed; scene empty | FR-EDIT-003 | P0 |
| T-BE-EDIT-003-02 | Redo restores undone action | Unit | Scene with 1 undone placement | 1. Execute redo | Brick reappears at original position | FR-EDIT-003 | P0 |
| T-BE-EDIT-003-03 | 50 levels of undo history maintained | Unit | Scene with 50 sequential actions | 1. Execute undo 50 times | All 50 actions reversed in correct order; scene returns to initial state | FR-EDIT-003 | P0 |
| T-BE-EDIT-003-04 | New action after undo clears redo stack | Unit | Scene with 3 undone actions | 1. Perform new action 2. Attempt redo | Redo stack is empty; new action is at top of history | FR-EDIT-003 | P0 |

### 3.4 Persistence Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-BE-PERS-001-01 | Auto-save triggers after 5-second debounce | Unit | Scene with bricks | 1. Place brick 2. Wait 5 seconds | Scene state persisted to IndexedDB | FR-PERS-001 | P0 |
| T-BE-PERS-001-02 | Rapid actions debounce to single save | Unit | Scene with bricks | 1. Place 10 bricks rapidly (within 3 seconds) 2. Wait 5 seconds | Only one save operation occurs after final action | FR-PERS-001 | P0 |
| T-BE-PERS-001-03 | Auto-save completes within latency budget | Unit | Scene with 500 bricks | 1. Trigger auto-save 2. Measure duration | Save completes in <500ms | FR-PERS-001 | P0 |
| T-BE-PERS-002-01 | Saved session detected on app load | Unit | IndexedDB contains saved scene | 1. Initialize app 2. Check session detection | App detects saved session and returns resume prompt data | FR-PERS-002 | P0 |
| T-BE-PERS-002-02 | Resume loads all bricks correctly | Unit | IndexedDB contains 100-brick scene | 1. Trigger resume 2. Compare loaded state to saved state | All 100 bricks match in position, type, rotation, and color | FR-PERS-002 | P0 |
| T-BE-PERS-002-03 | Fresh start clears saved session | Unit | IndexedDB contains saved scene | 1. Trigger fresh start | Scene is empty; saved session cleared or ignored | FR-PERS-002 | P0 |
| T-BE-PERS-002-04 | No prompt when no saved session exists | Unit | Empty IndexedDB | 1. Initialize app | No resume prompt; empty scene shown directly | FR-PERS-002 | P0 |

### 3.5 Export/Import Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-BE-EXPORT-001-01 | Export produces valid JSON with all brick data | Unit | Scene with 10 bricks of various types/colors | 1. Execute export 2. Parse JSON output | JSON contains array of 10 brick objects, each with position, type, rotation, color | FR-EXPORT-001 | P0 |
| T-BE-EXPORT-001-02 | Export includes schema version | Unit | Scene with bricks | 1. Execute export 2. Check JSON root | JSON includes version field for forward compatibility | FR-EXPORT-001 | P0 |
| T-BE-EXPORT-001-03 | Export of 500-brick scene completes within budget | Unit | Scene with 500 bricks | 1. Execute export 2. Measure time | Export completes in <2 seconds | FR-EXPORT-001 | P0 |
| T-BE-EXPORT-002-01 | Import reconstructs scene with 100% fidelity | Unit | Valid JSON file from previous export | 1. Export scene 2. Clear scene 3. Import exported file 4. Compare | Every brick matches original in position, type, rotation, color | FR-EXPORT-002 | P0 |
| T-BE-EXPORT-002-02 | Import rejects invalid JSON gracefully | Unit | Malformed JSON string | 1. Attempt import with invalid JSON | Error returned; current scene state unchanged | FR-EXPORT-002 | P0 |
| T-BE-EXPORT-002-03 | Import rejects JSON with missing required fields | Unit | JSON with bricks missing position field | 1. Attempt import | Validation error returned; current scene unchanged | FR-EXPORT-002 | P0 |
| T-BE-EXPORT-002-04 | Import handles newer version with graceful degradation | Unit | JSON with version higher than current | 1. Attempt import | Scene loads with warning; known fields imported, unknown fields ignored | FR-EXPORT-002 | P0 |

---

## 4. Frontend Component Test Specs

### 4.1 Toolbar Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-FE-UI-001-01 | Toolbar renders all 7 buttons | Component | App mounted | 1. Render toolbar 2. Query for buttons | 7 buttons visible: New, Import, Export, Undo, Redo, Delete, Reset Camera | FR-UI-001 | P0 |
| T-FE-UI-001-02 | Undo button disabled when history empty | Component | Empty undo history | 1. Render toolbar 2. Check Undo button state | Undo button has disabled attribute and grayed-out styling | FR-UI-001 | P0 |
| T-FE-UI-001-03 | Redo button disabled when redo stack empty | Component | Empty redo stack | 1. Render toolbar 2. Check Redo button state | Redo button has disabled attribute and grayed-out styling | FR-UI-001 | P0 |
| T-FE-UI-001-04 | Delete button disabled when no brick selected | Component | No selection | 1. Render toolbar 2. Check Delete button state | Delete button has disabled attribute | FR-UI-001 | P0 |

### 4.2 Brick Palette Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-FE-UI-002-01 | Palette sidebar renders brick type previews | Component | App mounted | 1. Render palette 2. Query brick items | At least 6 brick types displayed with visual previews | FR-UI-002 | P0 |
| T-FE-UI-002-02 | Clicking brick type sets active placement brick | Component | Palette rendered | 1. Click on 2×4 brick type | Active brick state updated to 2×4 | FR-UI-002 | P0 |
| T-FE-UI-002-03 | Color picker renders minimum colors | Component | Palette rendered | 1. Query color picker | At least 12 distinct color options visible | FR-UI-002 | P0 |
| T-FE-UI-002-04 | Selecting color updates active color state | Component | Palette rendered | 1. Click red color | Active color state updated to red | FR-UI-002 | P0 |
| T-FE-UI-002-05 | Sidebar does not obscure >25% of canvas at 1024px | Component | Viewport width = 1024px | 1. Render app 2. Measure sidebar width | Sidebar width ≤ 256px (25% of 1024px) | FR-UI-002 | P0 |

### 4.3 Ghost Brick Preview Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-FE-UI-003-01 | Ghost brick appears on valid hover position | Component | Brick type selected, hovering over grid | 1. Simulate hover over valid position | Semi-transparent ghost brick rendered at snap position | FR-UI-003 | P1 |
| T-FE-UI-003-02 | Ghost brick shows red on occupied position | Component | Brick type selected, hovering over occupied position | 1. Simulate hover over occupied stud | Ghost brick rendered in red color | FR-UI-003 | P1 |

### 4.4 Camera Control Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-FE-CAM-001-01 | Orbit control responds to right-click drag | Component | Scene rendered | 1. Simulate right-click drag | Camera position changes (orbit around center) | FR-CAM-001 | P0 |
| T-FE-CAM-001-02 | Zoom control responds to scroll wheel | Component | Scene rendered | 1. Simulate scroll event | Camera distance changes | FR-CAM-001 | P0 |
| T-FE-CAM-002-01 | Reset camera button returns to default view | Component | Camera moved from default | 1. Click Reset Camera button | Camera returns to default isometric position | FR-CAM-002 | P1 |

### 4.5 Resume Prompt Tests

| ID | Description | Type | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|----------------|----------|
| T-FE-PERS-002-01 | Resume modal renders with Yes/No options | Component | Saved session exists | 1. Render app with saved session | Modal visible with "Resume previous build?" text and Yes/No buttons | FR-PERS-002 | P0 |
| T-FE-PERS-002-02 | No modal when no saved session | Component | No saved session | 1. Render app without saved session | No modal rendered; empty scene shown | FR-PERS-002 | P0 |

---

## 5. End-to-End Test Specs

| ID | Description | User Journey | Preconditions | Steps | Expected Result | Related FR/NFR | Priority |
|----|-------------|--------------|---------------|-------|-----------------|----------------|----------|
| T-E2E-SCENE-001-01 | App loads with visible grid and empty scene | First-Time Build | None | 1. Navigate to app URL 2. Wait for canvas render | 3D canvas visible with ground grid; no bricks; toolbar and palette visible | FR-SCENE-001, FR-UI-001, FR-UI-002 | P0 |
| T-E2E-BRICK-001-01 | Place brick on grid via click | First-Time Build | App loaded | 1. Select 2×4 brick from palette 2. Click on grid position | Brick appears at clicked position, snapped to grid | FR-BRICK-001, FR-BRICK-003, FR-UI-002 | P0 |
| T-E2E-BRICK-002-01 | Stack bricks vertically | First-Time Build | App loaded, one brick placed | 1. Hover over top of placed brick 2. Click to place | New brick stacks on top at correct height | FR-BRICK-002, FR-UI-003 | P0 |
| T-E2E-EDIT-001-01 | Select and delete a brick | First-Time Build | App loaded, bricks placed | 1. Click on a brick 2. Verify highlight 3. Press Delete | Brick highlighted on click; removed on Delete | FR-EDIT-001, FR-EDIT-002 | P0 |
| T-E2E-EDIT-003-01 | Undo and redo brick placement | First-Time Build | App loaded, brick just placed | 1. Press Ctrl+Z 2. Verify brick removed 3. Press Ctrl+Y 4. Verify brick restored | Brick disappears on undo; reappears on redo | FR-EDIT-003 | P0 |
| T-E2E-CAM-001-01 | Orbit camera around scene | Complex Build | App loaded, bricks placed | 1. Right-click drag on canvas | Camera orbits; scene visible from new angle | FR-CAM-001 | P0 |
| T-E2E-EXPORT-001-01 | Export and reimport scene with full fidelity | Share Creation | App loaded, 20 bricks placed | 1. Click Export 2. Save file 3. Click New Scene 4. Click Import 5. Select saved file | All 20 bricks restored with exact positions, types, rotations, colors | FR-EXPORT-001, FR-EXPORT-002 | P0 |
| T-E2E-PERS-001-01 | Auto-save and resume after page reload | Resume Build | App loaded, bricks placed, 5s elapsed | 1. Place bricks 2. Wait 5 seconds 3. Reload page 4. Click "Yes" on resume prompt | All bricks restored from auto-save | FR-PERS-001, FR-PERS-002 | P0 |
| T-E2E-BRICK-004-01 | Rotate brick before placement | Complex Build | App loaded, brick type selected | 1. Press R key 2. Verify ghost brick rotated 3. Click to place | Brick placed in rotated orientation | FR-BRICK-004, FR-UI-003 | P1 |
| T-E2E-UI-001-01 | Toolbar button states reflect app state | First-Time Build | App loaded, no actions taken | 1. Verify Undo disabled 2. Place brick 3. Verify Undo enabled 4. Undo 5. Verify Redo enabled | Button states correctly reflect undo/redo availability | FR-UI-001, FR-EDIT-003 | P0 |

---

## 6. Performance Test Specs

| ID | Description | Type | Preconditions | Steps | Expected Result | Threshold | Measurement Method | Related NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|-----------|-------------------|-------------|----------|
| T-PERF-PERF-001-01 | Frame rate at 500 bricks (static) | Performance | Scene with 500 mixed bricks | 1. Render scene 2. Measure FPS over 10 seconds | p95 frame time <16.7ms (≥60 FPS) | ≥60 FPS | Puppeteer `requestAnimationFrame` timestamp measurement | NFR-PERF-001 | P0 |
| T-PERF-PERF-001-02 | Frame rate at 500 bricks (orbiting) | Performance | Scene with 500 bricks, camera orbiting | 1. Start camera orbit 2. Measure FPS over 10 seconds | No frame drops below 30 FPS; p95 ≥60 FPS | ≥30 FPS minimum, ≥60 FPS p95 | Puppeteer with automated orbit input | NFR-PERF-001 | P0 |
| T-PERF-PERF-001-03 | JavaScript heap usage at 500 bricks | Performance | Scene with 500 bricks | 1. Measure JS heap size | Heap usage <200MB | <200MB | Chrome DevTools Protocol via Puppeteer | NFR-PERF-001 | P0 |
| T-PERF-PERF-002-01 | Raycast latency at 500 bricks | Performance | Scene with 500 bricks, BVH built | 1. Perform 100 raycasts 2. Measure p95 latency | p95 raycast time <2ms | <2ms | Instrumented timing in test build | NFR-PERF-002 | P0 |
| T-PERF-PERF-003-01 | Time-to-interactive on initial load | Performance | Clean browser cache | 1. Navigate to app URL 2. Measure TTI | TTI <3 seconds on simulated 10 Mbps | <3s | Lighthouse CI with throttled network | NFR-PERF-003 | P0 |
| T-PERF-SCALE-001-01 | Frame rate at 100 bricks | Performance | Scene with 100 bricks | 1. Render scene 2. Measure FPS | ≥60 FPS | ≥60 FPS | Puppeteer measurement | NFR-SCALE-001 | P0 |
| T-PERF-SCALE-001-02 | Frame rate at 250 bricks | Performance | Scene with 250 bricks | 1. Render scene 2. Measure FPS | ≥60 FPS | ≥60 FPS | Puppeteer measurement | NFR-SCALE-001 | P0 |

---

## 7. Security Test Specs

| ID | Description | Type | Preconditions | Steps | Expected Result | Related NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|-------------|----------|
| T-SEC-SEC-001-01 | Import rejects JSON with script injection | Unit | Malicious JSON with embedded script tags | 1. Attempt import with `<script>` in brick name field | Import rejected or field sanitized; no script execution | NFR-SEC-001 | P0 |
| T-SEC-SEC-001-02 | Import rejects JSON with prototype pollution | Unit | JSON with `__proto__` keys | 1. Attempt import with prototype pollution payload | Import rejected; no prototype modification | NFR-SEC-001 | P0 |
| T-SEC-SEC-001-03 | Import rejects oversized JSON payload | Unit | JSON file >10MB | 1. Attempt import with oversized file | Import rejected with file size error | NFR-SEC-001 | P0 |
| T-SEC-SEC-001-04 | Import validates all required fields against schema | Unit | JSON with valid structure but invalid field types | 1. Attempt import with number where string expected | Validation error returned; scene unchanged | NFR-SEC-001 | P0 |
| T-SEC-SEC-002-01 | No inline scripts in HTML output | Integration | Built application | 1. Build app 2. Scan HTML for inline scripts | Zero inline `<script>` tags; all scripts loaded from files | NFR-SEC-002 | P0 |
| T-SEC-SEC-002-02 | No eval() usage in production code | Unit | Source code | 1. Scan codebase for eval() calls | Zero eval() calls in production code | NFR-SEC-002 | P0 |

---

## 8. Accessibility Test Specs

| ID | Description | Type | Preconditions | Steps | Expected Result | Related NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|-------------|----------|
| T-A11Y-A11Y-001-01 | Toolbar buttons navigable via Tab key | Integration | App loaded | 1. Press Tab repeatedly 2. Verify focus moves through toolbar buttons | All 7 toolbar buttons receive focus in logical order | NFR-A11Y-001 | P0 |
| T-A11Y-A11Y-001-02 | Palette items navigable via arrow keys | Integration | App loaded, palette focused | 1. Press arrow keys 2. Verify focus moves through brick types | Brick types navigable with arrow keys | NFR-A11Y-001 | P0 |
| T-A11Y-A11Y-001-03 | Buttons activatable via Enter key | Integration | App loaded, button focused | 1. Focus Export button 2. Press Enter | Export action triggered | NFR-A11Y-001 | P0 |
| T-A11Y-A11Y-002-01 | Toolbar buttons have ARIA labels | Unit | App loaded | 1. Query toolbar buttons for aria-label attributes | Every button has descriptive aria-label (e.g., "Undo last action") | NFR-A11Y-002 | P0 |
| T-A11Y-A11Y-002-02 | Palette items have ARIA labels | Unit | App loaded | 1. Query palette items for aria-label attributes | Every brick type and color has descriptive aria-label | NFR-A11Y-002 | P0 |
| T-A11Y-A11Y-001-04 | axe-core audit passes with zero violations | Integration | App loaded | 1. Run axe-core scan on full page | Zero WCAG 2.1 AA violations on non-3D UI elements | NFR-A11Y-001 | P0 |

---

## 9. Reliability Test Specs

| ID | Description | Type | Preconditions | Steps | Expected Result | Related NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|-------------|----------|
| T-BE-REL-001-01 | Auto-saved data survives simulated browser crash | Integration | Scene with 50 bricks, auto-save completed | 1. Kill browser process 2. Reopen app 3. Resume session | All 50 bricks restored from IndexedDB | NFR-REL-001 | P0 |
| T-BE-REL-001-02 | Normal browser close preserves data | Integration | Scene with bricks, auto-save completed | 1. Close browser tab normally 2. Reopen app | Resume prompt appears; data intact | NFR-REL-001 | P0 |
| T-BE-REL-002-01 | App recovers from WebGL context loss | Integration | Scene with bricks rendered | 1. Simulate WebGL context loss event 2. Wait for recovery | Scene re-renders with all bricks intact; no crash | NFR-REL-002 | P0 |

---

## 10. Maintainability Test Specs

| ID | Description | Type | Preconditions | Steps | Expected Result | Related NFR | Priority |
|----|-------------|------|---------------|-------|-----------------|-------------|----------|
| T-BE-MAINT-001-01 | State logic unit test coverage meets threshold | CI | Full test suite run | 1. Run Vitest with coverage 2. Check state logic coverage | ≥60% line coverage for state management modules | NFR-MAINT-001 | P0 |
| T-FE-MAINT-001-01 | Frontend component test coverage meets threshold | CI | Full test suite run | 1. Run Vitest with coverage 2. Check component coverage | ≥50% line coverage for React components | NFR-MAINT-001 | P0 |
| T-BE-MAINT-002-01 | TypeScript strict mode passes with zero errors | CI | Full codebase | 1. Run `tsc --strict --noEmit` | Zero TypeScript errors | NFR-MAINT-002 | P0 |
| T-BE-MAINT-002-02 | No `any` types in production code | CI | Full codebase | 1. Run ESLint with no-explicit-any rule | Zero `any` type violations in src/ | NFR-MAINT-002 | P0 |

---

## 11. FR/NFR → Test ID Traceability Matrix

| FR/NFR | Test IDs |
|--------|----------|
| FR-SCENE-001 | T-BE-SCENE-001-01, T-BE-SCENE-001-02, T-E2E-SCENE-001-01 |
| FR-SCENE-002 | T-BE-SCENE-002-01, T-BE-SCENE-002-02 |
| FR-SCENE-003 | T-BE-SCENE-003-01 |
| FR-BRICK-001 | T-BE-BRICK-001-01, T-BE-BRICK-001-02, T-BE-BRICK-001-03, T-E2E-BRICK-001-01 |
| FR-BRICK-002 | T-BE-BRICK-002-01, T-BE-BRICK-002-02, T-E2E-BRICK-002-01 |
| FR-BRICK-003 | T-BE-BRICK-003-01, T-BE-BRICK-003-02, T-E2E-BRICK-001-01 |
| FR-BRICK-004 | T-BE-BRICK-004-01, T-BE-BRICK-004-02, T-E2E-BRICK-004-01 |
| FR-EDIT-001 | T-BE-EDIT-001-01, T-BE-EDIT-001-02, T-BE-EDIT-001-03, T-E2E-EDIT-001-01 |
| FR-EDIT-002 | T-BE-EDIT-002-01, T-BE-EDIT-002-02, T-E2E-EDIT-001-01 |
| FR-EDIT-003 | T-BE-EDIT-003-01, T-BE-EDIT-003-02, T-BE-EDIT-003-03, T-BE-EDIT-003-04, T-E2E-EDIT-003-01 |
| FR-CAM-001 | T-FE-CAM-001-01, T-FE-CAM-001-02, T-E2E-CAM-001-01 |
| FR-CAM-002 | T-FE-CAM-002-01 |
| FR-PERS-001 | T-BE-PERS-001-01, T-BE-PERS-001-02, T-BE-PERS-001-03, T-E2E-PERS-001-01 |
| FR-PERS-002 | T-BE-PERS-002-01, T-BE-PERS-002-02, T-BE-PERS-002-03, T-BE-PERS-002-04, T-FE-PERS-002-01, T-FE-PERS-002-02, T-E2E-PERS-001-01 |
| FR-EXPORT-001 | T-BE-EXPORT-001-01, T-BE-EXPORT-001-02, T-BE-EXPORT-001-03, T-E2E-EXPORT-001-01 |
| FR-EXPORT-002 | T-BE-EXPORT-002-01, T-BE-EXPORT-002-02, T-BE-EXPORT-002-03, T-BE-EXPORT-002-04, T-E2E-EXPORT-001-01 |
| FR-UI-001 | T-FE-UI-001-01, T-FE-UI-001-02, T-FE-UI-001-03, T-FE-UI-001-04, T-E2E-UI-001-01 |
| FR-UI-002 | T-FE-UI-002-01, T-FE-UI-002-02, T-FE-UI-002-03, T-FE-UI-002-04, T-FE-UI-002-05 |
| FR-UI-003 | T-FE-UI-003-01, T-FE-UI-003-02 |
| FR-PERF-001 | T-PERF-PERF-001-01, T-PERF-PERF-001-02, T-PERF-PERF-001-03 |
| NFR-PERF-001 | T-PERF-PERF-001-01, T-PERF-PERF-001-02, T-PERF-PERF-001-03 |
| NFR-PERF-002 | T-PERF-PERF-002-01 |
| NFR-PERF-003 | T-PERF-PERF-003-01 |
| NFR-SCALE-001 | T-PERF-SCALE-001-01, T-PERF-SCALE-001-02 |
| NFR-SEC-001 | T-SEC-SEC-001-01, T-SEC-SEC-001-02, T-SEC-SEC-001-03, T-SEC-SEC-001-04 |
| NFR-SEC-002 | T-SEC-SEC-002-01, T-SEC-SEC-002-02 |
| NFR-A11Y-001 | T-A11Y-A11Y-001-01, T-A11Y-A11Y-001-02, T-A11Y-A11Y-001-03, T-A11Y-A11Y-001-04 |
| NFR-A11Y-002 | T-A11Y-A11Y-002-01, T-A11Y-A11Y-002-02 |
| NFR-REL-001 | T-BE-REL-001-01, T-BE-REL-001-02 |
| NFR-REL-002 | T-BE-REL-002-01 |
| NFR-MAINT-001 | T-BE-MAINT-001-01, T-FE-MAINT-001-01 |
| NFR-MAINT-002 | T-BE-MAINT-002-01, T-BE-MAINT-002-02 |

---

## 12. Test Coverage Targets

| Area | Minimum Coverage | Governance Depth |
|------|-----------------|------------------|
| Backend / state logic overall | 60% | Lightweight |
| Frontend components overall | 50% | Lightweight |
| E2E critical-path coverage | Key user journeys | Lightweight |
| Performance test pass rate | 100% of NFR thresholds | Lightweight |
| Security scan pass | Required | Lightweight |
| Accessibility compliance | WCAG 2.1 AA (non-3D UI) | Lightweight |

---

## 13. Test Maintenance

When adding new tests:

1. Assign a unique Test ID following the `T-<DOMAIN>-<FR_ID>-<SEQ>` convention.
2. Add to the appropriate section in this document.
3. Update the traceability matrix (Section 11).
4. Reference the Test ID in the test code.

When removing tests:

1. Document why in the PR description.
2. Mark as deprecated in this document (do not delete).
3. Update the traceability matrix.

When FRs are added or modified:

1. Add or update corresponding test cases.
2. Ensure every new FR has at least one T-* test case before Gate 2 re-approval.
3. Test plan version must track PRD version.