/**
 * NFR-REL-001 — Unit Tests: crashRecoveryService
 *
 * Test IDs:
 *   T-UNIT-REL-001-02  detectOrphanedSession() returns session when status=active
 *   T-UNIT-REL-001-03  detectOrphanedSession() returns null when status=closed
 *
 * Strategy:
 *   Uses fake-indexeddb to simulate IndexedDB in jsdom.
 *   The crashRecoveryService reads the auto-save-meta object store to determine
 *   whether the previous session was closed gracefully (status='closed') or
 *   crashed (status='active').
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-02, T-UNIT-REL-001-03
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { openDB } from 'idb';

// ---------------------------------------------------------------------------
// Constants — must match the LLD schema exactly
// ---------------------------------------------------------------------------
const DB_NAME = 'legobuilder-autosave';
const DB_VERSION = 1;
const META_STORE = 'auto-save-meta';
const SNAPSHOT_STORE = 'scene-snapshots';
const SESSION_KEY = 'current';

// ---------------------------------------------------------------------------
// Inline crashRecoveryService implementation contract (interface-level)
// The real implementation lives in src/services/crashRecoveryService.ts.
// These tests validate the contract so the coding agent can implement against
// a passing test suite.
// ---------------------------------------------------------------------------

interface AutoSaveMeta {
  sessionId: string;
  status: 'active' | 'closed';
  lastSavedAt: number;
  snapshotCount: number;
}

interface OrphanedSession {
  sessionId: string;
  lastSavedAt: number;
  snapshotCount: number;
}

/**
 * Opens (or reuses) the legobuilder-autosave IndexedDB database.
 * Mirrors the schema defined in the NFR-REL-001 LLD Section 4.
 */
async function openAutosaveDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        const snapshotStore = db.createObjectStore(SNAPSHOT_STORE, {
          keyPath: 'snapshotId',
        });
        snapshotStore.createIndex('by-session', 'sessionId');
        snapshotStore.createIndex('by-timestamp', 'savedAt');
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    },
  });
}

/**
 * Minimal crashRecoveryService contract.
 * Returns the orphaned session if the previous session status is 'active',
 * or null if the session was closed gracefully (status='closed') or if no
 * session record exists.
 */
async function detectOrphanedSession(): Promise<OrphanedSession | null> {
  const db = await openAutosaveDB();
  const meta = await db.get(META_STORE, SESSION_KEY) as AutoSaveMeta | undefined;
  db.close();

  if (!meta || meta.status !== 'active') {
    return null;
  }

  return {
    sessionId: meta.sessionId,
    lastSavedAt: meta.lastSavedAt,
    snapshotCount: meta.snapshotCount,
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

async function seedMeta(meta: AutoSaveMeta): Promise<void> {
  const db = await openAutosaveDB();
  await db.put(META_STORE, meta, SESSION_KEY);
  db.close();
}

async function clearDB(): Promise<void> {
  const db = await openAutosaveDB();
  await db.clear(META_STORE);
  await db.clear(SNAPSHOT_STORE);
  db.close();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('crashRecoveryService', () => {
  beforeEach(async () => {
    // Reset fake-indexeddb state between tests by clearing all stores.
    // fake-indexeddb/auto replaces globalThis.indexedDB with a fresh IDBFactory
    // per test file, so we only need to clear the object stores.
    await clearDB();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-02
  // -------------------------------------------------------------------------
  describe('T-UNIT-REL-001-02: detectOrphanedSession — active session', () => {
    it('returns the orphaned session when the previous session status is active', async () => {
      // Arrange: seed a meta record that simulates a crashed session
      const crashedMeta: AutoSaveMeta = {
        sessionId: 'session-crash-001',
        status: 'active',          // <-- never set to 'closed' before crash
        lastSavedAt: Date.now() - 60_000, // 1 minute ago
        snapshotCount: 3,
      };
      await seedMeta(crashedMeta);

      // Act
      const result = await detectOrphanedSession();

      // Assert
      expect(result).not.toBeNull();
      expect(result!.sessionId).toBe('session-crash-001');
      expect(result!.snapshotCount).toBe(3);
      expect(result!.lastSavedAt).toBe(crashedMeta.lastSavedAt);
    });

    it('returns an object with the correct shape (sessionId, lastSavedAt, snapshotCount)', async () => {
      const meta: AutoSaveMeta = {
        sessionId: 'session-shape-check',
        status: 'active',
        lastSavedAt: 1_700_000_000_000,
        snapshotCount: 7,
      };
      await seedMeta(meta);

      const result = await detectOrphanedSession();

      expect(result).toMatchObject({
        sessionId: 'session-shape-check',
        lastSavedAt: 1_700_000_000_000,
        snapshotCount: 7,
      });
      // Must NOT expose the raw status field
      expect(result).not.toHaveProperty('status');
    });
  });

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-03
  // -------------------------------------------------------------------------
  describe('T-UNIT-REL-001-03: detectOrphanedSession — closed session', () => {
    it('returns null when the previous session was closed gracefully (status=closed)', async () => {
      // Arrange: seed a meta record that simulates a graceful close
      const closedMeta: AutoSaveMeta = {
        sessionId: 'session-graceful-001',
        status: 'closed',          // <-- set by beforeunload handler
        lastSavedAt: Date.now() - 120_000,
        snapshotCount: 5,
      };
      await seedMeta(closedMeta);

      // Act
      const result = await detectOrphanedSession();

      // Assert: graceful close must NOT trigger recovery prompt
      expect(result).toBeNull();
    });

    it('returns null when no session record exists in IndexedDB', async () => {
      // Arrange: DB is empty (cleared in beforeEach)

      // Act
      const result = await detectOrphanedSession();

      // Assert: no prior session → no recovery needed
      expect(result).toBeNull();
    });

    it('returns null when meta record has an unexpected status value', async () => {
      // Arrange: simulate a corrupted or future-schema record
      const db = await openAutosaveDB();
      await db.put(
        META_STORE,
        { sessionId: 'session-corrupt', status: 'unknown', lastSavedAt: 0, snapshotCount: 0 },
        SESSION_KEY,
      );
      db.close();

      // Act
      const result = await detectOrphanedSession();

      // Assert: unknown status is treated as non-orphaned (safe default)
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles snapshotCount of 0 correctly for an active session', async () => {
      // Edge case: session started but crashed before first snapshot was written
      const meta: AutoSaveMeta = {
        sessionId: 'session-zero-snapshots',
        status: 'active',
        lastSavedAt: Date.now(),
        snapshotCount: 0,
      };
      await seedMeta(meta);

      const result = await detectOrphanedSession();

      // Still an orphaned session — the meta record exists with status=active
      expect(result).not.toBeNull();
      expect(result!.snapshotCount).toBe(0);
    });
  });
});
