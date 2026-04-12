/**
 * scalability.test.ts
 * NFR-SCALE-001 — Scene Scalability Performance Test Suite
 *
 * Validates that the LegoBuilder 3D scene supports up to 500 bricks
 * without performance degradation:
 *   - Frame rate >= 60 FPS at 100, 250, and 500 bricks
 *   - JS heap < 200 MB at 500 bricks
 *
 * Test Cases:
 *   T-PERF-SCALE-001-01: 100 and 250 brick FPS >= 60
 *   T-PERF-SCALE-001-02: 500 brick FPS >= 60 + heap < 200 MB
 *
 * Architecture:
 *   - Puppeteer launches headless Chrome with CDP enabled
 *   - BrickScenePopulator injects bricks via window.__sceneStore
 *   - FPSMeter measures rAF-based FPS over a 2000ms window
 *   - HeapMonitor reads heap via CDP Runtime.getHeapUsage
 *
 * Prerequisites:
 *   - App must be built and served at http://localhost:5173
 *   - window.__sceneStore must be exposed in non-production mode
 *   - <Canvas data-testid="scene-canvas"> must be present
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SCALE-001
 * Spectra-Tests: T-PERF-SCALE-001-01, T-PERF-SCALE-001-02
 */

import {
  describe,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
} from 'vitest';
import puppeteer, {
  type Browser,
  type Page,
  type CDPSession,
} from 'puppeteer';
import { BrickScenePopulator } from './helpers/BrickScenePopulator.js';
import { FPSMeter } from './helpers/FPSMeter.js';
import { HeapMonitor } from './helpers/HeapMonitor.js';
import {
  THRESHOLDS,
  STABILIZATION_DELAY_MS,
  MEASUREMENT_WINDOW_MS,
} from './helpers/ScalabilityThresholds.js';
import {
  assertNoDuplicatePositions,
  generateBrickFixtures,
} from './fixtures/brickFixtures.js';

// ─── App URL ──────────────────────────────────────────────────────────────────
const APP_URL = process.env['APP_URL'] ?? 'http://localhost:5173';
const SCENE_CANVAS_SELECTOR = '[data-testid="scene-canvas"]';
const PAGE_LOAD_TIMEOUT_MS = 30_000;

// ─── Test Scenarios ───────────────────────────────────────────────────────────
const SCENARIOS = [
  { brickCount: 100, testId: 'T-PERF-SCALE-001-01', checkHeap: false },
  { brickCount: 250, testId: 'T-PERF-SCALE-001-01', checkHeap: false },
  { brickCount: 500, testId: 'T-PERF-SCALE-001-02', checkHeap: true },
] as const;

