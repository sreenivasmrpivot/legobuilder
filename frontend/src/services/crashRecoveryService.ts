/**
 * Crash Recovery Service — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements ICrashRecoveryService from LLD Section 7.
 * Detects crashed sessions (status='active' in IndexedDB meta) and
 * provides recovery snapshot retrieval and cleanup.
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import type {
  SceneSnapshot,
  AutoSaveMeta,
  ICrashRecoveryService,
} from '../../tests/unit/persistenceService.types';
import { persistenceService } from './persistenceService';

const DB_NAME = 'legobuilder-autosave';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'scene-snapshots';
const STORE_META = 'auto-save-meta';

class CrashRecoveryService implements ICrashRecoveryService {
  /**
   * Returns true if the previous session was left in 'active' status.
   * An 'active' status means the beforeunload handler never fired,
   * indicating a browser crash or forced termination.
   */
  async detectCrashedSession(sessionId: string): Promise<boolean> {
    try {
      const db = await persistenceService.openDb();

      return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction([STORE_META], 'readonly');
        const req = tx.objectStore(STORE_META).get(sessionId);

        req.onsuccess = () => {
          const meta = req.result as AutoSaveMeta | undefined;
          if (!meta) return resolve(false);
          resolve(meta.status === 'active');
        };

        req.onerror = () => reject(req.error);
      });
    } catch {
      // If IndexedDB is unavailable, no crash to detect
      return false;
    }
  }

  /**
   * Returns the most recent snapshot for recovery.
   * Returns undefined if no snapshots exist for the session.
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
   * Marks the session as closed and optionally cleans up snapshots.
   */
  async clearRecoveryData(sessionId: string): Promise<void> {
    try {
      const db = await persistenceService.openDb();

      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(
          [STORE_META, STORE_SNAPSHOTS],
          'readwrite',
        );

        // Mark session as closed
        const metaReq = tx.objectStore(STORE_META).get(sessionId);
        metaReq.onsuccess = () => {
          const meta = metaReq.result as AutoSaveMeta | undefined;
          if (meta) {
            meta.status = 'closed';
            tx.objectStore(STORE_META).put(meta);
          }
        };

        // Delete all snapshots for this session
        const index = tx.objectStore(STORE_SNAPSHOTS).index('by-session');
        const snapReq = index.getAllKeys(IDBKeyRange.only(sessionId));
        snapReq.onsuccess = () => {
          const keys = snapReq.result;
          keys.forEach((key) => {
            tx.objectStore(STORE_SNAPSHOTS).delete(key);
          });
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Silently fail — clearing recovery data is best-effort
    }
  }
}

/** Singleton instance */
export const crashRecoveryService = new CrashRecoveryService();
export type { ICrashRecoveryService };
