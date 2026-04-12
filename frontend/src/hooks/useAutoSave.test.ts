/**
 * useAutoSave.test.ts
 * NFR-REL-001 — Auto-Save Crash Durability
 *
 * Test ID: T-UNIT-REL-001-06
 * Verifies: useAutoSave registers beforeunload listener and 30s interval
 *
 * LLD v2.0 contract:
 *   - setInterval(saveSnapshot, AUTO_SAVE_INTERVAL_MS) — 30,000ms
 *   - window.addEventListener('beforeunload', closeSession)
 *   - Overlap guard: skips save if previous save is still in-flight
 *   - Cleanup: clears interval and removes beforeunload listener on unmount
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AUTO_SAVE_INTERVAL_MS } from '../services/dbSchema';

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-06: useAutoSave registers beforeunload listener
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-06: useAutoSave — interval and beforeunload registration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registers a beforeunload event listener on mount', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    const { useAutoSave } = await import('./useAutoSave');
    const { unmount } = renderHook(() => useAutoSave());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    unmount();
  });

  it('removes the beforeunload listener on unmount', async () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { useAutoSave } = await import('./useAutoSave');
    const { unmount } = renderHook(() => useAutoSave());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('uses AUTO_SAVE_INTERVAL_MS (30000ms) for the interval', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    const { useAutoSave } = await import('./useAutoSave');
    const { unmount } = renderHook(() => useAutoSave());

    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      AUTO_SAVE_INTERVAL_MS
    );
    expect(AUTO_SAVE_INTERVAL_MS).toBe(30_000);

    unmount();
  });

  it('clears the interval on unmount', async () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { useAutoSave } = await import('./useAutoSave');
    const { unmount } = renderHook(() => useAutoSave());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('triggers auto-save after AUTO_SAVE_INTERVAL_MS elapses', async () => {
    const { useAutoSave } = await import('./useAutoSave');
    // Mock the persistence store's triggerAutoSave
    const mockTriggerAutoSave = vi.fn().mockResolvedValue(undefined);

    vi.mock('../stores/persistenceStore', () => ({
      usePersistenceStore: {
        getState: () => ({
          triggerAutoSave: mockTriggerAutoSave,
          autoSaveStatus: 'idle',
          currentSessionId: 'test-session',
        }),
      },
    }));

    const { unmount } = renderHook(() => useAutoSave());

    // Advance time by one interval
    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
    });

    // triggerAutoSave should have been called
    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('does not overlap saves when previous save is in-flight', async () => {
    const { useAutoSave } = await import('./useAutoSave');
    let resolveFirstSave: () => void;
    const firstSavePromise = new Promise<void>((resolve) => {
      resolveFirstSave = resolve;
    });

    const mockTriggerAutoSave = vi
      .fn()
      .mockReturnValueOnce(firstSavePromise)
      .mockResolvedValue(undefined);

    vi.mock('../stores/persistenceStore', () => ({
      usePersistenceStore: {
        getState: () => ({
          triggerAutoSave: mockTriggerAutoSave,
          autoSaveStatus: 'saving', // in-flight
          currentSessionId: 'test-session',
        }),
      },
    }));

    const { unmount } = renderHook(() => useAutoSave());

    // Advance time by two intervals while first save is in-flight
    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS * 2);
    });

    // Should not have called triggerAutoSave while status is 'saving'
    // (overlap guard prevents concurrent writes)
    expect(mockTriggerAutoSave.mock.calls.length).toBeLessThanOrEqual(1);

    unmount();
  });
});
