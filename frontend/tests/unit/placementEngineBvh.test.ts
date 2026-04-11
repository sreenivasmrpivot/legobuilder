/**
 * Unit tests for placementEngine BVH integration — FR-SCENE-003
 *
 * Test IDs:
 *   T-BE-SCENE-003-06  placementEngine uses BVH for hover hit detection
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-SCENE-003
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Mock three-mesh-bvh (same contract as bvhManager tests)
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
// Mock bvhManager so placementEngine can import it
// ---------------------------------------------------------------------------

const mockBuildBvh = vi.fn();
const mockRaycastWithBvh = vi.fn();
const mockIsBvhBuilt = vi.fn();

vi.mock('../../src/engine/bvhManager', () => ({
  buildBvh: mockBuildBvh,
  disposeBvh: vi.fn(),
  raycastWithBvh: mockRaycastWithBvh,
  isBvhBuilt: mockIsBvhBuilt,
}));

import { getHoverHit } from '../../src/engine/placementEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeScene(brickCount: number): THREE.Scene {
  const scene = new THREE.Scene();
  for (let i = 0; i < brickCount; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial()
    );
    mesh.name = `brick-${i}`;
    mesh.userData.isBrick = true;
    mesh.position.set(i, 0, 0);
    scene.add(mesh);
  }
  return scene;
}

function makePointerEvent(x = 0, y = 0): { clientX: number; clientY: number } {
  return { clientX: x, clientY: y };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('placementEngine BVH integration — FR-SCENE-003', () => {
  beforeEach(() => {
    mockBvhRaycast.mockReset();
    mockBuildBvh.mockReset();
    mockRaycastWithBvh.mockReset();
    mockIsBvhBuilt.mockReset();
  });

  // -------------------------------------------------------------------------
  // T-BE-SCENE-003-06: placementEngine uses BVH for hover hit detection
  // -------------------------------------------------------------------------
  describe('getHoverHit — T-BE-SCENE-003-06', () => {
    it('calls raycastWithBvh for each brick mesh when BVH is built', () => {
      const scene = makeScene(3);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(0, 10, 0);
      camera.lookAt(0, 0, 0);

      // All bricks have BVH built
      mockIsBvhBuilt.mockReturnValue(true);
      // First brick returns a hit
      const hit = {
        distance: 5,
        point: new THREE.Vector3(0, 0, 0),
        face: null,
        object: scene.children[0],
      };
      mockRaycastWithBvh
        .mockReturnValueOnce(hit)
        .mockReturnValue(null);

      const result = getHoverHit(scene, camera, makePointerEvent(0, 0), {
        width: 800,
        height: 600,
      });

      // BVH raycast must have been called for brick meshes
      expect(mockRaycastWithBvh).toHaveBeenCalled();
      // Closest hit returned
      expect(result).toBe(hit);
    });

    it('returns null when no brick is hit', () => {
      const scene = makeScene(5);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      mockIsBvhBuilt.mockReturnValue(true);
      mockRaycastWithBvh.mockReturnValue(null);

      const result = getHoverHit(scene, camera, makePointerEvent(999, 999), {
        width: 800,
        height: 600,
      });

      expect(result).toBeNull();
    });

    it('returns closest hit when multiple bricks intersect the ray', () => {
      const scene = makeScene(3);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      mockIsBvhBuilt.mockReturnValue(true);

      const farHit = { distance: 10, point: new THREE.Vector3(0, 0, 0), face: null, object: scene.children[0] };
      const nearHit = { distance: 3, point: new THREE.Vector3(0, 0, 0), face: null, object: scene.children[1] };
      const noHit = null;

      mockRaycastWithBvh
        .mockReturnValueOnce(farHit)
        .mockReturnValueOnce(nearHit)
        .mockReturnValueOnce(noHit);

      const result = getHoverHit(scene, camera, makePointerEvent(0, 0), {
        width: 800,
        height: 600,
      });

      // Must return the nearest hit
      expect(result).toBe(nearHit);
    });

    it('falls back gracefully when BVH is not built for a mesh', () => {
      const scene = makeScene(2);
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      // BVH not built for any mesh
      mockIsBvhBuilt.mockReturnValue(false);
      mockRaycastWithBvh.mockReturnValue(null);

      expect(() =>
        getHoverHit(scene, camera, makePointerEvent(0, 0), { width: 800, height: 600 })
      ).not.toThrow();
    });
  });
});
