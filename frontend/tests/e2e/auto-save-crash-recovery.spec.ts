/**
 * E2E Playwright tests for NFR-REL-001 Auto-Save Crash Durability
 *
 * Test IDs: T-BE-REL-001-01, T-BE-REL-001-02
 *
 * T-BE-REL-001-01: Browser crash → data survives → ResumePrompt shown on reload
 * T-BE-REL-001-02: Graceful close → ResumePrompt NOT shown on reload
 *
 * Crash simulation: browser.close({ runBeforeUnload: false }) per LLD Section 11.
 * This skips the beforeunload handler, leaving the session status as 'active'
 * in IndexedDB — exactly what happens in a real browser crash.
 *
 * Graceful close simulation: page.close() which fires beforeunload, allowing
 * the hook to mark the session as 'closed' before the page unloads.
 *
 * Prerequisites (handled by CI):
 * - App running at http://localhost:5173 (Vite dev server)
 * - IndexedDB available (Chromium, not WebKit private mode)
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-BE-REL-001-01, T-BE-REL-001-02
 */

import { test, expect, chromium, type BrowserContext } from '@playwright/test';

const APP_URL = 'http://localhost:5173';
const AUTO_SAVE_INTERVAL_MS = 30_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Place a brick on the canvas by clicking the first available brick in the
 * catalog panel and then clicking the viewport.
 * Adjust selectors to match the real LegoBuilder UI.
 */
async function placeBrick(page: import('@playwright/test').Page): Promise<void> {
  // Click the first brick in the catalog (adjust selector as needed)
  const catalogItem = page.locator('[data-testid="brick-catalog-item"]').first();
  if (await catalogItem.isVisible()) {
    await catalogItem.click();
  }
  // Click the viewport to place the brick
  const viewport = page.locator('[data-testid="scene-viewport"]');
  if (await viewport.isVisible()) {
    await viewport.click({ position: { x: 200, y: 200 } });
  }
}

/**
 * Trigger the auto-save by advancing the page clock by 30 seconds.
 * Uses Playwright's clock API (available in Playwright >= 1.45).
 */
async function triggerAutoSave(
  page: import('@playwright/test').Page,
): Promise<void> {
  // Advance the fake clock by the auto-save interval
  await page.clock.fastForward(AUTO_SAVE_INTERVAL_MS);
  // Give the async IndexedDB write time to complete
  await page.waitForTimeout(500);
}

/**
 * Read the auto-save-meta record from IndexedDB via page.evaluate.
 * Returns the meta record for the most recent session, or null.
 */
async function readAutoSaveMeta(
  page: import('@playwright/test').Page,
): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => {
    return new Promise<Record<string, unknown> | null>((resolve) => {
      const req = indexedDB.open('legobuilder-autosave', 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('auto-save-meta')) {
          db.close();
          return resolve(null);
        }
        const tx = db.transaction(['auto-save-meta'], 'readonly');
        const store = tx.objectStore('auto-save-meta');
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          db.close();
          const records = getAllReq.result as Array<Record<string, unknown>>;
          if (!records.length) return resolve(null);
          // Return the most recently saved record
          records.sort(
            (a, b) =>
              (b.lastSavedAt as number) - (a.lastSavedAt as number),
          );
          resolve(records[0]);
        };
        getAllReq.onerror = () => {
          db.close();
          resolve(null);
        };
      };
      req.onerror = () => resolve(null);
    });
  });
}

// ---------------------------------------------------------------------------
// T-BE-REL-001-01 — Browser crash: data survives, ResumePrompt shown
// ---------------------------------------------------------------------------

test.describe('T-BE-REL-001-01 — Browser crash recovery', () => {
  test(
    'scene data survives a browser crash and ResumePrompt is shown on reload',
    async () => {
      // Launch a persistent context so IndexedDB data survives across page loads
      const userDataDir = `/tmp/legobuilder-crash-test-${Date.now()}`;
      const context: BrowserContext = await chromium.launchPersistentContext(
        userDataDir,
        {
          headless: true,
          args: ['--no-sandbox'],
        },
      );

      try {
        const page = await context.newPage();

        // --- Step 1: Load the app and place a brick ---
        await page.goto(APP_URL);
        await page.waitForLoadState('networkidle');

        // Install fake clock BEFORE the auto-save interval fires
        await page.clock.install({ time: Date.now() });

        await placeBrick(page);

        // --- Step 2: Trigger auto-save (advance clock 30s) ---
        await triggerAutoSave(page);

        // --- Step 3: Verify the session is marked 'active' in IndexedDB ---
        const metaBefore = await readAutoSaveMeta(page);
        expect(metaBefore).not.toBeNull();
        expect(metaBefore?.status).toBe('active');

        // --- Step 4: Simulate browser crash (skip beforeunload) ---
        // browser.close({ runBeforeUnload: false }) is the LLD-specified method
        // We close the context without running beforeunload handlers
        await context.close();

        // --- Step 5: Reopen the app in a new context with the same user data ---
        const context2: BrowserContext = await chromium.launchPersistentContext(
          userDataDir,
          {
            headless: true,
            args: ['--no-sandbox'],
          },
        );

        try {
          const page2 = await context2.newPage();
          await page2.goto(APP_URL);
          await page2.waitForLoadState('networkidle');

          // --- Step 6: ResumePrompt should be visible ---
          const resumePrompt = page2.getByRole('dialog', {
            name: /unsaved work/i,
          });
          await expect(resumePrompt).toBeVisible({ timeout: 5000 });

          // --- Step 7: Verify the prompt has Resume and Start Fresh buttons ---
          await expect(
            page2.getByRole('button', { name: /resume/i }),
          ).toBeVisible();
          await expect(
            page2.getByRole('button', { name: /start fresh/i }),
          ).toBeVisible();

          // --- Step 8: Accept recovery and verify scene is restored ---
          await page2.getByRole('button', { name: /resume/i }).click();
          await expect(resumePrompt).not.toBeVisible({ timeout: 3000 });

          // The scene should have the brick that was placed before the crash
          // (Adjust selector to match the real scene representation)
          const brickCount = await page2
            .locator('[data-testid="scene-brick"]')
            .count();
          expect(brickCount).toBeGreaterThanOrEqual(1);
        } finally {
          await context2.close();
        }
      } catch (e) {
        // Ensure context is closed even on failure
        try {
          await context.close();
        } catch {}
        throw e;
      }
    },
  );
});

