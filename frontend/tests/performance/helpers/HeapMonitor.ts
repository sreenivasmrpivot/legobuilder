/**
 * HeapMonitor.ts
 * NFR-SCALE-001 — Chrome DevTools Protocol heap memory measurement utility.
 *
 * Uses CDP Runtime.getHeapUsage to measure current JS heap usage in MB.
 * Forces a GC cycle before measurement for deterministic results.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SCALE-001
 * Spectra-Tests: T-PERF-SCALE-001-02
 */

import type { CDPSession } from 'puppeteer';

export interface HeapMeasurement {
  /** Used heap size in megabytes (after GC) */
  usedMB: number;
  /** Total allocated heap size in megabytes */
  totalMB: number;
  /** Percentage of total heap that is used */
  usagePercent: number;
}

export class HeapMonitor {
  /**
   * Measure current JS heap usage in MB via Chrome DevTools Protocol.
   *
   * Triggers a GC cycle first for deterministic measurement, then reads
   * heap usage via Runtime.getHeapUsage.
   *
   * @param session  CDP session attached to the Puppeteer page
   * @returns        HeapMeasurement with usedMB, totalMB, usagePercent
   */
  static async measure(session: CDPSession): Promise<HeapMeasurement> {
    // Force GC to get a clean heap snapshot.
    // HeapProfiler.collectGarbage is more reliable than Runtime.collectGarbage
    // for triggering a full GC cycle.
    try {
      await session.send('HeapProfiler.collectGarbage');
    } catch {
      // HeapProfiler may not be enabled; fall back silently.
      // Measurement will still proceed without GC.
    }

    const { usedSize, totalSize } = await session.send('Runtime.getHeapUsage');

    const usedMB = usedSize / (1024 * 1024);
    const totalMB = totalSize / (1024 * 1024);
    const usagePercent = totalMB > 0 ? (usedMB / totalMB) * 100 : 0;

    return { usedMB, totalMB, usagePercent };
  }
}
