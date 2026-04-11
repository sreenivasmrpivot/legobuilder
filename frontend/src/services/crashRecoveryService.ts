/**
 * crashRecoveryService — Interface Contract (Stub)
 *
 * FR: NFR-REL-001 — Auto-Save Crash Durability
 * Issue: https://github.com/sreenivasmrpivot/legobuilder/issues/35
 *
 * This file defines the TypeScript interface and a NOT-YET-IMPLEMENTED stub
 * so that the test files can import the types. The coding agent MUST replace
 * the stub implementations with real logic.
 *
 * Interface contract defined in LLD Section 4.3.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 */

import type { PersistenceService } from './persistenceService';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface RecoveryCandidate {
  sessionId: string;
  snapshotId: string;
  /** Number of bricks in the recoverable snapshot */
  brickCount: number;
  /** Unix epoch ms */
  lastSavedAt: number;
  /** SemVer string */
  appVersion: string;
}

export interface CrashRecoveryService {
  /**
   * Scans IndexedDB for active sessions that were not gracefully closed.
   * Returns the most recent candidate, or null if none found.
   * Called once at app boot before rendering the main scene.
   */
  detectCrash(): Promise<RecoveryCandidate | null>;

  /**
   * Loads the snapshot for the given sessionId into the scene store.
   * Marks the session as closed after successful restore.
   */
  restoreSession(sessionId: string): Promise<void>;

  /**
   * Discards the recovery candidate without restoring.
   * Purges the stale session from IndexedDB.
   */
  discardSession(sessionId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// NOT-YET-IMPLEMENTED stub — coding agent replaces this
// ---------------------------------------------------------------------------

class CrashRecoveryServiceNotImplemented implements CrashRecoveryService {
  constructor(private readonly _persistence: PersistenceService) {}

  async detectCrash(): Promise<RecoveryCandidate | null> {
    throw new Error(
      'NOT IMPLEMENTED: crashRecoveryService.detectCrash() — coding agent must implement'
    );
  }

  async restoreSession(_sessionId: string): Promise<void> {
    throw new Error(
      'NOT IMPLEMENTED: crashRecoveryService.restoreSession() — coding agent must implement'
    );
  }

  async discardSession(_sessionId: string): Promise<void> {
    throw new Error(
      'NOT IMPLEMENTED: crashRecoveryService.discardSession() — coding agent must implement'
    );
  }
}

/**
 * Factory function — creates a CrashRecoveryService instance.
 * The coding agent should replace the stub class with a real implementation.
 */
export function createCrashRecoveryService(
  persistence: PersistenceService
): CrashRecoveryService {
  return new CrashRecoveryServiceNotImplemented(persistence);
}

export default createCrashRecoveryService;
