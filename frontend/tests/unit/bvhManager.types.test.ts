/**
 * Type-contract tests for bvhManager public API — FR-SCENE-003
 *
 * These tests verify the TypeScript interface contract of bvhManager
 * without exercising runtime BVH logic. They serve as living documentation
 * of the module's public surface.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-SCENE-003
 */

import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';

vi.mock('three-mesh-bvh', () => ({
  MeshBVH: class {},
  computeBoundsTree: vi.fn(),
  disposeBoundsTree: vi.fn(),
  acceleratedRaycast: vi.fn(),
}));

import * as bvhManager from '../../src/engine/bvhManager';

describe('bvhManager public API contract — FR-SCENE-003', () => {
  it('exports buildBvh as a function', () => {
    expect(typeof bvhManager.buildBvh).toBe('function');
  });

  it('exports disposeBvh as a function', () => {
    expect(typeof bvhManager.disposeBvh).toBe('function');
  });

  it('exports raycastWithBvh as a function', () => {
    expect(typeof bvhManager.raycastWithBvh).toBe('function');
  });

  it('exports isBvhBuilt as a function', () => {
    expect(typeof bvhManager.isBvhBuilt).toBe('function');
  });

  it('isBvhBuilt accepts a THREE.Mesh and returns boolean', () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial()
    );
    const result = bvhManager.isBvhBuilt(mesh);
    expect(typeof result).toBe('boolean');
  });

  it('raycastWithBvh accepts (mesh, raycaster) and returns hit or null', () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial()
    );
    const rc = new THREE.Raycaster();
    // No BVH built — should return null without throwing
    const result = bvhManager.raycastWithBvh(mesh, rc);
    expect(result === null || typeof result === 'object').toBe(true);
  });
});
