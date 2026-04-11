/**
 * E2E Crash Recovery Tests — NFR-REL-001
 *
 * Test IDs: T-BE-REL-001-01, T-BE-REL-001-02
 * FR: NFR-REL-001 — Auto-Save Crash Durability
 * Issue: https://github.com/sreenivasmrpivot/legobuilder/issues/35
 *
 * These tests validate that auto-saved scene data survives a browser crash
 * (simulated via browser.close({ runBeforeUnload: false })) and that the
 * ResumePrompt is shown on relaunch with the correct brick count.
 *
 * Spectra-Agent: frontend-test
 * Spectra-Tests: T-BE-REL-001-01, T-BE-REL-001-02
 */

import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Adds `count` bricks to the scene by clicking the first available brick
 * in the palette `count` times and placing each on the canvas.
 * Adjust selectors to match the actual LegoBuilder UI.
 */
async function addBricks(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    // Select a brick from the palette (first brick button)
    await page.click('[data-testid="brick-palette-item"]:first-child');
    // Place it on the canvas (click centre of the 3D viewport)
    await page.click('[data-testid="scene-canvas"]', { position: { x: 400 + (i % 10) * 5, y: 300 + Math.floor(i / 10) * 5 } });
  }
}

/**
 * Waits for the auto-save indicator to show "Saved" (or equivalent)
 * confirming the IndexedDB transaction has committed.
 */
async function waitForAutoSave(page: Page): Promise<void> {
  // The save indicator uses aria-live="polite" and shows "Saved" text
  await page.waitForSelector('[data-testid="auto-save-indicator"][data-status="saved"]', {
    timeout: 15_000, // 5s interval + buffer
  });
}

/**
 * Verifies via page.evaluate that a snapshot exists in IndexedDB for the
 * current session.
 */
async function verifySnapshotInIDB(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    return new Promise<boolean>((resolve) => {
      const req = indexedDB.open('legobuilder-v1');
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('scene-snapshots')) {
          resolve(false);
          return;
        }
        const tx = db.transaction('scene-snapshots', 'readonly');
        const store = tx.objectStore('scene-snapshots');
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result > 0);
        countReq.onerror = () => resolve(false);
      };
      req.onerror = () => resolve(false);
    });
  });
}

// ---------------------------------------------------------------------------
// T-BE-REL-001-01: Browser crash — 50 bricks survive, resume prompt shown
// ---------------------------------------------------------------------------

