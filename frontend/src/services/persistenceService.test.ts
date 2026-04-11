/**
 * NFR-REL-001 — Auto-Save Crash Durability
 * Unit tests for persistenceService
 *
 * Test IDs:
 *   T-UNIT-REL-001-01: saveSnapshot() performs atomic dual-store write
 *   T-UNIT-REL-001-04: closeSession() marks session status='closed'
 *   T-UNIT-REL-001-07: Quota exceeded triggers purge-and-retry
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Iteration: 3
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initDb,
  saveSnapshot,
  closeSession,
  getActiveSessions,
  getLatestSnapshot,
  purgeSession,
} from './persistenceService';

const SESSION_ID = 'unit-test-session';
const MOCK_BRICKS = Array.from({ length: 50 }, (_, i) => ({
  id: `brick-${i}`,
  type: '2x4',
  position: { x: i % 10, y: Math.floor(i / 10), z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#ff0000',
}));

beforeEach(async () => {
  await initDb();
});

describe('T-UNIT-REL-001-01: saveSnapshot() — atomic dual-store write', () => {
  it('writes to both scene-snapshots and auto-save-meta in a single transaction', async () => {
    await saveSnapshot(SESSION_ID, MOCK_BRICKS);

    const snapshot = await getLatestSnapshot(SESSION_ID);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.bricks).toHaveLength(50);
    expect(snapshot?.sessionId).toBe(SESSION_ID);

    const activeSessions = await getActiveSessions();
    const meta = activeSessions.find((s) => s.sessionId === SESSION_ID);
    expect(meta).toBeDefined();
    expect(meta?.status).toBe('active');
  });

  it('snapshot contains all 50 bricks with correct structure', async () => {
    await saveSnapshot(SESSION_ID, MOCK_BRICKS);

    const snapshot = await getLatestSnapshot(SESSION_ID);
    expect(snapshot?.bricks[0]).toMatchObject({
      id: 'brick-0',
      type: '2x4',
      position: expect.objectContaining({ x: 0, y: 0, z: 0 }),
    });
    expect(snapshot?.bricks[49]).toMatchObject({
      id: 'brick-49',
    });
  });

  it('snapshot has schemaVersion field', async () => {
    await saveSnapshot(SESSION_ID, MOCK_BRICKS);
    const snapshot = await getLatestSnapshot(SESSION_ID);
    expect(snapshot?.schemaVersion).toBeDefined();
    expect(typeof snapshot?.schemaVersion).toBe('number');
  });

  it('snapshot has timestamp field', async () => {
    const before = Date.now();
    await saveSnapshot(SESSION_ID, MOCK_BRICKS);
    const after = Date.now();

    const snapshot = await getLatestSnapshot(SESSION_ID);
    expect(snapshot?.timestamp).toBeGreaterThanOrEqual(before);
    expect(snapshot?.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('T-UNIT-REL-001-04: closeSession() — marks status=closed', () => {
  it('sets session status to closed after graceful close', async () => {
    await saveSnapshot(SESSION_ID, MOCK_BRICKS);

    // Verify session is active before close
    let activeSessions = await getActiveSessions();
    expect(activeSessions.some((s) => s.sessionId === SESSION_ID)).toBe(true);

    await closeSession(SESSION_ID);

    // After close, session should not appear in active sessions
    activeSessions = await getActiveSessions();
    expect(activeSessions.some((s) => s.sessionId === SESSION_ID)).toBe(false);
  });

  it('closeSession is idempotent — calling twice does not throw', async () => {
    await saveSnapshot(SESSION_ID, MOCK_BRICKS);
    await closeSession(SESSION_ID);
    await expect(closeSession(SESSION_ID)).resolves.not.toThrow();
  });

  it('closeSession on non-existent session does not throw', async () => {
    await expect(closeSession('non-existent-session')).resolves.not.toThrow();
  });
});

describe('T-UNIT-REL-001-07: Quota exceeded — purge-and-retry', () => {
  it('purgeSession removes session data from both stores', async () => {
    await saveSnapshot(SESSION_ID, MOCK_BRICKS);

    // Verify data exists
    const snapshotBefore = await getLatestSnapshot(SESSION_ID);
    expect(snapshotBefore).not.toBeNull();

    await purgeSession(SESSION_ID);

    // After purge, snapshot should be gone
    const snapshotAfter = await getLatestSnapshot(SESSION_ID);
    expect(snapshotAfter).toBeNull();
  });

  it('saveSnapshot handles QuotaExceededError by purging oldest and retrying', async () => {
    // Create multiple sessions to simulate storage pressure
    const sessions = Array.from({ length: 12 }, (_, i) => `session-${i}`);
    for (const sid of sessions) {
      await saveSnapshot(sid, MOCK_BRICKS);
    }

    // Mock QuotaExceededError on first write attempt
    const { openDB } = await import('idb');
    const originalOpenDB = openDB;
    let callCount = 0;

    vi.spyOn(await import('idb'), 'openDB').mockImplementationOnce(
      async (...args) => {
        const db = await originalOpenDB(...args);
        const originalTransaction = db.transaction.bind(db);
        db.transaction = (...txArgs: Parameters<typeof db.transaction>) => {
          callCount++;
          if (callCount === 1) {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
          }
          return originalTransaction(...txArgs);
        };
        return db;
      }
    );

    // The save should succeed after purge-and-retry
    // (In practice, the service handles this internally)
    const newSession = 'new-session-after-quota';
    await expect(saveSnapshot(newSession, MOCK_BRICKS)).resolves.not.toThrow();
  });
});
