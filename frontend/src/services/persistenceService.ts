/**
 * Persistence Service — NFR-REL-001 Auto-Save Crash Durability
 *
 * Implements IPersistenceService interface from LLD Section 6.
 * Uses IndexedDB for client-side persistence with atomic transactions.
 *
 * Database: 'legobuilder-autosave' v1
 * Object Stores:
 *   - 'scene-snapshots': keyPath='snapshotId', indexes: 'by-session', 'by-timestamp'
 *   - 'auto-save-meta': keyPath='sessionId'
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: NFR-REL-001
 */

import type { SceneData, SceneSnapshot, AutoSaveMeta, IPersistenceService } from '../types/persistence';

const DB_NAME = 'legobuilder-autosave';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'scene-snapshots';
const STORE_META = 'auto-save-meta';
const MAX_SNAPSHOTS = 10;

class PersistenceService implements IPersistenceService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open (or upgrade) the IndexedDB database.
   * Creates object stores and indexes on first run.
   */
  openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
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

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          this.dbPromise = null;
          reject(new Error('IndexedDB unavailable'));
        };
      } catch (e) {
        this.dbPromise = null;
        reject(new Error('IndexedDB unavailable'));
      }
    });

    return this.dbPromise;
  }

  /**
   * Write snapshot + meta in a single atomic readwrite transaction.
   * Both stores are committed together or neither is.
   */
  async saveSnapshot(sessionId: string, data: SceneData): Promise<void> {
    const db = await this.openDb();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_SNAPSHOTS, STORE_META], 'readwrite');
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error('Transaction aborted'));

      const snapshotId = `${sessionId}-${Date.now()}`;
      const savedAt = Date.now();

      const snapshot: SceneSnapshot = {
        snapshotId,
        sessionId,
        savedAt,
        version: 1,
        data,
      };

      tx.objectStore(STORE_SNAPSHOTS).put(snapshot);

      const meta: AutoSaveMeta = {
        sessionId,
        status: 'active',
        lastSavedAt: savedAt,
        snapshotCount: 1,
      };

      tx.objectStore(STORE_META).put(meta);

      tx.oncomplete = () => {
        // Fire-and-forget pruning after successful write
        this.pruneSnapshots(sessionId).catch(() => {});
        resolve();
      };
    });
  }

  /**
   * Mark session as closed (called from beforeunload handler).
   * Updates the meta record status from 'active' to 'closed'.
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
        tx.oncomplete = () => resolve();
      };

      req.onerror = () => reject(req.error);
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
   * Default maxCount is MAX_SNAPSHOTS (10).
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
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get the meta record for a session.
   */
  async getMeta(sessionId: string): Promise<AutoSaveMeta | undefined> {
    const db = await this.openDb();

    return new Promise<AutoSaveMeta | undefined>((resolve, reject) => {
      const tx = db.transaction([STORE_META], 'readonly');
      const req = tx.objectStore(STORE_META).get(sessionId);
      req.onsuccess = () =>
        resolve(req.result as AutoSaveMeta | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Detect if a previous session was left in 'active' status (crash).
   */
  async detectCrashedSession(sessionId: string): Promise<boolean> {
    try {
      const meta = await this.getMeta(sessionId);
      return meta?.status === 'active';
    } catch {
      return false;
    }
  }
}

export const persistenceService = new PersistenceService();
export default persistenceService;
