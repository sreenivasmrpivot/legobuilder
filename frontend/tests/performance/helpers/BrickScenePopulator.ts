/**
 * BrickScenePopulator.ts
 * NFR-SCALE-001 — Programmatic brick placement helper.
 *
 * Injects brick placement commands directly into sceneStore via
 * page.evaluate() — no UI interaction required. Uses a deterministic
 * 25×20 grid layout to avoid collision detection overhead and ensure
 * reproducible scene geometry.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SCALE-001
 * Spectra-Tests: T-PERF-SCALE-001-01, T-PERF-SCALE-001-02
 */

import type { Page } from 'puppeteer';
import { GRID_WIDTH, BRICK_SPACING } from './ScalabilityThresholds.js';

export class BrickScenePopulator {
  /**
   * Populate the scene with `count` bricks via sceneStore.addBrick().
   *
   * Bricks are placed on a deterministic grid:
   *   x = (i % GRID_WIDTH) * BRICK_SPACING
   *   z = Math.floor(i / GRID_WIDTH) * BRICK_SPACING
   *   y = 0 (ground plane)
   *
   * @param page       Puppeteer Page instance with app loaded
   * @param count      Number of bricks to place (100 | 250 | 500)
   * @throws           If sceneStore is not exposed on window
   */
  static async populate(page: Page, count: number): Promise<void> {
    await page.evaluate(
      (brickCount: number, gridWidth: number, spacing: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const store = (window as any).__sceneStore;
        if (!store) {
          throw new Error(
            'sceneStore not exposed on window — check main.tsx test mode guard. ' +
              'Expected: if (import.meta.env.MODE !== "production") { (window as any).__sceneStore = useSceneStore; }'
          );
        }

        const state = store.getState();
        if (typeof state.addBrick !== 'function') {
          throw new Error(
            'sceneStore.addBrick is not a function — verify sceneStore API contract'
          );
        }

        for (let i = 0; i < brickCount; i++) {
          state.addBrick({
            id: `perf-brick-${i}`,
            type: '2x4',
            color: '#FF0000',
            position: {
              x: (i % gridWidth) * spacing,
              y: 0,
              z: Math.floor(i / gridWidth) * spacing,
            },
            rotation: { x: 0, y: 0, z: 0 },
          });
        }
      },
      count,
      GRID_WIDTH,
      BRICK_SPACING
    );
  }

  /**
   * Clear all bricks from the scene via sceneStore.clearScene().
   *
   * @param page  Puppeteer Page instance with app loaded
   * @throws      If sceneStore is not exposed on window
   */
  static async clear(page: Page): Promise<void> {
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (window as any).__sceneStore;
      if (!store) {
        throw new Error('sceneStore not exposed on window');
      }
      store.getState().clearScene();
    });
  }

  /**
   * Return the current brick count from sceneStore.
   *
   * @param page  Puppeteer Page instance with app loaded
   * @returns     Number of bricks currently in the scene
   */
  static async getBrickCount(page: Page): Promise<number> {
    return page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (window as any).__sceneStore;
      if (!store) return 0;
      const state = store.getState();
      return Array.isArray(state.bricks) ? state.bricks.length : 0;
    });
  }
}
