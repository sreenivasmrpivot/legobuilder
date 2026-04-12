/**
 * crashRecovery.spec.ts
 * NFR-REL-001 — Auto-Save Crash Durability
 *
 * Test IDs:
 *   T-BE-REL-001-01: Browser crash — 50 bricks survive, resume prompt shown
 *   T-BE-REL-001-02: Graceful close — no resume prompt on reopen
 *   T-BE-REL-001-01b: Discard path — prompt dismissed, scene empty
 *
 * LLD v2.0 verified facts:
 *   - browser.close({ runBeforeUnload: false }) is the ONLY correct crash simulation
 *   - page.close() and context.close() both fire beforeunload — DO NOT USE
 *   - AUTO_SAVE_INTERVAL_MS = 30_000 (30 seconds)
 *   - data-testid selectors: resume-prompt, resume-prompt-brick-count,
 *     resume-btn, discard-btn, add-brick-btn, brick-instance, auto-save-status
 */
import { test, expect, chromium, type Browser, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Constants (LLD v2.0 verified)
// ---------------------------------------------------------------------------

const AUTO_SAVE_INTERVAL_MS = 30_000;
const APP_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Adds `count` bricks to the scene via the UI.
 * Uses data-testid="add-brick-btn" as confirmed in LLD v2.0.
 */
async function addBricks(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.getByTestId('add-brick-btn').click();
    // Small delay to avoid overwhelming the UI
    if (i % 10 === 9) {
      await page.waitForTimeout(100);
    }
  }
}

/**
 * Waits for the auto-save indicator to show 'Saved'.
 * Uses data-testid="auto-save-status" as confirmed in LLD v2.0.
 */
async function waitForAutoSave(page: Page): Promise<void> {
  await page.getByTestId('auto-save-status').waitFor({ state: 'visible' });
  await expect(page.getByTestId('auto-save-status')).toContainText('Saved', {
    timeout: AUTO_SAVE_INTERVAL_MS + 10_000, // interval + 10s buffer
  });
}

/**
 * Counts the number of brick instances in the scene.
 * Uses data-testid="brick-instance" as confirmed in LLD v2.0.
 */
async function getBrickCount(page: Page): Promise<number> {
  const bricks = page.getByTestId('brick-instance');
  return bricks.count();
}

// ---------------------------------------------------------------------------
// T-BE-REL-001-01: Browser crash — 50 bricks survive, resume prompt shown
// ---------------------------------------------------------------------------

test.describe('T-BE-REL-001-01: Browser crash recovery', () => {
  test('50 bricks survive browser crash — resume prompt shown with correct count', async () => {
    // Phase 1: Launch browser, add 50 bricks, wait for auto-save
    const browser1: Browser = await chromium.launch();
    const context1 = await browser1.newContext();
    const page1 = await context1.newPage();

    await page1.goto(APP_URL);
    await page1.waitForLoadState('networkidle');

    // Add 50 bricks
    await addBricks(page1, 50);

    // Wait for auto-save to complete
    await waitForAutoSave(page1);

    // Verify IDB has the snapshot before crash
    const snapshotExists = await page1.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const req = indexedDB.open('legobuilder-v1');
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          const tx = db.transaction('auto-save-meta', 'readonly');
          const store = tx.objectStore('auto-save-meta');
          const getAllReq = store.getAll();
          getAllReq.onsuccess = () => {
            const records = getAllReq.result as Array<{ status: string }>;
            resolve(records.some((r) => r.status === 'active'));
          };
        };
        req.onerror = () => resolve(false);
      });
    });
    expect(snapshotExists).toBe(true);

    // Phase 2: CRASH — browser.close({ runBeforeUnload: false })
    // This is the ONLY correct way to simulate a crash in Playwright.
    // It skips beforeunload, leaving session status='active' in IDB.
    await browser1.close({ runBeforeUnload: false });

    // Phase 3: Relaunch browser — fresh process, same IDB data
    const browser2: Browser = await chromium.launch();
    const context2 = await browser2.newContext();
    const page2 = await context2.newPage();

    await page2.goto(APP_URL);
    await page2.waitForLoadState('networkidle');

    // Assert: Resume prompt is visible
    await expect(page2.getByTestId('resume-prompt')).toBeVisible({
      timeout: 10_000,
    });

    // Assert: Brick count in prompt matches 50
    const brickCountText = await page2.getByTestId('resume-prompt-brick-count').textContent();
    expect(brickCountText).toContain('50');

    // Phase 4: Click Resume — verify 50 bricks are restored
    await page2.getByTestId('resume-btn').click();

    // Wait for scene to render
    await page2.waitForTimeout(1000);

    const restoredBrickCount = await getBrickCount(page2);
    expect(restoredBrickCount).toBe(50);

    await browser2.close();
  });
});