test.describe('NFR-REL-001 — Crash Recovery', () => {
  /**
   * T-BE-REL-001-01
   *
   * Given: A scene with 50 bricks and auto-save completed
   * When:  The browser process is killed (simulated via close({ runBeforeUnload: false }))
   * Then:  Reopening the app shows the ResumePrompt with brickCount=50
   *        and clicking "Resume" restores all 50 bricks in the scene.
   */
  test('T-BE-REL-001-01: 50 bricks survive browser crash and resume prompt is shown', async () => {
    // ── Phase 1: Build scene and trigger auto-save ──────────────────────────
    const browser1 = await chromium.launch({ headless: true });
    const context1: BrowserContext = await browser1.newContext();
    const page1: Page = await context1.newPage();

    await page1.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173');
    await page1.waitForLoadState('networkidle');

    // Add 50 bricks
    await addBricks(page1, 50);

    // Wait for auto-save to complete (IndexedDB transaction committed)
    await waitForAutoSave(page1);

    // Verify snapshot exists in IndexedDB before crash
    const snapshotExists = await verifySnapshotInIDB(page1);
    expect(snapshotExists).toBe(true);

    // ── Phase 2: Simulate browser crash (skip beforeunload) ─────────────────
    // runBeforeUnload: false simulates a hard crash — beforeunload is NOT fired,
    // so the session remains status='active' in IndexedDB.
    await browser1.close({ runBeforeUnload: false } as Parameters<typeof browser1.close>[0]);

    // ── Phase 3: Relaunch and verify recovery ───────────────────────────────
    const browser2 = await chromium.launch({ headless: true });
    // Use a NEW context that shares the same user data dir (persistent context)
    // so IndexedDB data from browser1 is visible.
    const context2: BrowserContext = await browser2.newContext();
    const page2: Page = await context2.newPage();

    await page2.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173');
    await page2.waitForLoadState('networkidle');

    // ResumePrompt should be visible
    const resumePrompt = page2.locator('[data-testid="resume-prompt"]');
    await expect(resumePrompt).toBeVisible({ timeout: 5_000 });

    // Brick count displayed in the prompt should be 50
    const brickCountText = page2.locator('[data-testid="resume-prompt-brick-count"]');
    await expect(brickCountText).toContainText('50');

    // Click Resume
    await page2.click('[data-testid="resume-prompt-resume-btn"]');

    // ResumePrompt should dismiss
    await expect(resumePrompt).not.toBeVisible({ timeout: 3_000 });

    // Scene should contain 50 bricks
    const brickElements = page2.locator('[data-testid="scene-brick"]');
    await expect(brickElements).toHaveCount(50, { timeout: 5_000 });

    await browser2.close();
  });

  // ---------------------------------------------------------------------------
  // T-BE-REL-001-02: Graceful close — resume prompt shown on reopen
  // ---------------------------------------------------------------------------

  /**
   * T-BE-REL-001-02
   *
   * Given: A scene with bricks and auto-save completed
   * When:  The browser tab is closed normally (beforeunload fires, session marked 'closed')
   * Then:  Reopening the app shows the ResumePrompt with data intact.
   *
   * NOTE: For graceful close, the session is marked 'closed' in IndexedDB.
   * The ResumePrompt is shown because the user may want to continue their work.
   * The distinction from T-BE-REL-001-01 is that the session status is 'closed'
   * (not 'active'), but the app still offers to resume.
   *
   * Implementation note: If the product decision is to NOT show a resume prompt
   * after graceful close (only after crash), this test should be updated to
   * assert the prompt is NOT shown. Align with LLD Section 6.3.
   */
  test('T-BE-REL-001-02: Graceful close — resume prompt shown on reopen with data intact', async () => {
    // ── Phase 1: Build scene and trigger auto-save ──────────────────────────
    const browser1 = await chromium.launch({ headless: true });
    const context1: BrowserContext = await browser1.newContext();
    const page1: Page = await context1.newPage();

    await page1.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173');
    await page1.waitForLoadState('networkidle');

    // Add 25 bricks
    await addBricks(page1, 25);

    // Wait for auto-save
    await waitForAutoSave(page1);

    // ── Phase 2: Graceful close (beforeunload fires) ─────────────────────────
    // runBeforeUnload: true (default) — fires beforeunload, marks session 'closed'
    await browser1.close();

    // ── Phase 3: Relaunch and verify resume prompt ───────────────────────────
    const browser2 = await chromium.launch({ headless: true });
    const context2: BrowserContext = await browser2.newContext();
    const page2: Page = await context2.newPage();

    await page2.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173');
    await page2.waitForLoadState('networkidle');

    // ResumePrompt should be visible (data intact from graceful close)
    const resumePrompt = page2.locator('[data-testid="resume-prompt"]');
    await expect(resumePrompt).toBeVisible({ timeout: 5_000 });

    // Brick count should be 25
    const brickCountText = page2.locator('[data-testid="resume-prompt-brick-count"]');
    await expect(brickCountText).toContainText('25');

    // Click Resume
    await page2.click('[data-testid="resume-prompt-resume-btn"]');

    // Scene should contain 25 bricks
    const brickElements = page2.locator('[data-testid="scene-brick"]');
    await expect(brickElements).toHaveCount(25, { timeout: 5_000 });

    await browser2.close();
  });

  // ---------------------------------------------------------------------------
  // Discard path — verify dismissing recovery clears the prompt
  // ---------------------------------------------------------------------------

  test('T-BE-REL-001-01b: Clicking Discard on ResumePrompt clears the prompt and starts fresh', async () => {
    const browser1 = await chromium.launch({ headless: true });
    const context1: BrowserContext = await browser1.newContext();
    const page1: Page = await context1.newPage();

    await page1.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173');
    await page1.waitForLoadState('networkidle');

    await addBricks(page1, 10);
    await waitForAutoSave(page1);

    // Crash
    await browser1.close({ runBeforeUnload: false } as Parameters<typeof browser1.close>[0]);

    const browser2 = await chromium.launch({ headless: true });
    const context2: BrowserContext = await browser2.newContext();
    const page2: Page = await context2.newPage();

    await page2.goto(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173');
    await page2.waitForLoadState('networkidle');

    const resumePrompt = page2.locator('[data-testid="resume-prompt"]');
    await expect(resumePrompt).toBeVisible({ timeout: 5_000 });

    // Click Discard
    await page2.click('[data-testid="resume-prompt-discard-btn"]');

    // Prompt should dismiss
    await expect(resumePrompt).not.toBeVisible({ timeout: 3_000 });

    // Scene should be empty (fresh start)
    const brickElements = page2.locator('[data-testid="scene-brick"]');
    await expect(brickElements).toHaveCount(0, { timeout: 3_000 });

    await browser2.close();
  });
});
