/**
 * Persistence Service — IndexedDB read/write operations
 *
 * Provides atomic dual-store writes (scene-snapshots + auto-save-meta),
 * session lifecycle management, and quota exceeded handling.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01, T-UNIT-REL-001-04, T-UNIT-REL-001-07
 */
import { getDB, type SceneSnapshot, type AutoSaveMeta, type BrickRecord, type CameraState, type SceneMetadata, CURRENT_SCHEMA_VERSION } from './dbSchema';

// ---------------------------------------------------------------------------
// Error Types (LLD Section 6)
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
// Constants
// ---------------------------------------------------------------------------

const MAX_SNAPSHOTS_TO_KEEP = 10;
const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Snapshot Save (Atomic Dual-Store Write)
// ---------------------------------------------------------------------------

export interface SaveSnapshotParams {
  sessionId: string;
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
  saveCount: number;
}

/**
 * Save a scene snapshot atomically to both `scene-snapshots` and
 * `auto-save-meta` stores in a single IndexedDB transaction.
 *
 * If a QuotaExceededError occurs, purges the oldest snapshots
 * (keeping the latest MAX_SNAPSHOTS_TO_KEEP) and retries once.
 *
 * @returns The generated snapshotId
 */
export async function saveSnapshot(params: SaveSnapshotParams): Promise<string> {
  const { sessionId, bricks, cameraState, sceneMetadata, saveCount } = params;
  const snapshotId = crypto.randomUUID();
  const now = Date.now();

  const snapshot: SceneSnapshot = {
    snapshotId,
    sessionId,
    timestamp: now,
    schemaVersion: CURRENT_SCHEMA_VERSION,
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
    await atomicWrite(snapshot, meta);
  } catch (error) {
    if (isQuotaExceeded(error)) {
      // Purge oldest snapshots and retry
      await purgeOldestSnapshots(sessionId);
      try {
        await atomicWrite(snapshot, meta);
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
 * Perform the atomic write of snapshot + meta in a single transaction.
 */
async function atomicWrite(
  snapshot: SceneSnapshot,
  meta: AutoSaveMeta,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
  tx.objectStore('scene-snapshots').put(snapshot);
  tx.objectStore('auto-save-meta').put(meta);
  await tx.done;
}

// ---------------------------------------------------------------------------
// Session Close
// ---------------------------------------------------------------------------

/**
 * Mark a session as 'closed' in auto-save-meta.
 * Called during beforeunload to indicate a graceful shutdown.
 */
export async function closeSession(sessionId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('auto-save-meta', 'readwrite');
  const store = tx.objectStore('auto-save-meta');
  const record = await store.get(sessionId);

  if (record) {
    store.put({ ...record, status: 'closed' });
  }

  await tx.done;
}

// ---------------------------------------------------------------------------
// Load Snapshot
// ---------------------------------------------------------------------------

/**
 * Load a specific scene snapshot by its ID.
 */
export async function loadSnapshot(snapshotId: string): Promise<SceneSnapshot | undefined> {
  const db = await getDB();
  return db.get('scene-snapshots', snapshotId);
}

// ---------------------------------------------------------------------------
// Quota Management
// ---------------------------------------------------------------------------

/**
 * Purge the oldest snapshots for a session, keeping only the
 * MAX_SNAPSHOTS_TO_KEEP most recent ones.
 */
export async function purgeOldestSnapshots(sessionId: string): Promise<void> {
  const db = await getDB();

  // Get all snapshots for this session
  const allSnapshots = await db.getAllFromIndex(
    'scene-snapshots',
    'sessionId',
    sessionId,
  );

  if (allSnapshots.length <= MAX_SNAPSHOTS_TO_KEEP) return;

  // Sort by timestamp descending (newest first)
  const sorted = allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
  const toDelete = sorted.slice(MAX_SNAPSHOTS_TO_KEEP);

  const tx = db.transaction('scene-snapshots', 'readwrite');
  const store = tx.objectStore('scene-snapshots');
  for (const snap of toDelete) {
    store.delete(snap.snapshotId);
  }
  await tx.done;
}

/**
 * Delete a session and its associated snapshot from both stores.
 * Used when corrupted data is detected.
 */
export async function purgeSession(sessionId: string, snapshotId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
  tx.objectStore('scene-snapshots').delete(snapshotId);
  tx.objectStore('auto-save-meta').delete(sessionId);
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
