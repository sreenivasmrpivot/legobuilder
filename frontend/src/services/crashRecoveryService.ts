/**
 * Crash Recovery Service — Boot-time crash detection
 *
 * Detects orphaned active sessions in IndexedDB that indicate a previous
 * browser crash (session was never marked 'closed'). Returns a recovery
 * candidate with brick count and metadata for the ResumePrompt.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 */
import {
  getDB,
  PersistenceError,
  PersistenceErrorCode,
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
// detectCrash() — Boot-time crash detection (LLD Section 4.3)
// ---------------------------------------------------------------------------

/**
 * Scans IndexedDB for active sessions that were never closed (orphans).
 * Returns the most recently saved recovery candidate, or null if none found.
 *
 * Validates snapshot integrity:
 * - bricks must be an array
 * - schemaVersion must be <= CURRENT_SCHEMA_VERSION
 *
 * Corrupted or incompatible snapshots are purged automatically.
 */
export async function detectCrash(): Promise<RecoveryCandidate | null> {
  try {
    const db = await getDB();

    // 1. Find all active sessions
    const tx = db.transaction(['auto-save-meta', 'scene-snapshots'], 'readonly');
    const metaIndex = tx.objectStore('auto-save-meta').index('status');
    const activeSessions = await metaIndex.getAll('active');

    if (activeSessions.length === 0) return null;

    // 2. Sort by lastSavedAt descending (most recent first)
    const sorted = activeSessions.sort((a, b) => b.lastSavedAt - a.lastSavedAt);

    // 3. Try each active session until we find a valid one
    for (const meta of sorted) {
      const snapshot = await tx.objectStore('scene-snapshots').get(meta.latestSnapshotId);

      // No snapshot found for this meta — orphaned meta, skip
      if (!snapshot) continue;

      // Validate snapshot integrity
      if (!isValidSnapshot(snapshot)) {
        // Corrupted data — purge this session asynchronously
        // (don't await in the read transaction)
        void purgeCorruptedSession(meta.sessionId, meta.latestSnapshotId);
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
    throw new PersistenceError(
      'Failed to detect crash recovery candidate',
      PersistenceErrorCode.RECOVERY_FAILED,
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// restoreSession() — Load snapshot data for recovery
// ---------------------------------------------------------------------------

/**
 * Loads the full scene snapshot for a recovery candidate.
 * Returns the snapshot data to be loaded into the scene store.
 */
export async function restoreSession(
  snapshotId: string,
): Promise<SceneSnapshot | null> {
  const db = await getDB();
  const snapshot = await db.get('scene-snapshots', snapshotId);
  return snapshot ?? null;
}

// ---------------------------------------------------------------------------
// discardRecovery() — User chose to discard
// ---------------------------------------------------------------------------

/**
 * Purges all data for a recovered session when the user clicks "Discard".
 */
export async function discardRecovery(sessionId: string): Promise<void> {
  await purgeSession(sessionId);
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validates that a snapshot is structurally sound and compatible.
 */
function isValidSnapshot(snapshot: unknown): snapshot is SceneSnapshot {
  if (snapshot === null || typeof snapshot !== 'object') return false;

  const s = snapshot as Record<string, unknown>;

  // bricks must be an array
  if (!Array.isArray(s.bricks)) return false;

  // schemaVersion must be a number and <= current version
  if (typeof s.schemaVersion !== 'number') return false;
  if (s.schemaVersion > CURRENT_SCHEMA_VERSION) return false;

  return true;
}

/**
 * Purges a corrupted session (meta + snapshot) from IndexedDB.
 */
async function purgeCorruptedSession(
  sessionId: string,
  snapshotId: string,
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(['scene-snapshots', 'auto-save-meta'], 'readwrite');
    await tx.objectStore('scene-snapshots').delete(snapshotId);
    await tx.objectStore('auto-save-meta').delete(sessionId);
    await tx.done;
  } catch {
    // Silently fail — corruption cleanup is best-effort
    console.warn(`Failed to purge corrupted session ${sessionId}`);
  }
}
