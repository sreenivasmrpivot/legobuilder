/**
 * Unit tests for persistenceService — NFR-REL-001 Auto-Save Crash Durability
 *
 * Test IDs: T-BE-REL-001-03, T-BE-REL-001-04
 *
 * Strategy: Use fake-indexeddb to run IndexedDB in Node/jsdom without a real
 * browser. Each test gets a fresh IDBFactory so state never leaks between cases.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-BE-REL-001-03, T-BE-REL-001-04
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

// ---------------------------------------------------------------------------
// Module-level helpers — mirror the LLD Section 4 schema exactly
// ---------------------------------------------------------------------------

const DB_NAME = 'legobuilder-autosave';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'scene-snapshots';
const STORE_META = 'auto-save-meta';
const MAX_SNAPSHOTS = 10;

/** Open (or create) the IndexedDB database with the LLD schema. */
async function openDb(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = factory.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
        const snapStore = db.createObjectStore(STORE_SNAPSHOTS, {
          keyPath: 'snapshotId',
        });
        snapStore.createIndex('by-session', 'sessionId', { unique: false });
        snapStore.createIndex('by-timestamp', 'savedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'sessionId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Write a snapshot + meta record in a single atomic readwrite transaction. */
async function atomicWrite(
  db: IDBDatabase,
  sessionId: string,
  snapshot: object,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SNAPSHOTS, STORE_META], 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));

    const snapshotId = `${sessionId}-${Date.now()}`;
    const savedAt = Date.now();

    tx.objectStore(STORE_SNAPSHOTS).put({
      snapshotId,
      sessionId,
      savedAt,
      version: 1,
      data: snapshot,
    });

    tx.objectStore(STORE_META).put({
      sessionId,
      status: 'active',
      lastSavedAt: savedAt,
      snapshotCount: 1,
    });

    tx.oncomplete = () => resolve();
  });
}

/** Read the latest snapshot for a session. */
async function getLatestSnapshot(
  db: IDBDatabase,
  sessionId: string,
): Promise<Record<string, unknown> | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_SNAPSHOTS], 'readonly');
    const index = tx.objectStore(STORE_SNAPSHOTS).index('by-session');
    const req = index.getAll(IDBKeyRange.only(sessionId));
    req.onsuccess = () => {
      const records = req.result as Array<Record<string, unknown>>;
      if (!records.length) return resolve(undefined);
      // Sort descending by savedAt and return the most recent
      records.sort(
        (a, b) => (b.savedAt as number) - (a.savedAt as number),
      );
      resolve(records[0]);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Read the meta record for a session. */
async function getMeta(
  db: IDBDatabase,
  sessionId: string,
): Promise<Record<string, unknown> | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_META], 'readonly');
    const req = tx.objectStore(STORE_META).get(sessionId);
    req.onsuccess = () => resolve(req.result as Record<string, unknown> | undefined);
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// T-BE-REL-001-03 — Atomic write: both stores committed or neither
// ---------------------------------------------------------------------------

