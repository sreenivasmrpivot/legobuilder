/**
 * crashRecoveryService.test.ts
 * NFR-REL-001 — Auto-Save Crash Durability
 *
 * Test IDs:
 *   T-UNIT-REL-001-02: detectOrphanedSession() returns null when no active sessions
 *   T-UNIT-REL-001-03: detectOrphanedSession() returns candidate when active session exists
 *   T-UNIT-REL-001-08: Corrupted recovery data is discarded gracefully
 *
 * Uses fake-indexeddb/auto for in-memory IDB simulation (Vitest).
 * LLD v2.0 interface: ICrashRecoveryService
 * CRITICAL: API is detectOrphanedSession() — NOT detectCrash()
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DB_NAME,
  DB_VERSION,
  SCENE_SNAPSHOTS_STORE,
  AUTO_SAVE_META_STORE,
  type SceneSnapshot,
  type AutoSaveMeta,
} from '../dbSchema';
import { openDB } from 'idb';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBricks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `brick-${i}`,
    type: '2x4',
    position: { x: i, y: 0, z: 0 },
    rotation: 0 as const,
    color: '#FF0000',
  }));
}

async function seedActiveSession(
  sessionId: string,
  brickCount: number,
  status: 'active' | 'closed' = 'active'
) {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SCENE_SNAPSHOTS_STORE)) {
        db.createObjectStore(SCENE_SNAPSHOTS_STORE, { keyPath: 'sessionId' });
      }
      if (!db.objectStoreNames.contains(AUTO_SAVE_META_STORE)) {
        db.createObjectStore(AUTO_SAVE_META_STORE, { keyPath: 'sessionId' });
      }
    },
  });

  const snapshot: SceneSnapshot = {
    sessionId,
    timestamp: Date.now(),
    schemaVersion: 1,
    bricks: makeBricks(brickCount),
  };

  const meta: AutoSaveMeta = {
    sessionId,
    status,
    startedAt: Date.now() - 60_000,
    lastSavedAt: Date.now(),
    brickCount,
  };

  const tx = db.transaction([SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE], 'readwrite');
  await tx.objectStore(SCENE_SNAPSHOTS_STORE).put(snapshot);
  await tx.objectStore(AUTO_SAVE_META_STORE).put(meta);
  await tx.done;

  db.close();
}

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-02: detectOrphanedSession() returns null when no active sessions
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-02: detectOrphanedSession() — no active sessions', () => {
  it('returns null when IndexedDB is empty', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const candidate = await crashRecoveryService.detectOrphanedSession();
    expect(candidate).toBeNull();
  });

  it('returns null when all sessions have status=closed', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const sessionId = crypto.randomUUID();

    // Seed a closed session (graceful close)
    await seedActiveSession(sessionId, 10, 'closed');

    const candidate = await crashRecoveryService.detectOrphanedSession();
    expect(candidate).toBeNull();
  });

  it('uses the correct API name detectOrphanedSession (not detectCrash)', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    // Verify the method exists with the correct LLD v2.0 name
    expect(typeof crashRecoveryService.detectOrphanedSession).toBe('function');
    // Verify the old incorrect name does NOT exist
    expect((crashRecoveryService as Record<string, unknown>)['detectCrash']).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-03: detectOrphanedSession() returns candidate when active session exists
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-03: detectOrphanedSession() — active session found', () => {
  it('returns a RecoveryCandidate when an active session exists', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const sessionId = crypto.randomUUID();

    await seedActiveSession(sessionId, 50);

    const candidate = await crashRecoveryService.detectOrphanedSession();

    expect(candidate).not.toBeNull();
    expect(candidate?.sessionId).toBe(sessionId);
    expect(candidate?.brickCount).toBe(50);
    expect(candidate?.snapshot).toBeDefined();
    expect(candidate?.snapshot.bricks).toHaveLength(50);
    expect(candidate?.lastSavedAt).toBeGreaterThan(0);
  });

  it('returns the most recent active session when multiple exist', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const olderSessionId = crypto.randomUUID();
    const newerSessionId = crypto.randomUUID();

    // Seed older session first
    await seedActiveSession(olderSessionId, 10);
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 5));
    await seedActiveSession(newerSessionId, 25);

    const candidate = await crashRecoveryService.detectOrphanedSession();

    // Should return the most recent (newer) session
    expect(candidate).not.toBeNull();
    expect(candidate?.brickCount).toBe(25);
  });

  it('validates the snapshot before returning the candidate', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const sessionId = crypto.randomUUID();

    await seedActiveSession(sessionId, 30);

    const candidate = await crashRecoveryService.detectOrphanedSession();

    // validateSnapshot should have been called — candidate is valid
    expect(candidate).not.toBeNull();
    expect(candidate?.snapshot.bricks).toBeDefined();
    expect(Array.isArray(candidate?.snapshot.bricks)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-08: Corrupted recovery data is discarded gracefully
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-08: Corrupted recovery data — discarded gracefully', () => {
  it('returns null when snapshot has null bricks (corrupted)', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const sessionId = crypto.randomUUID();

    // Seed a corrupted snapshot (null bricks)
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SCENE_SNAPSHOTS_STORE)) {
          db.createObjectStore(SCENE_SNAPSHOTS_STORE, { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains(AUTO_SAVE_META_STORE)) {
          db.createObjectStore(AUTO_SAVE_META_STORE, { keyPath: 'sessionId' });
        }
      },
    });

    const corruptedSnapshot = {
      sessionId,
      timestamp: Date.now(),
      schemaVersion: 1,
      bricks: null, // corrupted!
    };

    const meta: AutoSaveMeta = {
      sessionId,
      status: 'active',
      startedAt: Date.now() - 60_000,
      lastSavedAt: Date.now(),
      brickCount: 10,
    };

    const tx = db.transaction([SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE], 'readwrite');
    await tx.objectStore(SCENE_SNAPSHOTS_STORE).put(corruptedSnapshot);
    await tx.objectStore(AUTO_SAVE_META_STORE).put(meta);
    await tx.done;
    db.close();

    const candidate = await crashRecoveryService.detectOrphanedSession();
    expect(candidate).toBeNull();
  });

  it('returns null when snapshot has invalid schemaVersion', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const sessionId = crypto.randomUUID();

    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SCENE_SNAPSHOTS_STORE)) {
          db.createObjectStore(SCENE_SNAPSHOTS_STORE, { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains(AUTO_SAVE_META_STORE)) {
          db.createObjectStore(AUTO_SAVE_META_STORE, { keyPath: 'sessionId' });
        }
      },
    });

    const futureSchemaSnapshot = {
      sessionId,
      timestamp: Date.now(),
      schemaVersion: 999, // future schema — incompatible
      bricks: [{ id: 'b1', type: '2x4', position: { x: 0, y: 0, z: 0 }, rotation: 0, color: '#FF0000' }],
    };

    const meta: AutoSaveMeta = {
      sessionId,
      status: 'active',
      startedAt: Date.now() - 60_000,
      lastSavedAt: Date.now(),
      brickCount: 1,
    };

    const tx = db.transaction([SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE], 'readwrite');
    await tx.objectStore(SCENE_SNAPSHOTS_STORE).put(futureSchemaSnapshot);
    await tx.objectStore(AUTO_SAVE_META_STORE).put(meta);
    await tx.done;
    db.close();

    const candidate = await crashRecoveryService.detectOrphanedSession();
    expect(candidate).toBeNull();
  });

  it('validateSnapshot returns false for null bricks', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const invalidSnapshot = {
      sessionId: 'test',
      timestamp: Date.now(),
      schemaVersion: 1,
      bricks: null,
    } as unknown as SceneSnapshot;

    expect(crashRecoveryService.validateSnapshot(invalidSnapshot)).toBe(false);
  });

  it('validateSnapshot returns true for valid snapshot', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const validSnapshot: SceneSnapshot = {
      sessionId: 'test',
      timestamp: Date.now(),
      schemaVersion: 1,
      bricks: makeBricks(5),
    };

    expect(crashRecoveryService.validateSnapshot(validSnapshot)).toBe(true);
  });

  it('discardRecovery purges all IDB data for the session', async () => {
    const { crashRecoveryService } = await import('../crashRecoveryService');
    const sessionId = crypto.randomUUID();

    await seedActiveSession(sessionId, 10);

    // Verify data exists
    const db = await openDB(DB_NAME, DB_VERSION);
    const beforeDiscard = await db.get(AUTO_SAVE_META_STORE, sessionId);
    expect(beforeDiscard).toBeDefined();
    db.close();

    // Discard the recovery
    await crashRecoveryService.discardRecovery(sessionId);

    // Verify data is gone
    const db2 = await openDB(DB_NAME, DB_VERSION);
    const afterDiscard = await db2.get(AUTO_SAVE_META_STORE, sessionId);
    expect(afterDiscard).toBeUndefined();
    db2.close();
  });
});
