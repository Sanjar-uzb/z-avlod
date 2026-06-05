"use client";

import { CuboidCollider, RigidBody } from "@react-three/rapier";

export default function Ramp({
  angleDeg,
  length,
  startHeight,
}: {
  angleDeg: number;
  length: number;
  startHeight: number;
}) {
  const angle = (angleDeg * Math.PI) / 180;
  const rampCenterY = startHeight / 2;
  const rampCenterX = 0;

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <mesh rotation={[0, 0, -angle]} position={[rampCenterX, rampCenterY, 0]}>
          <boxGeometry args={[length, 0.18, 2]} />
          <meshStandardMaterial color="#2c7a64" roughness={0.72} metalness={0.08} />
        </mesh>
        <CuboidCollider args={[length / 2, 0.09, 1]} rotation={[0, 0, -angle]} position={[rampCenterX, rampCenterY, 0]} friction={0.5} restitution={0.02} />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[-length / 2 + 0.16, startHeight + 0.2, 0]}>
          <boxGeometry args={[0.35, 0.3, 2]} />
          <meshStandardMaterial color="#7dd3fc" emissive="#164e63" />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, -0.36, 0]}>
          <boxGeometry args={[20, 0.2, 8]} />
          <meshStandardMaterial color="#10263b" roughness={0.96} />
        </mesh>
        <CuboidCollider args={[10, 0.1, 4]} position={[0, -0.36, 0]} />
      </RigidBody>
    </>
  );
}
