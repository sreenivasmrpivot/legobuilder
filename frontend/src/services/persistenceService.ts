/**
 * Persistence Service — NFR-REL-001 Auto-Save Crash Durability
 *
 * Provides atomic IndexedDB operations for scene snapshot persistence.
 * All writes to scene-snapshots and auto-save-meta occur within a single
 * readwrite transaction to guarantee atomicity (no partial writes).
 *
 * Database: legobuilder-v1 (version 1)
 * Object Stores:
 *   - scene-snapshots (keyPath: snapshotId, indexes: sessionId, timestamp)
 *   - auto-save-meta  (keyPath: sessionId, indexes: lastSavedAt)
 *
 * @see docs/features/NFR-REL-001/LOW_LEVEL_DESIGN.md Section 4.2, 5, 7, 8
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { openDB, type IDBPDatabase } from 'idb';

// ---------------------------------------------------------------------------
// Type definitions mirroring the LLD
// ---------------------------------------------------------------------------

export interface BrickRecord {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  color: string;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface SceneMetadata {
  name: string;
  createdAt: number;
  lastModifiedAt: number;
}

export interface SceneSnapshot {
  snapshotId: string;
  sessionId: string;
  timestamp: number;
  schemaVersion: number;
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
}

export interface AutoSaveMeta {
  sessionId: string;
  latestSnapshotId: string;
  saveCount: number;
  lastSavedAt: number;
  appVersion: string;
  status: 'active' | 'closed';
}

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

const DB_NAME = 'legobuilder-v1';
const DB_VERSION = 1;
const APP_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// Database initialization
// ---------------------------------------------------------------------------

/**
 * Opens (or creates) the legobuilder-v1 IndexedDB database.
 * Creates the scene-snapshots and auto-save-meta object stores on first run.
 */
export async function initDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('scene-snapshots')) {
        const snapshotStore = db.createObjectStore('scene-snapshots', {
          keyPath: 'snapshotId',
        });
        snapshotStore.createIndex('sessionId', 'sessionId');
        snapshotStore.createIndex('timestamp', 'timestamp');
      }
      if (!db.objectStoreNames.contains('auto-save-meta')) {
        const metaStore = db.createObjectStore('auto-save-meta', {
          keyPath: 'sessionId',
        });
        metaStore.createIndex('lastSavedAt', 'lastSavedAt');
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

/**
 * Creates a persistenceService instance bound to the given IDBPDatabase.
 * All methods operate on the provided db connection.
 */
export function createPersistenceService(db: IDBPDatabase) {
  return {
    /**
     * Saves a scene snapshot and updates auto-save-meta atomically
     * in a single readwrite transaction.
     *
     * @returns The generated snapshotId
     */
    async saveSnapshot(
      snapshot: Omit<SceneSnapshot, 'snapshotId'>,
    ): Promise<string> {
      const snapshotId = `snap-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const tx = db.transaction(
        ['scene-snapshots', 'auto-save-meta'],
        'readwrite',
      );

      await tx.objectStore('scene-snapshots').put({ ...snapshot, snapshotId });

      const existing = (await tx
        .objectStore('auto-save-meta')
        .get(snapshot.sessionId)) as AutoSaveMeta | undefined;

      await tx.objectStore('auto-save-meta').put({
        sessionId: snapshot.sessionId,
        latestSnapshotId: snapshotId,
        saveCount: (existing?.saveCount ?? 0) + 1,
        lastSavedAt: Date.now(),
        appVersion: APP_VERSION,
        status: 'active',
      } satisfies AutoSaveMeta);

      await tx.done;
      return snapshotId;
    },

    /**
     * Retrieves the latest snapshot for a given session.
     * Returns null if no session or snapshot exists.
     */
    async getLatestSnapshot(
      sessionId: string,
    ): Promise<SceneSnapshot | null> {
      const meta = (await db.get(
        'auto-save-meta',
        sessionId,
      )) as AutoSaveMeta | undefined;
      if (!meta) return null;

      const snapshot = (await db.get(
        'scene-snapshots',
        meta.latestSnapshotId,
      )) as SceneSnapshot | undefined;
      return snapshot ?? null;
    },

    /**
     * Returns all sessions with status='active'.
     * Used by crash recovery to detect orphaned sessions.
     */
    async getActiveSessions(): Promise<AutoSaveMeta[]> {
      const all = (await db.getAll('auto-save-meta')) as AutoSaveMeta[];
      return all.filter((m) => m.status === 'active');
    },

    /**
     * Marks a session as 'closed' (graceful shutdown).
     * Called from the beforeunload handler to prevent false-positive
     * crash recovery prompts.
     *
     * No-op if the session does not exist.
     */
    async closeSession(sessionId: string): Promise<void> {
      const meta = (await db.get(
        'auto-save-meta',
        sessionId,
      )) as AutoSaveMeta | undefined;
      if (!meta) return;
      await db.put('auto-save-meta', { ...meta, status: 'closed' });
    },

    /**
     * Purges all snapshots and meta for a given session.
     * Used for quota recovery (purge oldest sessions) and discard flows.
     */
    async purgeSession(sessionId: string): Promise<void> {
      const tx = db.transaction(
        ['scene-snapshots', 'auto-save-meta'],
        'readwrite',
      );
      const index = tx.objectStore('scene-snapshots').index('sessionId');
      let cursor = await index.openCursor(IDBKeyRange.only(sessionId));
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
      await tx.objectStore('auto-save-meta').delete(sessionId);
      await tx.done;
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton convenience export
// ---------------------------------------------------------------------------

let _db: IDBPDatabase | null = null;
let _service: ReturnType<typeof createPersistenceService> | null = null;

/**
 * Returns a singleton persistenceService instance.
 * Lazily initializes the database on first call.
 */
export async function getPersistenceService() {
  if (!_db) {
    _db = await initDb();
  }
  if (!_service) {
    _service = createPersistenceService(_db);
  }
  return _service;
}

/**
 * Module-level export for direct import in tests and hooks.
 */
export const persistenceService = {
  async saveSnapshot(
    snapshot: Omit<SceneSnapshot, 'snapshotId'>,
  ): Promise<string> {
    const svc = await getPersistenceService();
    return svc.saveSnapshot(snapshot);
  },
  async getLatestSnapshot(
    sessionId: string,
  ): Promise<SceneSnapshot | null> {
    const svc = await getPersistenceService();
    return svc.getLatestSnapshot(sessionId);
  },
  async getActiveSessions(): Promise<AutoSaveMeta[]> {
    const svc = await getPersistenceService();
    return svc.getActiveSessions();
  },
  async closeSession(sessionId: string): Promise<void> {
    const svc = await getPersistenceService();
    return svc.closeSession(sessionId);
  },
  async purgeSession(sessionId: string): Promise<void> {
    const svc = await getPersistenceService();
    return svc.purgeSession(sessionId);
  },
  openDB: initDb,
};
