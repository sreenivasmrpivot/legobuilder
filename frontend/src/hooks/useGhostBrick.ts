/**
 * useGhostBrick.ts — Hook for pointer-driven ghost brick updates
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * Accepts { brickTypeId } and returns { onPointerMove, onPointerLeave }
 * handlers to be wired to a pointer capture mesh (PointerEventCapture).
 *
 * On pointer move:
 *   1. Snaps the intersection point to the nearest integer grid position
 *   2. Checks occupancy via isCellOccupied()
 *   3. Calls setGhostBrick() with snapped position, validity, and brickTypeId
 *
 * On pointer leave:
 *   1. Calls clearGhostBrick() to hide the ghost brick
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import { useCallback } from 'react';
import { useGhostBrickStore } from '../stores/ghostBrickStore';
import { isCellOccupied } from '../engine/occupancyMap';

/** Three.js intersection-like object from R3F pointer events */
interface PointerIntersection {
  point: { x: number; y: number; z: number };
  face?: { normal: { x: number; y: number; z: number } } | null;
  object?: { name?: string };
}

/** Props for the useGhostBrick hook */
export interface UseGhostBrickProps {
  brickTypeId: string | null;
}

/** Return type of the useGhostBrick hook */
export interface UseGhostBrickReturn {
  onPointerMove: (intersection: PointerIntersection) => void;
  onPointerLeave: () => void;
}

/**
 * Snaps a world-space coordinate to the nearest integer grid unit.
 * Uses Math.round for consistent rounding behavior.
 */
function snapToGrid(value: number): number {
  return Math.round(value);
}

/**
 * Hook for managing ghost brick placement preview via pointer events.
 *
 * @param props.brickTypeId - The brick type being previewed, or null if none selected
 * @returns Object with onPointerMove and onPointerLeave handlers
 */
export function useGhostBrick({ brickTypeId }: UseGhostBrickProps): UseGhostBrickReturn {
  const { setGhostBrick, clearGhostBrick } = useGhostBrickStore.getState();

  const onPointerMove = useCallback(
    (intersection: PointerIntersection) => {
      // Do nothing if no brick type is selected
      if (brickTypeId === null) {
        return;
      }

      // Snap the pointer world position to the nearest integer grid
      const snappedPosition = {
        x: snapToGrid(intersection.point.x),
        y: snapToGrid(intersection.point.y),
        z: snapToGrid(intersection.point.z),
      };

      // Check if the snapped cell is occupied
      const occupied = isCellOccupied(snappedPosition);
      const isValid = !occupied;

      // Update the ghost brick store
      setGhostBrick(snappedPosition, isValid, brickTypeId);
    },
    [brickTypeId, setGhostBrick]
  );

  const onPointerLeave = useCallback(() => {
    clearGhostBrick();
  }, [clearGhostBrick]);

  return { onPointerMove, onPointerLeave };
}
