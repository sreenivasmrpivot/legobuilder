/**
 * FPSMeter.ts
 * NFR-SCALE-001 — requestAnimationFrame-based FPS measurement utility.
 *
 * Injects a rAF loop into the browser page context and collects frame
 * timestamps over a configurable measurement window. Returns the average
 * FPS over the window.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SCALE-001
 * Spectra-Tests: T-PERF-SCALE-001-01, T-PERF-SCALE-001-02
 */

import type { Page } from 'puppeteer';

export interface FPSMeasurement {
  /** Average FPS over the measurement window */
  averageFPS: number;
  /** Total number of frames captured */
  frameCount: number;
  /** Actual elapsed time in milliseconds */
  elapsedMs: number;
  /** Minimum inter-frame interval in ms (worst frame) */
  minFrameIntervalMs: number;
  /** Maximum inter-frame interval in ms (best frame) */
  maxFrameIntervalMs: number;
}

export class FPSMeter {
  /**
   * Measure FPS over `windowMs` milliseconds using requestAnimationFrame.
   *
   * Runs inside the browser context via page.evaluate(). The rAF loop
   * collects DOMHighResTimeStamp values and computes average FPS from
   * the total elapsed time and frame count.
   *
   * @param page      Puppeteer Page instance with app loaded
   * @param windowMs  Measurement window in milliseconds (default: 2000)
   * @returns         FPSMeasurement with averageFPS and diagnostics
   */
  static async measure(
    page: Page,
    windowMs: number = 2000
  ): Promise<FPSMeasurement> {
    return page.evaluate(
      (durationMs: number): Promise<FPSMeasurement> => {
        return new Promise((resolve) => {
          const timestamps: number[] = [];
          let rafId: number;
          const startTime = performance.now();

          function frame(ts: number): void {
            timestamps.push(ts);
            if (ts - startTime < durationMs) {
              rafId = requestAnimationFrame(frame);
            } else {
              cancelAnimationFrame(rafId);

              if (timestamps.length < 2) {
                resolve({
                  averageFPS: 0,
                  frameCount: timestamps.length,
                  elapsedMs: 0,
                  minFrameIntervalMs: 0,
                  maxFrameIntervalMs: 0,
                });
                return;
              }

              const elapsed =
                timestamps[timestamps.length - 1] - timestamps[0];
              const frameCount = timestamps.length - 1;
              const averageFPS = (frameCount / elapsed) * 1000;

              // Compute per-frame intervals for diagnostics
              let minInterval = Infinity;
              let maxInterval = 0;
              for (let i = 1; i < timestamps.length; i++) {
                const interval = timestamps[i] - timestamps[i - 1];
                if (interval < minInterval) minInterval = interval;
                if (interval > maxInterval) maxInterval = interval;
              }

              resolve({
                averageFPS,
                frameCount,
                elapsedMs: elapsed,
                minFrameIntervalMs: minInterval === Infinity ? 0 : minInterval,
                maxFrameIntervalMs: maxInterval,
              });
            }
          }

          requestAnimationFrame(frame);
        });
      },
      windowMs
    );
  }
}