// ─── Suite ────────────────────────────────────────────────────────────────────
describe('NFR-SCALE-001: Scene Scalability — 100/250/500 Bricks', () => {
  let browser: Browser;
  let page: Page;
  let cdpSession: CDPSession;

  // ── Fixture integrity checks (no browser needed) ──────────────────────────
  test('fixture integrity: no duplicate positions in 500-brick set', () => {
    const fixtures = generateBrickFixtures(500);
    expect(() => assertNoDuplicatePositions(fixtures)).not.toThrow();
    expect(fixtures).toHaveLength(500);
  });

  test('fixture integrity: 100-brick set is a prefix of 500-brick set', () => {
    const fixtures100 = generateBrickFixtures(100);
    const fixtures500 = generateBrickFixtures(500);
    for (let i = 0; i < 100; i++) {
      expect(fixtures100[i].id).toBe(fixtures500[i].id);
      expect(fixtures100[i].position).toEqual(fixtures500[i].position);
    }
  });

  // ── Browser lifecycle ─────────────────────────────────────────────────────
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-gpu',
        '--use-gl=swiftshader', // Software rendering fallback for CI
        '--disable-dev-shm-usage',
        '--disable-extensions',
      ],
    });
  }, 30_000);

  afterAll(async () => {
    try {
      await browser.close();
    } catch {
      // Browser may already be closed
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    cdpSession = await page.target().createCDPSession();

    // Navigate to app and wait for scene canvas
    await page.goto(APP_URL, {
      waitUntil: 'networkidle0',
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });

    await page
      .waitForSelector(SCENE_CANVAS_SELECTOR, {
        timeout: PAGE_LOAD_TIMEOUT_MS,
      })
      .catch(() => {
        throw new Error(
          `Scene canvas not found at selector "${SCENE_CANVAS_SELECTOR}" — ` +
            'app may have crashed or <Canvas data-testid="scene-canvas"> is missing'
        );
      });
  }, 35_000);

  afterEach(async () => {
    try {
      await cdpSession.detach();
    } catch {
      // Already detached
    }
    try {
      await page.close();
    } catch {
      // Already closed
    }
  });

  // ── Performance scenarios ─────────────────────────────────────────────────
  test.each(SCENARIOS)(
    '$testId: $brickCount bricks — FPS >= 60 (heap check: $checkHeap)',
    async ({ brickCount, checkHeap }) => {
      // ── Phase 1: Populate scene ──────────────────────────────────────────
      await BrickScenePopulator.populate(page, brickCount);

      // Verify brick count was applied
      const actualCount = await BrickScenePopulator.getBrickCount(page);
      expect(actualCount).toBe(brickCount);

      // ── Phase 2: Stabilize render loop ───────────────────────────────────
      await new Promise<void>((resolve) =>
        setTimeout(resolve, STABILIZATION_DELAY_MS)
      );

      // ── Phase 3: Measure FPS ─────────────────────────────────────────────
      const fpsMeasurement = await FPSMeter.measure(page, MEASUREMENT_WINDOW_MS);

      console.log(
        `[NFR-SCALE-001] ${brickCount} bricks: ` +
          `avgFPS=${fpsMeasurement.averageFPS.toFixed(1)}, ` +
          `frames=${fpsMeasurement.frameCount}, ` +
          `elapsed=${fpsMeasurement.elapsedMs.toFixed(0)}ms, ` +
          `minInterval=${fpsMeasurement.minFrameIntervalMs.toFixed(1)}ms, ` +
          `maxInterval=${fpsMeasurement.maxFrameIntervalMs.toFixed(1)}ms`
      );

      expect(
        fpsMeasurement.averageFPS,
        `FPS degradation at ${brickCount} bricks: ` +
          `measured ${fpsMeasurement.averageFPS.toFixed(1)} FPS, ` +
          `threshold is ${THRESHOLDS.MIN_FPS} FPS. ` +
          `Frames captured: ${fpsMeasurement.frameCount} over ` +
          `${fpsMeasurement.elapsedMs.toFixed(0)}ms. ` +
          `Check InstancedMesh batching (FR-SCENE-002) for regressions.`
      ).toBeGreaterThanOrEqual(THRESHOLDS.MIN_FPS);

      // ── Phase 4: Measure heap (500-brick tier only) ──────────────────────
      if (checkHeap) {
        const heapMeasurement = await HeapMonitor.measure(cdpSession);

        console.log(
          `[NFR-SCALE-001] ${brickCount} bricks heap: ` +
            `used=${heapMeasurement.usedMB.toFixed(1)}MB, ` +
            `total=${heapMeasurement.totalMB.toFixed(1)}MB, ` +
            `usage=${heapMeasurement.usagePercent.toFixed(1)}%`
        );

        expect(
          heapMeasurement.usedMB,
          `Memory exceeded at ${brickCount} bricks: ` +
            `measured ${heapMeasurement.usedMB.toFixed(1)}MB, ` +
            `threshold is ${THRESHOLDS.MAX_HEAP_MB}MB. ` +
            `Check for memory leaks in sceneStore or InstancedMesh buffers.`
        ).toBeLessThan(THRESHOLDS.MAX_HEAP_MB);
      }

      // ── Phase 5: Clean up scene for next test ────────────────────────────
      await BrickScenePopulator.clear(page);
    },
    // Per-test timeout: browser startup (30s) + population + stabilization +
    // measurement window (2s) + heap measurement + cleanup
    90_000
  );
});
