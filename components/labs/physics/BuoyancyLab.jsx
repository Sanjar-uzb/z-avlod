"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

const BuoyancyLab = forwardRef(function BuoyancyLab(
  { objDensity = 600, fluidDensity = 1000, volume = 0.003, paused = false, timeScale = 1, onTelemetry },
  ref
) {
  const rbRef = useRef(null);

  const side = useMemo(() => Math.cbrt(Math.max(volume, 0.0005)), [volume]);
  const mass = useMemo(() => objDensity * volume, [objDensity, volume]);

  const waterLevel = 0.2;

  const reset = () => {
    const rb = rbRef.current;
    if (!rb) return;
    rb.setTranslation({ x: 0, y: 2.2, z: 0 }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useImperativeHandle(ref, () => ({ reset }));

  useEffect(() => {
    setTimeout(reset, 50);
  }, []);

  useFrame(() => {
    const rb = rbRef.current;
    if (!rb || paused) return;

    const pos = rb.translation();
    const vel = rb.linvel();
    const bottomY = pos.y - side / 2;
    const submerged = clamp((waterLevel - bottomY) / side, 0, 1);

    const g = 9.81;
    const displacedV = volume * submerged;
    const Fb = fluidDensity * g * displacedV;

    rb.addForce({ x: 0, y: Fb * timeScale, z: 0 }, true);

    const v = Math.abs(vel.y);
    const a = (Fb / Math.max(mass, 0.0001)) - g;
    onTelemetry?.({ v, a, x: pos.x, z: pos.z });
  });

  return (
    <Physics gravity={[0, -9.81, 0]} paused={paused}>
      <RigidBody type="fixed">
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.7, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial roughness={0.95} />
        </mesh>
        <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.7, 0]} />
      </RigidBody>

      <mesh position={[0, waterLevel - 0.8, 0]}>
        <boxGeometry args={[6, 1.6, 3]} />
        <meshStandardMaterial transparent opacity={0.18} />
      </mesh>

      <RigidBody
        ref={rbRef}
        colliders="cuboid"
        mass={mass}
        position={[0, 2.2, 0]}
        linearDamping={0.25}
        angularDamping={0.25}
        restitution={0.05}
      >
        <mesh castShadow>
          <boxGeometry args={[side * 4, side * 4, side * 4]} />
          <meshStandardMaterial />
        </mesh>
      </RigidBody>
    </Physics>
  );
});

export default BuoyancyLab;
