import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Baseplate } from './Baseplate';
import { GridOverlay } from './GridOverlay';

export function Viewport() {
  return (
    <Canvas
      data-testid="viewport"
      camera={{ position: [20, 20, 20], fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#e8e8e8']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />

      <OrbitControls
        minDistance={5}
        maxDistance={100}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping
        dampingFactor={0.1}
      />

      <Baseplate />
      <GridOverlay />
    </Canvas>
  );
}
