/**
 * PointerEventCapture.tsx — Invisible R3F mesh for pointer event capture
 *
 * FR-ID: FR-UI-003 — Ghost Brick Placement Preview
 * Test IDs: T-FE-UI-003-01, T-FE-UI-003-02
 *
 * Renders an invisible mesh covering the ground plane that captures
 * pointer events and forwards them to the useGhostBrick hook.
 *
 * The mesh is:
 *   - Large enough to cover the entire build area (100x100 units)
 *   - Positioned at y=0 (ground level), rotated to lie flat on XZ plane
 *   - Fully invisible (opacity=0, visible=false for rendering)
 *   - Receives pointer events via R3F's event system
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-UI-003
 * Spectra-Tests: T-FE-UI-003-01, T-FE-UI-003-02
 */

import React from 'react';
import { useGhostBrick } from '../hooks/useGhostBrick';

/** Size of the invisible capture plane (width x height) */
const CAPTURE_PLANE_SIZE: [number, number] = [100, 100];

/** Props for the PointerEventCapture component */
export interface PointerEventCaptureProps {
  /** The brick type ID being previewed, or null if none selected */
  brickTypeId: string | null;
}

/**
 * PointerEventCapture renders an invisible mesh on the ground plane
 * that captures pointer move and leave events for ghost brick preview.
 *
 * @param props.brickTypeId - The brick type being previewed
 */
export function PointerEventCapture({
  brickTypeId,
}: PointerEventCaptureProps): React.ReactElement {
  const { onPointerMove, onPointerLeave } = useGhostBrick({ brickTypeId });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onPointerMove={(event) => {
        if (event.intersections && event.intersections.length > 0) {
          onPointerMove(event.intersections[0]);
        }
      }}
      onPointerLeave={() => {
        onPointerLeave();
      }}
    >
      <planeGeometry args={CAPTURE_PLANE_SIZE} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}
