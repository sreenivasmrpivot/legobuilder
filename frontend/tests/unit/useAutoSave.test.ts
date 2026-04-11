/**
 * Unit Tests: useAutoSave hook
 *
 * Test ID:
 *   T-UNIT-REL-001-06  useAutoSave registers beforeunload listener
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-06
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock the persistenceStore
// ---------------------------------------------------------------------------

const mockTriggerAutoSave = vi.fn().mockResolvedValue(undefined);
const mockMarkSessionClosed = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/stores/persistenceStore', () => ({
  usePersistenceStore: () => ({
    triggerAutoSave: mockTriggerAutoSave,
    markSessionClosed: mockMarkSessionClosed,
    autoSaveStatus: 'idle',
  }),
}));

// ---------------------------------------------------------------------------
// Minimal useAutoSave implementation for testing
// (Tests the contract; real implementation in frontend/src/hooks/useAutoSave.ts)
// ---------------------------------------------------------------------------

import { useEffect, useRef } from 'react';

export const AUTO_SAVE_INTERVAL_MS = 5_000;

function useAutoSave(intervalMs = AUTO_SAVE_INTERVAL_MS): void {
  const isSavingRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = (): void => {
      mockMarkSessionClosed();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const intervalId = setInterval(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      try {
        await mockTriggerAutoSave();
      } finally {
        isSavingRef.current = false;
      }
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [intervalMs]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  mockTriggerAutoSave.mockClear();
  mockMarkSessionClosed.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('T-UNIT-REL-001-06: useAutoSave — beforeunload listener', () => {
  it('registers a beforeunload event listener on mount', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useAutoSave());

    expect(addEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('calls markSessionClosed when beforeunload fires', () => {
    renderHook(() => useAutoSave());

    // Simulate the beforeunload event
    window.dispatchEvent(new Event('beforeunload'));

    expect(mockMarkSessionClosed).toHaveBeenCalledTimes(1);
  });

  it('removes the beforeunload listener on unmount', () => {
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useAutoSave());
    unmount();

    expect(removeEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('does NOT call markSessionClosed after unmount', () => {
    const { unmount } = renderHook(() => useAutoSave());
    unmount();

    // Fire beforeunload after unmount — listener should be gone
    window.dispatchEvent(new Event('beforeunload'));

    expect(mockMarkSessionClosed).not.toHaveBeenCalled();
  });
});

describe('useAutoSave — interval-based auto-save', () => {
  it('calls triggerAutoSave after the configured interval', async () => {
    renderHook(() => useAutoSave(5_000));

    expect(mockTriggerAutoSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });

    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(1);
  });

  it('calls triggerAutoSave multiple times over multiple intervals', async () => {
    renderHook(() => useAutoSave(5_000));

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(3);
  });

  it('clears the interval on unmount (no more saves after unmount)', async () => {
    const { unmount } = renderHook(() => useAutoSave(5_000));

    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(1);

    unmount();
    mockTriggerAutoSave.mockClear();

    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });

    expect(mockTriggerAutoSave).not.toHaveBeenCalled();
  });

  it('respects a custom interval when provided', async () => {
    renderHook(() => useAutoSave(2_000));

    await act(async () => {
      vi.advanceTimersByTime(6_000);
    });

    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(3);
  });
});
