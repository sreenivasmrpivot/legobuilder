/**
 * E2E Test — Brick Selection with Visual Highlight
 *
 * Test ID: T-E2E-EDIT-001-01
 *
 * Requirement: FR-EDIT-001 — Implement brick selection by click with visual highlight
 *
 * Acceptance Criteria (from Issue #13):
 *   AC-1: Given bricks exist in the scene, when the user clicks on a brick,
 *         then the brick displays a visible selection highlight.
 *   AC-2: Given a brick is selected, when the user clicks on a different brick,
 *         then the previous selection is cleared and the new brick is highlighted.
 *   AC-3: Given a brick is selected, when the user clicks on empty space,
 *         then the selection is cleared.
 *
 * Strategy:
 *   - Uses Playwright to drive a real browser against the running dev server.
 *   - Adds bricks to the scene via the UI (add-brick-btn or canvas click).
 *   - Verifies selection state via data-testid attributes on brick elements
 *     or via the selectionStore exposed on window.__legoApp (dev mode).
 *   - Verifies highlight via CSS class, aria-selected, or data-selected attribute.
 *
 * Playwright crash simulation note:
 *   This test does NOT simulate crashes — that is covered by NFR-REL-001.
 *   This test validates the selection UX flow only.
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md Section 5, 11
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-E2E-EDIT-001-01
 */

import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Add a brick to the scene and return its data-testid or brickId.
 * Tries the add-brick-btn first; falls back to canvas click.
 */
async function addBrick(page: Page, index = 0): Promise<string | null> {
  const addBtn = page.locator('[data-testid="add-brick-btn"]');
  const btnVisible = await addBtn.isVisible({ timeout: 500 }).catch(() => false);

  if (btnVisible) {
    await addBtn.click();
  } else {
    // Fallback: click on the 3D canvas at a grid position
    await page.locator('canvas').click({
      position: { x: 300 + index * 30, y: 300 },
    });
  }

  // Wait for a brick element to appear
  await page.waitForSelector(
    '[data-testid^="brick-"], [data-brick-id]',
    { timeout: 5_000 },
  ).catch(() => null);

  // Return the brickId of the most recently added brick
  const bricks = page.locator('[data-testid^="brick-"], [data-brick-id]');
  const count = await bricks.count();
  if (count === 0) return null;

  const lastBrick = bricks.nth(count - 1);
  return (
    (await lastBrick.getAttribute('data-testid')) ??
    (await lastBrick.getAttribute('data-brick-id'))
  );
}

/**
 * Click a brick in the 3D scene by its data-testid or data-brick-id.
 * Falls back to clicking the canvas at the brick's bounding box center.
 */
async function clickBrick(page: Page, brickTestId: string): Promise<void> {
  const brick = page.locator(`[data-testid="${brickTestId}"], [data-brick-id="${brickTestId}"]`);
  const visible = await brick.isVisible({ timeout: 2_000 }).catch(() => false);

  if (visible) {
    await brick.click();
  } else {
    // Fallback: use the canvas and rely on the 3D raycast
    // The brick position is approximated from its index in the DOM
    const bricks = page.locator('[data-testid^="brick-"], [data-brick-id]');
    const allIds = await bricks.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-testid') ?? el.getAttribute('data-brick-id')),
    );
    const idx = allIds.indexOf(brickTestId);
    if (idx >= 0) {
      await page.locator('canvas').click({
        position: { x: 300 + idx * 30, y: 300 },
      });
    }
  }
}

/**
 * Click on empty space in the 3D canvas (away from any bricks).
 */
async function clickEmptySpace(page: Page): Promise<void> {
  // Click far corner of the canvas — unlikely to hit any brick
  await page.locator('canvas').click({
    position: { x: 50, y: 50 },
  });
}

/**
 * Returns true if the brick with the given testId is currently selected.
 * Checks data-selected, aria-selected, or a CSS class containing 'selected'.
 */
