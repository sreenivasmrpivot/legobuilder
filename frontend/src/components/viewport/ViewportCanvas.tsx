import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSceneStore } from '../../stores/sceneStore';
import { useCameraStore } from '../../stores/cameraStore';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import type { ThreeEvent } from '@react-three/fiber';

export interface ViewportCanvasProps {
  children?: React.ReactNode;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
}

export function ViewportCanvas({
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ViewportCanvasProps) {
  const backgroundColor = useSceneStore((s) => s.backgroundColor);
  const position = useCameraStore((s) => s.position);
  const fov = useCameraStore((s) => s.fov);
  const near = useCameraStore((s) => s.near);
  const far = useCameraStore((s) => s.far);

  return (
    <div
      className="canvas-container"
      style={{ width: '100%', height: '100%' }}
      aria-label="3D viewport"
      role="img"
    >
      <SceneErrorBoundary>
        <Canvas
          camera={{ position, fov, near, far }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ background: backgroundColor }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
