/**
 * Crash Recovery Service — boot-time crash detection
 *
 * On app startup, checks IndexedDB for sessions with status='active'
 * (indicating the previous session did not close gracefully).
 * Returns a RecoveryCandidate if a recoverable session is found.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 */

import {
  getDB,
  AUTO_SAVE_META_STORE,
  SCENE_SNAPSHOTS_STORE,
  CURRENT_SCHEMA_VERSION,
  PersistenceError,
  PersistenceErrorCode,
  type AutoSaveMeta,
  type SceneSnapshot,
  type RecoveryCandidate,
} from './dbSchema';

// ---------------------------------------------------------------------------
// Snapshot Validation
// ---------------------------------------------------------------------------

/**
 * Validates that a snapshot is structurally sound and compatible
 * with the current schema version.
 */
export function isValidSnapshot(snapshot: unknown): snapshot is SceneSnapshot {
  if (snapshot === null || typeof snapshot !== 'object') return false;

  const s = snapshot as Record<string, unknown>;

  // bricks must be an array
  if (!Array.isArray(s.bricks)) return false;

  // schemaVersion must be a number <= current version
  if (
    typeof s.schemaVersion !== 'number' ||
    s.schemaVersion > CURRENT_SCHEMA_VERSION
  ) {
    return false;
  }

  // Must have required string fields
  if (typeof s.snapshotId !== 'string') return false;
  if (typeof s.sessionId !== 'string') return false;

  return true;
}

// ---------------------------------------------------------------------------
// detectCrash — main entry point
// ---------------------------------------------------------------------------

/**
 * Scans IndexedDB for active (non-closed) sessions.
 * Returns the most recently saved session as a RecoveryCandidate,
 * or null if no recoverable session exists.
 *
 * Corrupted snapshots are purged automatically.
 */
export async function detectCrash(): Promise<RecoveryCandidate | null> {
  try {
    const db = await getDB();

    // 1. Find all active sessions
    const activeSessions = (await db.getAllFromIndex(
      AUTO_SAVE_META_STORE,
      'status',
      'active',
    )) as AutoSaveMeta[];

    if (activeSessions.length === 0) return null;

    // 2. Sort by lastSavedAt descending — pick the most recent
    const sorted = activeSessions.sort(
      (a, b) => b.lastSavedAt - a.lastSavedAt,
    );

    // 3. Try each session until we find one with a valid snapshot
    for (const meta of sorted) {
      const snapshot = (await db.get(
        SCENE_SNAPSHOTS_STORE,
        meta.latestSnapshotId,
      )) as SceneSnapshot | undefined;

      // No snapshot found for this meta — orphaned meta
      if (!snapshot) {
        continue;
      }

      // Validate snapshot integrity
      if (!isValidSnapshot(snapshot)) {
        // Corrupted — purge this session's data
        await purgeCorruptedSession(meta.sessionId, meta.latestSnapshotId);
        continue;
      }

      return {
        sessionId: meta.sessionId,
        snapshotId: meta.latestSnapshotId,
        brickCount: snapshot.bricks.length,
        lastSavedAt: meta.lastSavedAt,
        appVersion: meta.appVersion,
      };
    }

    return null;
  } catch (error) {
    console.error('[crashRecoveryService] detectCrash failed:', error);
    throw new PersistenceError(
      'Failed to detect crash recovery candidate',
      PersistenceErrorCode.RECOVERY_FAILED,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// purgeCorruptedSession — remove corrupted data
// ---------------------------------------------------------------------------

/**
 * Removes a corrupted session's snapshot and meta from IndexedDB.
 */
async function purgeCorruptedSession(
  sessionId: string,
  snapshotId: string,
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(
      [SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE],
      'readwrite',
    );
    tx.objectStore(SCENE_SNAPSHOTS_STORE).delete(snapshotId);
    tx.objectStore(AUTO_SAVE_META_STORE).delete(sessionId);
    await tx.done;
    console.warn(
      `[crashRecoveryService] Purged corrupted session: ${sessionId}`,
    );
  } catch {
    console.error(
      `[crashRecoveryService] Failed to purge corrupted session: ${sessionId}`,
    );
  }
}

// ---------------------------------------------------------------------------
// discardRecovery — user chose to discard
// ---------------------------------------------------------------------------

/**
 * Discards a recovery candidate by purging all its data from IndexedDB.
 */
export async function discardRecovery(
  candidate: RecoveryCandidate,
): Promise<void> {
  const db = await getDB();

  // Get all snapshots for this session
  const allSnapshots = (await db.getAllFromIndex(
    SCENE_SNAPSHOTS_STORE,
    'sessionId',
    candidate.sessionId,
  )) as SceneSnapshot[];

  const tx = db.transaction(
    [SCENE_SNAPSHOTS_STORE, AUTO_SAVE_META_STORE],
    'readwrite',
  );
  for (const snap of allSnapshots) {
    tx.objectStore(SCENE_SNAPSHOTS_STORE).delete(snap.snapshotId);
  }
  tx.objectStore(AUTO_SAVE_META_STORE).delete(candidate.sessionId);
  await tx.done;
}
