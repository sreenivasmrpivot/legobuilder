/**
 * Persistence Service — NFR-REL-001
 *
 * Provides atomic dual-store IndexedDB writes for auto-save snapshots,
 * session close marking, and quota-exceeded purge logic.
 *
 * Contract tested by:
 *   T-UNIT-REL-001-01  saveSnapshot() atomic dual-store write
 *   T-UNIT-REL-001-04  closeSession() marks status='closed'
 *   T-UNIT-REL-001-07  Quota exceeded purge-and-retry
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */
import {
  getDB,
  APP_VERSION,
  CURRENT_SCHEMA_VERSION,
  MAX_SNAPSHOTS_PER_SESSION,
  type SceneSnapshot,
  type AutoSaveMeta,
  type BrickRecord,
  type CameraState,
  type SceneMetadata,
} from './dbSchema';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

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
// Save snapshot input
// ---------------------------------------------------------------------------

export interface SaveSnapshotInput {
  sessionId: string;
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
}

// ---------------------------------------------------------------------------
// saveSnapshot()
// ---------------------------------------------------------------------------

/**
 * Atomically writes a scene snapshot and updates the auto-save-meta record
 * in a single IndexedDB transaction.
 *
 * If a QuotaExceededError occurs, purges oldest snapshots and retries once.
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

  // Read existing meta to increment saveCount
  let existingMeta: AutoSaveMeta | undefined;
  try {
    existingMeta = await db.get('auto-save-meta', input.sessionId);
  } catch {
    // First save for this session
  }

  const meta: AutoSaveMeta = {
    sessionId: input.sessionId,
    latestSnapshotId: snapshotId,
    saveCount: (existingMeta?.saveCount ?? 0) + 1,
    lastSavedAt: now,
    appVersion: APP_VERSION,
    status: 'active',
  };

  try {
    const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
    const snapStore = tx.objectStore('scene-snapshots');
    const metaStore = tx.objectStore('auto-save-meta');

    await Promise.all([
      snapStore.put(snapshot),
      metaStore.put(meta),
      tx.done,
    ]);
  } catch (error: unknown) {
    if (isQuotaExceeded(error)) {
      // Purge oldest snapshots and retry
      await purgeOldSnapshots(input.sessionId);

      try {
        const retryTx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
        await Promise.all([
          retryTx.objectStore('scene-snapshots').put(snapshot),
          retryTx.objectStore('auto-save-meta').put(meta),
          retryTx.done,
        ]);
      } catch (retryError: unknown) {
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

// ---------------------------------------------------------------------------
// closeSession()
// ---------------------------------------------------------------------------

/**
 * Marks a session as 'closed' in auto-save-meta.
 * Called during beforeunload to signal a graceful exit.
 */
export async function closeSession(sessionId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('auto-save-meta', 'readwrite');
  const store = tx.objectStore('auto-save-meta');

  const record = await store.get(sessionId);
  if (record) {
    await store.put({ ...record, status: 'closed' });
  }
  await tx.done;
}

// ---------------------------------------------------------------------------
// loadSnapshot()
// ---------------------------------------------------------------------------

/**
 * Loads a specific scene snapshot by its ID.
 */
export async function loadSnapshot(snapshotId: string): Promise<SceneSnapshot | undefined> {
  const db = await getDB();
  return db.get('scene-snapshots', snapshotId);
}

// ---------------------------------------------------------------------------
// purgeSession()
// ---------------------------------------------------------------------------

/**
 * Removes all data for a session (meta + all snapshots).
 */
export async function purgeSession(sessionId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');

  // Delete all snapshots for this session
  const snapStore = tx.objectStore('scene-snapshots');
  const index = snapStore.index('sessionId');
  let cursor = await index.openCursor(IDBKeyRange.only(sessionId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  // Delete the meta record
  await tx.objectStore('auto-save-meta').delete(sessionId);
  await tx.done;
}

// ---------------------------------------------------------------------------
// purgeOldSnapshots()
// ---------------------------------------------------------------------------

/**
 * Purges oldest snapshots for a session, keeping only the most recent
 * MAX_SNAPSHOTS_PER_SESSION entries.
 */
export async function purgeOldSnapshots(sessionId: string): Promise<void> {
  const db = await getDB();

  // Get all snapshots for this session
  const allSnapshots = await db.getAllFromIndex('scene-snapshots', 'sessionId', sessionId);

  if (allSnapshots.length <= MAX_SNAPSHOTS_PER_SESSION) return;

  // Sort by timestamp descending, delete everything beyond the limit
  const sorted = allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
  const toDelete = sorted.slice(MAX_SNAPSHOTS_PER_SESSION);

  const tx = db.transaction('scene-snapshots', 'readwrite');
  const store = tx.objectStore('scene-snapshots');
  await Promise.all([
    ...toDelete.map((s) => store.delete(s.snapshotId)),
    tx.done,
  ]);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isQuotaExceeded(error: unknown): boolean {
  if (error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.code === 22 || // Legacy code
      error.message.toLowerCase().includes('quota')
    );
  }
  return false;
}

// Re-export types for consumers
export type { SceneSnapshot, AutoSaveMeta, BrickRecord, CameraState, SceneMetadata };
