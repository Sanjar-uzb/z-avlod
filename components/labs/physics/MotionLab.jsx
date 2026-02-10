"use client";

import { useEffect, useRef } from "react";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

export default function MotionLab({ mass = 2, friction = 0.2, initV = 4, onTelemetry }) {
  const ball = useRef(null);

  const reset = () => {
    const rb = ball.current;
    if (!rb) return;
    rb.setTranslation({ x: -4, y: 1.2, z: 0 }, true);
    rb.setLinvel({ x: initV, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useEffect(() => {
    // start
    setTimeout(reset, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // initV o‘zgarsa — qayta beramiz
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initV, mass, friction]);

  useEffect(() => {
    let lastV = 0;
    let lastT = performance.now();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const rb = ball.current;
      if (!rb) return;

      const t = performance.now();
      const dt = (t - lastT) / 1000;
      if (dt <= 0) return;

      const v3 = rb.linvel();
      const v = Math.sqrt(v3.x * v3.x + v3.z * v3.z);
      const a = (v - lastV) / dt;
      const p = rb.translation();

      onTelemetry?.({ v, a, x: p.x, z: p.z });

      lastV = v;
      lastT = t;
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, [onTelemetry]);

  return (
    <Physics gravity={[0, -9.81, 0]}>
      {/* floor */}
      <RigidBody type="fixed" friction={friction} restitution={0.05}>
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial roughness={0.95} />
        </mesh>
        <CuboidCollider args={[25, 0.1, 25]} position={[0, -0.6, 0]} />
      </RigidBody>

      {/* wall */}
      <RigidBody type="fixed">
        <CuboidCollider args={[0.2, 3, 6]} position={[10, 1.5, 0]} />
      </RigidBody>

      {/* ball */}
      <RigidBody
        ref={ball}
        colliders="ball"
        mass={mass}
        position={[-4, 1.2, 0]}
        linearDamping={0.05}
        angularDamping={0.05}
        restitution={0.2}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial />
        </mesh>
      </RigidBody>
    </Physics>
  );
}
