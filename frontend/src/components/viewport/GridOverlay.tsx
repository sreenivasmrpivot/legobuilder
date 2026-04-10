import { useMemo } from 'react';
import * as THREE from 'three';

export function GridOverlay() {
  const gridHelper = useMemo(() => {
    const size = 16; // 32 studs × 0.5 = 16 world units
    const divisions = 32;
    return new THREE.GridHelper(size, divisions, '#888888', '#cccccc');
  }, []);

  return <primitive object={gridHelper} position={[0, 0.01, 0]} />;
}
