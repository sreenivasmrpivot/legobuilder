/**
 * teardown.ts — Global teardown for NFR-PERF-001 performance test suite
 *
 * Logs a summary after all performance tests complete.
 */

export default async function globalTeardown(): Promise<void> {
  console.log('\n[NFR-PERF-001] Performance test suite complete.');
  console.log('[NFR-PERF-001] Results written to frontend/test-results/performance/junit.xml');
}
