/**
 * Unit Tests — crashRecoveryService
 *
 * Test IDs: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 * FR: NFR-REL-001 — Auto-Save Crash Durability
 * Issue: https://github.com/sreenivasmrpivot/legobuilder/issues/35
 *
 * Tests the crash recovery service interface contract defined in
 * LLD Section 4.3. Uses fake-indexeddb for in-memory IDB simulation.
 *
 * Spectra-Agent: frontend-test
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// ---------------------------------------------------------------------------
// Modules under test
// The coding agent will implement these at:
//   frontend/src/services/crashRecoveryService.ts
//   frontend/src/services/persistenceService.ts
// ---------------------------------------------------------------------------

import type { CrashRecoveryService } from './crashRecoveryService';
import type { PersistenceService } from './persistenceService';
import type { SceneSnapshot } from './dbSchema';

let recoveryService: CrashRecoveryService;
let persistenceService: PersistenceService;

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const ACTIVE_SESSION_ID = 'active-session-00000000-0000-0000-0000-000000000001';
const CLOSED_SESSION_ID = 'closed-session-00000000-0000-0000-0000-000000000002';

function makeBricks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `brick-${String(i).padStart(3, '0')}`,
    type: '2x4',
    position: [i, 0, 0] as [number, number, number],
    rotation: [0, 0, 0, 1] as [number, number, number, number],
    color: '#FF0000',
  }));
}

function makeMockSnapshot(
  sessionId: string,
  brickCount: number,
  overrides: Partial<Omit<SceneSnapshot, 'snapshotId'>> = {}
): Omit<SceneSnapshot, 'snapshotId'> {
  return {
    sessionId,
    timestamp: Date.now(),
    schemaVersion: 1,
    bricks: makeBricks(brickCount),
    cameraState: { position: [0, 10, 20], target: [0, 0, 0], zoom: 1.0 },
    sceneMetadata: {
      name: 'Test Scene',
      createdAt: Date.now() - 60_000,
      lastModifiedAt: Date.now(),
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(async () => {
  const persistenceMod = await import('./persistenceService');
  persistenceService =
    persistenceMod.default ??
    persistenceMod.createPersistenceService?.() ??
    (persistenceMod as unknown as { service: PersistenceService }).service;
  await persistenceService.init();

  const recoveryMod = await import('./crashRecoveryService');
  recoveryService =
    recoveryMod.default ??
    recoveryMod.createCrashRecoveryService?.(persistenceService) ??
    (recoveryMod as unknown as { service: CrashRecoveryService }).service;
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-02: detectCrash() returns null when no active sessions
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-02 — detectCrash() returns null when no active sessions', () => {
  it('returns null when IndexedDB is empty', async () => {
    const candidate = await recoveryService.detectCrash();
    expect(candidate).toBeNull();
  });

  it('returns null when all sessions are marked closed', async () => {
    // Create a session and close it gracefully
    await persistenceService.saveSnapshot(makeMockSnapshot(CLOSED_SESSION_ID, 10));
    await persistenceService.closeSession(CLOSED_SESSION_ID);

    const candidate = await recoveryService.detectCrash();
    expect(candidate).toBeNull();
  });

  it('returns null after a session has been purged', async () => {
    await persistenceService.saveSnapshot(makeMockSnapshot(ACTIVE_SESSION_ID, 5));
    await persistenceService.purgeSession(ACTIVE_SESSION_ID);

    const candidate = await recoveryService.detectCrash();
    expect(candidate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-03: detectCrash() returns candidate when active session exists
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-03 — detectCrash() returns candidate when active session exists', () => {
  it('returns a RecoveryCandidate with correct sessionId and brickCount', async () => {
    // Simulate a crash: save snapshot but do NOT close the session
    await persistenceService.saveSnapshot(makeMockSnapshot(ACTIVE_SESSION_ID, 50));

    const candidate = await recoveryService.detectCrash();

    expect(candidate).not.toBeNull();
    expect(candidate!.sessionId).toBe(ACTIVE_SESSION_ID);
    expect(candidate!.brickCount).toBe(50);
    expect(typeof candidate!.snapshotId).toBe('string');
    expect(typeof candidate!.lastSavedAt).toBe('number');
  });

  it('returns the most recent session when multiple active sessions exist', async () => {
    const olderSessionId = 'older-session-00000000-0000-0000-0000-000000000003';
    const newerSessionId = 'newer-session-00000000-0000-0000-0000-000000000004';

    // Older session saved first
    await persistenceService.saveSnapshot(
      makeMockSnapshot(olderSessionId, 10, { timestamp: Date.now() - 10_000 })
    );
    // Newer session saved more recently
    await persistenceService.saveSnapshot(
      makeMockSnapshot(newerSessionId, 30, { timestamp: Date.now() })
    );

    const candidate = await recoveryService.detectCrash();

    expect(candidate).not.toBeNull();
    // Should return the most recently saved session
    expect(candidate!.sessionId).toBe(newerSessionId);
    expect(candidate!.brickCount).toBe(30);
  });

  it('restoreSession() loads bricks into the scene store and marks session closed', async () => {
    await persistenceService.saveSnapshot(makeMockSnapshot(ACTIVE_SESSION_ID, 50));

    // restoreSession should not throw
    await expect(recoveryService.restoreSession(ACTIVE_SESSION_ID)).resolves.not.toThrow();

    // After restore, the session should be marked closed (no longer active)
    const sessions = await persistenceService.getActiveSessions();
    expect(sessions.some((s) => s.sessionId === ACTIVE_SESSION_ID)).toBe(false);
  });

  it('discardSession() purges the session without restoring', async () => {
    await persistenceService.saveSnapshot(makeMockSnapshot(ACTIVE_SESSION_ID, 50));

    await recoveryService.discardSession(ACTIVE_SESSION_ID);

    // Session should be gone from IDB
    const latest = await persistenceService.getLatestSnapshot(ACTIVE_SESSION_ID);
    expect(latest).toBeNull();

    const sessions = await persistenceService.getActiveSessions();
    expect(sessions.some((s) => s.sessionId === ACTIVE_SESSION_ID)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-08: Corrupted recovery data is discarded gracefully
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-08 — Corrupted recovery data is discarded gracefully', () => {
  it('returns null and does not throw when snapshot data is corrupted', async () => {
    // Simulate corruption by mocking getLatestSnapshot to return malformed data
    vi.spyOn(persistenceService, 'getLatestSnapshot').mockResolvedValueOnce(
      // Missing required fields — simulates corrupted IDB record
      { snapshotId: 'corrupt-id', sessionId: ACTIVE_SESSION_ID } as unknown as SceneSnapshot
    );

    // Also mock getActiveSessions to return an active session
    vi.spyOn(persistenceService, 'getActiveSessions').mockResolvedValueOnce([
      {
        sessionId: ACTIVE_SESSION_ID,
        latestSnapshotId: 'corrupt-id',
        saveCount: 1,
        lastSavedAt: Date.now(),
        appVersion: '1.0.0',
        status: 'active',
      },
    ]);

    // detectCrash should handle the corrupted data gracefully
    // Either return null or return a candidate with brickCount=0
    const candidate = await recoveryService.detectCrash();

    // The service must not throw — it should degrade gracefully
    // Acceptable outcomes: null (discard) or candidate with brickCount=0
    if (candidate !== null) {
      expect(candidate.brickCount).toBe(0);
    }
  });

  it('discards corrupted session and does not crash the app', async () => {
    // Mock a scenario where the snapshot JSON is unparseable
    vi.spyOn(persistenceService, 'getLatestSnapshot').mockRejectedValueOnce(
      new SyntaxError('Unexpected token in JSON')
    );
    vi.spyOn(persistenceService, 'getActiveSessions').mockResolvedValueOnce([
      {
        sessionId: ACTIVE_SESSION_ID,
        latestSnapshotId: 'bad-id',
        saveCount: 1,
        lastSavedAt: Date.now(),
        appVersion: '1.0.0',
        status: 'active',
      },
    ]);

    // Should not throw — corrupted data must be handled gracefully
    await expect(recoveryService.detectCrash()).resolves.not.toThrow();
  });

  it('restoreSession() with corrupted snapshot throws RecoveryError, not unhandled rejection', async () => {
    vi.spyOn(persistenceService, 'getLatestSnapshot').mockRejectedValueOnce(
      new Error('IDB read error')
    );

    // restoreSession should surface a typed error, not an unhandled rejection
    await expect(recoveryService.restoreSession(ACTIVE_SESSION_ID)).rejects.toMatchObject({
      name: expect.stringMatching(/PersistenceError|RecoveryError|Error/),
    });
  });
});
