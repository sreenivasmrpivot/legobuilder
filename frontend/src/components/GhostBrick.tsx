/**
 * GhostBrick.tsx — R3F component for ghost brick placement preview
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * Reads from useGhostBrickStore and renders a semi-transparent brick
 * preview at the ghost position:
 *   - Renders null when position is null (ghost hidden)
 *   - Green semi-transparent mesh when isValid=true (valid placement)
 *   - Red semi-transparent mesh when isValid=false (invalid/occupied)
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import React from 'react';
import { useGhostBrickStore } from '../stores/ghostBrickStore';

/** Semi-transparent green for valid placement */
const VALID_COLOR = '#00ff00';
/** Semi-transparent red for invalid placement */
const INVALID_COLOR = '#ff0000';
/** Opacity for the ghost brick preview */
const GHOST_OPACITY = 0.5;
/** Default brick dimensions (1x1x1 unit) */
const BRICK_SIZE: [number, number, number] = [1, 1, 1];

/**
 * GhostBrick renders a semi-transparent brick preview at the pointer
 * position on the build grid. It reads state from the ghostBrickStore
 * and renders nothing when no position is set.
 */
export function GhostBrick(): React.ReactElement | null {
  const { position, isValid } = useGhostBrickStore();

  // Render nothing when ghost brick is hidden
  if (position === null) {
    return null;
  }

  const color = isValid ? VALID_COLOR : INVALID_COLOR;

  return (
    <mesh position={[position.x, position.y, position.z]}>
      <boxGeometry args={BRICK_SIZE} />
      <meshStandardMaterial
        color={color}
        transparent={true}
        opacity={GHOST_OPACITY}
        depthWrite={false}
      />
    </mesh>
  );
}
