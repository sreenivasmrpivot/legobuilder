/**
 * performanceMonitor.ts
 *
 * Dev/test-only performance monitoring utility.
 * Exposed on `window.__perfMonitor` exclusively in non-production builds.
 * Zero production bundle impact — tree-shaken by Vite in production mode.
 *
 * NFR-PERF-001 | T-PERF-PERF-001-01, T-PERF-PERF-001-02, T-PERF-PERF-001-03
 */

export interface FrameSample {
  /** Timestamp from requestAnimationFrame (ms, monotonic) */
  timestamp: number;
  /** Frame duration in ms (delta from previous frame) */
  frameDuration: number;
}

export interface PerfMonitorState {
  samples: FrameSample[];
  isRecording: boolean;
  rafHandle: number | null;
  warmupFrames: number;
  framesCollected: number;
}

export interface PerfMonitorAPI {
  /** Start recording frame times. Discards first `warmupFrames` frames. */
  start(warmupFrames?: number): void;
  /** Stop recording and return all collected samples. */
  stop(): FrameSample[];
  /** Clear all samples without stopping. */
  reset(): void;
  /** Compute p95 frame time (ms) from collected samples. */
  p95(): number;
  /** Compute p99 frame time (ms) from collected samples. */
  p99(): number;
  /** Return mean frame time (ms). */
  mean(): number;
  /** Return all raw samples. */
  getSamples(): FrameSample[];
  /** True if currently recording. */
  readonly isRecording: boolean;
}

/**
 * Creates a performance monitor instance.
 * The default warmup of 60 frames discards scene-initialization overhead.
 */
export function createPerfMonitor(): PerfMonitorAPI {
  const state: PerfMonitorState = {
    samples: [],
    isRecording: false,
    rafHandle: null,
    warmupFrames: 60,
    framesCollected: 0,
  };

  let lastTimestamp: number | null = null;

  function tick(timestamp: number): void {
    if (!state.isRecording) return;

    if (lastTimestamp !== null) {
      const delta = timestamp - lastTimestamp;

      if (state.framesCollected >= state.warmupFrames) {
        state.samples.push({ timestamp, frameDuration: delta });
      }
      state.framesCollected++;
    }

    lastTimestamp = timestamp;
    state.rafHandle = requestAnimationFrame(tick);
  }

  function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
  }

  const api: PerfMonitorAPI = {
    start(warmupFrames = 60): void {
      if (state.isRecording) return;
      state.warmupFrames = warmupFrames;
      state.samples = [];
      state.framesCollected = 0;
      lastTimestamp = null;
      state.isRecording = true;
      state.rafHandle = requestAnimationFrame(tick);
    },

    stop(): FrameSample[] {
      state.isRecording = false;
      if (state.rafHandle !== null) {
        cancelAnimationFrame(state.rafHandle);
        state.rafHandle = null;
      }
      return [...state.samples];
    },

    reset(): void {
      state.samples = [];
      state.framesCollected = 0;
      lastTimestamp = null;
    },

    p95(): number {
      const durations = state.samples
        .map((s) => s.frameDuration)
        .sort((a, b) => a - b);
      return percentile(durations, 95);
    },

    p99(): number {
      const durations = state.samples
        .map((s) => s.frameDuration)
        .sort((a, b) => a - b);
      return percentile(durations, 99);
    },

    mean(): number {
      if (state.samples.length === 0) return 0;
      const sum = state.samples.reduce((acc, s) => acc + s.frameDuration, 0);
      return sum / state.samples.length;
    },

    getSamples(): FrameSample[] {
      return [...state.samples];
    },

    get isRecording(): boolean {
      return state.isRecording;
    },
  };

  return api;
}

// ---------------------------------------------------------------------------
// Dev/test-only global registration
// Tree-shaken by Vite in production (import.meta.env.PROD === true).
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    __perfMonitor?: PerfMonitorAPI;
  }
}

if (typeof window !== 'undefined' && !import.meta.env.PROD) {
  window.__perfMonitor = createPerfMonitor();
}
