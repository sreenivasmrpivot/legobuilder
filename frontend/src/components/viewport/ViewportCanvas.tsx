import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useSceneStore } from '../../stores/sceneStore';
import { useCameraStore } from '../../stores/cameraStore';
import { SceneErrorBoundary } from './SceneErrorBoundary';

function isValidPosition(pos: unknown): pos is [number, number, number] {
  return (
    Array.isArray(pos) &&
    pos.length === 3 &&
    pos.every((v) => typeof v === 'number' && isFinite(v))
  );
}

const DEFAULT_POSITION: [number, number, number] = [10, 10, 10];

export interface ViewportCanvasProps {
  children?: ReactNode;
  onPointerDown?: (e: unknown) => void;
  onPointerMove?: (e: unknown) => void;
  onPointerUp?: (e: unknown) => void;
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

  const safePosition = isValidPosition(position) ? position : DEFAULT_POSITION;

  return (
    <div
      className="canvas-container"
      style={{ width: '100%', height: '100%' }}
      aria-label="3D viewport"
      role="img"
    >
      <SceneErrorBoundary>
        <Canvas
          camera={{ position: safePosition, fov, near, far }}
          onPointerDown={onPointerDown as never}
          onPointerMove={onPointerMove as never}
          onPointerUp={onPointerUp as never}
          style={{ background: backgroundColor }}
        >
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
