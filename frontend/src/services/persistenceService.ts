/**
 * Persistence Service — IndexedDB read/write operations
 *
 * Implements atomic dual-store writes (scene-snapshots + auto-save-meta),
 * session lifecycle management, and quota exceeded purge logic.
 *
 * Uses the `idb` library for Promise-based IndexedDB access.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */
import {
  getDB,
  PersistenceError,
  PersistenceErrorCode,
  CURRENT_SCHEMA_VERSION,
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
// Types
// ---------------------------------------------------------------------------

export interface SaveSnapshotInput {
  sessionId: string;
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
}

// ---------------------------------------------------------------------------
// saveSnapshot() — Atomic dual-store write (LLD Section 4.2 / 7)
// ---------------------------------------------------------------------------

/**
 * Saves a scene snapshot and updates auto-save metadata in a single
 * IndexedDB transaction. Both stores are written atomically — if either
 * write fails, neither is persisted.
 *
 * @returns The generated snapshotId
 */
export async function saveSnapshot(input: SaveSnapshotInput): Promise<string> {
  const db = await getDB();
  const snapshotId = crypto.randomUUID();
  const now = Date.now();

  const snapshot: SceneSnapshot = {
    snapshotId,
    sessionId: input.sessionId,
    timestamp: now,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    bricks: input.bricks,
    cameraState: input.cameraState,
    sceneMetadata: input.sceneMetadata,
  };

  try {
    // Read existing meta to get saveCount
    const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
    const snapStore = tx.objectStore('scene-snapshots');
    const metaStore = tx.objectStore('auto-save-meta');

    const existingMeta = await metaStore.get(input.sessionId);
    const saveCount = existingMeta ? existingMeta.saveCount + 1 : 1;

    const meta: AutoSaveMeta = {
      sessionId: input.sessionId,
      latestSnapshotId: snapshotId,
      saveCount,
      lastSavedAt: now,
      appVersion: APP_VERSION,
      status: 'active',
    };

    await snapStore.put(snapshot);
    await metaStore.put(meta);
    await tx.done;

    return snapshotId;
  } catch (error) {
    // Check for QuotaExceededError
    if (isQuotaExceeded(error)) {
      // Attempt purge and retry
      await purgeOldSnapshots(input.sessionId);
      return saveSnapshot(input);
    }

    throw new PersistenceError(
      'Failed to save snapshot',
      PersistenceErrorCode.TRANSACTION_FAILED,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// closeSession() — Mark session as closed (LLD Section 4.2)
// ---------------------------------------------------------------------------

/**
 * Marks a session's auto-save-meta status as 'closed'.
 * Called during graceful tab close (beforeunload handler).
 * Preserves all other metadata fields.
 */
export async function closeSession(sessionId: string): Promise<void> {
  const db = await getDB();

  try {
    const tx = db.transaction('auto-save-meta', 'readwrite');
    const store = tx.objectStore('auto-save-meta');
    const record = await store.get(sessionId);

    if (record) {
      await store.put({ ...record, status: 'closed' });
    }

    await tx.done;
  } catch (error) {
    throw new PersistenceError(
      'Failed to close session',
      PersistenceErrorCode.TRANSACTION_FAILED,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// getSnapshot() — Read a specific snapshot
// ---------------------------------------------------------------------------

/**
 * Retrieves a scene snapshot by its ID.
 */
export async function getSnapshot(snapshotId: string): Promise<SceneSnapshot | undefined> {
  const db = await getDB();
  return db.get('scene-snapshots', snapshotId);
}

// ---------------------------------------------------------------------------
// getSessionMeta() — Read session metadata
// ---------------------------------------------------------------------------

/**
 * Retrieves auto-save metadata for a session.
 */
export async function getSessionMeta(sessionId: string): Promise<AutoSaveMeta | undefined> {
  const db = await getDB();
  return db.get('auto-save-meta', sessionId);
}

// ---------------------------------------------------------------------------
// purgeOldSnapshots() — Quota exceeded recovery (LLD Section 6)
// ---------------------------------------------------------------------------

/**
 * Purges oldest snapshots for a session, keeping only the most recent
 * MAX_SNAPSHOTS_PER_SESSION (10). Called when a QuotaExceededError occurs.
 */
export async function purgeOldSnapshots(sessionId: string): Promise<number> {
  const db = await getDB();

  const tx = db.transaction('scene-snapshots', 'readwrite');
  const index = tx.objectStore('scene-snapshots').index('sessionId');
  const allSnapshots = await index.getAll(IDBKeyRange.only(sessionId));

  if (allSnapshots.length <= MAX_SNAPSHOTS_PER_SESSION) {
    await tx.done;
    return 0;
  }

  // Sort by timestamp descending, keep the newest MAX_SNAPSHOTS_PER_SESSION
  const sorted = allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
  const toDelete = sorted.slice(MAX_SNAPSHOTS_PER_SESSION);

  const deleteTx = db.transaction('scene-snapshots', 'readwrite');
  const store = deleteTx.objectStore('scene-snapshots');

  for (const snap of toDelete) {
    await store.delete(snap.snapshotId);
  }

  await deleteTx.done;
  return toDelete.length;
}

// ---------------------------------------------------------------------------
// purgeSession() — Delete all data for a session
// ---------------------------------------------------------------------------

/**
 * Removes all snapshots and metadata for a given session.
 * Used when the user discards a recovery candidate.
 */
export async function purgeSession(sessionId: string): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
  const snapStore = tx.objectStore('scene-snapshots');
  const metaStore = tx.objectStore('auto-save-meta');

  // Delete all snapshots for this session
  const index = snapStore.index('sessionId');
  const snapshots = await index.getAll(IDBKeyRange.only(sessionId));
  for (const snap of snapshots) {
    await snapStore.delete(snap.snapshotId);
  }

  // Delete the meta record
  await metaStore.delete(sessionId);

  await tx.done;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isQuotaExceeded(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.message.includes('QuotaExceededError')
    );
  }
  return false;
}
