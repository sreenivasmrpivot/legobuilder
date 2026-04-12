/**
 * setup.ts — Global setup for NFR-PERF-001 performance test suite
 *
 * Validates that the dev server is reachable before running any tests.
 * Exits with a clear error if the server is not available.
 */

import http from 'http';

const BASE_URL = process.env.PERF_BASE_URL ?? 'http://localhost:5173';

async function isServerReachable(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = http.get(
      {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname,
        timeout: 5000,
      },
      (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500);
        req.destroy();
      },
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

export default async function globalSetup(): Promise<void> {
  console.log(`\n[NFR-PERF-001] Performance test global setup`);
  console.log(`[NFR-PERF-001] Target URL: ${BASE_URL}`);

  const reachable = await isServerReachable(BASE_URL);

  if (!reachable) {
    console.error(
      `\n[NFR-PERF-001] ERROR: Dev server not reachable at ${BASE_URL}`,
    );
    console.error(
      '[NFR-PERF-001] Start the dev server with: cd frontend && npm run dev',
    );
    process.exit(1);
  }

  console.log(`[NFR-PERF-001] Dev server reachable ✓`);
  console.log(`[NFR-PERF-001] SwiftShader WebGL enabled for headless CI`);
  console.log(`[NFR-PERF-001] Threshold: p95 frame time < 16.7 ms (≥60 FPS)\n`);
}
