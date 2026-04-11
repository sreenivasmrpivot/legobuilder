/**
 * Shared TypeScript types for NFR-REL-001 persistence layer tests.
 * These mirror the LLD Section 4 schema and Section 5 store interface.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 */

// ---------------------------------------------------------------------------
// IndexedDB Schema Types (LLD Section 4)
// ---------------------------------------------------------------------------

export interface SceneSnapshot {
  /** Primary key: `${sessionId}-${timestamp}` */
  snapshotId: string;
  /** Foreign key linking to auto-save-meta */
  sessionId: string;
  /** Unix timestamp (ms) when this snapshot was written */
  savedAt: number;
  /** Schema version for forward-compatibility */
  version: number;
  /** Serialized scene state */
  data: SceneData;
}

export interface AutoSaveMeta {
  /** Primary key */
  sessionId: string;
  /** 'active' = session in progress or crashed; 'closed' = graceful close */
  status: 'active' | 'closed';
  /** Unix timestamp (ms) of the most recent successful save */
  lastSavedAt: number;
  /** Number of snapshots stored for this session */
  snapshotCount: number;
}

export interface SceneData {
  bricks?: Array<BrickRecord>;
  camera?: CameraState;
  metadata?: SceneMetadata;
  [key: string]: unknown;
}

export interface BrickRecord {
  id: string;
  type?: string;
  x?: number;
  y?: number;
  z?: number;
  color?: string;
  [key: string]: unknown;
}

export interface CameraState {
  x?: number;
  y?: number;
  z?: number;
  azimuth?: number;
  elevation?: number;
  distance?: number;
  [key: string]: unknown;
}

export interface SceneMetadata {
  name?: string;
  savedAt?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// persistenceStore Types (LLD Section 5)
// ---------------------------------------------------------------------------

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type RecoveryStatus = 'none' | 'pending' | 'accepted' | 'dismissed';

export interface PersistenceStoreState {
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: number | null;
  saveError: string | null;
  recoveryStatus: RecoveryStatus;
  recoverySnapshot: SceneSnapshot | null;
  sessionId: string | null;
}

// ---------------------------------------------------------------------------
// persistenceService Interface (LLD Section 6)
// ---------------------------------------------------------------------------

export interface IPersistenceService {
  /** Open (or upgrade) the IndexedDB database */
  openDb(): Promise<IDBDatabase>;
  /** Write snapshot + meta atomically */
  saveSnapshot(sessionId: string, data: SceneData): Promise<void>;
  /** Mark session as closed (called from beforeunload) */
  markSessionClosed(sessionId: string): Promise<void>;
  /** Retrieve the most recent snapshot for a session */
  getLatestSnapshot(sessionId: string): Promise<SceneSnapshot | undefined>;
  /** Prune old snapshots, keeping only the most recent MAX_SNAPSHOTS */
  pruneSnapshots(sessionId: string, maxCount?: number): Promise<void>;
}

// ---------------------------------------------------------------------------
// crashRecoveryService Interface (LLD Section 7)
// ---------------------------------------------------------------------------

export interface ICrashRecoveryService {
  /** Returns true if the previous session was left in 'active' status */
  detectCrashedSession(sessionId: string): Promise<boolean>;
  /** Returns the most recent snapshot for recovery */
  getRecoverySnapshot(sessionId: string): Promise<SceneSnapshot | undefined>;
  /** Clears recovery data after user accepts or dismisses */
  clearRecoveryData(sessionId: string): Promise<void>;
}
