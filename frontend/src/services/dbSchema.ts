/**
 * IndexedDB Schema Types — NFR-REL-001
 *
 * Defines the TypeScript interfaces for the IndexedDB object stores
 * as specified in LLD Section 3.1.
 *
 * This file is the single source of truth for IDB data shapes.
 * Both persistenceService.ts and crashRecoveryService.ts import from here.
 *
 * NOTE: This is a TYPE-ONLY file. No runtime logic.
 * The coding agent should implement the actual IDB schema upgrade logic
 * in persistenceService.ts using the idb library's openDB() onupgradeneeded.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 */

// ---------------------------------------------------------------------------
// scene-snapshots object store
// ---------------------------------------------------------------------------

export interface BrickRecord {
  /** UUID v4 */
  id: string;
  /** e.g. "2x4", "1x1", "plate-2x4" */
  type: string;
  /** [x, y, z] in stud units */
  position: [number, number, number];
  /** quaternion [x, y, z, w] */
  rotation: [number, number, number, number];
  /** hex string e.g. "#FF0000" */
  color: string;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface SceneMetadata {
  name: string;
  /** Unix epoch ms */
  createdAt: number;
  /** Unix epoch ms */
  lastModifiedAt: number;
}

export interface SceneSnapshot {
  /** UUID v4 — primary key */
  snapshotId: string;
  /** UUID v4 — links to auto-save-meta */
  sessionId: string;
  /** Unix epoch ms */
  timestamp: number;
  /** Integer — for forward-compat migrations */
  schemaVersion: number;
  /** Full brick array (serialised scene state) */
  bricks: BrickRecord[];
  cameraState: CameraState;
  sceneMetadata: SceneMetadata;
}

// ---------------------------------------------------------------------------
// auto-save-meta object store
// ---------------------------------------------------------------------------

export interface AutoSaveMeta {
  /** UUID v4 — primary key */
  sessionId: string;
  /** FK -> scene-snapshots.snapshotId */
  latestSnapshotId: string;
  /** Monotonically increasing counter */
  saveCount: number;
  /** Unix epoch ms */
  lastSavedAt: number;
  /** SemVer string e.g. "1.0.0" */
  appVersion: string;
  /** 'closed' on graceful tab close; 'active' otherwise */
  status: 'active' | 'closed';
}

// ---------------------------------------------------------------------------
// Database constants
// ---------------------------------------------------------------------------

export const DB_NAME = 'legobuilder-v1' as const;
export const DB_VERSION = 1 as const;
export const STORE_SCENE_SNAPSHOTS = 'scene-snapshots' as const;
export const STORE_AUTO_SAVE_META = 'auto-save-meta' as const;
export const MAX_SNAPSHOTS_PER_SESSION = 10 as const;
export const MAX_SNAPSHOT_SIZE_BYTES = 500 * 1024 as const; // 500 KB
