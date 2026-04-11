/**
 * IndexedDB Schema Definition — NFR-REL-001
 *
 * Database: legobuilder-v1
 * Object Stores:
 *   - scene-snapshots: Full scene state snapshots (keyPath: snapshotId)
 *   - auto-save-meta: Session metadata for crash detection (keyPath: sessionId)
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

export const DB_NAME = 'legobuilder-v1';
export const DB_VERSION = 1;
export const CURRENT_SCHEMA_VERSION = 1;

export const STORE_SCENE_SNAPSHOTS = 'scene-snapshots';
export const STORE_AUTO_SAVE_META = 'auto-save-meta';

// ---------------------------------------------------------------------------
// Types (LLD Section 3.1)
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

export interface RecoveryCandidate {
  sessionId: string;
  snapshotId: string;
  brickCount: number;
  lastSavedAt: number;
  appVersion: string;
}

// ---------------------------------------------------------------------------
// Error types (LLD Section 4.2)
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
// Database initialization
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null;

/**
 * Open (or create) the legobuilder IndexedDB database.
 * Uses a singleton pattern — subsequent calls return the cached instance.
 */
export async function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_SCENE_SNAPSHOTS)) {
        const snapStore = db.createObjectStore(STORE_SCENE_SNAPSHOTS, {
          keyPath: 'snapshotId',
        });
        snapStore.createIndex('sessionId', 'sessionId', { unique: false });
        snapStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_AUTO_SAVE_META)) {
        const metaStore = db.createObjectStore(STORE_AUTO_SAVE_META, {
          keyPath: 'sessionId',
        });
        metaStore.createIndex('lastSavedAt', 'lastSavedAt', { unique: false });
        metaStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle unexpected close (e.g., browser clearing storage)
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(
        new PersistenceError(
          'Failed to open IndexedDB',
          PersistenceErrorCode.DB_OPEN_FAILED,
          request.error,
        ),
      );
    };
  });
}

/**
 * Close the database connection and clear the singleton.
 * Used primarily in tests.
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Validate that a snapshot is structurally sound.
 * Returns true if the snapshot has valid bricks array and compatible schema version.
 */
export function isValidSnapshot(snapshot: unknown): snapshot is SceneSnapshot {
  if (snapshot === null || typeof snapshot !== 'object') return false;
  const s = snapshot as Record<string, unknown>;
  if (!Array.isArray(s.bricks)) return false;
  if (typeof s.schemaVersion !== 'number' || s.schemaVersion > CURRENT_SCHEMA_VERSION) return false;
  if (typeof s.snapshotId !== 'string') return false;
  if (typeof s.sessionId !== 'string') return false;
  return true;
}
