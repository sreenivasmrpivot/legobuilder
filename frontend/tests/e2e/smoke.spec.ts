/**
 * E2E smoke test: Application loads
 *
 * Verifies the application loads successfully and renders
 * the main viewport and UI elements.
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('application loads and renders viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  });

  test('toolbar is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
  });

  test('brick palette is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="brick-palette"]')).toBeVisible();
  });
});
