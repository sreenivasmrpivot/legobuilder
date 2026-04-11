/**
 * Unit tests for selectionManager BVH integration — FR-SCENE-003
 *
 * Test IDs:
 *   T-BE-SCENE-003-07  selectionManager uses BVH for click selection
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-SCENE-003
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Mock three-mesh-bvh
// ---------------------------------------------------------------------------

const mockBvhRaycast = vi.fn();

vi.mock('three-mesh-bvh', () => {
  class MeshBVH {
    geometry: THREE.BufferGeometry;
    constructor(geometry: THREE.BufferGeometry) {
      this.geometry = geometry;
    }
    raycastFirst(raycaster: THREE.Raycaster) {
      return mockBvhRaycast(raycaster);
    }
  }
  function computeBoundsTree(this: THREE.BufferGeometry) {
    (this as any).boundsTree = new MeshBVH(this);
  }
  function disposeBoundsTree(this: THREE.BufferGeometry) {
    delete (this as any).boundsTree;
  }
  return {
    MeshBVH,
    computeBoundsTree,
    disposeBoundsTree,
    acceleratedRaycast: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Mock bvhManager
// ---------------------------------------------------------------------------

const mockRaycastWithBvh = vi.fn();
const mockIsBvhBuilt = vi.fn();

vi.mock('../../src/engine/bvhManager', () => ({
  buildBvh: vi.fn(),
  disposeBvh: vi.fn(),
  raycastWithBvh: mockRaycastWithBvh,
  isBvhBuilt: mockIsBvhBuilt,
}));

import { selectBrickAtPointer, getSelectedBrickId } from '../../src/engine/selectionManager';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBrickMesh(id: string, position = new THREE.Vector3()): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial()
  );
  mesh.name = id;
  mesh.userData.brickId = id;
  mesh.userData.isBrick = true;
  mesh.position.copy(position);
  return mesh;
}

function makeScene(...meshes: THREE.Mesh[]): THREE.Scene {
  const scene = new THREE.Scene();
  meshes.forEach(m => scene.add(m));
  return scene;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('selectionManager BVH integration — FR-SCENE-003', () => {
  beforeEach(() => {
    mockBvhRaycast.mockReset();
    mockRaycastWithBvh.mockReset();
    mockIsBvhBuilt.mockReset();
  });

  // -------------------------------------------------------------------------
  // T-BE-SCENE-003-07: selectionManager uses BVH for click selection
  // -------------------------------------------------------------------------
  describe('selectBrickAtPointer — T-BE-SCENE-003-07', () => {
    it('selects the brick whose BVH raycast returns the nearest hit', () => {
      const brickA = makeBrickMesh('brick-A', new THREE.Vector3(0, 0, 0));
      const brickB = makeBrickMesh('brick-B', new THREE.Vector3(2, 0, 0));
      const scene = makeScene(brickA, brickB);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(0, 10, 0);

      mockIsBvhBuilt.mockReturnValue(true);
      // brickA is hit at distance 3, brickB at distance 8
      mockRaycastWithBvh
        .mockReturnValueOnce({ distance: 3, point: new THREE.Vector3(), face: null, object: brickA })
        .mockReturnValueOnce({ distance: 8, point: new THREE.Vector3(), face: null, object: brickB });

      selectBrickAtPointer(scene, camera, { clientX: 400, clientY: 300 }, { width: 800, height: 600 });

      expect(getSelectedBrickId()).toBe('brick-A');
    });

    it('deselects (returns null) when click hits empty space', () => {
      const brickA = makeBrickMesh('brick-A');
      const scene = makeScene(brickA);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      mockIsBvhBuilt.mockReturnValue(true);
      mockRaycastWithBvh.mockReturnValue(null);

      selectBrickAtPointer(scene, camera, { clientX: 0, clientY: 0 }, { width: 800, height: 600 });

      expect(getSelectedBrickId()).toBeNull();
    });

    it('uses BVH raycast (not naive intersectObjects) when BVH is built', () => {
      const brickA = makeBrickMesh('brick-A');
      const scene = makeScene(brickA);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      mockIsBvhBuilt.mockReturnValue(true);
      mockRaycastWithBvh.mockReturnValue(null);

      // Spy on THREE.Raycaster.intersectObjects to ensure it is NOT called
      const intersectSpy = vi.spyOn(THREE.Raycaster.prototype, 'intersectObjects');

      selectBrickAtPointer(scene, camera, { clientX: 400, clientY: 300 }, { width: 800, height: 600 });

      // BVH path must be used — naive intersectObjects must NOT be called
      expect(intersectSpy).not.toHaveBeenCalled();
      expect(mockRaycastWithBvh).toHaveBeenCalled();

      intersectSpy.mockRestore();
    });

    it('does not throw when scene has no brick meshes', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      mockIsBvhBuilt.mockReturnValue(false);

      expect(() =>
        selectBrickAtPointer(scene, camera, { clientX: 400, clientY: 300 }, { width: 800, height: 600 })
      ).not.toThrow();

      expect(getSelectedBrickId()).toBeNull();
    });
  });
});
