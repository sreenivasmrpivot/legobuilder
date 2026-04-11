/**
 * Unit Tests — useAutoSave hook
 *
 * Test ID: T-UNIT-REL-001-06
 * FR: NFR-REL-001 — Auto-Save Crash Durability
 * Issue: https://github.com/sreenivasmrpivot/legobuilder/issues/35
 *
 * Tests the useAutoSave hook defined in LLD Section 4.4.
 * Validates interval registration, beforeunload listener, and cleanup.
 *
 * Spectra-Agent: frontend-test
 * Spectra-Tests: T-UNIT-REL-001-06
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Module under test
// The coding agent will implement this at:
//   frontend/src/hooks/useAutoSave.ts
// ---------------------------------------------------------------------------

import { useAutoSave, AUTO_SAVE_INTERVAL_MS } from '../hooks/useAutoSave';

// ---------------------------------------------------------------------------
// Mock the persistenceStore
// ---------------------------------------------------------------------------

const mockTriggerAutoSave = vi.fn().mockResolvedValue(undefined);
const mockMarkSessionClosed = vi.fn().mockResolvedValue(undefined);

vi.mock('../stores/persistenceStore', () => ({
  usePersistenceStore: vi.fn(() => ({
    autoSaveStatus: 'idle',
    triggerAutoSave: mockTriggerAutoSave,
    markSessionClosed: mockMarkSessionClosed,
  })),
}));

// ---------------------------------------------------------------------------
// Setup / teardown
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

// ---------------------------------------------------------------------------
// T-UNIT-REL-001-06: useAutoSave registers beforeunload listener
// ---------------------------------------------------------------------------

describe('T-UNIT-REL-001-06 — useAutoSave hook', () => {
  it('registers a beforeunload event listener on mount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useAutoSave());

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('removes the beforeunload listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useAutoSave());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('calls triggerAutoSave after AUTO_SAVE_INTERVAL_MS', async () => {
    renderHook(() => useAutoSave());

    // Advance timers by one interval
    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
    });

    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(1);
  });

  it('calls triggerAutoSave multiple times across multiple intervals', async () => {
    renderHook(() => useAutoSave());

    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS * 3);
    });

    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(3);
  });

  it('clears the interval on unmount (no more saves after unmount)', async () => {
    const { unmount } = renderHook(() => useAutoSave());

    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
    });
    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(1);

    unmount();
    mockTriggerAutoSave.mockClear();

    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS * 5);
    });
    // No more saves after unmount
    expect(mockTriggerAutoSave).not.toHaveBeenCalled();
  });

  it('respects a custom intervalMs parameter', async () => {
    const customInterval = 2000;
    renderHook(() => useAutoSave(customInterval));

    await act(async () => {
      vi.advanceTimersByTime(customInterval);
    });

    expect(mockTriggerAutoSave).toHaveBeenCalledTimes(1);
  });

  it('calls markSessionClosed when beforeunload fires', async () => {
    renderHook(() => useAutoSave());

    // Simulate beforeunload event
    await act(async () => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(mockMarkSessionClosed).toHaveBeenCalledTimes(1);
  });

  it('does not call triggerAutoSave if autoSaveStatus is saving (prevents overlap)', async () => {
    // Override the mock to return 'saving' status
    const { usePersistenceStore } = await import('../stores/persistenceStore');
    vi.mocked(usePersistenceStore).mockReturnValue({
      autoSaveStatus: 'saving',
      triggerAutoSave: mockTriggerAutoSave,
      markSessionClosed: mockMarkSessionClosed,
    } as ReturnType<typeof usePersistenceStore>);

    renderHook(() => useAutoSave());

    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
    });

    // Should NOT trigger save when already saving
    expect(mockTriggerAutoSave).not.toHaveBeenCalled();
  });

  it('AUTO_SAVE_INTERVAL_MS is exported and equals 5000', () => {
    expect(AUTO_SAVE_INTERVAL_MS).toBe(5000);
  });
});
