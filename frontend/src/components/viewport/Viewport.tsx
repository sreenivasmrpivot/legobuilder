import React from 'react';
import { ViewportCanvas } from './ViewportCanvas';
import { BrickInstances } from './BrickInstances';
import { GroundGrid } from './GroundGrid';
import { Baseplate } from './Baseplate';
import { useBrickPlacement } from '../../hooks/useBrickPlacement';
import { useSelection } from '../../hooks/useSelection';
import { useCameraControls } from '../../hooks/useCameraControls';
import { useSceneStore } from '../../stores/sceneStore';

export function Viewport() {
  const { handlePointerDown, handlePointerMove, handlePointerUp, ghostBrick } =
    useBrickPlacement();
  const { handleBrickClick } = useSelection();
  const bricks = useSceneStore((s) => s.bricks);

  return (
    <div className="viewport" style={{ width: '100%', height: '100%' }}>
      <ViewportCanvas
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <GroundGrid />
        <Baseplate />
        <BrickInstances
          bricks={bricks}
          onBrickClick={handleBrickClick}
          selectedBrickId={null}
        />
        {ghostBrick && (
          <mesh
            position={ghostBrick.position}
            rotation={[0, (ghostBrick.rotation * Math.PI) / 180, 0]}
          >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={ghostBrick.color}
              transparent
              opacity={ghostBrick.isValid ? 0.5 : 0.2}
            />
          </mesh>
        )}
      </ViewportCanvas>
    </div>
  );
}
