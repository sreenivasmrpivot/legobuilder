/**
 * IndexedDB Schema Definition for LegoBuilder Auto-Save
 *
 * Database: legobuilder-v1
 * Object Stores:
 *   - scene-snapshots: Full scene state snapshots
 *   - auto-save-meta: Session metadata for crash detection
 *
 * Uses the `idb` library for Promise-based IndexedDB access.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';

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
// DBSchema interface for idb library type safety
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
// Database Initialization
// ---------------------------------------------------------------------------

let dbInstance: IDBPDatabase<LegoBuilderDB> | null = null;

/**
 * Open (or return cached) the LegoBuilder IndexedDB database.
 * Creates object stores and indexes on first open / version upgrade.
 */
export async function getDB(): Promise<IDBPDatabase<LegoBuilderDB>> {
  if (dbInstance) return dbInstance;

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
}

/**
 * Close the database connection and clear the cached instance.
 * Useful for testing and cleanup.
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
