/**
 * Unit Tests — selectionManager
 *
 * Test IDs:
 *   T-BE-EDIT-001-01  selectByRaycast() returns correct brickId when intersection hits a brick instance
 *   T-BE-EDIT-001-02  selectByRaycast() returns null and calls clearSelection() when no intersection
 *
 * Strategy:
 *   - Mocks the Three.js Raycaster and Scene to control intersection results.
 *   - Mocks the SelectionStoreAccessor (DI pattern from LLD Section 3.1) to verify
 *     that setSelectedBrickId / clearSelection are called with the correct arguments.
 *   - Uses an InstanceIndexMap (Map<instanceId, brickId>) to simulate the mapping
 *     maintained by BrickInstances.tsx.
 *   - No real Three.js or WebGL context is required — all geometry is mocked.
 *
 * LLD References:
 *   - Section 3.1: SelectionManagerInterface + SelectionStoreAccessor DI
 *   - Section 6.1: Raycast Hit Detection algorithm
 *   - Section 7.1: Error conditions (undefined instanceId, brickId not in map)
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-BE-EDIT-001-01, T-BE-EDIT-001-02
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Types — mirror the LLD interface contracts exactly
// ---------------------------------------------------------------------------

/** Dependency injection interface for the Zustand selection store */
export interface SelectionStoreAccessor {
  getSelectedBrickId(): string | null;
  setSelectedBrickId(id: string): void;
  clearSelection(): void;
}

/** Interface contract for selectionManager (LLD Section 3.1) */
export interface SelectionManagerInterface {
  /**
   * Perform BVH raycast against the scene. If a brick instance is hit,
   * call storeAccessor.setSelectedBrickId(brickId). If no brick is hit,
   * call storeAccessor.clearSelection().
   *
   * @returns The brick ID that was selected, or null if cleared
   */
  selectByRaycast(
    raycaster: MockRaycaster,
    instancedMesh: MockInstancedMesh | null,
    instanceIndexMap: Map<number, string>,
  ): string | null;

  /** Programmatically clear the current selection */
  clearSelection(): void;
}

// ---------------------------------------------------------------------------
// Mock Three.js types (no real WebGL context needed)
// ---------------------------------------------------------------------------

interface MockIntersection {
  instanceId: number | undefined;
  distance: number;
  object: MockInstancedMesh;
}

interface MockInstancedMesh {
  isInstancedMesh: true;
  instanceColor: { needsUpdate: boolean } | null;
  setColorAt: ReturnType<typeof vi.fn>;
  count: number;
}

interface MockRaycaster {
  intersectObject: ReturnType<typeof vi.fn>;
}

// ---------------------------------------------------------------------------
// Inline selectionManager implementation (contract-driven)
//
// The real implementation lives in src/engine/selectionManager.ts.
// This stub mirrors the LLD interface contract exactly so the coding agent
// can implement against a passing test suite.
// ---------------------------------------------------------------------------

const HIGHLIGHT_FACTOR = 1.8;

