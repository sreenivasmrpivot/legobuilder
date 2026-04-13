/**
 * BrickInstances — InstancedMesh renderer with imperative highlight
 *
 * Renders all placed bricks as a single Three.js InstancedMesh for
 * performance. Subscribes to selectionStore.selectedBrickId via Zustand's
 * selector-based subscribe() to apply emissive highlight imperatively
 * (zero React re-renders on selection change).
 *
 * Highlight strategy: multiply the brick's base color by HIGHLIGHT_FACTOR
 * (1.8) to produce a brightened variant. This avoids a fixed highlight
 * color that may clash with certain brick colors.
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md Section 6.2, 10.2
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-E2E-EDIT-001-01
 */

import { useRef, useEffect, useMemo, useCallback, memo } from 'react';
import type { FC } from 'react';
import * as THREE from 'three';
import type { InstancedMesh as InstancedMeshType } from 'three';
import { useSelectionStore } from '../../stores/selectionStore';
import type { PlacedBrick } from '../../types/brick';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Brightness multiplier for the selected brick highlight (LLD Section 6.2) */
const HIGHLIGHT_FACTOR = 1.8;

/** Default brick geometry — 1×1 LEGO brick dimensions (in world units) */
const BRICK_WIDTH = 0.8;
const BRICK_HEIGHT = 0.96;
const BRICK_DEPTH = 0.8;

/** Maximum number of brick instances supported */
const MAX_INSTANCES = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrickInstancesProps {
  /** Array of all placed bricks from sceneStore */
  bricks: PlacedBrick[];
  /** Called when a brick is clicked in the viewport */
  onBrickClick?: (brickId: string, event: unknown) => void;
  /** ID of the currently selected brick */
  selectedBrickId?: string | null;
}

/**
 * Map from brick UUID (string) to instance index (number).
 * Used by the highlight algorithm to find the instance to brighten.
 */
type BrickIdToIndexMap = Map<string, number>;

/**
 * Map from instance index (number) to brick UUID (string).
 * Exposed to selectionManager for raycast hit → brickId lookup.
 */
export type InstanceIndexMap = Map<number, string>;

// ---------------------------------------------------------------------------
// Shared geometry and dummy object (created once, reused)
// ---------------------------------------------------------------------------

const sharedGeometry = new THREE.BoxGeometry(
  BRICK_WIDTH,
  BRICK_HEIGHT,
  BRICK_DEPTH,
);
const sharedMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.4,
  metalness: 0.1,
});
const dummy = new THREE.Object3D();
const tempColor = new THREE.Color();

// ---------------------------------------------------------------------------
// Highlight algorithm (LLD Section 6.2)
// ---------------------------------------------------------------------------

/**
 * Apply highlight to the selected brick instance and reset all others
 * to their base color. Operates directly on the InstancedMesh instanceColor
 * buffer — no React re-render required.
 */
function applyHighlight(
  mesh: InstancedMeshType | null,
  bricks: PlacedBrick[],
  brickIdToIndex: BrickIdToIndexMap,
  selectedBrickId: string | null,
): void {
  if (!mesh || bricks.length === 0) return;

  // Ensure instanceColor buffer is initialized (LLD Section 7.1 condition 4)
  if (!mesh.instanceColor) {
    // Initialize the color attribute buffer
    const colors = new Float32Array(mesh.count * 3);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
  }

  // Step 1: Reset all instance colors to their base color
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];
    if (!b) continue;
    tempColor.set(b.color);
    mesh.setColorAt(i, tempColor);
  }

  // Step 2: Apply highlight to the selected brick
  if (selectedBrickId !== null) {
    const selectedIndex = brickIdToIndex.get(selectedBrickId);
    if (selectedIndex !== undefined && selectedIndex < bricks.length) {
      const brick = bricks[selectedIndex];
      if (!brick) return;
      tempColor.set(brick.color).multiplyScalar(HIGHLIGHT_FACTOR);
      // THREE.Color clamps each channel to [0, 1] internally
      mesh.setColorAt(selectedIndex, tempColor);
    }
  }

  // Step 3: Flag the buffer for GPU upload
  if (mesh.instanceColor) {
    mesh.instanceColor.needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BrickInstances: FC<BrickInstancesProps> = memo(
  ({ bricks }) => {
    const meshRef = useRef<InstancedMeshType>(null);

    // Build brickId ↔ instanceIndex maps (rebuilt when bricks change)
    const { brickIdToIndex, instanceIndexMap } = useMemo(() => {
      const idToIdx: BrickIdToIndexMap = new Map();
      const idxToId: InstanceIndexMap = new Map();
      bricks.forEach((brick, index) => {
        idToIdx.set(brick.id, index);
        idxToId.set(index, brick.id);
      });
      return { brickIdToIndex: idToIdx, instanceIndexMap: idxToId };
    }, [bricks]);

    // Expose instanceIndexMap on the mesh userData for selectionManager access
    useEffect(() => {
      if (meshRef.current) {
        meshRef.current.userData.instanceIndexMap = instanceIndexMap;
      }
    }, [instanceIndexMap]);

    // Set instance transforms whenever bricks change
    useEffect(() => {
      const mesh = meshRef.current;
      if (!mesh) return;

      for (let i = 0; i < bricks.length; i++) {
        const brick = bricks[i];
        if (!brick) continue;
        dummy.position.set(brick.position[0], brick.position[1], brick.position[2]);
        dummy.rotation.set(0, (brick.rotation * Math.PI) / 2, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.count = bricks.length;

      // Apply initial colors
      const selectedBrickId = useSelectionStore.getState().selectedBrickId;
      applyHighlight(mesh, bricks, brickIdToIndex, selectedBrickId);
    }, [bricks, brickIdToIndex]);

    // Subscribe to selection changes for imperative highlight updates
    // (LLD Section 10.2 — zero React re-renders)
    useEffect(() => {
      const unsubscribe = useSelectionStore.subscribe(
        (state) => state.selectedBrickId,
        (selectedBrickId) => {
          applyHighlight(
            meshRef.current,
            bricks,
            brickIdToIndex,
            selectedBrickId,
          );
        },
      );
      return unsubscribe;
    }, [bricks, brickIdToIndex]);

    // Expose the mesh ref and instanceIndexMap for parent access
    const getMeshRef = useCallback(() => meshRef, []);
    const getInstanceIndexMap = useCallback(
      () => instanceIndexMap,
      [instanceIndexMap],
    );

    // Attach accessors to the component instance via userData
    useEffect(() => {
      if (meshRef.current) {
        meshRef.current.userData.getMeshRef = getMeshRef;
        meshRef.current.userData.getInstanceIndexMap = getInstanceIndexMap;
      }
    }, [getMeshRef, getInstanceIndexMap]);

    if (bricks.length === 0) return null;

    return (
      <instancedMesh
        ref={meshRef}
        args={[sharedGeometry, sharedMaterial, MAX_INSTANCES]}
        frustumCulled={false}
        data-testid="brick-instances"
      />
    );
  },
);

BrickInstances.displayName = 'BrickInstances';

export { HIGHLIGHT_FACTOR, MAX_INSTANCES };
