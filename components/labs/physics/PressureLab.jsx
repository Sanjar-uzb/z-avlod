"use client";

import { forwardRef, useImperativeHandle, useMemo } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

const PressureLab = forwardRef(function PressureLab({ force = 80, area = 0.02 }, ref) {
  useImperativeHandle(ref, () => ({
    reset() {
      // bosim labda “reset” shart emas, lekin tugma bosilganda xato bo‘lmasin
    },
  }));

  const P = force / Math.max(area, 0.000001);
  const depth = useMemo(() => clamp(P / 20000, 0, 0.35), [P]);
  const side = useMemo(() => Math.sqrt(Math.max(area, 0.0001)) * 6, [area]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial roughness={0.95} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[0, -0.69 - depth * 0.6, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial roughness={0.9} />
      </mesh>

      <mesh position={[0, 0.5 - depth, 0]} castShadow>
        <boxGeometry args={[side, 0.4, side]} />
        <meshStandardMaterial />
      </mesh>
    </group>
  );
});

export default PressureLab;
