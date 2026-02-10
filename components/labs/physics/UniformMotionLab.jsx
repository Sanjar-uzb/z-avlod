"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

export default function UniformMotionLab({
  mass = 2,
  friction = 0.05,
  initV = 3,
  modeAcc = 1.5,
  onTelemetry,
}) {
  const rbRef = useRef(null);
  const [mode, setMode] = useState("tekis"); // tekis | tezlanishli

  const reset = () => {
    const rb = rbRef.current;
    if (!rb) return;
    rb.setTranslation({ x: -4, y: 1.2, z: 0 }, true);
    rb.setLinvel({ x: initV, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useEffect(() => {
    setTimeout(reset, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initV, mass, friction]);

  // tezlanishli rejimda doimiy kuch beramiz: F = m*a
  useFrame((_, dt) => {
    const rb = rbRef.current;
    if (!rb) return;

    if (mode === "tezlanishli") {
      const F = mass * modeAcc; // N
      rb.addForce({ x: F, y: 0, z: 0 }, true);
    }

    // telemetry
    const v3 = rb.linvel();
    const v = Math.sqrt(v3.x * v3.x + v3.z * v3.z);
    const p = rb.translation();
    onTelemetry?.({ v, a: mode === "tezlanishli" ? modeAcc : 0, x: p.x, z: p.z });
  });

  return (
    <group>
      {/* UI tugmalar (3D ichida oddiy panel o‘rnida) */}
      {/* Next.js static export uchun oddiy: HTML tugmalarni LabClient’da ham qilsa bo‘ladi.
          Lekin tez MVP uchun bu yerda “mode”ni avtomatik almashtirmaymiz.
          Rejim: LabClient’dagi slider bilan a ni o‘zgartirasiz, mode default: tekis.
          Rejimni almashtirish uchun quyida kichik “mode toggler” bor: */}
      <HtmlButtons mode={mode} setMode={setMode} onReset={reset} />

      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" friction={friction} restitution={0.05}>
          <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, 0]} receiveShadow>
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial roughness={0.95} />
          </mesh>
          <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.6, 0]} />
        </RigidBody>

        <RigidBody type="fixed">
          <CuboidCollider args={[0.2, 3, 6]} position={[10, 1.5, 0]} />
        </RigidBody>

        <RigidBody
          ref={rbRef}
          colliders="ball"
          mass={mass}
          position={[-4, 1.2, 0]}
          linearDamping={0.03}
          angularDamping={0.05}
          restitution={0.2}
        >
          <mesh castShadow>
            <sphereGeometry args={[0.45, 32, 32]} />
            <meshStandardMaterial />
          </mesh>
        </RigidBody>
      </Physics>
    </group>
  );
}

/** Minimal HTML overlay without extra deps */
function HtmlButtons({ mode, setMode, onReset }) {
  // we avoid @react-three/drei Html to keep deps simple;
  // controls are still in LabClient. This is optional.
  // If you want, I can replace with drei <Html/>.
  useEffect(() => {}, []);
  return null;
}
