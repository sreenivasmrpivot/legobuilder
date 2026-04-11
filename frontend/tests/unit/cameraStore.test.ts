/**
 * Unit tests for cameraStore (Zustand)
 *
 * FR: FR-SCENE-001
 * Test IDs:
 *   T-UNIT-SCENE-001-04  initial state shape
 *   T-UNIT-SCENE-001-05  resetCamera restores defaults
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: FR-SCENE-001
 * Spectra-Tests: T-UNIT-SCENE-001-04, T-UNIT-SCENE-001-05
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCameraStore } from '../../src/stores/cameraStore';

// Default camera values per LLD §4.2
const DEFAULT_POSITION: [number, number, number] = [10, 10, 10];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];
const DEFAULT_FOV = 50;

beforeEach(() => {
  // Reset to known defaults before each test
  useCameraStore.getState().resetCamera?.();
});

describe('cameraStore — T-UNIT-SCENE-001-04: initial state', () => {
  it('should expose a position array of length 3', () => {
    const { position } = useCameraStore.getState();
    expect(Array.isArray(position)).toBe(true);
    expect(position).toHaveLength(3);
  });

  it('should expose a target array of length 3', () => {
    const { target } = useCameraStore.getState();
    expect(Array.isArray(target)).toBe(true);
    expect(target).toHaveLength(3);
  });

  it('should have a positive fov', () => {
    const { fov } = useCameraStore.getState();
    expect(typeof fov).toBe('number');
    expect(fov).toBeGreaterThan(0);
    expect(fov).toBeLessThanOrEqual(180);
  });

  it('should default position to [10, 10, 10]', () => {
    const { position } = useCameraStore.getState();
    expect(position).toEqual(DEFAULT_POSITION);
  });

  it('should default target to [0, 0, 0]', () => {
    const { target } = useCameraStore.getState();
    expect(target).toEqual(DEFAULT_TARGET);
  });

  it('should default fov to 50', () => {
    const { fov } = useCameraStore.getState();
    expect(fov).toBe(DEFAULT_FOV);
  });
});

describe('cameraStore — T-UNIT-SCENE-001-05: resetCamera', () => {
  it('should restore position to default after mutation', () => {
    useCameraStore.setState({ position: [99, 99, 99] });
    useCameraStore.getState().resetCamera();
    expect(useCameraStore.getState().position).toEqual(DEFAULT_POSITION);
  });

  it('should restore target to default after mutation', () => {
    useCameraStore.setState({ target: [5, 5, 5] });
    useCameraStore.getState().resetCamera();
    expect(useCameraStore.getState().target).toEqual(DEFAULT_TARGET);
  });

  it('should restore fov to default after mutation', () => {
    useCameraStore.setState({ fov: 90 });
    useCameraStore.getState().resetCamera();
    expect(useCameraStore.getState().fov).toBe(DEFAULT_FOV);
  });

  it('should be callable multiple times without error', () => {
    expect(() => {
      useCameraStore.getState().resetCamera();
      useCameraStore.getState().resetCamera();
    }).not.toThrow();
  });
});
