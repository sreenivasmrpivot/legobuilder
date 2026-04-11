/**
 * Persistence Service — IndexedDB read/write operations
 *
 * Provides atomic dual-store writes (scene-snapshots + auto-save-meta),
 * session lifecycle management, and quota exceeded recovery.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */

import {
  getDB,
  SCENE_SNAPSHOTS_STORE,
  AUTO_SAVE_META_STORE,
  MAX_RETAINED_SNAPSHOTS,
  PersistenceError,
  PersistenceErrorCode,
  type SceneSnapshot,
  type AutoSaveMeta,
  type BrickRecord,
  type CameraState,
  type SceneMetadata,
} from './dbSchema';

// ---------------------------------------------------------------------------
// App version (injected at build time or hardcoded for now)
// ---------------------------------------------------------------------------

const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Session ID management
// ---------------------------------------------------------------------------

let currentSessionId: string | null = null;
let currentSaveCount = 0;

/**
 * Get or create the current session ID.
 */
export function getSessionId(): string {
  if (!currentSessionId) {
    currentSessionId = crypto.randomUUID();
    currentSaveCount = 0;
  }
  return currentSessionId;
}

/**
 * Reset session state (used after discard or for testing).
 */
export function resetSession(): void {
  currentSessionId = null;
  currentSaveCount = 0;
}

// ---------------------------------------------------------------------------
// saveSnapshot — atomic dual-store write
// ---------------------------------------------------------------------------

export interface SaveSnapshotInput {
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
}

/**
 * Saves a scene snapshot and updates auto-save metadata in a single
 * IndexedDB transaction. If the transaction fails, neither store is modified.
 *
 * On QuotaExceededError, purges oldest snapshots and retries once.
 */
export async function saveSnapshot(input: SaveSnapshotInput): Promise<string> {
  const db = await getDB();
  const sessionId = getSessionId();
  const snapshotId = crypto.randomUUID();
  const now = Date.now();
  currentSaveCount += 1;

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
    saveCount: currentSaveCount,
    lastSavedAt: now,
    appVersion: APP_VERSION,
    status: 'active',
  };

  try {
    const tx = db.transaction(
      [SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE],
      'readwrite',
    );
    await Promise.all([
      tx.objectStore(SCENE_SNAPSHOTS_STORE).put(snapshot),
      tx.objectStore(AUTO_SAVE_META_STORE).put(meta),
      tx.done,
    ]);
    return snapshotId;
  } catch (error) {
    // Check for QuotaExceededError
    if (
      error instanceof DOMException &&
      error.name === 'QuotaExceededError'
    ) {
      // Purge oldest snapshots and retry
      await purgeOldSnapshots(sessionId);
      try {
        const retryTx = db.transaction(
          [SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE],
          'readwrite',
        );
        await Promise.all([
          retryTx.objectStore(SCENE_SNAPSHOTS_STORE).put(snapshot),
          retryTx.objectStore(AUTO_SAVE_META_STORE).put(meta),
          retryTx.done,
        ]);
        return snapshotId;
      } catch (retryError) {
        throw new PersistenceError(
          'Storage quota exceeded even after purge',
          PersistenceErrorCode.QUOTA_EXCEEDED,
          retryError,
        );
      }
    }
    throw new PersistenceError(
      'Failed to save snapshot',
      PersistenceErrorCode.TRANSACTION_FAILED,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// closeSession — marks session as 'closed' (graceful shutdown)
// ---------------------------------------------------------------------------

/**
 * Marks the current session as 'closed' in auto-save-meta.
 * Called from the beforeunload handler to distinguish graceful close
 * from a crash (where status remains 'active').
 */
export async function closeSession(): Promise<void> {
  if (!currentSessionId) return;

  try {
    const db = await getDB();
    const tx = db.transaction(AUTO_SAVE_META_STORE, 'readwrite');
    const store = tx.objectStore(AUTO_SAVE_META_STORE);
    const record = await store.get(currentSessionId) as AutoSaveMeta | undefined;

    if (record) {
      await store.put({ ...record, status: 'closed' as const });
    }
    await tx.done;
  } catch {
    // Best-effort on close — don't throw during beforeunload
    console.warn('[persistenceService] Failed to close session gracefully');
  }
}

// ---------------------------------------------------------------------------
// loadSnapshot — retrieve a specific snapshot by ID
// ---------------------------------------------------------------------------

/**
 * Loads a scene snapshot by its snapshotId.
 */
export async function loadSnapshot(
  snapshotId: string,
): Promise<SceneSnapshot | undefined> {
  const db = await getDB();
  return db.get(SCENE_SNAPSHOTS_STORE, snapshotId) as Promise<SceneSnapshot | undefined>;
}

// ---------------------------------------------------------------------------
// purgeOldSnapshots — keeps only the N most recent snapshots per session
// ---------------------------------------------------------------------------

/**
 * Deletes all but the most recent MAX_RETAINED_SNAPSHOTS snapshots
 * for the given session. Used for quota recovery.
 */
export async function purgeOldSnapshots(sessionId: string): Promise<number> {
  const db = await getDB();

  // Get all snapshots for this session
  const allSnapshots = await db.getAllFromIndex(
    SCENE_SNAPSHOTS_STORE,
    'sessionId',
    sessionId,
  ) as SceneSnapshot[];

  if (allSnapshots.length <= MAX_RETAINED_SNAPSHOTS) return 0;

  // Sort by timestamp descending, keep the newest
  const sorted = allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
  const toDelete = sorted.slice(MAX_RETAINED_SNAPSHOTS);

  const tx = db.transaction(SCENE_SNAPSHOTS_STORE, 'readwrite');
  const store = tx.objectStore(SCENE_SNAPSHOTS_STORE);
  for (const snap of toDelete) {
    store.delete(snap.snapshotId);
  }
  await tx.done;

  return toDelete.length;
}

// ---------------------------------------------------------------------------
// purgeSession — remove all data for a session (used after discard)
// ---------------------------------------------------------------------------

/**
 * Removes all snapshots and meta for a given session.
 */
export async function purgeSession(sessionId: string): Promise<void> {
  const db = await getDB();

  const allSnapshots = await db.getAllFromIndex(
    SCENE_SNAPSHOTS_STORE,
    'sessionId',
    sessionId,
  ) as SceneSnapshot[];

  const tx = db.transaction(
    [SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE],
    'readwrite',
  );
  for (const snap of allSnapshots) {
    tx.objectStore(SCENE_SNAPSHOTS_STORE).delete(snap.snapshotId);
  }
  tx.objectStore(AUTO_SAVE_META_STORE).delete(sessionId);
  await tx.done;
}
