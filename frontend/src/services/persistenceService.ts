/**
 * Persistence Service — IndexedDB read/write operations
 *
 * Provides atomic dual-store writes (scene-snapshots + auto-save-meta),
 * session lifecycle management, and quota-exceeded recovery.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */

import {
  type AutoSaveMeta,
  type BrickRecord,
  type CameraState,
  type SceneMetadata,
  type SceneSnapshot,
  PersistenceError,
  PersistenceErrorCode,
  STORE_AUTO_SAVE_META,
  STORE_SCENE_SNAPSHOTS,
  openDatabase,
} from './dbSchema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_VERSION = '1.0.0';
const MAX_SNAPSHOTS_TO_KEEP = 10;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Save a scene snapshot atomically to both object stores in a single
 * IndexedDB transaction. If either write fails, neither is committed.
 *
 * @param sessionId - Current session identifier
 * @param bricks - Array of brick records to persist
 * @param cameraState - Current camera state
 * @param sceneMetadata - Scene metadata (name, timestamps)
 * @param saveCount - Incremental save counter for this session
 * @returns The generated snapshot ID
 */
export async function saveSnapshot(
  sessionId: string,
  bricks: BrickRecord[],
  cameraState: CameraState,
  sceneMetadata: SceneMetadata,
  saveCount: number,
): Promise<string> {
  const db = await openDatabase();
  const snapshotId = crypto.randomUUID();
  const now = Date.now();

  const snapshot: SceneSnapshot = {
    snapshotId,
    sessionId,
    timestamp: now,
    schemaVersion: 1,
    bricks,
    cameraState,
    sceneMetadata: {
      ...sceneMetadata,
      lastModifiedAt: now,
    },
  };

  const meta: AutoSaveMeta = {
    sessionId,
    latestSnapshotId: snapshotId,
    saveCount,
    lastSavedAt: now,
    appVersion: APP_VERSION,
    status: 'active',
  };

  try {
    await performAtomicWrite(db, snapshot, meta);
  } catch (error) {
    if (isQuotaExceededError(error)) {
      // Purge oldest snapshots and retry once
      await purgeOldestSnapshots(db, sessionId);
      try {
        await performAtomicWrite(db, snapshot, meta);
      } catch (retryError) {
        throw new PersistenceError(
          'Storage quota exceeded even after purge',
          PersistenceErrorCode.QUOTA_EXCEEDED,
          retryError,
        );
      }
    } else {
      throw new PersistenceError(
        'Failed to save snapshot',
        PersistenceErrorCode.TRANSACTION_FAILED,
        error,
      );
    }
  }

  return snapshotId;
}

/**
 * Mark a session as 'closed' in auto-save-meta.
 * Called during graceful shutdown (beforeunload).
 *
 * @param sessionId - Session to close
 */
export async function closeSession(sessionId: string): Promise<void> {
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_AUTO_SAVE_META, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const store = tx.objectStore(STORE_AUTO_SAVE_META);
    const getReq = store.get(sessionId);
    getReq.onsuccess = () => {
      const record = getReq.result as AutoSaveMeta | undefined;
      if (record) {
        store.put({ ...record, status: 'closed' });
      }
    };
  });
}

/**
 * Load a specific snapshot by its ID.
 *
 * @param snapshotId - The snapshot to load
 * @returns The snapshot or undefined if not found
 */
export async function loadSnapshot(
  snapshotId: string,
): Promise<SceneSnapshot | undefined> {
  const db = await openDatabase();

  return new Promise<SceneSnapshot | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readonly');
    const req = tx.objectStore(STORE_SCENE_SNAPSHOTS).get(snapshotId);
    req.onsuccess = () => resolve(req.result as SceneSnapshot | undefined);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a session and all its associated snapshots.
 *
 * @param sessionId - Session to purge
 */
export async function purgeSession(sessionId: string): Promise<void> {
  const db = await openDatabase();

  // Get all snapshots for this session
  const snapshots = await new Promise<SceneSnapshot[]>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readonly');
    const index = tx.objectStore(STORE_SCENE_SNAPSHOTS).index('sessionId');
    const req = index.getAll(IDBKeyRange.only(sessionId));
    req.onsuccess = () => resolve(req.result as SceneSnapshot[]);
    req.onerror = () => reject(req.error);
  });

  // Delete all in a single transaction
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [STORE_SCENE_SNAPSHOTS, STORE_AUTO_SAVE_META],
      'readwrite',
    );
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const snapStore = tx.objectStore(STORE_SCENE_SNAPSHOTS);
    for (const snap of snapshots) {
      snapStore.delete(snap.snapshotId);
    }
    tx.objectStore(STORE_AUTO_SAVE_META).delete(sessionId);
  });
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Perform an atomic write of both snapshot and meta in a single transaction.
 */
async function performAtomicWrite(
  db: IDBDatabase,
  snapshot: SceneSnapshot,
  meta: AutoSaveMeta,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [STORE_SCENE_SNAPSHOTS, STORE_AUTO_SAVE_META],
      'readwrite',
    );
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    tx.objectStore(STORE_SCENE_SNAPSHOTS).put(snapshot);
    tx.objectStore(STORE_AUTO_SAVE_META).put(meta);
  });
}

/**
 * Detect if an error is a QuotaExceededError from IndexedDB.
 */
function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.message.includes('QuotaExceededError')
    );
  }
  return false;
}

/**
 * Purge the oldest snapshots for a session, keeping only the most recent
 * MAX_SNAPSHOTS_TO_KEEP entries.
 */
async function purgeOldestSnapshots(
  db: IDBDatabase,
  sessionId: string,
): Promise<void> {
  const allSnapshots = await new Promise<SceneSnapshot[]>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readonly');
    const index = tx.objectStore(STORE_SCENE_SNAPSHOTS).index('sessionId');
    const req = index.getAll(IDBKeyRange.only(sessionId));
    req.onsuccess = () => resolve(req.result as SceneSnapshot[]);
    req.onerror = () => reject(req.error);
  });

  // Sort by timestamp descending, keep first MAX_SNAPSHOTS_TO_KEEP
  const sorted = allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
  const toDelete = sorted.slice(MAX_SNAPSHOTS_TO_KEEP).map((s) => s.snapshotId);

  if (toDelete.length === 0) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    const store = tx.objectStore(STORE_SCENE_SNAPSHOTS);
    for (const id of toDelete) {
      store.delete(id);
    }
  });
}