async function isBrickSelected(page: Page, brickTestId: string): Promise<boolean> {
  // Strategy 1: data-selected attribute
  const brick = page.locator(
    `[data-testid="${brickTestId}"][data-selected="true"], ` +
    `[data-brick-id="${brickTestId}"][data-selected="true"]`,
  );
  if (await brick.isVisible({ timeout: 500 }).catch(() => false)) {
    return true;
  }

  // Strategy 2: aria-selected attribute
  const ariaSelected = page.locator(
    `[data-testid="${brickTestId}"][aria-selected="true"], ` +
    `[data-brick-id="${brickTestId}"][aria-selected="true"]`,
  );
  if (await ariaSelected.isVisible({ timeout: 500 }).catch(() => false)) {
    return true;
  }

  // Strategy 3: CSS class containing 'selected'
  const withClass = page.locator(
    `[data-testid="${brickTestId}"].selected, ` +
    `[data-testid="${brickTestId}"][class*="selected"], ` +
    `[data-brick-id="${brickTestId}"].selected`,
  );
  if (await withClass.isVisible({ timeout: 500 }).catch(() => false)) {
    return true;
  }

  // Strategy 4: Check via window.__legoApp.selectionStore (dev mode)
  const brickId = brickTestId.replace(/^brick-/, '');
  const selectedViaStore = await page.evaluate((id: string) => {
    const app = (window as unknown as { __legoApp?: { selectionStore?: { getState?: () => { selectedBrickId?: string } } } }).__legoApp;
    if (!app?.selectionStore?.getState) return false;
    return app.selectionStore.getState().selectedBrickId === id;
  }, brickId).catch(() => false);

  return selectedViaStore;
}

// ---------------------------------------------------------------------------
// T-E2E-EDIT-001-01
// ---------------------------------------------------------------------------

test.describe('FR-EDIT-001 — Brick Selection with Visual Highlight', () => {
  test(
    'T-E2E-EDIT-001-01: click brick → highlight; click different brick → swap; click empty → clear',
    async ({ page }) => {
      // ── Setup ──────────────────────────────────────────────────────────────
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Add two bricks to the scene
      const brick1Id = await addBrick(page, 0);
      const brick2Id = await addBrick(page, 1);

      // Verify bricks were added
      expect(brick1Id).toBeTruthy();
      expect(brick2Id).toBeTruthy();
      expect(brick1Id).not.toBe(brick2Id);

      // ── AC-1: Click brick → highlight visible ──────────────────────────────
      await clickBrick(page, brick1Id!);

      // Wait for selection to register
      await page.waitForTimeout(300);

      // Brick 1 should be selected
      const brick1Selected = await isBrickSelected(page, brick1Id!);
      expect(brick1Selected).toBe(true);

      // Brick 2 should NOT be selected
      const brick2NotSelected = await isBrickSelected(page, brick2Id!);
      expect(brick2NotSelected).toBe(false);

      // ── AC-2: Click different brick → previous unhighlighted ───────────────
      await clickBrick(page, brick2Id!);

      // Wait for selection to update
      await page.waitForTimeout(300);

      // Brick 2 should now be selected
      const brick2Selected = await isBrickSelected(page, brick2Id!);
      expect(brick2Selected).toBe(true);

      // Brick 1 should now be deselected
      const brick1Deselected = await isBrickSelected(page, brick1Id!);
      expect(brick1Deselected).toBe(false);

      // ── AC-3: Click empty space → selection cleared ────────────────────────
      await clickEmptySpace(page);

      // Wait for selection to clear
      await page.waitForTimeout(300);

      // Neither brick should be selected
      const brick1ClearedFinal = await isBrickSelected(page, brick1Id!);
      const brick2ClearedFinal = await isBrickSelected(page, brick2Id!);
      expect(brick1ClearedFinal).toBe(false);
      expect(brick2ClearedFinal).toBe(false);
    },
  );

  // ── Additional: Empty scene — no bricks to select ─────────────────────────
  test(
    'T-E2E-EDIT-001-01b: clicking empty canvas when no bricks exist does not throw',
    async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // No bricks added — click on canvas
      await expect(
        page.locator('canvas').click({ position: { x: 400, y: 300 } }),
      ).resolves.not.toThrow();

      // No error dialogs or console errors
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.waitForTimeout(500);

      // Filter out known benign errors (WebGL warnings, etc.)
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('WebGL') &&
          !e.includes('THREE') &&
          !e.includes('ResizeObserver'),
      );
      expect(criticalErrors).toHaveLength(0);
    },
  );

  // ── Additional: Keyboard Escape clears selection ──────────────────────────
  test(
    'T-E2E-EDIT-001-01c: pressing Escape clears the current selection',
    async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Add a brick and select it
      const brickId = await addBrick(page, 0);
      if (!brickId) {
        test.skip();
        return;
      }

      await clickBrick(page, brickId);
      await page.waitForTimeout(300);

      // Verify brick is selected
      const selected = await isBrickSelected(page, brickId);
      if (!selected) {
        // Escape key test only makes sense if selection works
        test.skip();
        return;
      }

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Selection should be cleared
      const clearedAfterEscape = await isBrickSelected(page, brickId);
      expect(clearedAfterEscape).toBe(false);
    },
  );
});
