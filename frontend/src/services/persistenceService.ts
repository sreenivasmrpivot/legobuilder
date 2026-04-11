/**
 * Persistence Service — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements IPersistenceService from LLD Section 6.
 * Manages IndexedDB operations for auto-save snapshots and session metadata.
 *
 * Schema (LLD Section 4):
 * - Database: 'legobuilder-autosave' v1
 * - Store 'scene-snapshots': keyPath='snapshotId', indexes: by-session, by-timestamp
 * - Store 'auto-save-meta': keyPath='sessionId'
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import type {
  SceneData,
  SceneSnapshot,
  AutoSaveMeta,
  IPersistenceService,
} from '../../tests/unit/persistenceService.types';

const DB_NAME = 'legobuilder-autosave';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'scene-snapshots';
const STORE_META = 'auto-save-meta';
const MAX_SNAPSHOTS = 10;

class PersistenceService implements IPersistenceService {
  private db: IDBDatabase | null = null;

  /**
   * Open (or upgrade) the IndexedDB database with the LLD schema.
   * Gracefully handles private-mode / unavailable IndexedDB.
   */
  async openDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
            const snapStore = db.createObjectStore(STORE_SNAPSHOTS, {
              keyPath: 'snapshotId',
            });
            snapStore.createIndex('by-session', 'sessionId', { unique: false });
            snapStore.createIndex('by-timestamp', 'savedAt', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_META)) {
            db.createObjectStore(STORE_META, { keyPath: 'sessionId' });
          }
        };

        req.onsuccess = () => {
          this.db = req.result;
          resolve(req.result);
        };

        req.onerror = () => {
          reject(new Error('IndexedDB unavailable'));
        };
      } catch (e) {
        reject(new Error('IndexedDB unavailable'));
      }
    });
  }

  /**
   * Write snapshot + meta atomically in a single readwrite transaction.
   * If the write fails (e.g., QuotaExceededError), the error is propagated
   * but does not crash the application.
   */
  async saveSnapshot(sessionId: string, data: SceneData): Promise<void> {
    const db = await this.openDb();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS, STORE_META], 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      const snapshotId = `${sessionId}-${Date.now()}`;
      const savedAt = Date.now();

      tx.objectStore(STORE_SNAPSHOTS).put({
        snapshotId,
        sessionId,
        savedAt,
        version: 1,
        data,
      } satisfies SceneSnapshot);

      // Count existing snapshots for this session
      const countReq = tx
        .objectStore(STORE_SNAPSHOTS)
        .index('by-session')
        .count(IDBKeyRange.only(sessionId));

      countReq.onsuccess = () => {
        const count = countReq.result + 1; // +1 for the one we just put
        tx.objectStore(STORE_META).put({
          sessionId,
          status: 'active',
          lastSavedAt: savedAt,
          snapshotCount: count,
        } satisfies AutoSaveMeta);
      };

      tx.oncomplete = () => resolve();
    });
  }

  /**
   * Mark session as closed (called from beforeunload handler).
   * This prevents the crash recovery prompt on next load.
   */
  async markSessionClosed(sessionId: string): Promise<void> {
    const db = await this.openDb();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_META], 'readwrite');
      const req = tx.objectStore(STORE_META).get(sessionId);

      req.onsuccess = () => {
        const meta = req.result as AutoSaveMeta | undefined;
        if (meta) {
          meta.status = 'closed';
          tx.objectStore(STORE_META).put(meta);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retrieve the most recent snapshot for a session.
   * Returns undefined if no snapshots exist.
   */
  async getLatestSnapshot(
    sessionId: string,
  ): Promise<SceneSnapshot | undefined> {
    const db = await this.openDb();

    return new Promise<SceneSnapshot | undefined>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readonly');
      const index = tx.objectStore(STORE_SNAPSHOTS).index('by-session');
      const req = index.getAll(IDBKeyRange.only(sessionId));

      req.onsuccess = () => {
        const records = req.result as SceneSnapshot[];
        if (!records.length) return resolve(undefined);
        records.sort((a, b) => b.savedAt - a.savedAt);
        resolve(records[0]);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Prune old snapshots, keeping only the most recent maxCount.
   * Default maxCount is MAX_SNAPSHOTS (10) per LLD.
   */
  async pruneSnapshots(
    sessionId: string,
    maxCount: number = MAX_SNAPSHOTS,
  ): Promise<void> {
    const db = await this.openDb();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS], 'readwrite');
      const index = tx.objectStore(STORE_SNAPSHOTS).index('by-session');
      const req = index.getAll(IDBKeyRange.only(sessionId));

      req.onsuccess = () => {
        const records = (req.result as SceneSnapshot[]).sort(
          (a, b) => b.savedAt - a.savedAt,
        );
        const toDelete = records.slice(maxCount);
        toDelete.forEach((r) => {
          tx.objectStore(STORE_SNAPSHOTS).delete(r.snapshotId);
        });
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

/** Singleton instance */
export const persistenceService = new PersistenceService();
export type { IPersistenceService };
