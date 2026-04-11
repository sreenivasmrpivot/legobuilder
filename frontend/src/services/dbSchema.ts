/**
 * IndexedDB Schema for LegoBuilder Auto-Save
 *
 * Database: legobuilder-v1
 * Stores:
 *   - scene-snapshots: Full scene state snapshots
 *   - auto-save-meta: Session metadata for crash detection
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import { openDB, type IDBPDatabase } from 'idb';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DB_NAME = 'legobuilder-v1';
export const DB_VERSION = 1;
export const SCENE_SNAPSHOTS_STORE = 'scene-snapshots';
export const AUTO_SAVE_META_STORE = 'auto-save-meta';
export const CURRENT_SCHEMA_VERSION = 1;
export const MAX_RETAINED_SNAPSHOTS = 10;

// ---------------------------------------------------------------------------
// Types
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
// Error Types
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
// Database Connection
// ---------------------------------------------------------------------------

let dbInstance: IDBPDatabase | null = null;

/**
 * Opens (or returns cached) the legobuilder-v1 IndexedDB database.
 * Creates object stores and indexes on first open / version upgrade.
 */
export async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // scene-snapshots store
        if (!db.objectStoreNames.contains(SCENE_SNAPSHOTS_STORE)) {
          const snapStore = db.createObjectStore(SCENE_SNAPSHOTS_STORE, {
            keyPath: 'snapshotId',
          });
          snapStore.createIndex('sessionId', 'sessionId', { unique: false });
          snapStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // auto-save-meta store
        if (!db.objectStoreNames.contains(AUTO_SAVE_META_STORE)) {
          const metaStore = db.createObjectStore(AUTO_SAVE_META_STORE, {
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
      'Failed to open IndexedDB',
      PersistenceErrorCode.DB_OPEN_FAILED,
      error,
    );
  }
}

/**
 * Close the cached database connection. Used in tests and cleanup.
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
