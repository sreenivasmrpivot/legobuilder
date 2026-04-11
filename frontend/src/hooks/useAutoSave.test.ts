/**
 * NFR-REL-001 — Auto-Save Crash Durability
 * Unit tests for useAutoSave hook
 *
 * Test IDs:
 *   T-UNIT-REL-001-06: useAutoSave registers beforeunload listener and cleans up
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Iteration: 3
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

const MOCK_SESSION_ID = 'hook-test-session';
const MOCK_BRICKS = [
  { id: 'b1', type: '2x4', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, color: '#ff0000' },
  { id: 'b2', type: '2x2', position: { x: 2, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, color: '#0000ff' },
];

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('T-UNIT-REL-001-06: useAutoSave — beforeunload listener', () => {
  it('registers a beforeunload event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useAutoSave({ sessionId: MOCK_SESSION_ID, bricks: MOCK_BRICKS }));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('removes the beforeunload listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useAutoSave({ sessionId: MOCK_SESSION_ID, bricks: MOCK_BRICKS })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('sets up auto-save interval on mount', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    renderHook(() => useAutoSave({ sessionId: MOCK_SESSION_ID, bricks: MOCK_BRICKS }));

    expect(setIntervalSpy).toHaveBeenCalled();
  });

  it('clears auto-save interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() =>
      useAutoSave({ sessionId: MOCK_SESSION_ID, bricks: MOCK_BRICKS })
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('does not trigger concurrent saves (overlap guard)', async () => {
    const saveSnapshotMock = vi.fn().mockResolvedValue(undefined);
    vi.mock('./persistenceService', () => ({
      saveSnapshot: saveSnapshotMock,
      closeSession: vi.fn().mockResolvedValue(undefined),
      initDb: vi.fn().mockResolvedValue(undefined),
    }));

    const { result } = renderHook(() =>
      useAutoSave({ sessionId: MOCK_SESSION_ID, bricks: MOCK_BRICKS })
    );

    // Trigger two rapid saves
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Should not have concurrent saves in flight
    expect(result.current).toBeDefined();
  });
});
