import { ViewportCanvas } from './ViewportCanvas';
import { BrickInstances } from './BrickInstances';
import { GroundGrid } from './GroundGrid';
import { Baseplate } from './Baseplate';
import { OrbitControls } from '@react-three/drei';
import { useBrickPlacement } from '../../hooks/useBrickPlacement';
import { useSelection } from '../../hooks/useSelection';
import { useSceneStore } from '../../stores/sceneStore';
import { useSelectionStore } from '../../stores/selectionStore';

export function Viewport() {
  const { handlePointerDown, handlePointerMove, handlePointerUp, ghostBrick } =
    useBrickPlacement();
  const { handleBrickClick } = useSelection();
  const bricks = useSceneStore((s) => s.bricks);
  const selectedBrickId = useSelectionStore((s) => s.selectedBrickId);

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
          onBrickClick={handleBrickClick as (brickId: string, event: unknown) => void}
          selectedBrickId={selectedBrickId}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.1}
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
