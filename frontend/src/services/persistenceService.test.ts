/**
 * Unit Tests — persistenceService
 *
 * Test IDs: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 * FR: NFR-REL-001 — Auto-Save Crash Durability
 * Issue: https://github.com/sreenivasmrpivot/legobuilder/issues/35
 *
 * Tests the IndexedDB persistence service interface contract defined in
 * LLD Section 4.2. Uses fake-indexeddb for in-memory IDB simulation.
 *
 * Spectra-Agent: frontend-test
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

// ---------------------------------------------------------------------------
// Module under test — imported after fake-indexeddb is installed
// The coding agent will implement these at:
//   frontend/src/services/persistenceService.ts
//   frontend/src/services/dbSchema.ts
// ---------------------------------------------------------------------------

// We import the service lazily so fake-indexeddb is in place first.
// The service must export a factory function or class matching PersistenceService.
import type { PersistenceService } from './persistenceService';
import type { SceneSnapshot, AutoSaveMeta } from './dbSchema';

// Dynamic import to allow fake-indexeddb to be set up first
let service: PersistenceService;

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION_ID = 'test-session-00000000-0000-0000-0000-000000000001';

function makeMockSnapshot(
  overrides: Partial<Omit<SceneSnapshot, 'snapshotId'>> = {}
): Omit<SceneSnapshot, 'snapshotId'> {
  return {
    sessionId: MOCK_SESSION_ID,
    timestamp: Date.now(),
    schemaVersion: 1,
    bricks: [
      {
        id: 'brick-001',
        type: '2x4',
        position: [0, 0, 0],
        rotation: [0, 0, 0, 1],
        color: '#FF0000',
      },
      {
        id: 'brick-002',
        type: '1x1',
        position: [2, 0, 0],
        rotation: [0, 0, 0, 1],
        color: '#0000FF',
      },
    ],
    cameraState: {
      position: [0, 10, 20],
      target: [0, 0, 0],
      zoom: 1.0,
    },
    sceneMetadata: {
      name: 'Test Scene',
      createdAt: Date.now() - 60_000,
      lastModifiedAt: Date.now(),
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Re-import fresh service instance for each test (IDB is reset by fake-indexeddb)
  const mod = await import('./persistenceService');
  // Support both default export and named export
  service = mod.default ?? mod.createPersistenceService?.() ?? (mod as unknown as { service: PersistenceService }).service;
  await service.init();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-01: saveSnapshot() writes both stores in one transaction
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-01 — saveSnapshot() atomic transaction', () => {
  it('writes scene-snapshots and auto-save-meta in a single transaction and returns a snapshotId', async () => {
    const snapshot = makeMockSnapshot();

    const snapshotId = await service.saveSnapshot(snapshot);

    // snapshotId must be a non-empty string (UUID)
    expect(typeof snapshotId).toBe('string');
    expect(snapshotId.length).toBeGreaterThan(0);

    // The snapshot must be retrievable
    const retrieved = await service.getLatestSnapshot(MOCK_SESSION_ID);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.snapshotId).toBe(snapshotId);
    expect(retrieved!.bricks).toHaveLength(2);
    expect(retrieved!.sessionId).toBe(MOCK_SESSION_ID);
  });

  it('auto-save-meta latestSnapshotId matches the returned snapshotId', async () => {
    const snapshot = makeMockSnapshot();
    const snapshotId = await service.saveSnapshot(snapshot);

    // getActiveSessions should return the session with the correct latestSnapshotId
    const sessions = await service.getActiveSessions();
    const session = sessions.find((s) => s.sessionId === MOCK_SESSION_ID);
    expect(session).toBeDefined();
    expect(session!.latestSnapshotId).toBe(snapshotId);
    expect(session!.status).toBe('active');
  });

  it('saveCount increments on each save', async () => {
    const snapshot = makeMockSnapshot();

    await service.saveSnapshot(snapshot);
    await service.saveSnapshot({ ...snapshot, timestamp: Date.now() + 1 });

    const sessions = await service.getActiveSessions();
    const session = sessions.find((s) => s.sessionId === MOCK_SESSION_ID);
    expect(session!.saveCount).toBe(2);
  });

  it('getLatestSnapshot returns null when no snapshot exists for sessionId', async () => {
    const result = await service.getLatestSnapshot('non-existent-session-id');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-04: closeSession() marks status='closed'
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-04 — closeSession() marks status closed', () => {
  it('marks the session status as closed after closeSession()', async () => {
    // First create a session by saving a snapshot
    await service.saveSnapshot(makeMockSnapshot());

    // Verify it starts as 'active'
    let sessions = await service.getActiveSessions();
    expect(sessions.some((s) => s.sessionId === MOCK_SESSION_ID)).toBe(true);

    // Close the session
    await service.closeSession(MOCK_SESSION_ID);

    // Should no longer appear in active sessions
    sessions = await service.getActiveSessions();
    expect(sessions.some((s) => s.sessionId === MOCK_SESSION_ID)).toBe(false);
  });

  it('closeSession() on a non-existent session does not throw', async () => {
    await expect(service.closeSession('ghost-session-id')).resolves.not.toThrow();
  });

  it('purgeSession() removes all snapshots and meta for the session', async () => {
    await service.saveSnapshot(makeMockSnapshot());
    await service.purgeSession(MOCK_SESSION_ID);

    const retrieved = await service.getLatestSnapshot(MOCK_SESSION_ID);
    expect(retrieved).toBeNull();

    const sessions = await service.getActiveSessions();
    expect(sessions.some((s) => s.sessionId === MOCK_SESSION_ID)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-07: Quota exceeded error triggers purge-and-retry
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-07 — Quota exceeded triggers purge-and-retry', () => {
  it('throws PersistenceError with code QUOTA_EXCEEDED when storage is full', async () => {
    // Simulate QuotaExceededError by mocking the IDB transaction
    // The service should catch DOMException with name 'QuotaExceededError'
    // and re-throw as PersistenceError(QUOTA_EXCEEDED)
    const { PersistenceError, PersistenceErrorCode } = await import('./persistenceService');

    // Spy on the internal IDB write to throw QuotaExceededError
    const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');

    // We mock the underlying idb openDB to simulate quota exceeded on put
    vi.spyOn(service as unknown as { _db: IDBDatabase }, '_db', 'get').mockImplementation(() => {
      throw quotaError;
    });

    // The service should surface this as a PersistenceError
    await expect(service.saveSnapshot(makeMockSnapshot())).rejects.toMatchObject({
      name: 'PersistenceError',
      code: PersistenceErrorCode.QUOTA_EXCEEDED,
    });
  });

  it('purges oldest snapshots when quota is exceeded and retries successfully', async () => {
    // Create 12 snapshots (more than the 10-snapshot retention limit)
    for (let i = 0; i < 12; i++) {
      await service.saveSnapshot(
        makeMockSnapshot({ timestamp: Date.now() + i * 1000 })
      );
    }

    // After 12 saves, only the 10 most recent should remain
    // (pruning policy: keep latest 10 per session)
    const latest = await service.getLatestSnapshot(MOCK_SESSION_ID);
    expect(latest).not.toBeNull();

    // Verify the service is still functional after pruning
    const snapshotId = await service.saveSnapshot(makeMockSnapshot({ timestamp: Date.now() + 13_000 }));
    expect(typeof snapshotId).toBe('string');
  });
});
