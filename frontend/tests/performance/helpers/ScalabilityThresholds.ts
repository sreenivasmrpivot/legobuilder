/**
 * ScalabilityThresholds.ts
 * NFR-SCALE-001 — Threshold constants for scalability performance tests.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SCALE-001
 * Spectra-Tests: T-PERF-SCALE-001-01, T-PERF-SCALE-001-02
 */

/** Performance thresholds for NFR-SCALE-001 */
export const THRESHOLDS = {
  /** Minimum acceptable frame rate in frames per second */
  MIN_FPS: 60,

  /** Maximum acceptable JS heap usage in megabytes at 500 bricks */
  MAX_HEAP_MB: 200,
} as const;

/**
 * Milliseconds to wait after brick population before measuring FPS.
 * Allows InstancedMesh matrix updates to flush and render loop to reach
 * steady state.
 */
export const STABILIZATION_DELAY_MS = 500;

/**
 * Milliseconds over which to collect FPS samples.
 * At 60 FPS this captures ≥120 frames for statistical stability.
 */
export const MEASUREMENT_WINDOW_MS = 2000;

/** Brick counts to test per NFR-SCALE-001 acceptance criteria */
export const BRICK_COUNTS = [100, 250, 500] as const;
export type BrickCount = (typeof BRICK_COUNTS)[number];

/**
 * Grid width used for deterministic brick placement.
 * 25 columns × 20 rows = 500 max bricks on a single layer.
 */
export const GRID_WIDTH = 25;

/** Spacing between bricks in world units (2 studs per 2×4 brick width) */
export const BRICK_SPACING = 2;
