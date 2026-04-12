/**
 * vitest.performance.config.ts
 * NFR-SCALE-001 — Vitest configuration for performance tests.
 *
 * Isolated from the unit test suite to:
 *   - Avoid inflating coverage numbers with performance scaffolding
 *   - Allow longer timeouts for browser-based tests
 *   - Run tests sequentially (Puppeteer sessions cannot be parallelized)
 *
 * Usage:
 *   npx vitest run --config vitest.performance.config.ts
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SCALE-001
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'performance',
    include: ['tests/performance/**/*.test.ts'],
    exclude: ['tests/unit/**', 'tests/component/**', 'tests/e2e/**'],

    // Puppeteer runs in Node context — not jsdom
    environment: 'node',

    // 2 minutes per test: browser startup + 3 brick tiers + measurement windows
    testTimeout: 120_000,

    // 30 seconds for browser launch in beforeAll
    hookTimeout: 30_000,

    // Verbose output for CI diagnostics + JSON for artifact upload
    reporters: ['verbose', 'json'],
    outputFile: 'tests/performance/scalability-report.json',

    // No coverage — performance tests are not coverage targets
    coverage: { enabled: false },

    // Sequential execution — Puppeteer browser sessions cannot be safely
    // parallelized across workers
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
