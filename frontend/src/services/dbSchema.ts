/**
 * IndexedDB Schema Definition for LegoBuilder Auto-Save
 *
 * Defines the database schema, types, and helper to open the database.
 * Uses the `idb` library for a Promise-based IndexedDB API.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ---------------------------------------------------------------------------
// Schema Version
// ---------------------------------------------------------------------------

export const CURRENT_SCHEMA_VERSION = 1;
export const DB_NAME = 'legobuilder-v1';
export const DB_VERSION = 1;

// ---------------------------------------------------------------------------
// Record Types (LLD Section 3.1)
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

// ---------------------------------------------------------------------------
// IDB Schema (typed for `idb` library)
// ---------------------------------------------------------------------------

export interface LegoBuilderDB extends DBSchema {
  'scene-snapshots': {
    key: string;
    value: SceneSnapshot;
    indexes: {
      sessionId: string;
      timestamp: number;
    };
  };
  'auto-save-meta': {
    key: string;
    value: AutoSaveMeta;
    indexes: {
      lastSavedAt: number;
      status: string;
    };
  };
}

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
// Database Open Helper
// ---------------------------------------------------------------------------

let dbInstance: IDBPDatabase<LegoBuilderDB> | null = null;

/**
 * Opens (or returns cached) the LegoBuilder IndexedDB database.
 * Creates object stores and indexes on first open / upgrade.
 */
export async function getDB(): Promise<IDBPDatabase<LegoBuilderDB>> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<LegoBuilderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // scene-snapshots store
        if (!db.objectStoreNames.contains('scene-snapshots')) {
          const snapStore = db.createObjectStore('scene-snapshots', {
            keyPath: 'snapshotId',
          });
          snapStore.createIndex('sessionId', 'sessionId', { unique: false });
          snapStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // auto-save-meta store
        if (!db.objectStoreNames.contains('auto-save-meta')) {
          const metaStore = db.createObjectStore('auto-save-meta', {
            keyPath: 'sessionId',
          });
          metaStore.createIndex('lastSavedAt', 'lastSavedAt', { unique: false });
          metaStore.createIndex('status', 'status', { unique: false });
        }
      },
    });

    return dbInstance;
  } catch (error) {
    throw new PersistenceError(
      'Failed to open IndexedDB database',
      PersistenceErrorCode.DB_OPEN_FAILED,
      error,
    );
  }
}

/**
 * Close and reset the cached DB instance.
 * Useful for testing and cleanup.
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
