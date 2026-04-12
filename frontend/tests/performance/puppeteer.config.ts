/**
 * puppeteer.config.ts
 *
 * Puppeteer launch configuration for jest-puppeteer.
 * SwiftShader WebGL flags enable headless WebGL rendering in CI
 * without a physical GPU.
 *
 * NFR-PERF-001 | T-PERF-PERF-001-01, T-PERF-PERF-001-02, T-PERF-PERF-001-03
 */

const BASE_URL = process.env.PERF_BASE_URL ?? 'http://localhost:5173';

module.exports = {
  launch: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // SwiftShader: software WebGL renderer for headless CI
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--disable-gpu-sandbox',
      // Prevent background throttling from skewing frame times
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
    ],
    defaultViewport: {
      width: 1280,
      height: 720,
    },
  },
  server: {
    command: `echo "Server expected at ${BASE_URL}"`,
    port: parseInt(new URL(BASE_URL).port || '5173', 10),
    launchTimeout: 10_000,
    debug: false,
  },
};
