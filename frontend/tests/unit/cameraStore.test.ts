/**
 * T-FE-CAM-001-02 — cameraStore unit tests
 *
 * Feature:  FR-CAM-001 — Orbit, Pan, and Zoom Camera Controls
 * Issue:    #17
 * Test IDs: T-FE-CAM-001-02
 * Runner:   Vitest
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs:   FR-CAM-001
 * Spectra-Tests: T-FE-CAM-001-02
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCameraStore, DEFAULT_CAMERA_STATE } from '../../src/stores/cameraStore';

// ---------------------------------------------------------------------------
// T-FE-CAM-001-02 test suite
// ---------------------------------------------------------------------------

describe('T-FE-CAM-001-02 — cameraStore', () => {
  // Reset store to defaults before each test to ensure isolation
  beforeEach(() => {
    useCameraStore.setState(DEFAULT_CAMERA_STATE);
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('has the correct default position [20, 20, 20]', () => {
      expect(useCameraStore.getState().position).toEqual([20, 20, 20]);
    });

    it('has the correct default target [0, 0, 0]', () => {
      expect(useCameraStore.getState().target).toEqual([0, 0, 0]);
    });

    it('has the correct default zoom of 1', () => {
      expect(useCameraStore.getState().zoom).toBe(1);
    });

    it('exposes setCameraState action', () => {
      expect(typeof useCameraStore.getState().setCameraState).toBe('function');
    });

    it('exposes resetCamera action', () => {
      expect(typeof useCameraStore.getState().resetCamera).toBe('function');
    });
  });

  // -------------------------------------------------------------------------
  // setCameraState
  // -------------------------------------------------------------------------

  describe('setCameraState', () => {
    it('updates position when provided', () => {
      useCameraStore.getState().setCameraState({ position: [10, 10, 10] });
      expect(useCameraStore.getState().position).toEqual([10, 10, 10]);
    });

    it('updates target when provided', () => {
      useCameraStore.getState().setCameraState({ target: [5, 0, 5] });
      expect(useCameraStore.getState().target).toEqual([5, 0, 5]);
    });

    it('updates zoom when provided', () => {
      useCameraStore.getState().setCameraState({ zoom: 2.5 });
      expect(useCameraStore.getState().zoom).toBe(2.5);
    });

    it('performs a partial update — unspecified fields remain unchanged', () => {
      useCameraStore.getState().setCameraState({ position: [1, 2, 3] });
      // target and zoom should remain at defaults
      expect(useCameraStore.getState().target).toEqual(DEFAULT_CAMERA_STATE.target);
      expect(useCameraStore.getState().zoom).toBe(DEFAULT_CAMERA_STATE.zoom);
    });

    it('updates all fields simultaneously', () => {
      useCameraStore.getState().setCameraState({
        position: [15, 25, 35],
        target:   [1, 2, 3],
        zoom:     1.8,
      });
      const state = useCameraStore.getState();
      expect(state.position).toEqual([15, 25, 35]);
      expect(state.target).toEqual([1, 2, 3]);
      expect(state.zoom).toBe(1.8);
    });

    it('handles multiple sequential updates correctly', () => {
      useCameraStore.getState().setCameraState({ position: [1, 1, 1] });
      useCameraStore.getState().setCameraState({ position: [2, 2, 2] });
      useCameraStore.getState().setCameraState({ position: [3, 3, 3] });
      expect(useCameraStore.getState().position).toEqual([3, 3, 3]);
    });

    it('accepts negative coordinate values', () => {
      useCameraStore.getState().setCameraState({ position: [-10, -5, -20] });
      expect(useCameraStore.getState().position).toEqual([-10, -5, -20]);
    });

    it('accepts fractional coordinate values', () => {
      useCameraStore.getState().setCameraState({ position: [1.5, 2.7, 3.14] });
      expect(useCameraStore.getState().position).toEqual([1.5, 2.7, 3.14]);
    });
  });

  // -------------------------------------------------------------------------
  // resetCamera
  // -------------------------------------------------------------------------

  describe('resetCamera', () => {
    it('restores position to default after update', () => {
      useCameraStore.getState().setCameraState({ position: [99, 99, 99] });
      useCameraStore.getState().resetCamera();
      expect(useCameraStore.getState().position).toEqual(DEFAULT_CAMERA_STATE.position);
    });

    it('restores target to default after update', () => {
      useCameraStore.getState().setCameraState({ target: [10, 10, 10] });
      useCameraStore.getState().resetCamera();
      expect(useCameraStore.getState().target).toEqual(DEFAULT_CAMERA_STATE.target);
    });

    it('restores zoom to default after update', () => {
      useCameraStore.getState().setCameraState({ zoom: 5 });
      useCameraStore.getState().resetCamera();
      expect(useCameraStore.getState().zoom).toBe(DEFAULT_CAMERA_STATE.zoom);
    });

    it('restores all fields to defaults simultaneously', () => {
      useCameraStore.getState().setCameraState({
        position: [50, 60, 70],
        target:   [3, 4, 5],
        zoom:     3,
      });
      useCameraStore.getState().resetCamera();
      const state = useCameraStore.getState();
      expect(state.position).toEqual(DEFAULT_CAMERA_STATE.position);
      expect(state.target).toEqual(DEFAULT_CAMERA_STATE.target);
      expect(state.zoom).toBe(DEFAULT_CAMERA_STATE.zoom);
    });

    it('is idempotent — calling reset twice leaves state at defaults', () => {
      useCameraStore.getState().setCameraState({ position: [1, 2, 3] });
      useCameraStore.getState().resetCamera();
      useCameraStore.getState().resetCamera();
      expect(useCameraStore.getState().position).toEqual(DEFAULT_CAMERA_STATE.position);
    });
  });

  // -------------------------------------------------------------------------
  // Selector isolation
  // -------------------------------------------------------------------------

  describe('selector isolation', () => {
    it('position selector returns only position', () => {
      useCameraStore.getState().setCameraState({ position: [7, 8, 9] });
      const position = useCameraStore.getState().position;
      expect(position).toEqual([7, 8, 9]);
    });

    it('target selector returns only target', () => {
      useCameraStore.getState().setCameraState({ target: [2, 4, 6] });
      const target = useCameraStore.getState().target;
      expect(target).toEqual([2, 4, 6]);
    });

    it('zoom selector returns only zoom', () => {
      useCameraStore.getState().setCameraState({ zoom: 0.5 });
      const zoom = useCameraStore.getState().zoom;
      expect(zoom).toBe(0.5);
    });
  });

  // -------------------------------------------------------------------------
  // DEFAULT_CAMERA_STATE export
  // -------------------------------------------------------------------------

  describe('DEFAULT_CAMERA_STATE export', () => {
    it('exports DEFAULT_CAMERA_STATE with correct position', () => {
      expect(DEFAULT_CAMERA_STATE.position).toEqual([20, 20, 20]);
    });

    it('exports DEFAULT_CAMERA_STATE with correct target', () => {
      expect(DEFAULT_CAMERA_STATE.target).toEqual([0, 0, 0]);
    });

    it('exports DEFAULT_CAMERA_STATE with correct zoom', () => {
      expect(DEFAULT_CAMERA_STATE.zoom).toBe(1);
    });

    it('DEFAULT_CAMERA_STATE is immutable (not mutated by store actions)', () => {
      const originalPosition = [...DEFAULT_CAMERA_STATE.position];
      useCameraStore.getState().setCameraState({ position: [99, 99, 99] });
      // DEFAULT_CAMERA_STATE should not be mutated
      expect(DEFAULT_CAMERA_STATE.position).toEqual(originalPosition);
    });
  });
});
