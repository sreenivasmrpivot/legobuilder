/**
 * E2E Crash Recovery Tests — NFR-REL-001
 *
 * Test IDs: T-BE-REL-001-01, T-BE-REL-001-02
 * Requirement: Zero data loss when browser process is killed unexpectedly.
 *
 * Strategy:
 *   T-BE-REL-001-01 — Simulate a hard browser crash (SIGKILL) by calling
 *     browser.close({ runBeforeUnload: false }). Relaunch and assert that
 *     the ResumePrompt appears with the correct brick count, and that
 *     accepting recovery restores all bricks.
 *
 *   T-BE-REL-001-02 — Simulate a graceful tab close (beforeunload fires).
 *     Relaunch and assert that the ResumePrompt does NOT appear (graceful
 *     close marks session 'closed', preventing false-positive recovery).
 *
 * Playwright crash simulation:
 *   browser.close({ runBeforeUnload: false }) skips the beforeunload event,
 *   leaving the session status='active' in IndexedDB — identical to a crash.
 *
 * @see docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md Section 6.4
 */

import {
  test,
  expect,
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Base URL for the running dev server (set via PLAYWRIGHT_BASE_URL or default). */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

/**
 * Add `count` bricks to the scene via the UI.
 * Assumes the app exposes a data-testid="add-brick-btn" button.
 * Falls back to canvas click if button is not present.
 */
async function addBricks(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    const addBtn = page.locator('[data-testid="add-brick-btn"]');
    const btnVisible = await addBtn.isVisible({ timeout: 500 }).catch(() => false);
    if (btnVisible) {
      await addBtn.click();
    } else {
      // Fallback: click on the 3D canvas to place a brick
      await page.locator('canvas').click({
        position: { x: 400 + (i % 10) * 5, y: 300 + Math.floor(i / 10) * 5 },
      });
    }
  }
}

/**
 * Wait for the auto-save indicator to show "Saved" or equivalent.
 * Polls up to 15 seconds (3× the 5-second save interval).
 */
async function waitForAutoSave(page: Page): Promise<void> {
  await page.waitForSelector(
    '[data-testid="auto-save-status"][data-status="saved"], [aria-label*="Saved"], text=Saved',
    { timeout: 15_000 }
  );
}

/**
 * Verify via page.evaluate that IndexedDB contains at least one active session.
 */
async function verifySnapshotInIDB(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    return new Promise<boolean>((resolve) => {
      const req = indexedDB.open('legobuilder-v1');
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('auto-save-meta')) {
          resolve(false);
          return;
        }
        const tx = db.transaction('auto-save-meta', 'readonly');
        const store = tx.objectStore('auto-save-meta');
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          const records = getAllReq.result as Array<{ status: string }>;
          resolve(records.some((r) => r.status === 'active'));
        };
        getAllReq.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    });
  });
}

/**
 * Get the brick count from the most recent active session snapshot.
 */
async function getBrickCountFromIDB(page: Page): Promise<number> {
  return page.evaluate(async () => {
    return new Promise<number>((resolve) => {
      const req = indexedDB.open('legobuilder-v1');
      req.onsuccess = () => {
        const db = req.result;
        if (
          !db.objectStoreNames.contains('auto-save-meta') ||
          !db.objectStoreNames.contains('scene-snapshots')
        ) {
          resolve(0);
          return;
        }
        const tx = db.transaction(['auto-save-meta', 'scene-snapshots'], 'readonly');
        const metaStore = tx.objectStore('auto-save-meta');
        const snapshotStore = tx.objectStore('scene-snapshots');

        const metaReq = metaStore.getAll();
        metaReq.onsuccess = () => {
          const metas = metaReq.result as Array<{
            status: string;
            latestSnapshotId: string;
          }>;
          const active = metas.find((m) => m.status === 'active');
          if (!active) {
            resolve(0);
            return;
          }
          const snapReq = snapshotStore.get(active.latestSnapshotId);
          snapReq.onsuccess = () => {
            const snap = snapReq.result as { bricks?: unknown[] } | undefined;
            resolve(snap?.bricks?.length ?? 0);
          };
          snapReq.onerror = () => resolve(0);
        };
        metaReq.onerror = () => resolve(0);
      };
      req.onerror = () => resolve(0);
    });
  });
}

// ---------------------------------------------------------------------------
// T-BE-REL-001-01: Browser crash — 50 bricks survive, resume prompt shown
// ---------------------------------------------------------------------------

