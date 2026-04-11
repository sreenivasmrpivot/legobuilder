/**
 * Crash Recovery Service — NFR-REL-001 Auto-Save Crash Durability
 *
 * Detects orphaned sessions left behind by browser crashes.
 * An orphaned session is one where the auto-save-meta record has
 * status='active' — meaning the beforeunload handler never fired
 * to mark it as 'closed'.
 *
 * Database: legobuilder-autosave (version 1)
 * Object Stores:
 *   - auto-save-meta (out-of-line key: 'current')
 *   - scene-snapshots (keyPath: snapshotId)
 *
 * @see docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md Section 4, 5
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { openDB } from 'idb';

// ---------------------------------------------------------------------------
// Constants — must match the LLD schema exactly
// ---------------------------------------------------------------------------

const DB_NAME = 'legobuilder-autosave';
const DB_VERSION = 1;
const META_STORE = 'auto-save-meta';
const SNAPSHOT_STORE = 'scene-snapshots';
const SESSION_KEY = 'current';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AutoSaveMeta {
  sessionId: string;
  status: 'active' | 'closed';
  lastSavedAt: number;
  snapshotCount: number;
}

export interface OrphanedSession {
  sessionId: string;
  lastSavedAt: number;
  snapshotCount: number;
}

// ---------------------------------------------------------------------------
// Database helper
// ---------------------------------------------------------------------------

/**
 * Opens (or creates) the legobuilder-autosave IndexedDB database.
 * Mirrors the schema defined in the NFR-REL-001 LLD Section 4.
 */
export async function openAutosaveDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        const snapshotStore = db.createObjectStore(SNAPSHOT_STORE, {
          keyPath: 'snapshotId',
        });
        snapshotStore.createIndex('by-session', 'sessionId');
        snapshotStore.createIndex('by-timestamp', 'savedAt');
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Detects whether the previous session was orphaned (crashed).
 *
 * Returns the orphaned session info if the previous session status is 'active',
 * or null if the session was closed gracefully (status='closed'), if no
 * session record exists, or if the status has an unexpected value.
 *
 * The returned object intentionally omits the raw `status` field —
 * consumers only need to know whether recovery is needed and the
 * session metadata.
 */
export async function detectOrphanedSession(): Promise<OrphanedSession | null> {
  const db = await openAutosaveDB();
  const meta = (await db.get(META_STORE, SESSION_KEY)) as
    | AutoSaveMeta
    | undefined;
  db.close();

  if (!meta || meta.status !== 'active') {
    return null;
  }

  return {
    sessionId: meta.sessionId,
    lastSavedAt: meta.lastSavedAt,
    snapshotCount: meta.snapshotCount,
  };
}

/**
 * Loads the latest snapshot for a given session from the autosave DB.
 * Returns null if no snapshots exist for the session.
 */
export async function loadLatestSnapshot(
  sessionId: string,
): Promise<unknown | null> {
  const db = await openAutosaveDB();
  const index = db
    .transaction(SNAPSHOT_STORE, 'readonly')
    .objectStore(SNAPSHOT_STORE)
    .index('by-session');

  const snapshots = await index.getAll(IDBKeyRange.only(sessionId));
  db.close();

  if (!snapshots || snapshots.length === 0) {
    return null;
  }

  // Return the most recent snapshot by savedAt timestamp
  return snapshots.sort(
    (a: { savedAt: number }, b: { savedAt: number }) =>
      b.savedAt - a.savedAt,
  )[0];
}

/**
 * Marks the current session as closed in the autosave DB.
 * Called from the beforeunload handler for graceful shutdown.
 */
export async function markSessionClosed(): Promise<void> {
  const db = await openAutosaveDB();
  const meta = (await db.get(META_STORE, SESSION_KEY)) as
    | AutoSaveMeta
    | undefined;
  if (meta) {
    await db.put(META_STORE, { ...meta, status: 'closed' }, SESSION_KEY);
  }
  db.close();
}

/**
 * Purges the current session data from the autosave DB.
 * Used when the user discards recovery.
 */
export async function purgeCurrentSession(): Promise<void> {
  const db = await openAutosaveDB();
  const meta = (await db.get(META_STORE, SESSION_KEY)) as
    | AutoSaveMeta
    | undefined;

  if (meta) {
    // Delete all snapshots for this session
    const tx = db.transaction(
      [SNAPSHOT_STORE, META_STORE],
      'readwrite',
    );
    const index = tx.objectStore(SNAPSHOT_STORE).index('by-session');
    let cursor = await index.openCursor(
      IDBKeyRange.only(meta.sessionId),
    );
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.objectStore(META_STORE).delete(SESSION_KEY);
    await tx.done;
  }

  db.close();
}
