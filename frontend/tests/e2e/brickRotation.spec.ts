/**
 * E2E tests for FR-BRICK-004: Brick rotation in 90-degree increments
 *
 * Test ID: T-E2E-BRICK-004-01
 *
 * Covers:
 *   - R key rotates placement preview 90° clockwise
 *   - R key rotates a selected placed brick 90° in place
 *   - Rotation state is reflected in the UI (data-testid attributes)
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-BRICK-004
 * Spectra-Tests: T-E2E-BRICK-004-01
 */

import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openApp(page: Page) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="canvas-container"]', {
    timeout: 15_000,
  });
}

async function selectBrickFromCatalog(
  page: Page,
  catalogId = '2x4',
) {
  // Open the brick catalog panel
  const catalogBtn = page.locator('[data-testid="catalog-panel-toggle"]');
  if (await catalogBtn.isVisible()) await catalogBtn.click();

  // Click the brick entry in the catalog
  await page.locator(`[data-testid="catalog-item-${catalogId}"]`).click();
}

async function getPlacementRotation(page: Page): Promise<number> {
  const indicator = page.locator('[data-testid="placement-rotation-indicator"]');
  const text = await indicator.getAttribute('data-rotation');
  return text ? parseInt(text, 10) : 0;
}

async function clickCanvas(page: Page, x = 400, y = 300) {
  await page.locator('[data-testid="canvas-container"]').click({ position: { x, y } });
}

// ---------------------------------------------------------------------------
// T-E2E-BRICK-004-01 — Placement preview rotation
// ---------------------------------------------------------------------------
test.describe('T-E2E-BRICK-004-01 — Brick rotation via R key', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('placement preview starts at 0° rotation', async ({ page }) => {
    await selectBrickFromCatalog(page);
    const rotation = await getPlacementRotation(page);
    expect(rotation).toBe(0);
  });

  test('pressing R rotates placement preview to 90°', async ({ page }) => {
    await selectBrickFromCatalog(page);
    await page.keyboard.press('r');
    const rotation = await getPlacementRotation(page);
    expect(rotation).toBe(90);
  });

  test('pressing R twice rotates placement preview to 180°', async ({ page }) => {
    await selectBrickFromCatalog(page);
    await page.keyboard.press('r');
    await page.keyboard.press('r');
    const rotation = await getPlacementRotation(page);
    expect(rotation).toBe(180);
  });

  test('pressing R three times rotates placement preview to 270°', async ({ page }) => {
    await selectBrickFromCatalog(page);
    await page.keyboard.press('r');
    await page.keyboard.press('r');
    await page.keyboard.press('r');
    const rotation = await getPlacementRotation(page);
    expect(rotation).toBe(270);
  });

  test('pressing R four times wraps placement preview back to 0°', async ({ page }) => {
    await selectBrickFromCatalog(page);
    for (let i = 0; i < 4; i++) await page.keyboard.press('r');
    const rotation = await getPlacementRotation(page);
    expect(rotation).toBe(0);
  });

  test('placed brick inherits the rotation from the preview', async ({ page }) => {
    await selectBrickFromCatalog(page);
    // Rotate preview to 90°
    await page.keyboard.press('r');
    // Place the brick
    await clickCanvas(page);

    // The most recently placed brick should show rotation=90
    const placedBrick = page
      .locator('[data-testid^="placed-brick-"]')
      .last();
    await expect(placedBrick).toBeVisible();
    const brickRotation = await placedBrick.getAttribute('data-rotation');
    expect(brickRotation).toBe('90');
  });

  test('R key rotates a selected placed brick 90° in place', async ({ page }) => {
    // Place a brick at 0°
    await selectBrickFromCatalog(page);
    await clickCanvas(page);

    // Click the placed brick to select it
    const placedBrick = page
      .locator('[data-testid^="placed-brick-"]')
      .last();
    await placedBrick.click();

    // Verify it is selected
    await expect(
      page.locator('[data-testid="selection-indicator"]'),
    ).toBeVisible();

    // Press R to rotate the selected placed brick
    await page.keyboard.press('r');

    // Rotation should now be 90°
    const brickRotation = await placedBrick.getAttribute('data-rotation');
    expect(brickRotation).toBe('90');
  });

  test('rotating a placed brick does not change its grid position', async ({ page }) => {
    await selectBrickFromCatalog(page);
    await clickCanvas(page, 400, 300);

    const placedBrick = page
      .locator('[data-testid^="placed-brick-"]')
      .last();
    const positionBefore = await placedBrick.getAttribute('data-position');

    // Select and rotate
    await placedBrick.click();
    await page.keyboard.press('r');

    const positionAfter = await placedBrick.getAttribute('data-position');
    expect(positionAfter).toBe(positionBefore);
  });

  test('R key is a no-op when no brick is selected or in placement mode', async ({ page }) => {
    // No brick selected, no placement mode active
    // Pressing R should not throw or cause visible errors
    await page.keyboard.press('r');
    await expect(page.locator('[data-testid="error-overlay"]')).not.toBeVisible();
  });

  test('rotation is preserved after undo/redo cycle', async ({ page }) => {
    await selectBrickFromCatalog(page);
    await clickCanvas(page);

    const placedBrick = page
      .locator('[data-testid^="placed-brick-"]')
      .last();
    await placedBrick.click();
    await page.keyboard.press('r'); // rotate to 90°

    // Undo the rotation
    await page.keyboard.press('Control+z');
    const rotationAfterUndo = await placedBrick.getAttribute('data-rotation');
    expect(rotationAfterUndo).toBe('0');

    // Redo the rotation
    await page.keyboard.press('Control+y');
    const rotationAfterRedo = await placedBrick.getAttribute('data-rotation');
    expect(rotationAfterRedo).toBe('90');
  });
});
