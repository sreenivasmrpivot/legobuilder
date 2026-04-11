/**
 * Component: GroundGrid
 *
 * Renders a visible grid plane on the XZ plane (Y=0) using Three.js
 * GridHelper. Grid visibility is controlled by sceneStore.showGrid.
 *
 * FR: FR-SCENE-001
 * LLD: docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md §2.2
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

import React from 'react';
import { useSceneStore } from '../../stores/sceneStore';

export interface GroundGridProps {
  /** Total grid size in studs (default: 32) */
  size?: number;
  /** Number of grid divisions (default: 32, giving 1-stud intervals) */
  divisions?: number;
  /** Center line color (default: '#888888') */
  colorCenter?: string;
  /** Grid line color (default: '#444444') */
  colorGrid?: string;
}

/**
 * Cap grid size and divisions to prevent DoS via oversized grids.
 */
const MAX_GRID_SIZE = 128;

export function GroundGrid({
  size = 32,
  divisions = 32,
  colorCenter = '#888888',
  colorGrid = '#444444',
}: GroundGridProps) {
  const showGrid = useSceneStore((s) => s.showGrid);

  // Cap values at MAX_GRID_SIZE
  const safeSize = Math.min(size, MAX_GRID_SIZE);
  const safeDivisions = Math.min(divisions, MAX_GRID_SIZE);

  if (!showGrid) return null;

  return (
    <gridHelper
      args={[safeSize, safeDivisions, colorCenter, colorGrid]}
      position={[0, 0, 0]}
    />
  );
}