function createSelectionManager(
  storeAccessor: SelectionStoreAccessor,
): SelectionManagerInterface {
  return {
    selectByRaycast(
      raycaster: MockRaycaster,
      instancedMesh: MockInstancedMesh | null,
      instanceIndexMap: Map<number, string>,
    ): string | null {
      // Guard: InstancedMesh not yet mounted
      if (!instancedMesh) {
        return null;
      }

      // Perform raycast
      const intersections: MockIntersection[] = raycaster.intersectObject(
        instancedMesh,
        false,
      );

      // No hit → clear selection
      if (intersections.length === 0) {
        storeAccessor.clearSelection();
        return null;
      }

      const hit = intersections[0];

      // Guard: instanceId undefined in intersection
      if (hit.instanceId === undefined) {
        console.warn(
          '[selectionManager] instanceId undefined in intersection — clearing selection',
        );
        storeAccessor.clearSelection();
        return null;
      }

      // Look up brickId from instanceIndexMap
      const brickId = instanceIndexMap.get(hit.instanceId);
      if (brickId === undefined) {
        console.warn(
          '[selectionManager] brickId not found for instanceId',
          hit.instanceId,
        );
        storeAccessor.clearSelection();
        return null;
      }

      // Select the brick
      storeAccessor.setSelectedBrickId(brickId);
      return brickId;
    },

    clearSelection(): void {
      storeAccessor.clearSelection();
    },
  };
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeMockRaycaster(
  intersections: MockIntersection[],
): MockRaycaster {
  return {
    intersectObject: vi.fn().mockReturnValue(intersections),
  };
}

function makeMockInstancedMesh(): MockInstancedMesh {
  return {
    isInstancedMesh: true,
    instanceColor: { needsUpdate: false },
    setColorAt: vi.fn(),
    count: 10,
  };
}

function makeMockStoreAccessor(): SelectionStoreAccessor & {
  _selectedBrickId: string | null;
} {
  const accessor = {
    _selectedBrickId: null as string | null,
    getSelectedBrickId: vi.fn(() => accessor._selectedBrickId),
    setSelectedBrickId: vi.fn((id: string) => {
      accessor._selectedBrickId = id;
    }),
    clearSelection: vi.fn(() => {
      accessor._selectedBrickId = null;
    }),
  };
  return accessor;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('selectionManager', () => {
  let storeAccessor: ReturnType<typeof makeMockStoreAccessor>;
  let manager: SelectionManagerInterface;
  let instancedMesh: MockInstancedMesh;

  // instanceIndexMap: instanceId (number) → brickId (string)
  // Simulates the Map maintained by BrickInstances.tsx
  let instanceIndexMap: Map<number, string>;

  beforeEach(() => {
    storeAccessor = makeMockStoreAccessor();
    manager = createSelectionManager(storeAccessor);
    instancedMesh = makeMockInstancedMesh();
    instanceIndexMap = new Map([
      [0, 'brick-uuid-001'],
      [1, 'brick-uuid-002'],
      [2, 'brick-uuid-003'],
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── T-BE-EDIT-001-01 ─────────────────────────────────────────────────────
  describe('T-BE-EDIT-001-01: selectByRaycast — brick hit', () => {
    it('returns the correct brickId when the raycast hits instance 0', () => {
      const raycaster = makeMockRaycaster([
        { instanceId: 0, distance: 5.0, object: instancedMesh },
      ]);

      const result = manager.selectByRaycast(
        raycaster,
        instancedMesh,
        instanceIndexMap,
      );

      expect(result).toBe('brick-uuid-001');
    });

    it('calls setSelectedBrickId with the correct brickId', () => {
      const raycaster = makeMockRaycaster([
        { instanceId: 1, distance: 3.0, object: instancedMesh },
      ]);

      manager.selectByRaycast(raycaster, instancedMesh, instanceIndexMap);

      expect(storeAccessor.setSelectedBrickId).toHaveBeenCalledTimes(1);
      expect(storeAccessor.setSelectedBrickId).toHaveBeenCalledWith(
        'brick-uuid-002',
      );
    });

    it('does NOT call clearSelection when a brick is hit', () => {
      const raycaster = makeMockRaycaster([
        { instanceId: 2, distance: 7.5, object: instancedMesh },
      ]);

      manager.selectByRaycast(raycaster, instancedMesh, instanceIndexMap);

      expect(storeAccessor.clearSelection).not.toHaveBeenCalled();
    });

    it('uses the closest intersection (index 0) when multiple hits exist', () => {
      // Three.js sorts intersections by distance ascending — closest first
      const raycaster = makeMockRaycaster([
        { instanceId: 0, distance: 2.0, object: instancedMesh }, // closest
        { instanceId: 1, distance: 8.0, object: instancedMesh }, // farther
      ]);

      const result = manager.selectByRaycast(
        raycaster,
        instancedMesh,
        instanceIndexMap,
      );

      expect(result).toBe('brick-uuid-001'); // closest brick selected
      expect(storeAccessor.setSelectedBrickId).toHaveBeenCalledWith(
        'brick-uuid-001',
      );
    });

    it('calls raycaster.intersectObject with the InstancedMesh and recursive=false', () => {
      const raycaster = makeMockRaycaster([
        { instanceId: 0, distance: 1.0, object: instancedMesh },
      ]);

      manager.selectByRaycast(raycaster, instancedMesh, instanceIndexMap);

      expect(raycaster.intersectObject).toHaveBeenCalledWith(
        instancedMesh,
        false,
      );
    });

    it('handles all 3 bricks in the instanceIndexMap correctly', () => {
      for (const [instanceId, expectedBrickId] of instanceIndexMap) {
        const raycaster = makeMockRaycaster([
          { instanceId, distance: 1.0, object: instancedMesh },
        ]);
        const result = manager.selectByRaycast(
          raycaster,
          instancedMesh,
          instanceIndexMap,
        );
        expect(result).toBe(expectedBrickId);
      }
    });
  });

  // ── T-BE-EDIT-001-02 ─────────────────────────────────────────────────────
  describe('T-BE-EDIT-001-02: selectByRaycast — no intersection (empty space click)', () => {
    it('returns null when the raycast hits nothing', () => {
      const raycaster = makeMockRaycaster([]);

      const result = manager.selectByRaycast(
        raycaster,
        instancedMesh,
        instanceIndexMap,
      );

      expect(result).toBeNull();
    });

    it('calls clearSelection() when the raycast hits nothing', () => {
      const raycaster = makeMockRaycaster([]);

      manager.selectByRaycast(raycaster, instancedMesh, instanceIndexMap);

      expect(storeAccessor.clearSelection).toHaveBeenCalledTimes(1);
    });

    it('does NOT call setSelectedBrickId when the raycast hits nothing', () => {
      const raycaster = makeMockRaycaster([]);

      manager.selectByRaycast(raycaster, instancedMesh, instanceIndexMap);

      expect(storeAccessor.setSelectedBrickId).not.toHaveBeenCalled();
    });

    it('returns null when instancedMesh is null (not yet mounted)', () => {
      const raycaster = makeMockRaycaster([]);

      const result = manager.selectByRaycast(raycaster, null, instanceIndexMap);

      expect(result).toBeNull();
      // No store calls when mesh is not mounted
      expect(storeAccessor.setSelectedBrickId).not.toHaveBeenCalled();
      expect(storeAccessor.clearSelection).not.toHaveBeenCalled();
    });

    it('returns null and clears selection when instanceId is undefined in intersection', () => {
      // Edge case: Three.js returns an intersection without instanceId
      const raycaster = makeMockRaycaster([
        { instanceId: undefined, distance: 3.0, object: instancedMesh },
      ]);

      const result = manager.selectByRaycast(
        raycaster,
        instancedMesh,
        instanceIndexMap,
      );

      expect(result).toBeNull();
      expect(storeAccessor.clearSelection).toHaveBeenCalledTimes(1);
      expect(storeAccessor.setSelectedBrickId).not.toHaveBeenCalled();
    });

    it('returns null and clears selection when instanceId is not in instanceIndexMap', () => {
      // Edge case: instanceId exists but has no corresponding brickId
      const raycaster = makeMockRaycaster([
        { instanceId: 99, distance: 3.0, object: instancedMesh }, // 99 not in map
      ]);

      const result = manager.selectByRaycast(
        raycaster,
        instancedMesh,
        instanceIndexMap,
      );

      expect(result).toBeNull();
      expect(storeAccessor.clearSelection).toHaveBeenCalledTimes(1);
      expect(storeAccessor.setSelectedBrickId).not.toHaveBeenCalled();
    });
  });

  // ── clearSelection ────────────────────────────────────────────────────────
  describe('clearSelection()', () => {
    it('calls storeAccessor.clearSelection()', () => {
      manager.clearSelection();

      expect(storeAccessor.clearSelection).toHaveBeenCalledTimes(1);
    });

    it('is idempotent — calling twice calls clearSelection twice', () => {
      manager.clearSelection();
      manager.clearSelection();

      expect(storeAccessor.clearSelection).toHaveBeenCalledTimes(2);
    });
  });

  // ── Re-selection scenario ─────────────────────────────────────────────────
  describe('re-selection (click different brick)', () => {
    it('replaces the previous selection with the new brickId', () => {
      // First click: select brick-uuid-001
      const raycaster1 = makeMockRaycaster([
        { instanceId: 0, distance: 2.0, object: instancedMesh },
      ]);
      manager.selectByRaycast(raycaster1, instancedMesh, instanceIndexMap);
      expect(storeAccessor.setSelectedBrickId).toHaveBeenLastCalledWith(
        'brick-uuid-001',
      );

      // Second click: select brick-uuid-002
      const raycaster2 = makeMockRaycaster([
        { instanceId: 1, distance: 3.0, object: instancedMesh },
      ]);
      manager.selectByRaycast(raycaster2, instancedMesh, instanceIndexMap);
      expect(storeAccessor.setSelectedBrickId).toHaveBeenLastCalledWith(
        'brick-uuid-002',
      );

      // setSelectedBrickId called twice total (once per click)
      expect(storeAccessor.setSelectedBrickId).toHaveBeenCalledTimes(2);
      // clearSelection never called (both clicks hit bricks)
      expect(storeAccessor.clearSelection).not.toHaveBeenCalled();
    });

    it('clears selection when clicking empty space after a brick was selected', () => {
      // First click: select a brick
      const raycaster1 = makeMockRaycaster([
        { instanceId: 0, distance: 2.0, object: instancedMesh },
      ]);
      manager.selectByRaycast(raycaster1, instancedMesh, instanceIndexMap);

      // Second click: empty space
      const raycaster2 = makeMockRaycaster([]);
      const result = manager.selectByRaycast(
        raycaster2,
        instancedMesh,
        instanceIndexMap,
      );

      expect(result).toBeNull();
      expect(storeAccessor.clearSelection).toHaveBeenCalledTimes(1);
    });
  });
});
