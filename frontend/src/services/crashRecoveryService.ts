/**
 * Crash Recovery Service — NFR-REL-001
 *
 * Boot-time crash detection: scans IndexedDB for orphaned active sessions
 * (sessions that were never marked 'closed' due to a crash) and returns
 * a recovery candidate for the user to accept or discard.
 *
 * Contract tested by:
 *   T-UNIT-REL-001-02  detectCrash() returns null when no active sessions
 *   T-UNIT-REL-001-03  detectCrash() returns candidate when active session exists
 *   T-UNIT-REL-001-08  Corrupted recovery data is discarded gracefully
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03, T-UNIT-REL-001-08
 */
import {
  getDB,
  CURRENT_SCHEMA_VERSION,
  type AutoSaveMeta,
  type SceneSnapshot,
} from './dbSchema';
import { purgeSession, loadSnapshot } from './persistenceService';

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
// Validation
// ---------------------------------------------------------------------------

/**
 * Validates that a snapshot is structurally sound and compatible with
 * the current schema version.
 */
function isValidSnapshot(snapshot: unknown): snapshot is SceneSnapshot {
  if (snapshot === null || typeof snapshot !== 'object') return false;
  const s = snapshot as Record<string, unknown>;
  if (!Array.isArray(s.bricks)) return false;
  if (typeof s.schemaVersion !== 'number') return false;
  if (s.schemaVersion > CURRENT_SCHEMA_VERSION) return false;
  return true;
}

// ---------------------------------------------------------------------------
// detectCrash()
// ---------------------------------------------------------------------------

/**
 * Scans IndexedDB for active (non-closed) sessions. If found, validates
 * the most recent snapshot and returns a RecoveryCandidate.
 *
 * Returns null if:
 * - No active sessions exist
 * - The snapshot for the active session is missing or corrupted
 *
 * Corrupted sessions are automatically purged.
 */
export async function detectCrash(): Promise<RecoveryCandidate | null> {
  const db = await getDB();

  // 1. Find all active sessions
  const activeSessions = await db.getAllFromIndex('auto-save-meta', 'status', 'active');

  if (activeSessions.length === 0) return null;

  // 2. Sort by lastSavedAt descending — pick the most recent
  const sorted = [...activeSessions].sort((a, b) => b.lastSavedAt - a.lastSavedAt);

  // 3. Try each candidate (most recent first) until we find a valid one
  for (const meta of sorted) {
    const snapshot = await loadSnapshot(meta.latestSnapshotId);

    // Missing snapshot — purge the orphaned meta
    if (!snapshot) {
      await purgeSession(meta.sessionId);
      continue;
    }

    // Validate snapshot integrity
    if (!isValidSnapshot(snapshot)) {
      // Corrupted — purge and try next
      await purgeSession(meta.sessionId);
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
}

// ---------------------------------------------------------------------------
// acceptRecovery()
// ---------------------------------------------------------------------------

/**
 * Accepts a recovery candidate: loads the snapshot and marks the session
 * as closed (it's now been resumed, not orphaned).
 */
export async function acceptRecovery(
  candidate: RecoveryCandidate,
): Promise<SceneSnapshot | null> {
  const snapshot = await loadSnapshot(candidate.snapshotId);
  if (!snapshot || !isValidSnapshot(snapshot)) return null;

  // Mark the session as closed since we're resuming it
  const db = await getDB();
  const meta = await db.get('auto-save-meta', candidate.sessionId);
  if (meta) {
    const tx = db.transaction('auto-save-meta', 'readwrite');
    await tx.objectStore('auto-save-meta').put({ ...meta, status: 'closed' });
    await tx.done;
  }

  return snapshot;
}

// ---------------------------------------------------------------------------
// discardRecovery()
// ---------------------------------------------------------------------------

/**
 * Discards a recovery candidate: purges all data for the session.
 */
export async function discardRecovery(candidate: RecoveryCandidate): Promise<void> {
  await purgeSession(candidate.sessionId);
}