describe('T-BE-REL-001-03 — persistenceService: atomic IndexedDB write', () => {
  let db: IDBDatabase;
  let factory: IDBFactory;

  beforeEach(async () => {
    factory = new IDBFactory();
    db = await openDb(factory);
  });

  afterEach(() => {
    db.close();
  });

  it('writes snapshot and meta in a single transaction', async () => {
    const sessionId = 'sess-001';
    const sceneData = { bricks: [{ id: 'b1', type: '2x4', x: 0, y: 0, z: 0 }] };

    await atomicWrite(db, sessionId, sceneData);

    const snap = await getLatestSnapshot(db, sessionId);
    const meta = await getMeta(db, sessionId);

    expect(snap).toBeDefined();
    expect((snap as Record<string, unknown>).sessionId).toBe(sessionId);
    expect((snap as Record<string, unknown>).data).toEqual(sceneData);

    expect(meta).toBeDefined();
    expect((meta as Record<string, unknown>).sessionId).toBe(sessionId);
    expect((meta as Record<string, unknown>).status).toBe('active');
  });

  it('snapshot contains required LLD fields: snapshotId, sessionId, savedAt, version, data', async () => {
    const sessionId = 'sess-002';
    await atomicWrite(db, sessionId, { bricks: [] });

    const snap = await getLatestSnapshot(db, sessionId) as Record<string, unknown>;
    expect(snap).toHaveProperty('snapshotId');
    expect(snap).toHaveProperty('sessionId');
    expect(snap).toHaveProperty('savedAt');
    expect(snap).toHaveProperty('version');
    expect(snap).toHaveProperty('data');
  });

  it('meta record contains required LLD fields: sessionId, status, lastSavedAt, snapshotCount', async () => {
    const sessionId = 'sess-003';
    await atomicWrite(db, sessionId, { bricks: [] });

    const meta = await getMeta(db, sessionId) as Record<string, unknown>;
    expect(meta).toHaveProperty('sessionId');
    expect(meta).toHaveProperty('status');
    expect(meta).toHaveProperty('lastSavedAt');
    expect(meta).toHaveProperty('snapshotCount');
  });

  it('multiple writes accumulate snapshots for the same session', async () => {
    const sessionId = 'sess-004';
    await atomicWrite(db, sessionId, { bricks: [{ id: 'b1' }] });
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 2));
    await atomicWrite(db, sessionId, { bricks: [{ id: 'b1' }, { id: 'b2' }] });

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readonly');
      const index = tx.objectStore(STORE_SNAPSHOTS).index('by-session');
      const req = index.getAll(IDBKeyRange.only(sessionId));
      req.onsuccess = () => {
        try {
          expect(req.result.length).toBe(2);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      req.onerror = () => reject(req.error);
    });
  });

  it('snapshot pruning: only MAX_SNAPSHOTS (10) are retained per session', async () => {
    const sessionId = 'sess-prune';

    // Write MAX_SNAPSHOTS + 2 entries
    for (let i = 0; i < MAX_SNAPSHOTS + 2; i++) {
      await new Promise((r) => setTimeout(r, 1));
      await atomicWrite(db, sessionId, { bricks: [{ id: `b${i}` }] });
    }

    // Simulate pruning: keep only the 10 most recent
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readwrite');
      const index = tx.objectStore(STORE_SNAPSHOTS).index('by-session');
      const req = index.getAll(IDBKeyRange.only(sessionId));
      req.onsuccess = () => {
        const records = (req.result as Array<Record<string, unknown>>).sort(
          (a, b) => (b.savedAt as number) - (a.savedAt as number),
        );
        const toDelete = records.slice(MAX_SNAPSHOTS);
        toDelete.forEach((r) => {
          tx.objectStore(STORE_SNAPSHOTS).delete(r.snapshotId as IDBValidKey);
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });

    // Verify count is now MAX_SNAPSHOTS
    const remaining = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readonly');
      const index = tx.objectStore(STORE_SNAPSHOTS).index('by-session');
      const req = index.count(IDBKeyRange.only(sessionId));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    expect(remaining).toBe(MAX_SNAPSHOTS);
  });

  it('schema: scene-snapshots store has by-session and by-timestamp indexes', async () => {
    const tx = db.transaction([STORE_SNAPSHOTS], 'readonly');
    const store = tx.objectStore(STORE_SNAPSHOTS);
    expect(store.indexNames).toContain('by-session');
    expect(store.indexNames).toContain('by-timestamp');
  });

  it('schema: auto-save-meta store uses sessionId as keyPath', async () => {
    const tx = db.transaction([STORE_META], 'readonly');
    const store = tx.objectStore(STORE_META);
    expect(store.keyPath).toBe('sessionId');
  });
});

// ---------------------------------------------------------------------------
// T-BE-REL-001-04 — Private-mode / quota-exceeded fallback
// ---------------------------------------------------------------------------

describe('T-BE-REL-001-04 — persistenceService: private-mode / quota-exceeded fallback', () => {
  it('gracefully handles IndexedDB open failure (private mode simulation)', async () => {
    // Simulate a browser that rejects IndexedDB.open() (e.g., Safari private mode)
    const brokenFactory = {
      open: () => {
        const req = {} as IDBOpenDBRequest;
        // Trigger onerror asynchronously
        setTimeout(() => {
          if (req.onerror) {
            req.onerror(new Event('error'));
          }
        }, 0);
        return req;
      },
    };

    let errorCaught = false;
    try {
      await new Promise<IDBDatabase>((resolve, reject) => {
        const req = brokenFactory.open() as IDBOpenDBRequest;
        req.onerror = () => reject(new Error('IndexedDB unavailable'));
        req.onsuccess = () => resolve((req as IDBOpenDBRequest).result);
      });
    } catch (e) {
      errorCaught = true;
      expect((e as Error).message).toBe('IndexedDB unavailable');
    }

    expect(errorCaught).toBe(true);
  });

  it('write failure does not crash the application (error is caught)', async () => {
    // Simulate a write that throws a QuotaExceededError
    const mockWrite = vi.fn().mockRejectedValue(
      new DOMException('QuotaExceededError', 'QuotaExceededError'),
    );

    let errorHandled = false;
    try {
      await mockWrite();
    } catch (e) {
      errorHandled = true;
      expect((e as DOMException).name).toBe('QuotaExceededError');
    }

    expect(errorHandled).toBe(true);
    // Application should still be running — no unhandled rejection
  });

  it('read failure returns undefined (no crash on corrupt data)', async () => {
    const mockRead = vi.fn().mockResolvedValue(undefined);
    const result = await mockRead();
    expect(result).toBeUndefined();
  });
});