// ---------------------------------------------------------------------------
// T-BE-REL-001-02: Graceful close — no resume prompt on reopen
// ---------------------------------------------------------------------------

test.describe('T-BE-REL-001-02: Graceful close — no false-positive recovery', () => {
  test('graceful tab close does not trigger resume prompt on reopen', async () => {
    // Phase 1: Launch browser, add bricks, wait for auto-save
    const browser1: Browser = await chromium.launch();
    const context1 = await browser1.newContext();
    const page1 = await context1.newPage();

    await page1.goto(APP_URL);
    await page1.waitForLoadState('networkidle');

    // Add some bricks
    await addBricks(page1, 10);

    // Wait for auto-save
    await waitForAutoSave(page1);

    // Phase 2: GRACEFUL close — fires beforeunload, marks session as 'closed'
    // This is a normal tab close (NOT a crash).
    // context.close() fires beforeunload — correct for graceful close test.
    await context1.close();
    await browser1.close();

    // Phase 3: Relaunch browser
    const browser2: Browser = await chromium.launch();
    const context2 = await browser2.newContext();
    const page2 = await context2.newPage();

    await page2.goto(APP_URL);
    await page2.waitForLoadState('networkidle');

    // Assert: Resume prompt is NOT visible (session was gracefully closed)
    await page2.waitForTimeout(2000); // Give app time to check IDB
    const resumePromptVisible = await page2.getByTestId('resume-prompt').isVisible();
    expect(resumePromptVisible).toBe(false);

    await browser2.close();
  });
});

// ---------------------------------------------------------------------------
// T-BE-REL-001-01b: Discard path — prompt dismissed, scene empty
// ---------------------------------------------------------------------------

test.describe('T-BE-REL-001-01b: Discard path — resume prompt dismissed', () => {
  test('clicking Discard dismisses prompt and starts with empty scene', async () => {
    // Phase 1: Create a crash scenario
    const browser1: Browser = await chromium.launch();
    const context1 = await browser1.newContext();
    const page1 = await context1.newPage();

    await page1.goto(APP_URL);
    await page1.waitForLoadState('networkidle');

    await addBricks(page1, 20);
    await waitForAutoSave(page1);

    // Crash the browser
    await browser1.close({ runBeforeUnload: false });

    // Phase 2: Relaunch and discard recovery
    const browser2: Browser = await chromium.launch();
    const context2 = await browser2.newContext();
    const page2 = await context2.newPage();

    await page2.goto(APP_URL);
    await page2.waitForLoadState('networkidle');

    // Assert: Resume prompt is visible
    await expect(page2.getByTestId('resume-prompt')).toBeVisible({
      timeout: 10_000,
    });

    // Click Discard
    await page2.getByTestId('discard-btn').click();

    // Assert: Resume prompt is dismissed
    await expect(page2.getByTestId('resume-prompt')).not.toBeVisible();

    // Assert: Scene is empty (no bricks from the crashed session)
    await page2.waitForTimeout(500);
    const brickCount = await getBrickCount(page2);
    expect(brickCount).toBe(0);

    await browser2.close();
  });
});
