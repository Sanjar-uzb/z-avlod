"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function BuoyancyLab({
  objDensity = 600,      // kg/m3
  fluidDensity = 1000,   // kg/m3
  volume = 0.003,        // m3
  onTelemetry,
}) {
  const rbRef = useRef(null);

  // kub tomonini hajmdan olamiz: V = s^3 => s = cbrt(V)
  const side = useMemo(() => Math.cbrt(Math.max(volume, 0.0005)), [volume]);

  // massa = zichlik * hajm
  const mass = useMemo(() => objDensity * volume, [objDensity, volume]);

  const waterLevel = 0.2; // suv sathi (y)

  const reset = () => {
    const rb = rbRef.current;
    if (!rb) return;
    rb.setTranslation({ x: 0, y: 2.2, z: 0 }, true);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useEffect(() => {
    setTimeout(reset, 50);
  }, []);

  useFrame(() => {
    const rb = rbRef.current;
    if (!rb) return;

    const pos = rb.translation();
    const vel = rb.linvel();

    // jismning pastki nuqtasi
    const bottomY = pos.y - side / 2;

    // suvga botish darajasi (0..1)
    const submerged = clamp((waterLevel - bottomY) / side, 0, 1);

    // Arximed kuchi: Fb = rho_fluid * g * displaced_volume
    const g = 9.81;
    const displacedV = volume * submerged;
    const Fb = fluidDensity * g * displacedV; // N

    // yuqoriga kuch beramiz
    rb.addForce({ x: 0, y: Fb, z: 0 }, true);

    // telemetry (v, a taxmin)
    const v = Math.abs(vel.y);
    const a = (Fb / Math.max(mass, 0.0001)) - g; // taxmin

    onTelemetry?.({ v, a, x: pos.x, z: pos.z });
  });

  return (
    <Physics gravity={[0, -9.81, 0]}>
      {/* pol */}
      <RigidBody type="fixed">
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.7, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial roughness={0.95} />
        </mesh>
        <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.7, 0]} />
      </RigidBody>

      {/* suv hajmi (vizual) */}
      <mesh position={[0, waterLevel - 0.8, 0]}>
        <boxGeometry args={[6, 1.6, 3]} />
        <meshStandardMaterial transparent opacity={0.18} />
      </mesh>

      {/* jism */}
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
}
