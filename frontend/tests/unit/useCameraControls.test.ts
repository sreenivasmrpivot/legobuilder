/**
 * T-FE-CAM-001-01 — useCameraControls hook unit tests
 *
 * Feature:  FR-CAM-001 — Orbit, Pan, and Zoom Camera Controls
 * Issue:    #17
 * Test IDs: T-FE-CAM-001-01
 * Runner:   Vitest
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs:   FR-CAM-001
 * Spectra-Tests: T-FE-CAM-001-01
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module mock — @react-three/drei OrbitControls is a WebGL component;
// we only need the hook logic, not the actual Three.js renderer.
// ---------------------------------------------------------------------------
vi.mock('@react-three/drei', () => ({
  OrbitControls: vi.fn(() => null),
}));

// Mock zustand cameraStore so the hook can call setCameraState without a store
const mockSetCameraState = vi.fn();
vi.mock('../../src/stores/cameraStore', () => ({
  useCameraStore: (selector: (s: { setCameraState: typeof mockSetCameraState }) => unknown) =>
    selector({ setCameraState: mockSetCameraState }),
}));

// Import AFTER mocks are registered
import { useCameraControls } from '../../src/hooks/useCameraControls';
import { DEFAULT_CAMERA_CONFIG } from '../../src/types/camera';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Advance performance.now by `ms` milliseconds. */
function advancePerformanceNow(ms: number) {
  const original = performance.now;
  let base = original();
  vi.spyOn(performance, 'now').mockImplementation(() => (base += ms));
}

// ---------------------------------------------------------------------------
// T-FE-CAM-001-01 test suite
// ---------------------------------------------------------------------------

