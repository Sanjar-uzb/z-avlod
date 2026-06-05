"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";

const NewtonLab = forwardRef(function NewtonLab(
  { mass = 2, friction = 0.2, force = 12, paused = false, timeScale = 1, onTelemetry },
  ref
) {
  const rbRef = useRef(null);

  const reset = () => {
    const rb = rbRef.current;
    if (!rb) return;
    rb.setTranslation({ x: -4, y: 1.2, z: 0 }, true);
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

    rb.addForce({ x: force * timeScale, y: 0, z: 0 }, true);

    const v3 = rb.linvel();
    const v = Math.sqrt(v3.x * v3.x + v3.z * v3.z);
    const p = rb.translation();

    const a = mass > 0 ? (force / mass) : 0;
    onTelemetry?.({ v, a, x: p.x, z: p.z });
  });

  return (
    <Physics gravity={[0, -9.81, 0]} paused={paused}>
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
});

export default NewtonLab;