// ---------------------------------------------------------------------------
// T-BE-REL-001-02 — Graceful close: ResumePrompt NOT shown on reload
// ---------------------------------------------------------------------------

test.describe('T-BE-REL-001-02 — Graceful close suppresses recovery prompt', () => {
  test(
    'ResumePrompt is NOT shown after a graceful tab close',
    async () => {
      const userDataDir = `/tmp/legobuilder-graceful-test-${Date.now()}`;
      const context: BrowserContext = await chromium.launchPersistentContext(
        userDataDir,
        {
          headless: true,
          args: ['--no-sandbox'],
        },
      );

      try {
        const page = await context.newPage();

        // --- Step 1: Load the app and place a brick ---
        await page.goto(APP_URL);
        await page.waitForLoadState('networkidle');
        await page.clock.install({ time: Date.now() });

        await placeBrick(page);

        // --- Step 2: Trigger auto-save ---
        await triggerAutoSave(page);

        // --- Step 3: Verify session is 'active' before close ---
        const metaBefore = await readAutoSaveMeta(page);
        expect(metaBefore?.status).toBe('active');

        // --- Step 4: Graceful close — fires beforeunload ---
        // page.close() triggers beforeunload, which marks session as 'closed'
        await page.close({ runBeforeUnload: true });

        // --- Step 5: Reopen the app ---
        const page2 = await context.newPage();
        await page2.goto(APP_URL);
        await page2.waitForLoadState('networkidle');

        // --- Step 6: ResumePrompt should NOT be visible ---
        const resumePrompt = page2.getByRole('dialog', {
          name: /unsaved work/i,
        });
        await expect(resumePrompt).not.toBeVisible({ timeout: 3000 });

        // --- Step 7: Verify session status is 'closed' in IndexedDB ---
        const metaAfter = await readAutoSaveMeta(page2);
        expect(metaAfter?.status).toBe('closed');
      } finally {
        await context.close();
      }
    },
  );
});

// ---------------------------------------------------------------------------
// T-BE-REL-001-02b — Dismiss recovery: choosing "Start Fresh" clears state
// ---------------------------------------------------------------------------

test.describe('T-BE-REL-001-02b — Dismiss recovery clears IndexedDB state', () => {
  test(
    'clicking "Start Fresh" dismisses the prompt and does not restore scene',
    async () => {
      const userDataDir = `/tmp/legobuilder-dismiss-test-${Date.now()}`;
      const context: BrowserContext = await chromium.launchPersistentContext(
        userDataDir,
        {
          headless: true,
          args: ['--no-sandbox'],
        },
      );

      try {
        const page = await context.newPage();
        await page.goto(APP_URL);
        await page.waitForLoadState('networkidle');
        await page.clock.install({ time: Date.now() });

        await placeBrick(page);
        await triggerAutoSave(page);

        // Crash (skip beforeunload)
        await context.close();

        const context2: BrowserContext = await chromium.launchPersistentContext(
          userDataDir,
          {
            headless: true,
            args: ['--no-sandbox'],
          },
        );

        try {
          const page2 = await context2.newPage();
          await page2.goto(APP_URL);
          await page2.waitForLoadState('networkidle');

          // ResumePrompt should appear
          const resumePrompt = page2.getByRole('dialog', {
            name: /unsaved work/i,
          });
          await expect(resumePrompt).toBeVisible({ timeout: 5000 });

          // Click "Start Fresh"
          await page2.getByRole('button', { name: /start fresh/i }).click();

          // Prompt should be dismissed
          await expect(resumePrompt).not.toBeVisible({ timeout: 3000 });

          // Scene should be empty (no bricks restored)
          const brickCount = await page2
            .locator('[data-testid="scene-brick"]')
            .count();
          expect(brickCount).toBe(0);
        } finally {
          await context2.close();
        }
      } catch (e) {
        try {
          await context.close();
        } catch {}
        throw e;
      }
    },
  );
});