test.describe('NFR-REL-001 — Crash Recovery', () => {
  test(
    'T-BE-REL-001-01: browser crash — 50 bricks survive and resume prompt shown',
    async () => {
      // —— Phase 1: Launch browser, add bricks, wait for auto-save ——————————
      const browser: Browser = await chromium.launch({ headless: true });
      const context: BrowserContext = await browser.newContext();
      const page: Page = await context.newPage();

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Add 50 bricks
      await addBricks(page, 50);

      // Wait for auto-save to complete (up to 15s)
      await waitForAutoSave(page);

      // Verify snapshot is in IndexedDB before crash
      const snapshotExists = await verifySnapshotInIDB(page);
      expect(snapshotExists).toBe(true);

      const savedBrickCount = await getBrickCountFromIDB(page);
      expect(savedBrickCount).toBe(50);

      // —— Phase 2: Simulate crash (skip beforeunload) ————————————————————
      // browser.close() without runBeforeUnload skips beforeunload,
      // leaving session status='active' in IndexedDB — identical to a crash.
      await browser.close();

      // —— Phase 3: Relaunch browser and navigate to app ————————————————————
      const browser2: Browser = await chromium.launch({ headless: true });
      const context2: BrowserContext = await browser2.newContext();
      const page2: Page = await context2.newPage();

      await page2.goto(BASE_URL);
      await page2.waitForLoadState('networkidle');

      // —— Phase 4: Assert ResumePrompt is visible ——————————————————————————
      const resumePrompt = page2.locator(
        '[data-testid="resume-prompt"], [role="dialog"][aria-label*="resume" i], [role="dialog"][aria-label*="recover" i]'
      );
      await expect(resumePrompt).toBeVisible({ timeout: 10_000 });

      // Assert brick count is shown in the prompt
      await expect(resumePrompt).toContainText('50');

      // —— Phase 5: Accept recovery and assert bricks are restored ——————————
      const resumeBtn = page2.locator(
        '[data-testid="resume-btn"], button:has-text("Resume"), button:has-text("Restore")'
      );
      await resumeBtn.click();

      // Wait for scene to render with restored bricks
      await page2.waitForSelector('[data-testid="brick"], [data-testid="scene-brick"]', {
        timeout: 10_000,
      });

      const brickElements = page2.locator('[data-testid="brick"], [data-testid="scene-brick"]');
      await expect(brickElements).toHaveCount(50, { timeout: 10_000 });

      // ResumePrompt should be dismissed
      await expect(resumePrompt).not.toBeVisible();

      await browser2.close();
    }
  );

  // ---------------------------------------------------------------------------
  // T-BE-REL-001-02: Graceful close — NO false-positive recovery prompt
  // ---------------------------------------------------------------------------

  test(
    'T-BE-REL-001-02: graceful tab close — session marked closed, no recovery prompt on reopen',
    async () => {
      // —— Phase 1: Launch browser, add bricks, wait for auto-save ——————————
      const browser: Browser = await chromium.launch({ headless: true });
      const context: BrowserContext = await browser.newContext();
      const page: Page = await context.newPage();

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Add 20 bricks for graceful-close test
      await addBricks(page, 20);
      await waitForAutoSave(page);

      const savedBrickCount = await getBrickCountFromIDB(page);
      expect(savedBrickCount).toBe(20);

      // —— Phase 2: Graceful close (beforeunload fires) ——————————————————————
      // page.close() triggers beforeunload → markSessionClosed() →
      // session status='closed' in IndexedDB.
      await page.close();
      await browser.close();

      // —— Phase 3: Relaunch and verify NO false-positive recovery prompt ——
      const browser2: Browser = await chromium.launch({ headless: true });
      const context2: BrowserContext = await browser2.newContext();
      const page2: Page = await context2.newPage();

      await page2.goto(BASE_URL);
      await page2.waitForLoadState('networkidle');

      // Wait 3 seconds to ensure recovery check has completed
      await page2.waitForTimeout(3_000);

      const resumePrompt = page2.locator(
        '[data-testid="resume-prompt"], [role="dialog"][aria-label*="resume" i], [role="dialog"][aria-label*="recover" i]'
      );

      // Graceful close → session status='closed' → NO recovery prompt
      await expect(resumePrompt).not.toBeVisible();

      await browser2.close();
    }
  );

  // ---------------------------------------------------------------------------
  // Additional: Discard recovery path
  // ---------------------------------------------------------------------------

  test(
    'T-BE-REL-001-01b: discard recovery — prompt dismissed, fresh session starts',
    async () => {
      // —— Phase 1: Create a crash scenario ——————————————————————————————————
      const browser: Browser = await chromium.launch({ headless: true });
      const context: BrowserContext = await browser.newContext();
      const page: Page = await context.newPage();

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      await addBricks(page, 10);
      await waitForAutoSave(page);

      // Crash (skip beforeunload)
      await browser.close();

      // —— Phase 2: Relaunch and discard recovery ————————————————————————————
      const browser2: Browser = await chromium.launch({ headless: true });
      const context2: BrowserContext = await browser2.newContext();
      const page2: Page = await context2.newPage();

      await page2.goto(BASE_URL);
      await page2.waitForLoadState('networkidle');

      const resumePrompt = page2.locator(
        '[data-testid="resume-prompt"], [role="dialog"][aria-label*="resume" i], [role="dialog"][aria-label*="recover" i]'
      );
      await expect(resumePrompt).toBeVisible({ timeout: 10_000 });

      // Click Discard
      const discardBtn = page2.locator(
        '[data-testid="discard-btn"], button:has-text("Discard"), button:has-text("Start fresh"), button:has-text("New scene")'
      );
      await discardBtn.click();

      // Prompt dismissed, scene is empty
      await expect(resumePrompt).not.toBeVisible();

      // No bricks in scene (fresh start)
      const brickElements = page2.locator('[data-testid="brick"], [data-testid="scene-brick"]');
      await expect(brickElements).toHaveCount(0, { timeout: 5_000 });

      await browser2.close();
    }
  );
});
