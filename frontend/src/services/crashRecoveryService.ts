/**
 * Crash Recovery Service — Boot-time crash detection
 *
 * Detects orphaned active sessions in IndexedDB that indicate
 * a previous browser crash (session was never marked 'closed').
 * Validates snapshot integrity before offering recovery.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 */
import {
  getDB,
  CURRENT_SCHEMA_VERSION,
  type SceneSnapshot,
  type AutoSaveMeta,
} from './dbSchema';
import { purgeSession } from './persistenceService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RecoveryCandidate {
  sessionId: string;
  snapshotId: string;
  brickCount: number;
  lastSavedAt: number;
  appVersion: string;
}

// ---------------------------------------------------------------------------
// Crash Detection
// ---------------------------------------------------------------------------

/**
 * Detect if a previous session crashed (left in 'active' status).
 *
 * Algorithm:
 * 1. Query all sessions with status='active' from auto-save-meta
 * 2. If none found, return null (no crash detected)
 * 3. Pick the most recently saved active session
 * 4. Load and validate its snapshot
 * 5. If snapshot is valid, return a RecoveryCandidate
 * 6. If snapshot is corrupted, purge it and return null
 *
 * @returns RecoveryCandidate if a recoverable crash is detected, null otherwise
 */
export async function detectCrash(): Promise<RecoveryCandidate | null> {
  const db = await getDB();

  // 1. Find all active sessions
  const activeSessions = await db.getAllFromIndex(
    'auto-save-meta',
    'status',
    'active',
  );

  if (activeSessions.length === 0) return null;

  // 2. Sort by lastSavedAt descending, pick the most recent
  const sorted = activeSessions.sort((a, b) => b.lastSavedAt - a.lastSavedAt);
  const mostRecent = sorted[0];

  // 3. Load the corresponding snapshot
  const snapshot = await db.get('scene-snapshots', mostRecent.latestSnapshotId);

  if (!snapshot) {
    // Orphaned meta with no snapshot — purge and return null
    await purgeSession(mostRecent.sessionId, mostRecent.latestSnapshotId);
    return null;
  }

  // 4. Validate snapshot integrity
  if (!isValidSnapshot(snapshot)) {
    // Corrupted data — purge and return null
    await purgeSession(mostRecent.sessionId, mostRecent.latestSnapshotId);
    return null;
  }

  return {
    sessionId: mostRecent.sessionId,
    snapshotId: mostRecent.latestSnapshotId,
    brickCount: snapshot.bricks.length,
    lastSavedAt: mostRecent.lastSavedAt,
    appVersion: mostRecent.appVersion,
  };
}

/**
 * Accept recovery: load the snapshot and mark the session as closed.
 * Returns the full snapshot for scene restoration.
 */
export async function acceptRecovery(
  snapshotId: string,
  sessionId: string,
): Promise<SceneSnapshot | null> {
  const db = await getDB();

  const snapshot = await db.get('scene-snapshots', snapshotId);
  if (!snapshot || !isValidSnapshot(snapshot)) return null;

  // Mark the recovered session as closed
  const tx = db.transaction('auto-save-meta', 'readwrite');
  const meta = await tx.objectStore('auto-save-meta').get(sessionId);
  if (meta) {
    tx.objectStore('auto-save-meta').put({ ...meta, status: 'closed' });
  }
  await tx.done;

  return snapshot;
}

/**
 * Discard recovery: purge the crashed session data entirely.
 */
export async function discardRecovery(
  sessionId: string,
  snapshotId: string,
): Promise<void> {
  await purgeSession(sessionId, snapshotId);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate that a snapshot has the expected structure and is compatible
 * with the current schema version.
 */
function isValidSnapshot(snapshot: unknown): snapshot is SceneSnapshot {
  if (snapshot === null || typeof snapshot !== 'object') return false;

  const s = snapshot as Record<string, unknown>;

  // bricks must be an array
  if (!Array.isArray(s.bricks)) return false;

  // schemaVersion must be <= current supported version
  if (typeof s.schemaVersion !== 'number') return false;
  if (s.schemaVersion > CURRENT_SCHEMA_VERSION) return false;

  // Must have required fields
  if (typeof s.snapshotId !== 'string') return false;
  if (typeof s.sessionId !== 'string') return false;
  if (typeof s.timestamp !== 'number') return false;

  return true;
}
