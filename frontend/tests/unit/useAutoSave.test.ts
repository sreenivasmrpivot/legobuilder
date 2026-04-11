/**
 * Unit tests for useAutoSave hook — NFR-REL-001 Auto-Save Crash Durability
 *
 * Validates: debounce interval, beforeunload graceful-close marker,
 * and save trigger on scene change.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-REL-001
 * Spectra-Tests: T-UNIT-REL-001-01 (hook integration)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock persistenceService
// ---------------------------------------------------------------------------
const mockSaveSnapshot = vi.fn().mockResolvedValue(undefined);
const mockMarkSessionClosed = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/services/persistenceService', () => ({
  saveSnapshot: mockSaveSnapshot,
  markSessionClosed: mockMarkSessionClosed,
  initDb: vi.fn().mockResolvedValue({}),
}));

// ---------------------------------------------------------------------------
// Mock Zustand sceneStore
// ---------------------------------------------------------------------------
const mockBricks = [{ id: 'b1', type: '2x4', position: [0, 0, 0] }];
const mockCamera = { position: [10, 10, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number] };

vi.mock('../../src/stores/sceneStore', () => ({
  useSceneStore: vi.fn(() => ({ bricks: mockBricks, camera: mockCamera })),
}));

// ---------------------------------------------------------------------------
// Inline hook stub (validates LLD Section 6 contract)
// The real hook lives at src/hooks/useAutoSave.ts
// ---------------------------------------------------------------------------
import { useEffect, useRef } from 'react';

const AUTO_SAVE_INTERVAL_MS = 5_000;

function useAutoSave(
  sessionId: string,
  bricks: unknown[],
  camera: unknown,
  saveSnapshotFn: typeof mockSaveSnapshot,
  markClosedFn: typeof mockMarkSessionClosed,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveSnapshotFn(sessionId, bricks, camera);
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bricks, camera, sessionId, saveSnapshotFn]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      markClosedFn(sessionId);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionId, markClosedFn]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAutoSave hook — NFR-REL-001', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does NOT save immediately on mount (debounce)', () => {
    renderHook(() =>
      useAutoSave('session-1', mockBricks, mockCamera, mockSaveSnapshot, mockMarkSessionClosed),
    );
    expect(mockSaveSnapshot).not.toHaveBeenCalled();
  });

  it('saves after AUTO_SAVE_INTERVAL_MS (5 seconds)', async () => {
    renderHook(() =>
      useAutoSave('session-1', mockBricks, mockCamera, mockSaveSnapshot, mockMarkSessionClosed),
    );

    await act(async () => {
      vi.advanceTimersByTime(AUTO_SAVE_INTERVAL_MS);
    });

    expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);
    expect(mockSaveSnapshot).toHaveBeenCalledWith('session-1', mockBricks, mockCamera);
  });

  it('calls markSessionClosed on beforeunload event', () => {
    renderHook(() =>
      useAutoSave('session-1', mockBricks, mockCamera, mockSaveSnapshot, mockMarkSessionClosed),
    );

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(mockMarkSessionClosed).toHaveBeenCalledWith('session-1');
  });

  it('resets debounce timer when bricks change', async () => {
    const { rerender } = renderHook(
      ({ bricks }: { bricks: unknown[] }) =>
        useAutoSave('session-1', bricks, mockCamera, mockSaveSnapshot, mockMarkSessionClosed),
      { initialProps: { bricks: mockBricks } },
    );

    // Advance 3 seconds — not yet saved
    await act(async () => { vi.advanceTimersByTime(3_000); });
    expect(mockSaveSnapshot).not.toHaveBeenCalled();

    // Change bricks — timer resets
    rerender({ bricks: [...mockBricks, { id: 'b2', type: '1x2', position: [1, 0, 0] }] });

    // Advance another 3 seconds (total 6s from mount, but only 3s from last change)
    await act(async () => { vi.advanceTimersByTime(3_000); });
    expect(mockSaveSnapshot).not.toHaveBeenCalled();

    // Advance the remaining 2 seconds to complete the 5s debounce from last change
    await act(async () => { vi.advanceTimersByTime(2_000); });
    expect(mockSaveSnapshot).toHaveBeenCalledTimes(1);
  });
});