describe('T-FE-CAM-001-01 — useCameraControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.matchMedia to non-reduced-motion by default
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Default configuration
  // -------------------------------------------------------------------------

  describe('default configuration', () => {
    it('returns the correct mouseButtons mapping', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.mouseButtons.RIGHT).toBe(0);   // MOUSE.ROTATE
      expect(result.current.config.mouseButtons.MIDDLE).toBe(1);  // MOUSE.PAN
      expect(result.current.config.mouseButtons.LEFT).toBeNull(); // disabled
    });

    it('returns correct touch gesture mapping', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.touches.ONE).toBe(0);  // TOUCH.ROTATE (reserved)
      expect(result.current.config.touches.TWO).toBe(1);  // TOUCH.DOLLY_PAN
    });

    it('enables damping with correct factor', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.enableDamping).toBe(true);
      expect(result.current.config.dampingFactor).toBe(DEFAULT_CAMERA_CONFIG.dampingFactor);
    });

    it('enables zoom and pan', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.enableZoom).toBe(true);
      expect(result.current.config.enablePan).toBe(true);
    });

    it('enforces distance bounds', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.minDistance).toBe(5);
      expect(result.current.config.maxDistance).toBe(200);
    });

    it('prevents camera going below ground plane (maxPolarAngle = PI/2)', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.maxPolarAngle).toBeCloseTo(Math.PI / 2);
    });

    it('sets syncThrottleMs to 100ms', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.syncThrottleMs).toBe(100);
    });

    it('returns a controlsRef initialised to null', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.controlsRef.current).toBeNull();
    });

    it('returns a handleChange function', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(typeof result.current.handleChange).toBe('function');
    });
  });

  // -------------------------------------------------------------------------
  // Reduced-motion accessibility
  // -------------------------------------------------------------------------

  describe('prefers-reduced-motion', () => {
    it('sets dampingFactor to 0 when prefers-reduced-motion is active', () => {
      // Override matchMedia to return reduced-motion: reduce
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.dampingFactor).toBe(0);
    });

    it('uses default dampingFactor when prefers-reduced-motion is not active', () => {
      const { result } = renderHook(() => useCameraControls());
      expect(result.current.config.dampingFactor).toBe(DEFAULT_CAMERA_CONFIG.dampingFactor);
    });
  });

  // -------------------------------------------------------------------------
  // Config override
  // -------------------------------------------------------------------------

  describe('config override', () => {
    it('merges partial config overrides with defaults', () => {
      const { result } = renderHook(() =>
        useCameraControls({ zoomSpeed: 2.5, panSpeed: 0.5 })
      );
      expect(result.current.config.zoomSpeed).toBe(2.5);
      expect(result.current.config.panSpeed).toBe(0.5);
      // Unoverridden defaults remain
      expect(result.current.config.enableDamping).toBe(true);
    });

    it('allows overriding syncThrottleMs', () => {
      const { result } = renderHook(() =>
        useCameraControls({ syncThrottleMs: 200 })
      );
      expect(result.current.config.syncThrottleMs).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // Throttle behaviour
  // -------------------------------------------------------------------------

  describe('handleChange throttle', () => {
    it('does NOT call setCameraState when controlsRef is null', () => {
      const { result } = renderHook(() => useCameraControls());
      // controlsRef.current is null — handleChange should early-return
      act(() => {
        result.current.handleChange();
      });
      expect(mockSetCameraState).not.toHaveBeenCalled();
    });

    it('calls setCameraState when controlsRef is populated and throttle has elapsed', () => {
      const { result } = renderHook(() => useCameraControls());

      // Populate the ref with a mock controls object
      const mockControls = {
        object: { position: { x: 10, y: 20, z: 30 }, zoom: 1 },
        target: { x: 0, y: 0, z: 0 },
        update: vi.fn(),
        reset: vi.fn(),
      };
      // @ts-expect-error — assigning to read-only ref for test purposes
      result.current.controlsRef.current = mockControls;

      // Advance time beyond throttle window
      advancePerformanceNow(200);

      act(() => {
        result.current.handleChange();
      });

      expect(mockSetCameraState).toHaveBeenCalledOnce();
      expect(mockSetCameraState).toHaveBeenCalledWith({
        position: [10, 20, 30],
        target:   [0, 0, 0],
        zoom:     1,
      });
    });

    it('suppresses setCameraState calls within the throttle window', () => {
      const { result } = renderHook(() => useCameraControls());

      const mockControls = {
        object: { position: { x: 5, y: 5, z: 5 }, zoom: 1 },
        target: { x: 1, y: 1, z: 1 },
        update: vi.fn(),
        reset: vi.fn(),
      };
      // @ts-expect-error
      result.current.controlsRef.current = mockControls;

      // First call — time starts at 0, throttle not yet elapsed
      // (performance.now returns 0 initially, lastSyncRef starts at 0)
      // Advance just 50ms — within the 100ms throttle window
      vi.spyOn(performance, 'now').mockReturnValue(50);

      act(() => {
        result.current.handleChange();
        result.current.handleChange();
        result.current.handleChange();
      });

      // All calls within throttle window — setCameraState should not be called
      // (first call: now=50, lastSync=0, diff=50 < 100 → skip)
      expect(mockSetCameraState).not.toHaveBeenCalled();
    });

    it('allows a second sync after throttle window elapses', () => {
      const { result } = renderHook(() => useCameraControls());

      const mockControls = {
        object: { position: { x: 1, y: 2, z: 3 }, zoom: 1.5 },
        target: { x: 0, y: 0, z: 0 },
        update: vi.fn(),
        reset: vi.fn(),
      };
      // @ts-expect-error
      result.current.controlsRef.current = mockControls;

      let now = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => now);

      // First call at t=0 — lastSync=0, diff=0 < 100 → skip
      act(() => { result.current.handleChange(); });
      expect(mockSetCameraState).not.toHaveBeenCalled();

      // Advance to t=150 — diff=150 > 100 → sync fires
      now = 150;
      act(() => { result.current.handleChange(); });
      expect(mockSetCameraState).toHaveBeenCalledOnce();

      // Advance to t=200 — diff=50 < 100 → skip
      now = 200;
      act(() => { result.current.handleChange(); });
      expect(mockSetCameraState).toHaveBeenCalledOnce(); // still only 1

      // Advance to t=300 — diff=150 > 100 → second sync fires
      now = 300;
      act(() => { result.current.handleChange(); });
      expect(mockSetCameraState).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  // performance.now fallback
  // -------------------------------------------------------------------------

  describe('performance.now fallback', () => {
    it('falls back to Date.now when performance is undefined', () => {
      // Simulate environment where performance is not available
      const originalPerformance = globalThis.performance;
      // @ts-expect-error
      delete globalThis.performance;

      const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(9999);

      const { result } = renderHook(() => useCameraControls());
      const mockControls = {
        object: { position: { x: 0, y: 0, z: 0 }, zoom: 1 },
        target: { x: 0, y: 0, z: 0 },
        update: vi.fn(),
        reset: vi.fn(),
      };
      // @ts-expect-error
      result.current.controlsRef.current = mockControls;

      // Should not throw
      expect(() => {
        act(() => { result.current.handleChange(); });
      }).not.toThrow();

      // Restore
      globalThis.performance = originalPerformance;
      dateSpy.mockRestore();
    });
  });
});
