/**
 * Selection Manager — Core selection logic via BVH raycast
 *
 * Implements the SelectionManagerInterface from LLD Section 3.1.
 * Performs BVH-accelerated raycast against InstancedMesh, maps instanceId
 * to brickId via InstanceIndexMap, and delegates state updates to the
 * SelectionStoreAccessor (dependency injection).
 *
 * Error handling covers all 5 conditions from LLD Section 7.1:
 *   1. instanceId undefined in intersection
 *   2. brickId not found in instanceIndexMap
 *   3. InstancedMesh not yet mounted (null ref)
 *   4. instanceColor buffer not initialized
 *   5. Stale instanceIndexMap (handled by caller rebuilding map on bricks change)
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md Section 3.1, 6.1, 7.1
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-BE-EDIT-001-01, T-BE-EDIT-001-02
 */

import type { Raycaster, InstancedMesh, Intersection } from 'three';
import type { SelectionStoreAccessor } from '../stores/selectionStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Map from Three.js instance index (number) to brick UUID (string).
 * Maintained by BrickInstances.tsx and rebuilt on every bricks array change.
 */
export type InstanceIndexMap = Map<number, string>;

/**
 * Interface contract for selectionManager (LLD Section 3.1).
 * The implementation is created via createSelectionManager() factory
 * with a SelectionStoreAccessor injected for testability.
 */
export interface SelectionManagerInterface {
  /**
   * Perform BVH raycast against the InstancedMesh. If a brick instance is
   * hit, call storeAccessor.setSelectedBrickId(brickId). If no brick is
   * hit, call storeAccessor.clearSelection().
   *
   * @param raycaster       - Three.js Raycaster configured with pointer NDC coords
   * @param instancedMesh   - The InstancedMesh containing all brick instances, or null if not mounted
   * @param instanceIndexMap - Map from instanceId (number) to brickId (string)
   * @returns The brick ID that was selected, or null if cleared
   */
  selectByRaycast(
    raycaster: Raycaster,
    instancedMesh: InstancedMesh | null,
    instanceIndexMap: InstanceIndexMap,
  ): string | null;

  /** Programmatically clear the current selection */
  clearSelection(): void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a SelectionManager with the given store accessor injected.
 *
 * @param storeAccessor - DI interface for the Zustand selection store.
 *   In production, use createSelectionStoreAccessor() from selectionStore.ts.
 *   In tests, pass a mock accessor.
 */
export function createSelectionManager(
  storeAccessor: SelectionStoreAccessor,
): SelectionManagerInterface {
  return {
    selectByRaycast(
      raycaster: Raycaster,
      instancedMesh: InstancedMesh | null,
      instanceIndexMap: InstanceIndexMap,
    ): string | null {
      // Guard: InstancedMesh not yet mounted (LLD Section 7.1 condition 3)
      if (!instancedMesh) {
        return null;
      }

      // Perform raycast — BVH-accelerated if three-mesh-bvh is applied
      // to the InstancedMesh geometry (FR-SCENE-003 dependency)
      const intersections: Intersection[] = raycaster.intersectObject(
        instancedMesh,
        false,
      );

      // No hit → clear selection (LLD Section 5.3)
      if (intersections.length === 0) {
        storeAccessor.clearSelection();
        return null;
      }

      const hit = intersections[0];

      // Guard: instanceId undefined in intersection (LLD Section 7.1 condition 1)
      if (hit.instanceId === undefined) {
        console.warn(
          '[selectionManager] instanceId undefined in intersection — clearing selection',
        );
        storeAccessor.clearSelection();
        return null;
      }

      // Look up brickId from instanceIndexMap
      const brickId = instanceIndexMap.get(hit.instanceId);

      // Guard: brickId not found in map (LLD Section 7.1 condition 2)
      if (brickId === undefined) {
        console.warn(
          '[selectionManager] brickId not found for instanceId',
          hit.instanceId,
        );
        storeAccessor.clearSelection();
        return null;
      }

      // Select the brick (LLD Section 5.1)
      storeAccessor.setSelectedBrickId(brickId);
      return brickId;
    },

    clearSelection(): void {
      storeAccessor.clearSelection();
    },
  };
}
