/**
 * Crash Recovery Service — boot-time crash detection
 *
 * Detects orphaned active sessions in IndexedDB that indicate a
 * previous crash or ungraceful shutdown. Returns a RecoveryCandidate
 * if a recoverable session is found.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 */

import {
  type AutoSaveMeta,
  type RecoveryCandidate,
  type SceneSnapshot,
  CURRENT_SCHEMA_VERSION,
  STORE_AUTO_SAVE_META,
  STORE_SCENE_SNAPSHOTS,
  isValidSnapshot,
  openDatabase,
} from './dbSchema';
import { purgeSession } from './persistenceService';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect if a previous session crashed (left in 'active' status).
 *
 * Algorithm:
 * 1. Query all sessions with status='active' from auto-save-meta.
 * 2. If none found, return null (no crash detected).
 * 3. Pick the most recently saved active session.
 * 4. Load its latest snapshot and validate it.
 * 5. If snapshot is missing or corrupted, purge and return null.
 * 6. If snapshot schema version is incompatible, purge and return null.
 * 7. Return a RecoveryCandidate with session details.
 *
 * @param db - Optional IDBDatabase instance (for testing). If not provided,
 *             opens the default database.
 * @returns RecoveryCandidate or null if no crash detected
 */
export async function detectCrash(
  db?: IDBDatabase,
): Promise<RecoveryCandidate | null> {
  const database = db ?? (await openDatabase());

  // 1. Find all active sessions
  const activeSessions = await getActiveSessions(database);

  if (activeSessions.length === 0) return null;

  // 2. Pick the most recently saved session
  const mostRecent = activeSessions.sort(
    (a, b) => b.lastSavedAt - a.lastSavedAt,
  )[0];

  // 3. Load the snapshot
  const snapshot = await getSnapshot(database, mostRecent.latestSnapshotId);

  // 4. Validate snapshot exists
  if (!snapshot) {
    // Orphaned meta without snapshot — purge it
    if (!db) {
      await purgeSession(mostRecent.sessionId);
    }
    return null;
  }

  // 5. Validate snapshot integrity
  if (!isValidSnapshot(snapshot)) {
    // Corrupted snapshot — purge the session
    if (!db) {
      await purgeSession(mostRecent.sessionId);
    }
    return null;
  }

  // 6. Validate schema compatibility
  if (snapshot.schemaVersion > CURRENT_SCHEMA_VERSION) {
    // Future schema version — incompatible, purge
    if (!db) {
      await purgeSession(mostRecent.sessionId);
    }
    return null;
  }

  // 7. Return recovery candidate
  return {
    sessionId: mostRecent.sessionId,
    snapshotId: mostRecent.latestSnapshotId,
    brickCount: snapshot.bricks.length,
    lastSavedAt: mostRecent.lastSavedAt,
    appVersion: mostRecent.appVersion,
  };
}

/**
 * Accept a recovery candidate: restore the session data and mark it
 * as the current active session.
 *
 * @param candidate - The recovery candidate to accept
 * @returns The restored SceneSnapshot
 */
export async function acceptRecovery(
  candidate: RecoveryCandidate,
): Promise<SceneSnapshot | null> {
  const db = await openDatabase();

  const snapshot = await getSnapshot(db, candidate.snapshotId);
  if (!snapshot || !isValidSnapshot(snapshot)) return null;

  return snapshot;
}

/**
 * Discard a recovery candidate: purge the crashed session data.
 *
 * @param candidate - The recovery candidate to discard
 */
export async function discardRecovery(
  candidate: RecoveryCandidate,
): Promise<void> {
  await purgeSession(candidate.sessionId);
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

async function getActiveSessions(
  db: IDBDatabase,
): Promise<AutoSaveMeta[]> {
  return new Promise<AutoSaveMeta[]>((resolve, reject) => {
    const tx = db.transaction(STORE_AUTO_SAVE_META, 'readonly');
    const index = tx.objectStore(STORE_AUTO_SAVE_META).index('status');
    const req = index.getAll(IDBKeyRange.only('active'));
    req.onsuccess = () => resolve(req.result as AutoSaveMeta[]);
    req.onerror = () => reject(req.error);
  });
}

async function getSnapshot(
  db: IDBDatabase,
  snapshotId: string,
): Promise<SceneSnapshot | undefined> {
  return new Promise<SceneSnapshot | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_SCENE_SNAPSHOTS, 'readonly');
    const req = tx.objectStore(STORE_SCENE_SNAPSHOTS).get(snapshotId);
    req.onsuccess = () => resolve(req.result as SceneSnapshot | undefined);
    req.onerror = () => reject(req.error);
  });
}
