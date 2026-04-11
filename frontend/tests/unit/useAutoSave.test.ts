/**
 * Unit Tests: useAutoSave hook
 *
 * Test ID:
 *   T-UNIT-REL-001-06  useAutoSave registers beforeunload listener
 *
 * M1 FIX: Now imports the real production useAutoSave hook instead
 * of defining an inline stub. The persistenceStore and sceneStore
 * are mocked to isolate the hook's behavior.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-06
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock the persistenceStore and sceneStore
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

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: {
    getState: () => ({
      bricks: [
        { id: 'brick-1', type: '2x4', position: [0, 0, 0], rotation: [0, 0, 0, 1], color: '#FF0000' },
      ],
      cameraState: { position: [0, 10, 20], target: [0, 0, 0], zoom: 1 },
      sceneMetadata: { name: 'Test Scene', createdAt: 1000, lastModifiedAt: 2000 },
    }),
  },
}));

// ---------------------------------------------------------------------------
// M1 FIX: Import real production hook
// ---------------------------------------------------------------------------

import { useAutoSave } from '../../src/hooks/useAutoSave';

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

  it('passes actual scene state from sceneStore to triggerAutoSave', async () => {
    renderHook(() => useAutoSave(5_000));

    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });

    // Verify triggerAutoSave was called with real scene data, not empty arrays
    expect(mockTriggerAutoSave).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'brick-1' }),
      ]),
      expect.objectContaining({ position: [0, 10, 20] }),
      expect.objectContaining({ name: 'Test Scene' }),
    );
  });
});
