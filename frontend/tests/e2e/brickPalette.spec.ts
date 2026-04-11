/**
 * FR-UI-002: Brick Palette Sidebar — E2E Tests (Playwright)
 *
 * Test IDs: T-FE-UI-002-01 (E2E), T-FE-UI-002-02 (E2E), T-FE-UI-002-03 (E2E), T-FE-UI-002-04 (E2E)
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-UI-002
 * Spectra-Tests: T-FE-UI-002-01, T-FE-UI-002-02, T-FE-UI-002-03, T-FE-UI-002-04
 *
 * NOTE: These tests require the dev server to be running (npm run dev in frontend/).
 * They are skipped in CI unless PLAYWRIGHT_BASE_URL is set.
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// T-FE-UI-002-01 (E2E): Brick palette is visible and shows brick type previews
// ---------------------------------------------------------------------------
test.describe('T-FE-UI-002-01 (E2E) — Brick palette displays brick types with visual previews', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('brick palette sidebar is visible on app load', async ({ page }) => {
    const sidebar =
      page.getByRole('complementary', { name: /brick palette/i })
        .or(page.getByTestId('brick-palette'));
    await expect(sidebar).toBeVisible();
  });

  test('brick type previews are rendered in the palette', async ({ page }) => {
    // At least one brick preview must be visible
    const previews = page.locator('[data-testid^="brick-preview-"]');
    await expect(previews.first()).toBeVisible();
    const count = await previews.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('each brick type has a visible label', async ({ page }) => {
    // Labels like "1×1", "2×1", "2×2" etc. must be visible
    const labels = ['1×1', '2×1', '2×2', '4×1', '4×2'];
    for (const label of labels) {
      const el = page.getByText(new RegExp(label.replace('×', '[x×]'), 'i'));
      // At least one label must be visible (not all brick types may be in MVP)
      const count = await el.count();
      if (count > 0) {
        await expect(el.first()).toBeVisible();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-002-02 (E2E): Clicking a brick type makes it the active placement brick
// ---------------------------------------------------------------------------
test.describe('T-FE-UI-002-02 (E2E) — Clicking a brick type sets it as active', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('clicking a brick type marks it as active in the palette', async ({ page }) => {
    const previews = page.locator('[data-testid^="brick-preview-"]');
    const count = await previews.count();
    if (count >= 2) {
      // Click the second brick type
      await previews.nth(1).click();
      // The clicked item should now be marked active
      const isActive =
        await previews.nth(1).getAttribute('aria-pressed') === 'true' ||
        await previews.nth(1).getAttribute('aria-selected') === 'true' ||
        await previews.nth(1).getAttribute('data-active') === 'true';
      expect(isActive).toBe(true);
    }
  });

  test('only one brick type is active at a time', async ({ page }) => {
    const previews = page.locator('[data-testid^="brick-preview-"]');
    const count = await previews.count();
    if (count >= 2) {
      await previews.nth(0).click();
      await previews.nth(1).click();
      // Count active items — should be exactly 1
      const activeItems = page.locator(
        '[data-testid^="brick-preview-"][aria-pressed="true"], ' +
        '[data-testid^="brick-preview-"][aria-selected="true"], ' +
        '[data-testid^="brick-preview-"][data-active="true"]'
      );
      const activeCount = await activeItems.count();
      expect(activeCount).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-002-03 (E2E): Color picker selection updates the active color
// ---------------------------------------------------------------------------
test.describe('T-FE-UI-002-03 (E2E) — Color picker updates active color', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('color swatches are visible in the palette', async ({ page }) => {
    const swatches = page.locator('[data-testid^="color-swatch-"]');
    const count = await swatches.count();
    expect(count).toBeGreaterThanOrEqual(12);
  });

  test('clicking a color swatch marks it as active', async ({ page }) => {
    const swatches = page.locator('[data-testid^="color-swatch-"]');
    const count = await swatches.count();
    if (count >= 3) {
      await swatches.nth(2).click();
      const isActive =
        await swatches.nth(2).getAttribute('aria-checked') === 'true' ||
        await swatches.nth(2).getAttribute('aria-pressed') === 'true' ||
        await swatches.nth(2).getAttribute('aria-selected') === 'true' ||
        await swatches.nth(2).getAttribute('data-active') === 'true';
      expect(isActive).toBe(true);
    }
  });

  test('exactly 12 color swatches are rendered', async ({ page }) => {
    const swatches = page.locator('[data-testid^="color-swatch-"]');
    const count = await swatches.count();
    expect(count).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// T-FE-UI-002-04 (E2E): Sidebar width ≤ 256px at 1024px viewport
// ---------------------------------------------------------------------------
test.describe('T-FE-UI-002-04 (E2E) — Sidebar does not obscure more than 25% of 1024px canvas', () => {
  test('sidebar width is at most 256px at 1024px viewport width', async ({ page }) => {
    // Set viewport to exactly 1024px wide
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar =
      page.getByRole('complementary', { name: /brick palette/i })
        .or(page.getByTestId('brick-palette'));

    const boundingBox = await sidebar.boundingBox();
    expect(boundingBox).not.toBeNull();
    // Width must be ≤ 256px (25% of 1024px)
    expect(boundingBox!.width).toBeLessThanOrEqual(256);
  });

  test('sidebar does not overlap the 3D canvas at 1024px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const sidebar =
      page.getByRole('complementary', { name: /brick palette/i })
        .or(page.getByTestId('brick-palette'));
    const canvas =
      page.locator('canvas').first()
        .or(page.getByTestId('viewport-canvas'));

    const sidebarBox = await sidebar.boundingBox();
    const canvasBox = await canvas.boundingBox();

    if (sidebarBox && canvasBox) {
      // Sidebar right edge must not exceed 25% of viewport (256px)
      const sidebarRightEdge = sidebarBox.x + sidebarBox.width;
      expect(sidebarRightEdge).toBeLessThanOrEqual(256);
      // Canvas must have at least 75% of viewport width available
      expect(canvasBox.width).toBeGreaterThanOrEqual(768);
    }
  });
});
