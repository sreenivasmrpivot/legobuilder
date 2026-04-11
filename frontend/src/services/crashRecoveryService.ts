/**
 * Crash Recovery Service — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements ICrashRecoveryService interface from LLD Section 7.
 * Detects crashed sessions (status='active' in IndexedDB meta) and
 * provides recovery snapshot retrieval.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import type { SceneSnapshot, ICrashRecoveryService } from '../types/persistence';
import { persistenceService } from './persistenceService';

class CrashRecoveryService implements ICrashRecoveryService {
  /**
   * Returns true if the previous session was left in 'active' status.
   * An 'active' status means the beforeunload handler never fired,
   * indicating a browser crash or forced termination.
   */
  async detectCrashedSession(sessionId: string): Promise<boolean> {
    try {
      return await persistenceService.detectCrashedSession(sessionId);
    } catch {
      return false;
    }
  }

  /**
   * Returns the most recent snapshot for recovery.
   * Called after detectCrashedSession returns true.
   */
  async getRecoverySnapshot(
    sessionId: string,
  ): Promise<SceneSnapshot | undefined> {
    try {
      return await persistenceService.getLatestSnapshot(sessionId);
    } catch {
      return undefined;
    }
  }

  /**
   * Clears recovery data after user accepts or dismisses the prompt.
   * Marks the session as 'closed' so the prompt won't appear again.
   */
  async clearRecoveryData(sessionId: string): Promise<void> {
    try {
      await persistenceService.markSessionClosed(sessionId);
    } catch {
      // Silently fail — recovery data cleanup is best-effort
    }
  }
}

export const crashRecoveryService = new CrashRecoveryService();
export default crashRecoveryService;
