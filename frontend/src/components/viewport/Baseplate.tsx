export function Baseplate() {
  const width = 32;
  const depth = 32;
  const studSize = 0.5;

  return (
    <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width * studSize, depth * studSize]} />
      <meshStandardMaterial color="#4a7c4b" />
    </mesh>
  );
}
