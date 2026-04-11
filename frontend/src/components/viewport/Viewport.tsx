/**
 * Viewport — R3F Canvas host with click-to-select handler
 *
 * Hosts the Three.js/R3F scene with OrbitControls, Baseplate, GridOverlay,
 * and BrickInstances. Implements the click-to-select handler with
 * drag-vs-click disambiguation (DRAG_THRESHOLD_PX = 4) per LLD Section 10.1.
 *
 * The click handler computes NDC coordinates from the pointer event,
 * configures a Raycaster, and delegates to selectionManager.selectByRaycast().
 *
 * @see docs/features/FR-EDIT-001/LOW_LEVEL_DESIGN.md Section 2.2, 10.1
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-EDIT-001
 * Spectra-Tests: T-E2E-EDIT-001-01
 */

import React, { useRef, useCallback, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Baseplate } from './Baseplate';
import { GridOverlay } from './GridOverlay';
import { BrickInstances } from './BrickInstances';
import type { InstanceIndexMap } from './BrickInstances';
import {
  createSelectionManager,
  type SelectionManagerInterface,
} from '../../engine/selectionManager';
import {
  createSelectionStoreAccessor,
  useSelectionStore,
} from '../../stores/selectionStore';
import { useSceneStore } from '../../stores/sceneStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Drag-vs-click disambiguation threshold in pixels (LLD Section 10.1).
 * A pointer movement > DRAG_THRESHOLD_PX between pointerdown and pointerup
 * is classified as an orbit drag and does NOT trigger selection.
 */
const DRAG_THRESHOLD_PX = 4;

// ---------------------------------------------------------------------------
// Scene content (inside R3F Canvas context)
// ---------------------------------------------------------------------------

interface SceneContentProps {
  selectionManager: SelectionManagerInterface;
}

function SceneContent({ selectionManager }: SceneContentProps) {
  const { camera, raycaster, scene } = useThree();
  const bricks = useSceneStore((state) => state.bricks);
  const brickInstancesRef = useRef<THREE.InstancedMesh>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  /**
   * Handle pointer down — record position for drag disambiguation.
   */
  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      // Only handle primary button (left click)
      if (event.button !== 0) return;
      pointerDownPos.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  /**
   * Handle pointer up — check drag distance and perform selection.
   * Uses DRAG_THRESHOLD_PX to disambiguate orbit drag from click.
   */
  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      if (!pointerDownPos.current) return;

      // Calculate drag distance
      const dx = event.clientX - pointerDownPos.current.x;
      const dy = event.clientY - pointerDownPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Reset pointer position
      pointerDownPos.current = null;

      // If drag distance exceeds threshold, this was an orbit gesture
      if (distance > DRAG_THRESHOLD_PX) return;

      // Compute NDC coordinates (LLD Section 6.1 step 1)
      const canvas = (event.target as HTMLElement).closest('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Configure raycaster (LLD Section 6.1 step 2)
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      // Find the InstancedMesh in the scene
      let instancedMesh: THREE.InstancedMesh | null = null;
      let instanceIndexMap: InstanceIndexMap = new Map();

      scene.traverse((child) => {
        if (
          (child as THREE.InstancedMesh).isInstancedMesh &&
          !instancedMesh
        ) {
          instancedMesh = child as THREE.InstancedMesh;
          instanceIndexMap =
            (instancedMesh.userData.instanceIndexMap as InstanceIndexMap) ??
            new Map();
        }
      });

      // Delegate to selectionManager (LLD Section 6.1 steps 3-7)
      selectionManager.selectByRaycast(
        raycaster,
        instancedMesh,
        instanceIndexMap,
      );
    },
    [camera, raycaster, scene, selectionManager],
  );

  return (
    <group
      onPointerDown={handlePointerDown as unknown as (event: THREE.Event) => void}
      onPointerUp={handlePointerUp as unknown as (event: THREE.Event) => void}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <Baseplate />
      <GridOverlay />
      <BrickInstances bricks={bricks} />
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2.1}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Viewport component
// ---------------------------------------------------------------------------

export const Viewport: React.FC = () => {
  // Create selectionManager with store accessor (DI pattern)
  const selectionManager = useMemo(() => {
    const storeAccessor = createSelectionStoreAccessor();
    return createSelectionManager(storeAccessor);
  }, []);

  return (
    <div
      data-testid="viewport"
      style={{ width: '100%', height: '100%' }}
    >
      <Canvas
        camera={{ position: [10, 15, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <SceneContent selectionManager={selectionManager} />
      </Canvas>
    </div>
  );
};

export { DRAG_THRESHOLD_PX };
