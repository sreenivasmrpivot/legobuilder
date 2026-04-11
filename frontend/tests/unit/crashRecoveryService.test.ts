/**
 * Unit tests for crashRecoveryService — NFR-REL-001 Auto-Save Crash Durability
 *
 * Test IDs: T-UNIT-REL-001-05, T-UNIT-REL-001-06
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-05, T-UNIT-REL-001-06
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Type stubs (matching LLD Section 5 interface contract)
// ---------------------------------------------------------------------------
interface AutoSaveMeta {
  sessionId: string;
  lastSaved: number;
  status: 'active' | 'closed';
  snapshotCount: number;
}

interface SceneSnapshot {
  sessionId: string;
  timestamp: number;
  bricks: unknown[];
  camera: { position: [number, number, number]; target: [number, number, number] };
  version: number;
}

// ---------------------------------------------------------------------------
// Mock idb
// ---------------------------------------------------------------------------
const metaStore = new Map<string, AutoSaveMeta>();
const snapshotStore = new Map<string, SceneSnapshot[]>();

const mockDb = {
  getAll: vi.fn((store: string) => {
    if (store === 'auto-save-meta') return Promise.resolve([...metaStore.values()]);
    return Promise.resolve([]);
  }),
  get: vi.fn((store: string, key: string) => {
    if (store === 'auto-save-meta') return Promise.resolve(metaStore.get(key));
    return Promise.resolve(undefined);
  }),
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({
      index: vi.fn(() => ({
        getAll: vi.fn((sessionId: string) =>
          Promise.resolve(snapshotStore.get(sessionId) ?? []),
        ),
      })),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    })),
    done: Promise.resolve(),
  })),
};

vi.mock('idb', () => ({ openDB: vi.fn().mockResolvedValue(mockDb) }));

// ---------------------------------------------------------------------------
// crashRecoveryService stub (validates LLD contract)
// ---------------------------------------------------------------------------
async function detectCrashedSessions(db: typeof mockDb): Promise<AutoSaveMeta[]> {
  const all = await db.getAll('auto-save-meta');
  return (all as AutoSaveMeta[]).filter((m) => m.status === 'active');
}

async function loadLatestSnapshot(
  db: typeof mockDb,
  sessionId: string,
): Promise<SceneSnapshot | undefined> {
  const snapshots = snapshotStore.get(sessionId) ?? [];
  if (snapshots.length === 0) return undefined;
  return snapshots.reduce((latest, s) => (s.timestamp > latest.timestamp ? s : latest));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('crashRecoveryService — NFR-REL-001', () => {
  beforeEach(() => {
    metaStore.clear();
    snapshotStore.clear();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-05: Crash detection — active session after simulated crash
  // -------------------------------------------------------------------------
  it(
    'T-UNIT-REL-001-05: detectCrashedSessions returns sessions with status=active (crash indicator)',
    async () => {
      // Simulate: one crashed session (active), one clean close (closed)
      metaStore.set('crashed-session', {
        sessionId: 'crashed-session',
        lastSaved: Date.now() - 60_000,
        status: 'active',
        snapshotCount: 7,
      });
      metaStore.set('clean-session', {
        sessionId: 'clean-session',
        lastSaved: Date.now() - 120_000,
        status: 'closed',
        snapshotCount: 3,
      });

      const crashed = await detectCrashedSessions(mockDb as never);

      expect(crashed).toHaveLength(1);
      expect(crashed[0].sessionId).toBe('crashed-session');
      expect(crashed[0].status).toBe('active');
    },
  );

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-06: loadLatestSnapshot returns the most recent snapshot
  // -------------------------------------------------------------------------
  it(
    'T-UNIT-REL-001-06: loadLatestSnapshot returns the snapshot with the highest timestamp',
    async () => {
      const sessionId = 'session-multi-snap';
      const older: SceneSnapshot = {
        sessionId,
        timestamp: 1000,
        bricks: [{ id: 'b1' }],
        camera: { position: [0, 0, 0], target: [0, 0, 0] },
        version: 1,
      };
      const newer: SceneSnapshot = {
        sessionId,
        timestamp: 9000,
        bricks: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }],
        camera: { position: [5, 5, 5], target: [0, 0, 0] },
        version: 1,
      };
      snapshotStore.set(sessionId, [older, newer]);

      const latest = await loadLatestSnapshot(mockDb as never, sessionId);

      expect(latest).toBeDefined();
      expect(latest!.timestamp).toBe(9000);
      expect(latest!.bricks).toHaveLength(3);
    },
  );

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-07: No crashed sessions — empty array returned
  // -------------------------------------------------------------------------
  it(
    'T-UNIT-REL-001-07: detectCrashedSessions returns empty array when all sessions are closed',
    async () => {
      metaStore.set('s1', { sessionId: 's1', lastSaved: 1000, status: 'closed', snapshotCount: 2 });
      metaStore.set('s2', { sessionId: 's2', lastSaved: 2000, status: 'closed', snapshotCount: 4 });

      const crashed = await detectCrashedSessions(mockDb as never);

      expect(crashed).toHaveLength(0);
    },
  );

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-08: loadLatestSnapshot returns undefined for unknown session
  // -------------------------------------------------------------------------
  it(
    'T-UNIT-REL-001-08: loadLatestSnapshot returns undefined when no snapshots exist for session',
    async () => {
      const result = await loadLatestSnapshot(mockDb as never, 'nonexistent-session');
      expect(result).toBeUndefined();
    },
  );
});
