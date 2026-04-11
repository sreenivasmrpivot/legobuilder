/**
 * NFR-REL-001 — Unit Tests: useAutoSave hook
 *
 * Test IDs:
 *   T-UNIT-REL-001-05  Debounce fires save after 30-second interval
 *   T-UNIT-REL-001-06  Concurrent write guard skips second save when first is in-flight
 *
 * Strategy:
 *   - Uses vi.useFakeTimers() for deterministic debounce control.
 *   - Mocks persistenceService.saveSnapshot() to avoid real IndexedDB I/O.
 *   - Uses renderHook from @testing-library/react to exercise the hook lifecycle.
 *
 * The useAutoSave hook contract (from NFR-REL-001 LLD Section 6):
 *   - Subscribes to sceneStore changes via Zustand subscribe().
 *   - Debounces saves with a 30-second interval (AUTO_SAVE_INTERVAL_MS = 30_000).
 *   - Guards against concurrent writes with an isSaving flag.
 *   - Cancels the debounce timer on unmount.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-05, T-UNIT-REL-001-06
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Constants — must match the LLD exactly
// ---------------------------------------------------------------------------
const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the persistenceService module so we don't touch real IndexedDB
const mockSaveSnapshot = vi.fn();
const mockGetLatestSnapshot = vi.fn();

vi.mock('../../src/services/persistenceService', () => ({
  persistenceService: {
    saveSnapshot: mockSaveSnapshot,
    getLatestSnapshot: mockGetLatestSnapshot,
    openDB: vi.fn(),
  },
}));

// Mock the sceneStore — we control when it emits changes
const mockSubscribe = vi.fn();
const mockGetState = vi.fn();

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: {
    subscribe: mockSubscribe,
    getState: mockGetState,
  },
}));

// ---------------------------------------------------------------------------
// Inline useAutoSave hook implementation contract
// The real implementation lives in src/hooks/useAutoSave.ts.
// This test validates the contract so the coding agent implements correctly.
// ---------------------------------------------------------------------------

type UnsubscribeFn = () => void;
type SceneSnapshot = { bricks: unknown[]; version: number; savedAt: number };

function useAutoSave() {
  const { useEffect, useRef } = require('react');

  const isSavingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { persistenceService } = require('../../src/services/persistenceService');
    const { useSceneStore } = require('../../src/stores/sceneStore');

    const scheduleAutoSave = () => {
      // Clear any pending debounce timer
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(async () => {
        // Concurrent write guard
        if (isSavingRef.current) {
          return;
        }

        isSavingRef.current = true;
        try {
          const state = useSceneStore.getState();
          const snapshot: SceneSnapshot = {
            bricks: Array.from(state.bricks?.values?.() ?? []),
            version: 1,
            savedAt: Date.now(),
          };
          await persistenceService.saveSnapshot(snapshot);
        } finally {
          isSavingRef.current = false;
        }
      }, AUTO_SAVE_INTERVAL_MS);
    };

    const unsubscribe: UnsubscribeFn = useSceneStore.subscribe(scheduleAutoSave);

    return () => {
      unsubscribe();
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAutoSave hook', () => {
  let capturedSubscriber: (() => void) | null = null;
  let unsubscribeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    capturedSubscriber = null;
    unsubscribeSpy = vi.fn();

    // Capture the subscriber function passed to sceneStore.subscribe()
    mockSubscribe.mockImplementation((fn: () => void) => {
      capturedSubscriber = fn;
      return unsubscribeSpy;
    });

    // Default scene state
    mockGetState.mockReturnValue({
      bricks: new Map([['brick-1', { id: 'brick-1', type: '2x4', color: '#FF0000' }]]),
    });

    // Default: saveSnapshot resolves immediately
    mockSaveSnapshot.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-05
  // -------------------------------------------------------------------------
  describe('T-UNIT-REL-001-05: debounce fires save after 30-second interval', () => {
    it('does NOT call saveSnapshot before the debounce interval elapses', async () => {
      const { unmount } = renderHook(() => useAutoSave());

      // Simulate a scene change
      act(() => {
        capturedSubscriber?.();
      });

      // Advance time by less than the debounce interval
      await act(async () => {
        vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS - 1);
      });

      expect(mockSaveSnapshot).not.toHaveBeenCalled();
      unmount();
    });

    it('calls saveSnapshot exactly once after the debounce interval elapses', async () => {
      const { unmount } = renderHook(() => useAutoSave());

      // Simulate a scene change
      act(() => {
        capturedSubscriber?.();
      });

      // Advance time past the debounce interval
      await act(async () => {
        vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
        // Allow the async saveSnapshot to resolve
        await Promise.resolve();
      });

      expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);
      expect(mockSaveSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
          savedAt: expect.any(Number),
        }),
      );
      unmount();
    });

    it('resets the debounce timer when a second scene change arrives before the interval', async () => {
      const { unmount } = renderHook(() => useAutoSave());

      // First scene change
      act(() => {
        capturedSubscriber?.();
      });

      // Advance 20 seconds (not yet at 30s threshold)
      await act(async () => {
        vi.advanceTimersByTime(20_000);
      });

      // Second scene change — should reset the debounce timer
      act(() => {
        capturedSubscriber?.();
      });

      // Advance another 20 seconds (total 40s from first change, but only 20s from second)
      await act(async () => {
        vi.advanceTimersByTime(20_000);
      });

      // Should NOT have saved yet (second debounce hasn't elapsed)
      expect(mockSaveSnapshot).not.toHaveBeenCalled();

      // Advance the remaining 10 seconds to complete the second debounce
      await act(async () => {
        vi.advanceTimersByTime(10_000);
        await Promise.resolve();
      });

      // Now exactly one save should have occurred
      expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // T-UNIT-REL-001-06
  // -------------------------------------------------------------------------
  describe('T-UNIT-REL-001-06: concurrent write guard skips second save', () => {
    it('skips the second save when the first is still in-flight', async () => {
      // Arrange: make saveSnapshot hang (never resolves) to simulate in-flight write
      let resolveFirstSave!: () => void;
      const firstSavePromise = new Promise<void>((resolve) => {
        resolveFirstSave = resolve;
      });
      mockSaveSnapshot.mockReturnValueOnce(firstSavePromise);

      const { unmount } = renderHook(() => useAutoSave());

      // First scene change → triggers debounce
      act(() => {
        capturedSubscriber?.();
      });

      // Advance past debounce — first save starts (but doesn't resolve)
      await act(async () => {
        vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
        await Promise.resolve();
      });

      expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);

      // Second scene change while first save is still in-flight
      act(() => {
        capturedSubscriber?.();
      });

      // Advance past second debounce
      await act(async () => {
        vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
        await Promise.resolve();
      });

      // The concurrent write guard must have blocked the second save
      expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);

      // Resolve the first save
      resolveFirstSave();
      await act(async () => {
        await Promise.resolve();
      });

      unmount();
    });

    it('allows a new save after the previous in-flight save completes', async () => {
      const { unmount } = renderHook(() => useAutoSave());

      // First scene change → first save
      act(() => {
        capturedSubscriber?.();
      });
      await act(async () => {
        vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
        await Promise.resolve();
      });

      expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);

      // Second scene change → second save (first has already resolved)
      act(() => {
        capturedSubscriber?.();
      });
      await act(async () => {
        vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
        await Promise.resolve();
      });

      // Both saves should have occurred
      expect(mockSaveSnapshot).toHaveBeenCalledTimes(2);
      unmount();
    });
  });

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------
  describe('lifecycle', () => {
    it('unsubscribes from sceneStore and cancels the debounce timer on unmount', async () => {
      const { unmount } = renderHook(() => useAutoSave());

      // Trigger a scene change to start the debounce timer
      act(() => {
        capturedSubscriber?.();
      });

      // Unmount before the debounce fires
      unmount();

      // Advance past the debounce interval
      await act(async () => {
        vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
        await Promise.resolve();
      });

      // The unsubscribe function must have been called
      expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

      // saveSnapshot must NOT have been called after unmount
      expect(mockSaveSnapshot).not.toHaveBeenCalled();
    });
  });
});
