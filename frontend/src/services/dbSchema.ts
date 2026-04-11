/**
 * IndexedDB Schema Definition — NFR-REL-001
 *
 * Defines the legobuilder-v1 database schema with two object stores:
 * - scene-snapshots: Full scene state snapshots
 * - auto-save-meta: Session metadata for crash detection
 *
 * Uses the `idb` library for a Promise-based IndexedDB API.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */
import { openDB, type IDBPDatabase, type DBSchema } from 'idb';

// ---------------------------------------------------------------------------
// Schema Types
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
// idb DBSchema interface
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
// Constants
// ---------------------------------------------------------------------------

export const DB_NAME = 'legobuilder-v1';
export const DB_VERSION = 1;
export const CURRENT_SCHEMA_VERSION = 1;
export const APP_VERSION = '1.0.0';
export const MAX_SNAPSHOTS_PER_SESSION = 10;

// ---------------------------------------------------------------------------
// Database opener
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<LegoBuilderDB>> | null = null;

/**
 * Opens (or returns the cached handle to) the legobuilder-v1 IndexedDB.
 * Creates object stores and indexes on first open / version upgrade.
 */
export function getDB(): Promise<IDBPDatabase<LegoBuilderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LegoBuilderDB>(DB_NAME, DB_VERSION, {
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
  }
  return dbPromise;
}

/**
 * Reset the cached DB promise (useful for testing).
 */
export function resetDBPromise(): void {
  dbPromise = null;
}
