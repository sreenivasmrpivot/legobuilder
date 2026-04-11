/**
 * NFR-REL-001 — Auto-Save Crash Durability
 * Unit tests for crashRecoveryService
 *
 * Test IDs:
 *   T-UNIT-REL-001-02: detectOrphanedSession() returns null when no active sessions
 *   T-UNIT-REL-001-03: detectOrphanedSession() returns candidate when active session exists
 *   T-UNIT-REL-001-08: Corrupted recovery data discarded gracefully
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Iteration: 3
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { detectOrphanedSession } from './crashRecoveryService';
import { initDb, saveSnapshot, closeSession } from './persistenceService';

const MOCK_SESSION_ID = 'test-session-001';
const MOCK_BRICKS = Array.from({ length: 5 }, (_, i) => ({
  id: `brick-${i}`,
  type: '2x4',
  position: { x: i, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  color: '#ff0000',
}));

beforeEach(async () => {
  // Reset IDB state between tests
  await initDb();
});

describe('T-UNIT-REL-001-02: detectOrphanedSession — no active sessions', () => {
  it('returns null when no sessions exist in IDB', async () => {
    const result = await detectOrphanedSession();
    expect(result).toBeNull();
  });

  it('returns null when all sessions are closed', async () => {
    // Create a session and close it gracefully
    await saveSnapshot(MOCK_SESSION_ID, MOCK_BRICKS);
    await closeSession(MOCK_SESSION_ID);

    const result = await detectOrphanedSession();
    expect(result).toBeNull();
  });
});

describe('T-UNIT-REL-001-03: detectOrphanedSession — active session (crash candidate)', () => {
  it('returns session candidate when an active session exists', async () => {
    // Simulate a crash: save snapshot but do NOT call closeSession
    await saveSnapshot(MOCK_SESSION_ID, MOCK_BRICKS);

    const result = await detectOrphanedSession();
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      sessionId: MOCK_SESSION_ID,
      bricks: expect.arrayContaining([
        expect.objectContaining({ id: 'brick-0' }),
      ]),
    });
  });

  it('returns the most recent active session when multiple exist', async () => {
    const sessionA = 'session-a';
    const sessionB = 'session-b';

    await saveSnapshot(sessionA, MOCK_BRICKS);
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 10));
    await saveSnapshot(sessionB, MOCK_BRICKS);

    const result = await detectOrphanedSession();
    expect(result).not.toBeNull();
    // Should return the most recent session
    expect(result?.sessionId).toBe(sessionB);
  });
});

describe('T-UNIT-REL-001-08: Corrupted recovery data discarded gracefully', () => {
  it('returns null and purges session when snapshot has no bricks array', async () => {
    // Directly write a corrupted snapshot to IDB
    const { openDB } = await import('idb');
    const db = await openDB('legobuilder-autosave', 1);
    const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
    await tx.objectStore('scene-snapshots').put({
      sessionId: 'corrupt-session',
      // Missing bricks array — corrupted data
      timestamp: Date.now(),
      schemaVersion: 1,
    });
    await tx.objectStore('auto-save-meta').put({
      sessionId: 'corrupt-session',
      status: 'active',
      lastSaved: Date.now(),
    });
    await tx.done;
    db.close();

    const result = await detectOrphanedSession();
    // Corrupted data should be discarded — returns null
    expect(result).toBeNull();
  });

  it('returns null when snapshot has empty bricks array and schemaVersion mismatch', async () => {
    const { openDB } = await import('idb');
    const db = await openDB('legobuilder-autosave', 1);
    const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
    await tx.objectStore('scene-snapshots').put({
      sessionId: 'old-schema-session',
      bricks: [],
      timestamp: Date.now(),
      schemaVersion: 0, // Incompatible schema version
    });
    await tx.objectStore('auto-save-meta').put({
      sessionId: 'old-schema-session',
      status: 'active',
      lastSaved: Date.now(),
    });
    await tx.done;
    db.close();

    const result = await detectOrphanedSession();
    expect(result).toBeNull();
  });
});
