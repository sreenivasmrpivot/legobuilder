/**
 * Utility: PerformanceMonitor
 *
 * Tracks FPS, operation latency, and memory usage.
 * See TECHNICAL_ARCHITECTURE.md Section 7 for metrics definitions.
 */

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private currentFps = 60;

  /**
   * Call once per animation frame to update FPS counter.
   */
  tick(): void {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  getFPS(): number {
    return this.currentFps;
  }

  /**
   * Measure the execution time of a synchronous operation.
   * Logs a warning if it exceeds one frame (16ms at 60 FPS).
   */
  measureOperation<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    if (duration > 16) {
      console.warn(`[perf] ${name} took ${duration.toFixed(1)}ms`);
    }
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();
