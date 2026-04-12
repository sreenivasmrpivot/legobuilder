/**
 * jest.performance.config.ts
 *
 * Isolated Jest configuration for NFR-PERF-001 performance tests.
 * Runs separately from the unit/integration suite to avoid timeout
 * interference and to allow Puppeteer-specific setup.
 *
 * Usage:
 *   npx jest --config frontend/jest.performance.config.ts
 *
 * CI usage:
 *   PERF_BASE_URL=http://localhost:5173 npx jest --config frontend/jest.performance.config.ts
 */

import type { Config } from 'jest';

const config: Config = {
  displayName: 'performance',
  preset: 'jest-puppeteer',
  testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: false,
      },
    ],
  },
  testTimeout: 30_000,
  globalSetup: '<rootDir>/tests/performance/setup.ts',
  globalTeardown: '<rootDir>/tests/performance/teardown.ts',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results/performance',
        outputName: 'junit.xml',
        classname: 'NFR-PERF-001',
        title: '≥60 FPS Frame Rate Performance',
      },
    ],
  ],
  // Puppeteer launch options are read by jest-puppeteer from puppeteer.config.ts
  // (see frontend/tests/performance/puppeteer.config.ts)
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  // Isolate from unit/integration suite
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tests/unit/',
    '<rootDir>/tests/component/',
    '<rootDir>/tests/e2e/',
  ],
  // Allow dynamic imports in unit sub-tests
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Fail fast on first threshold breach (CI regression guard)
  bail: 1,
};

export default config;
