/**
 * NFR-REL-001 — Auto-Save Crash Durability
 * Playwright E2E tests
 *
 * Test IDs:
 *   T-BE-REL-001-01: 50 bricks survive browser crash, resume prompt shown
 *   T-BE-REL-001-02: Graceful close: resume prompt shown on reopen
 *
 * Crash simulation: browser.close({ runBeforeUnload: false })
 * This skips the beforeunload handler, leaving the session status='active'
 * in IndexedDB — the correct crash simulation per LLD Section 6.4.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Iteration: 3
 */
import { test, expect, chromium, type BrowserContext } from '@playwright/test';

const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const BRICK_COUNT = 50;

/**
 * Helper: add N bricks to the scene via the palette UI
 */
async function addBricks(context: BrowserContext, count: number): Promise<void> {
  const page = await context.newPage();
  await page.goto(APP_URL);
  await page.waitForSelector('[data-testid="add-brick-btn"]', { timeout: 10_000 });

  for (let i = 0; i < count; i++) {
    await page.click('[data-testid="add-brick-btn"]');
  }

  // Wait for auto-save to complete (status indicator shows 'saved')
  await page.waitForSelector('[data-testid="auto-save-status"][data-status="saved"]', {
    timeout: 15_000,
  });

  return page.close();
}

/**
 * T-BE-REL-001-01: 50 bricks survive browser crash
 *
 * Given a scene with 50 bricks and auto-save completed,
 * when the browser process is killed (runBeforeUnload: false),
 * then reopening the app shows all 50 bricks via the resume prompt.
 */
test('T-BE-REL-001-01: 50 bricks survive browser crash — resume prompt shown', async () => {
  // Launch a dedicated browser instance for crash simulation
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Step 1: Add 50 bricks and wait for auto-save
  await addBricks(context, BRICK_COUNT);

  // Step 2: Simulate crash — close browser WITHOUT running beforeunload
  // This leaves the IndexedDB session status='active' (orphaned session)
  await browser.close({ runBeforeUnload: false } as Parameters<typeof browser.close>[0]);

  // Step 3: Reopen the app in a new browser instance (same IDB origin)
  const browser2 = await chromium.launch();
  const context2 = await browser2.newContext();
  const page2 = await context2.newPage();

  await page2.goto(APP_URL);

  // Step 4: Resume prompt should appear
  await expect(page2.getByTestId('resume-prompt')).toBeVisible({ timeout: 10_000 });

  // Step 5: Brick count should show 50
  const brickCountEl = page2.getByTestId('resume-prompt-brick-count');
  await expect(brickCountEl).toBeVisible();
  const brickCountText = await brickCountEl.textContent();
  expect(brickCountText).toContain(String(BRICK_COUNT));

  // Step 6: Click Resume and verify bricks are restored
  await page2.getByTestId('resume-btn').click();
  await expect(page2.getByTestId('resume-prompt')).not.toBeVisible({ timeout: 5_000 });

  const brickInstances = page2.locator('[data-testid="brick-instance"]');
  await expect(brickInstances).toHaveCount(BRICK_COUNT, { timeout: 10_000 });

  await browser2.close();
});

/**
 * T-BE-REL-001-02: Graceful close — resume prompt on reopen
 *
 * Given a scene with bricks and auto-save completed,
 * when the browser tab is closed normally (beforeunload fires),
 * then reopening the app does NOT show the resume prompt
 * (session was marked closed).
 */
test('T-BE-REL-001-02: Graceful close — no resume prompt on reopen', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Step 1: Add bricks and wait for auto-save
  await addBricks(context, 10);

  // Step 2: Close gracefully — beforeunload fires, session marked 'closed'
  await browser.close(); // Default: runBeforeUnload: true

  // Step 3: Reopen the app
  const browser2 = await chromium.launch();
  const context2 = await browser2.newContext();
  const page2 = await context2.newPage();

  await page2.goto(APP_URL);
  await page2.waitForLoadState('networkidle');

  // Step 4: Resume prompt should NOT appear (graceful close)
  await expect(page2.getByTestId('resume-prompt')).not.toBeVisible({ timeout: 5_000 });

  await browser2.close();
});

/**
 * T-BE-REL-001-01b: Discard path — resume prompt dismissed
 *
 * Given the resume prompt is shown after a crash,
 * when the user clicks Discard,
 * then the prompt is dismissed and the scene is empty.
 */
test('T-BE-REL-001-01b: Discard path — resume prompt dismissed, scene empty', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Step 1: Add bricks and crash
  await addBricks(context, 5);
  await browser.close({ runBeforeUnload: false } as Parameters<typeof browser.close>[0]);

  // Step 2: Reopen and verify resume prompt
  const browser2 = await chromium.launch();
  const context2 = await browser2.newContext();
  const page2 = await context2.newPage();

  await page2.goto(APP_URL);
  await expect(page2.getByTestId('resume-prompt')).toBeVisible({ timeout: 10_000 });

  // Step 3: Click Discard
  await page2.getByTestId('discard-btn').click();

  // Step 4: Prompt dismissed, scene is empty
  await expect(page2.getByTestId('resume-prompt')).not.toBeVisible({ timeout: 5_000 });
  const brickInstances = page2.locator('[data-testid="brick-instance"]');
  await expect(brickInstances).toHaveCount(0, { timeout: 5_000 });

  await browser2.close();
});
