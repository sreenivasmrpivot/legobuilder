/**
 * Component: ViewportCanvas
 *
 * Root canvas wrapper that mounts the @react-three/fiber Canvas,
 * configures the WebGL renderer, sets up lighting, and renders
 * child scene components including GroundGrid.
 *
 * FR: FR-SCENE-001
 * LLD: docs/features/FR-SCENE-001/LOW_LEVEL_DESIGN.md §2.2
 *
 * Spectra-Agent: frontend-coding
 * Spectra-FRs: FR-SCENE-001
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useCameraStore } from '../../stores/cameraStore';
import { useSceneStore } from '../../stores/sceneStore';
import { GroundGrid } from './GroundGrid';

/**
 * Validate that a position is a valid [number, number, number] tuple
 * with finite values.
 */
function isValidPosition(pos: unknown): pos is [number, number, number] {
  return (
    Array.isArray(pos) &&
    pos.length === 3 &&
    pos.every((v) => typeof v === 'number' && isFinite(v))
  );
}

const DEFAULT_POSITION: [number, number, number] = [10, 10, 10];

export interface ViewportCanvasProps {
  className?: string;
  children?: React.ReactNode;
}

export function ViewportCanvas({ className, children }: ViewportCanvasProps) {
  const position = useCameraStore((s) => s.position);
  const fov = useCameraStore((s) => s.fov);
  const near = useCameraStore((s) => s.near);
  const far = useCameraStore((s) => s.far);
  const backgroundColor = useSceneStore((s) => s.backgroundColor);

  const safePosition = isValidPosition(position) ? position : DEFAULT_POSITION;

  // WebGL support detection
  const [webglSupported, setWebglSupported] = useState(true);

  const checkWebGL = useCallback(() => {
    try {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl2') ||
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    checkWebGL();
  }, [checkWebGL]);

  if (!webglSupported) {
    return (
      <div
        className={className}
        role="alert"
        data-testid="webgl-not-supported"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          color: '#ffffff',
        }}
      >
        <p>
          Your browser does not support WebGL. Please use Chrome, Firefox, or
          Edge for 3D rendering.
        </p>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', height: '100%' }}>
      <Canvas
        role="img"
        aria-label="3D scene viewport for LegoBuilder"
        data-testid="r3f-canvas"
        camera={{ position: safePosition, fov, near, far }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        shadows={false}
        frameloop="demand"
        onCreated={({ gl }) => {
          gl.setClearColor(backgroundColor);
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={0.8} />
        <GroundGrid />
        {children}
      </Canvas>
    </div>
  );
}
