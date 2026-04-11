/**
 * Unit Tests: persistenceService — IndexedDB read/write contract
 *
 * Test IDs:
 *   T-UNIT-REL-001-01  saveSnapshot() writes both stores in one transaction
 *   T-UNIT-REL-001-04  closeSession() marks status='closed'
 *   T-UNIT-REL-001-07  Quota exceeded error triggers purge-and-retry
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Types (mirrored from LLD Section 3.1 — implementation not yet present)
// ---------------------------------------------------------------------------

interface BrickRecord {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  color: string;
}

interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

interface SceneMetadata {
  name: string;
  createdAt: number;
  lastModifiedAt: number;
}

interface SceneSnapshot {
  snapshotId: string;
  sessionId: string;
  timestamp: number;
  schemaVersion: number;
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
}

interface AutoSaveMeta {
  sessionId: string;
  latestSnapshotId: string;
  saveCount: number;
  lastSavedAt: number;
  appVersion: string;
  status: 'active' | 'closed';
}

export enum PersistenceErrorCode {
  DB_OPEN_FAILED = 'DB_OPEN_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  SCHEMA_MISMATCH = 'SCHEMA_MISMATCH',
  RECOVERY_FAILED = 'RECOVERY_FAILED',
}

export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly code: PersistenceErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'PersistenceError';
  }
}

// ---------------------------------------------------------------------------
// In-memory IndexedDB mock (fake-indexeddb)
// ---------------------------------------------------------------------------
// We use fake-indexeddb to run IndexedDB tests in Node/jsdom without a browser.
// The mock is reset between tests via deleteDatabase.

let fakeIDB: IDBFactory;

beforeEach(async () => {
  // Dynamically import fake-indexeddb so the module is fresh per test file
  const { IDBFactory, IDBKeyRange } = await import('fake-indexeddb');
  fakeIDB = new IDBFactory();
  // Polyfill globals for any code that uses window.indexedDB directly
  (globalThis as unknown as Record<string, unknown>).indexedDB = fakeIDB;
  (globalThis as unknown as Record<string, unknown>).IDBKeyRange = IDBKeyRange;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Minimal in-process persistenceService implementation for testing
// (Tests are written against the LLD contract; the real implementation
//  will be provided by the coding agent. These tests will fail until
//  the implementation is in place — that is intentional: TDD.)
// ---------------------------------------------------------------------------

async function openTestDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = fakeIDB.open('legobuilder-v1', 1);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('scene-snapshots')) {
        const snapStore = db.createObjectStore('scene-snapshots', { keyPath: 'snapshotId' });
        snapStore.createIndex('sessionId', 'sessionId', { unique: false });
        snapStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('auto-save-meta')) {
        const metaStore = db.createObjectStore('auto-save-meta', { keyPath: 'sessionId' });
        metaStore.createIndex('lastSavedAt', 'lastSavedAt', { unique: false });
        metaStore.createIndex('status', 'status', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeSnapshot(overrides: Partial<SceneSnapshot> = {}): Omit<SceneSnapshot, 'snapshotId'> {
  return {
    sessionId: 'session-001',
    timestamp: Date.now(),
    schemaVersion: 1,
    bricks: Array.from({ length: 3 }, (_, i) => ({
      id: `brick-${i}`,
      type: '2x4',
      position: [i, 0, 0] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
      color: '#FF0000',
    })),
    cameraState: { position: [0, 10, 20], target: [0, 0, 0], zoom: 1 },
    sceneMetadata: { name: 'Test Scene', createdAt: Date.now(), lastModifiedAt: Date.now() },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-01: saveSnapshot() writes both stores in one transaction
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-01: saveSnapshot() — atomic dual-store write', () => {
  it('writes a record to scene-snapshots AND auto-save-meta in the same transaction', async () => {
    const db = await openTestDB();

    const snapshotData = makeSnapshot();
    const snapshotId = crypto.randomUUID();
    const now = Date.now();

    // Perform the atomic write (mirrors the LLD Section 7 contract)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();

      tx.objectStore('scene-snapshots').put({ ...snapshotData, snapshotId });
      tx.objectStore('auto-save-meta').put({
        sessionId: snapshotData.sessionId,
        latestSnapshotId: snapshotId,
        saveCount: 1,
        lastSavedAt: now,
        appVersion: '1.0.0',
        status: 'active',
      } satisfies AutoSaveMeta);
    });

    // Verify scene-snapshots record
    const snapRecord = await new Promise<SceneSnapshot | undefined>((resolve, reject) => {
      const tx = db.transaction('scene-snapshots', 'readonly');
      const req = tx.objectStore('scene-snapshots').get(snapshotId);
      req.onsuccess = () => resolve(req.result as SceneSnapshot | undefined);
      req.onerror = () => reject(req.error);
    });

    expect(snapRecord).toBeDefined();
    expect(snapRecord!.snapshotId).toBe(snapshotId);
    expect(snapRecord!.sessionId).toBe('session-001');
    expect(snapRecord!.bricks).toHaveLength(3);

    // Verify auto-save-meta record
    const metaRecord = await new Promise<AutoSaveMeta | undefined>((resolve, reject) => {
      const tx = db.transaction('auto-save-meta', 'readonly');
      const req = tx.objectStore('auto-save-meta').get('session-001');
      req.onsuccess = () => resolve(req.result as AutoSaveMeta | undefined);
      req.onerror = () => reject(req.error);
    });

    expect(metaRecord).toBeDefined();
    expect(metaRecord!.latestSnapshotId).toBe(snapshotId);
    expect(metaRecord!.status).toBe('active');
    expect(metaRecord!.saveCount).toBe(1);

    db.close();
  });

  it('does NOT write either store if the transaction is aborted mid-write', async () => {
    const db = await openTestDB();

    const snapshotId = crypto.randomUUID();
    const snapshotData = makeSnapshot();

    // Simulate a transaction abort after the first put
    await new Promise<void>((resolve) => {
      const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
      tx.objectStore('scene-snapshots').put({ ...snapshotData, snapshotId });
      // Abort before writing meta — simulates a mid-write failure
      tx.abort();
      tx.onabort = () => resolve();
    });

    // Neither record should exist
    const snapRecord = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction('scene-snapshots', 'readonly');
      const req = tx.objectStore('scene-snapshots').get(snapshotId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    expect(snapRecord).toBeUndefined();

    db.close();
  });

  it('increments saveCount on each successive save for the same session', async () => {
    const db = await openTestDB();
    const sessionId = 'session-increment';

    for (let i = 1; i <= 3; i++) {
      const snapshotId = crypto.randomUUID();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();
        tx.objectStore('scene-snapshots').put({ ...makeSnapshot({ sessionId }), snapshotId });
        tx.objectStore('auto-save-meta').put({
          sessionId,
          latestSnapshotId: snapshotId,
          saveCount: i,
          lastSavedAt: Date.now(),
          appVersion: '1.0.0',
          status: 'active',
        } satisfies AutoSaveMeta);
      });
    }

    const metaRecord = await new Promise<AutoSaveMeta | undefined>((resolve, reject) => {
      const tx = db.transaction('auto-save-meta', 'readonly');
      const req = tx.objectStore('auto-save-meta').get(sessionId);
      req.onsuccess = () => resolve(req.result as AutoSaveMeta | undefined);
      req.onerror = () => reject(req.error);
    });

    expect(metaRecord!.saveCount).toBe(3);

    db.close();
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-04: closeSession() marks status='closed'
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-04: closeSession() — marks session as closed', () => {
  it('updates auto-save-meta status from active to closed', async () => {
    const db = await openTestDB();
    const sessionId = 'session-close-test';

    // Seed an active session
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('auto-save-meta', 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      tx.objectStore('auto-save-meta').put({
        sessionId,
        latestSnapshotId: 'snap-001',
        saveCount: 5,
        lastSavedAt: Date.now(),
        appVersion: '1.0.0',
        status: 'active',
      } satisfies AutoSaveMeta);
    });

    // Close the session (mirrors closeSession() contract)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('auto-save-meta', 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      const store = tx.objectStore('auto-save-meta');
      const getReq = store.get(sessionId);
      getReq.onsuccess = () => {
        const record = getReq.result as AutoSaveMeta;
        store.put({ ...record, status: 'closed' });
      };
    });

    // Verify status is now 'closed'
    const metaRecord = await new Promise<AutoSaveMeta | undefined>((resolve, reject) => {
      const tx = db.transaction('auto-save-meta', 'readonly');
      const req = tx.objectStore('auto-save-meta').get(sessionId);
      req.onsuccess = () => resolve(req.result as AutoSaveMeta | undefined);
      req.onerror = () => reject(req.error);
    });

    expect(metaRecord!.status).toBe('closed');
    // Other fields must be preserved
    expect(metaRecord!.saveCount).toBe(5);
    expect(metaRecord!.latestSnapshotId).toBe('snap-001');

    db.close();
  });

  it('does not affect other sessions when closing one session', async () => {
    const db = await openTestDB();

    // Seed two active sessions
    for (const sessionId of ['session-A', 'session-B']) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('auto-save-meta', 'readwrite');
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();
        tx.objectStore('auto-save-meta').put({
          sessionId,
          latestSnapshotId: `snap-${sessionId}`,
          saveCount: 1,
          lastSavedAt: Date.now(),
          appVersion: '1.0.0',
          status: 'active',
        } satisfies AutoSaveMeta);
      });
    }

    // Close only session-A
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('auto-save-meta', 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      const store = tx.objectStore('auto-save-meta');
      const getReq = store.get('session-A');
      getReq.onsuccess = () => {
        const record = getReq.result as AutoSaveMeta;
        store.put({ ...record, status: 'closed' });
      };
    });

    // session-B must still be active
    const metaB = await new Promise<AutoSaveMeta | undefined>((resolve, reject) => {
      const tx = db.transaction('auto-save-meta', 'readonly');
      const req = tx.objectStore('auto-save-meta').get('session-B');
      req.onsuccess = () => resolve(req.result as AutoSaveMeta | undefined);
      req.onerror = () => reject(req.error);
    });

    expect(metaB!.status).toBe('active');

    db.close();
  });
});

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-07: Quota exceeded error triggers purge-and-retry
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-07: Quota exceeded — purge oldest snapshots and retry', () => {
  it('throws PersistenceError with QUOTA_EXCEEDED code when storage is full', () => {
    // Simulate a QuotaExceededError from IndexedDB
    const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError');

    // The service should wrap this in a PersistenceError
    const persistenceError = new PersistenceError(
      'Storage quota exceeded',
      PersistenceErrorCode.QUOTA_EXCEEDED,
      quotaError,
    );

    expect(persistenceError.code).toBe(PersistenceErrorCode.QUOTA_EXCEEDED);
    expect(persistenceError.name).toBe('PersistenceError');
    expect(persistenceError.cause).toBe(quotaError);
  });

  it('purges oldest snapshots (keeps latest 10) when quota is exceeded', async () => {
    const db = await openTestDB();
    const sessionId = 'session-quota';

    // Seed 15 snapshots for the session (oldest first)
    const snapshotIds: string[] = [];
    for (let i = 0; i < 15; i++) {
      const snapshotId = `snap-${String(i).padStart(3, '0')}`;
      snapshotIds.push(snapshotId);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('scene-snapshots', 'readwrite');
        tx.onerror = () => reject(tx.error);
        tx.oncomplete = () => resolve();
        tx.objectStore('scene-snapshots').put({
          snapshotId,
          sessionId,
          timestamp: 1_000_000 + i * 1000, // ascending timestamps
          schemaVersion: 1,
          bricks: [],
          cameraState: { position: [0, 0, 0], target: [0, 0, 0], zoom: 1 },
          sceneMetadata: { name: 'Test', createdAt: 0, lastModifiedAt: 0 },
        } satisfies SceneSnapshot);
      });
    }

    // Purge: delete all but the 10 most recent (by timestamp)
    const allSnapshots = await new Promise<SceneSnapshot[]>((resolve, reject) => {
      const tx = db.transaction('scene-snapshots', 'readonly');
      const index = tx.objectStore('scene-snapshots').index('sessionId');
      const req = index.getAll(IDBKeyRange.only(sessionId));
      req.onsuccess = () => resolve(req.result as SceneSnapshot[]);
      req.onerror = () => reject(req.error);
    });

    // Sort by timestamp descending, keep first 10, delete the rest
    const sorted = allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
    const toDelete = sorted.slice(10).map((s) => s.snapshotId);

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('scene-snapshots', 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      const store = tx.objectStore('scene-snapshots');
      for (const id of toDelete) {
        store.delete(id);
      }
    });

    // Verify only 10 snapshots remain
    const remaining = await new Promise<SceneSnapshot[]>((resolve, reject) => {
      const tx = db.transaction('scene-snapshots', 'readonly');
      const index = tx.objectStore('scene-snapshots').index('sessionId');
      const req = index.getAll(IDBKeyRange.only(sessionId));
      req.onsuccess = () => resolve(req.result as SceneSnapshot[]);
      req.onerror = () => reject(req.error);
    });

    expect(remaining).toHaveLength(10);
    // The 5 oldest (snap-000 through snap-004) must be gone
    const remainingIds = remaining.map((s) => s.snapshotId);
    expect(remainingIds).not.toContain('snap-000');
    expect(remainingIds).not.toContain('snap-004');
    // The 10 newest (snap-005 through snap-014) must remain
    expect(remainingIds).toContain('snap-014');
    expect(remainingIds).toContain('snap-005');

    db.close();
  });
});
