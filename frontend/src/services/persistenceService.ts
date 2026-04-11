/**
 * Persistence Service — NFR-REL-001
 *
 * Provides atomic IndexedDB read/write operations for auto-save.
 * All writes to scene-snapshots and auto-save-meta happen in a single
 * IDB transaction to guarantee atomicity (LLD Section 4.2 / Section 7).
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */

import {
  openDB,
  STORE_SCENE_SNAPSHOTS,
  STORE_AUTO_SAVE_META,
  PersistenceError,
  PersistenceErrorCode,
  type SceneSnapshot,
  type AutoSaveMeta,
  type BrickRecord,
  type CameraState,
  type SceneMetadata,
} from './dbSchema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const APP_VERSION = '1.0.0';
const MAX_SNAPSHOTS_PER_SESSION = 10;

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

let currentSessionId: string | null = null;
let saveCount = 0;

/**
 * Generate or return the current session ID.
 * A new session ID is created on first call per page load.
 */
export function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = crypto.randomUUID();
    saveCount = 0;
  }
  return currentSessionId;
}

/**
 * Reset the session (used after discard or for testing).
 */
export function resetSession(): void {
  currentSessionId = null;
  saveCount = 0;
}

// ---------------------------------------------------------------------------
// saveSnapshot() — T-UNIT-REL-001-01
// ---------------------------------------------------------------------------

export interface SaveSnapshotInput {
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
}

/**
 * Save a scene snapshot atomically to both scene-snapshots and auto-save-meta
 * stores in a single IndexedDB transaction.
 *
 * On QuotaExceededError, purges oldest snapshots and retries once.
 */
export async function saveSnapshot(input: SaveSnapshotInput): Promise<string> {
  const db = await openDB();
  const sessionId = getSessionId();
  const snapshotId = crypto.randomUUID();
  const now = Date.now();

  saveCount += 1;

  const snapshot: SceneSnapshot = {
    snapshotId,
    sessionId,
    timestamp: now,
    schemaVersion: 1,
    bricks: input.bricks,
    cameraState: input.cameraState,
    sceneMetadata: input.sceneMetadata,
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
    await atomicWrite(db, snapshot, meta);
  } catch (error) {
    if (isQuotaExceeded(error)) {
      // Purge oldest snapshots and retry once
      await purgeOldestSnapshots(db, sessionId);
      try {
        await atomicWrite(db, snapshot, meta);
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
 * Perform the atomic dual-store write in a single transaction.
 */
async function atomicWrite(
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

// ---------------------------------------------------------------------------
// closeSession() — T-UNIT-REL-001-04
// ---------------------------------------------------------------------------

/**
 * Mark the current session as 'closed' in auto-save-meta.
 * Called from the beforeunload handler for graceful close.
 */
export async function closeSession(sessionId?: string): Promise<void> {
  const db = await openDB();
  const sid = sessionId ?? currentSessionId;
  if (!sid) return;

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_AUTO_SAVE_META, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const store = tx.objectStore(STORE_AUTO_SAVE_META);
    const getReq = store.get(sid);
    getReq.onsuccess = () => {
      const record = getReq.result as AutoSaveMeta | undefined;
      if (record) {
        store.put({ ...record, status: 'closed' });
      }
    };
  });
}

// ---------------------------------------------------------------------------
// loadSnapshot()
// ---------------------------------------------------------------------------

/**
 * Load a specific snapshot by its ID.
 */
export async function loadSnapshot(snapshotId: string): Promise<SceneSnapshot | null> {
  const db = await openDB();

  return new Promise<SceneSnapshot | null>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readonly');
    const req = tx.objectStore(STORE_SCENE_SNAPSHOTS).get(snapshotId);
    req.onsuccess = () => resolve((req.result as SceneSnapshot) ?? null);
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// purgeSession()
// ---------------------------------------------------------------------------

/**
 * Remove all data for a given session (meta + all snapshots).
 * Used when the user discards a recovery candidate.
 */
export async function purgeSession(sessionId: string): Promise<void> {
  const db = await openDB();

  // Get all snapshot IDs for this session
  const snapshotIds = await new Promise<string[]>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readonly');
    const index = tx.objectStore(STORE_SCENE_SNAPSHOTS).index('sessionId');
    const req = index.getAll(IDBKeyRange.only(sessionId));
    req.onsuccess = () => {
      const snapshots = req.result as SceneSnapshot[];
      resolve(snapshots.map((s) => s.snapshotId));
    };
    req.onerror = () => reject(req.error);
  });

  // Delete all in one transaction
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [STORE_SCENE_SNAPSHOTS, STORE_AUTO_SAVE_META],
      'readwrite',
    );
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();

    const snapStore = tx.objectStore(STORE_SCENE_SNAPSHOTS);
    for (const id of snapshotIds) {
      snapStore.delete(id);
    }
    tx.objectStore(STORE_AUTO_SAVE_META).delete(sessionId);
  });
}

// ---------------------------------------------------------------------------
// Quota management — T-UNIT-REL-001-07
// ---------------------------------------------------------------------------

/**
 * Purge oldest snapshots for a session, keeping only the most recent
 * MAX_SNAPSHOTS_PER_SESSION entries.
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

  // Sort by timestamp descending, keep first MAX_SNAPSHOTS_PER_SESSION
  const sorted = allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
  const toDelete = sorted.slice(MAX_SNAPSHOTS_PER_SESSION).map((s) => s.snapshotId);

  if (toDelete.length === 0) return;

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readwrite');
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    const store = tx.objectStore(STORE_SCENE_SNAPSHOTS);
    for (const id of toDelete) {
      store.delete(id);
    }
  });
}

/**
 * Check if an error is a QuotaExceededError.
 */
function isQuotaExceeded(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.message.includes('QuotaExceededError')
    );
  }
  return false;
}

export type { SceneSnapshot, AutoSaveMeta, BrickRecord, CameraState, SceneMetadata };
export { PersistenceError, PersistenceErrorCode };
