/**
 * Unit tests for BVH rebuild lifecycle — FR-SCENE-003
 *
 * Verifies that BVH is rebuilt when bricks are added or removed,
 * as required by the LLD (Section: BVH Lifecycle Management).
 *
 * Test IDs:
 *   T-BE-SCENE-003-02  BVH rebuild triggered on brick add/remove
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-SCENE-003
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Mock three-mesh-bvh
// ---------------------------------------------------------------------------

const buildCallCount = { value: 0 };

vi.mock('three-mesh-bvh', () => {
  class MeshBVH {
    constructor(_geometry: THREE.BufferGeometry) {
      buildCallCount.value++;
    }
    raycastFirst() { return null; }
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

import { buildBvh, disposeBvh, isBvhBuilt } from '../../src/engine/bvhManager';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BVH rebuild lifecycle — FR-SCENE-003 T-BE-SCENE-003-02', () => {
  beforeEach(() => {
    buildCallCount.value = 0;
  });

  it('BVH is built once on initial brick add', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    buildBvh(mesh);
    expect(buildCallCount.value).toBe(1);
    expect(isBvhBuilt(mesh)).toBe(true);
  });

  it('BVH is rebuilt (dispose + build) when a brick is added to existing scene', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    buildBvh(mesh); // initial build
    expect(buildCallCount.value).toBe(1);

    // Simulate brick added — caller must rebuild
    buildBvh(mesh);
    expect(buildCallCount.value).toBe(2);
    expect(isBvhBuilt(mesh)).toBe(true);
  });

  it('BVH is rebuilt when a brick is removed from the scene', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    buildBvh(mesh);
    expect(buildCallCount.value).toBe(1);

    // Simulate brick removed — dispose old BVH, rebuild
    disposeBvh(mesh);
    expect(isBvhBuilt(mesh)).toBe(false);

    buildBvh(mesh);
    expect(buildCallCount.value).toBe(2);
    expect(isBvhBuilt(mesh)).toBe(true);
  });

  it('isBvhBuilt returns false after dispose', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    buildBvh(mesh);
    disposeBvh(mesh);
    expect(isBvhBuilt(mesh)).toBe(false);
  });

  it('multiple meshes each maintain independent BVH state', () => {
    const meshA = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    const meshB = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial());

    buildBvh(meshA);
    buildBvh(meshB);
    expect(buildCallCount.value).toBe(2);

    disposeBvh(meshA);
    expect(isBvhBuilt(meshA)).toBe(false);
    expect(isBvhBuilt(meshB)).toBe(true);
  });
});
