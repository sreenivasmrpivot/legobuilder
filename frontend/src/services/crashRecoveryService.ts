/**
 * Crash Recovery Service — NFR-REL-001
 *
 * Boot-time crash detection: scans IndexedDB for sessions with status='active'
 * (indicating the previous session did not close gracefully) and returns a
 * recovery candidate for the user to accept or discard.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 */

import {
  openDB,
  STORE_SCENE_SNAPSHOTS,
  STORE_AUTO_SAVE_META,
  CURRENT_SCHEMA_VERSION,
  isValidSnapshot,
  type AutoSaveMeta,
  type SceneSnapshot,
  type RecoveryCandidate,
} from './dbSchema';

// ---------------------------------------------------------------------------
// detectCrash() — T-UNIT-REL-001-02, T-UNIT-REL-001-03
// ---------------------------------------------------------------------------

/**
 * Detect if a previous session crashed (left status='active' in auto-save-meta).
 *
 * Returns the most recently saved active session as a RecoveryCandidate,
 * or null if no recovery is needed.
 *
 * Handles corruption gracefully (T-UNIT-REL-001-08):
 * - Missing snapshot → skip session
 * - Invalid bricks array → purge and skip
 * - Incompatible schema version → purge and skip
 */
export async function detectCrash(): Promise<RecoveryCandidate | null> {
  const db = await openDB();
  return detectCrashFromDB(db);
}

/**
 * Internal implementation that accepts a DB instance (for testability).
 */
export async function detectCrashFromDB(
  db: IDBDatabase,
): Promise<RecoveryCandidate | null> {
  // 1. Find all active sessions
  const activeSessions = await getActiveSessions(db);
  if (activeSessions.length === 0) return null;

  // 2. Sort by most recently saved first
  const sorted = activeSessions.sort((a, b) => b.lastSavedAt - a.lastSavedAt);

  // 3. Try each session until we find a valid one
  for (const session of sorted) {
    const snapshot = await getSnapshot(db, session.latestSnapshotId);

    // No snapshot found — orphaned meta
    if (!snapshot) continue;

    // Validate snapshot integrity
    if (!isValidSnapshot(snapshot)) {
      // Corrupted data — purge this session
      await purgeCorruptSession(db, session.sessionId, session.latestSnapshotId);
      continue;
    }

    // Check schema compatibility
    if (snapshot.schemaVersion > CURRENT_SCHEMA_VERSION) {
      // Future schema version — incompatible, purge
      await purgeCorruptSession(db, session.sessionId, snapshot.snapshotId);
      continue;
    }

    // Valid recovery candidate found
    return {
      sessionId: session.sessionId,
      snapshotId: session.latestSnapshotId,
      brickCount: snapshot.bricks.length,
      lastSavedAt: session.lastSavedAt,
      appVersion: session.appVersion,
    };
  }

  // No valid recovery candidates
  return null;
}

// ---------------------------------------------------------------------------
// discardRecovery()
// ---------------------------------------------------------------------------

/**
 * Discard a recovery candidate — purge all data for the session.
 */
export async function discardRecovery(sessionId: string): Promise<void> {
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
// Internal helpers
// ---------------------------------------------------------------------------

async function getActiveSessions(db: IDBDatabase): Promise<AutoSaveMeta[]> {
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

/**
 * Purge a corrupt session's meta and snapshot from IndexedDB.
 */
async function purgeCorruptSession(
  db: IDBDatabase,
  sessionId: string,
  snapshotId: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(
      [STORE_SCENE_SNAPSHOTS, STORE_AUTO_SAVE_META],
      'readwrite',
    );
    tx.onerror = () => reject(tx.error);
    tx.oncomplete = () => resolve();
    tx.objectStore(STORE_SCENE_SNAPSHOTS).delete(snapshotId);
    tx.objectStore(STORE_AUTO_SAVE_META).delete(sessionId);
  });
}
