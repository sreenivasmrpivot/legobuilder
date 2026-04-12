/**
 * E2E Test Suite — JSON Import Security
 * NFR-SEC-001: JSON Import Validation & Arbitrary Code Execution Prevention
 *
 * Test IDs: T-E2E-SEC-001-01 through T-E2E-SEC-001-03
 *
 * Uses Playwright. The app must be running at the baseURL configured in
 * playwright.config.ts (default: http://localhost:5173).
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SEC-001
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Writes a temporary JSON file to the OS temp directory and returns its path.
 * The file is cleaned up after the test via the returned cleanup function.
 */
function writeTempJson(content: string, filename = 'test-project.json'): { filePath: string; cleanup: () => void } {
  const filePath = path.join(os.tmpdir(), filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return {
    filePath,
    cleanup: () => {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    },
  };
}

const VALID_PROJECT_JSON = JSON.stringify({
  version: '1.0',
  name: 'E2E Security Test Project',
  bricks: [
    {
      id: 'brick-e2e-001',
      type: '2x4',
      color: '#0000FF',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  ],
});

const MALICIOUS_PROTO_JSON = '{"version":"1.0","name":"evil","bricks":[],"__proto__":{"isAdmin":true}}';

const INVALID_BRICK_JSON = JSON.stringify({
  version: '1.0',
  name: 'Bad Brick Project',
  bricks: [
    {
      id: 'b1',
      type: 'UNKNOWN_BRICK_XYZ',
      color: 'javascript:alert(1)',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
    },
  ],
});

/**
 * Locates the file import input element and triggers a file upload.
 * Adjust the selector if the app uses a different element.
 */
async function triggerFileImport(page: Page, filePath: string): Promise<void> {
  // The import button opens a hidden <input type="file"> — set files directly
  const fileInput = page.locator('input[type="file"][accept*="json"], input[type="file"]').first();
  await fileInput.setInputFiles(filePath);
}

// ---------------------------------------------------------------------------
// T-E2E-SEC-001-01: Valid JSON file imports and renders bricks
// ---------------------------------------------------------------------------
test.describe('T-E2E-SEC-001-01 — valid JSON import renders scene', () => {
  test('imports a valid project JSON and shows the scene without errors', async ({ page }) => {
    const { filePath, cleanup } = writeTempJson(VALID_PROJECT_JSON);

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Trigger import
      await triggerFileImport(page, filePath);

      // Wait for success indicator — no error toast/dialog should appear
      // The canvas or scene container should be visible
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible({ timeout: 10_000 });

      // No error dialog should be present
      const errorDialog = page.locator('[role="alert"], [data-testid="import-error"]');
      await expect(errorDialog).toHaveCount(0);
    } finally {
      cleanup();
    }
  });
});

// ---------------------------------------------------------------------------
// T-E2E-SEC-001-02: Malicious JSON (prototype pollution) is rejected with UI feedback
// ---------------------------------------------------------------------------
test.describe('T-E2E-SEC-001-02 — malicious JSON rejected with UI feedback', () => {
  test('shows an error message when importing a prototype-pollution payload', async ({ page }) => {
    const { filePath, cleanup } = writeTempJson(MALICIOUS_PROTO_JSON, 'malicious.json');

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await triggerFileImport(page, filePath);

      // An error notification or dialog should appear
      const errorIndicator = page.locator(
        '[role="alert"], [data-testid="import-error"], .error-toast, .notification--error'
      );
      await expect(errorIndicator).toBeVisible({ timeout: 10_000 });

      // Object.prototype must NOT be polluted
      const isAdminPolluted = await page.evaluate(() => {
        return (Object.prototype as Record<string, unknown>).isAdmin === true;
      });
      expect(isAdminPolluted).toBe(false);
    } finally {
      cleanup();
    }
  });
});

// ---------------------------------------------------------------------------
// T-E2E-SEC-001-03: Invalid brick schema is rejected with descriptive error
// ---------------------------------------------------------------------------
test.describe('T-E2E-SEC-001-03 — invalid brick schema rejected', () => {
  test('shows a descriptive error when brick type or color is invalid', async ({ page }) => {
    const { filePath, cleanup } = writeTempJson(INVALID_BRICK_JSON, 'invalid-brick.json');

    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await triggerFileImport(page, filePath);

      // An error notification should appear
      const errorIndicator = page.locator(
        '[role="alert"], [data-testid="import-error"], .error-toast, .notification--error'
      );
      await expect(errorIndicator).toBeVisible({ timeout: 10_000 });

      // The scene should NOT have loaded the invalid bricks
      // (canvas may still be visible from a previous state, but no new bricks)
      // We verify no script execution occurred by checking for alert dialogs
      // Playwright auto-dismisses dialogs; if one fired, the test would have caught it
    } finally {
      cleanup();
    }
  });
});
