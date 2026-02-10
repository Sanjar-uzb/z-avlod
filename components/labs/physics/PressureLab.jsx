"use client";

import { useMemo } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function PressureLab({ force = 80, area = 0.02 }) {
  // P = F / S
  const P = force / Math.max(area, 0.000001);

  // “iz” chuqurligi (vizual): bosim oshsa chuqurlik oshadi
  const depth = useMemo(() => clamp(P / 20000, 0, 0.35), [P]);

  // sirt kvadrat deb faraz qilamiz: S = side^2
  const side = useMemo(() => Math.sqrt(Math.max(area, 0.0001)) * 6, [area]); // scale for view

  return (
    <group>
      {/* Pol */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.7, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial roughness={0.95} />
      </mesh>

      {/* Yumshoq “mat” (bosim izini ko‘rsatish) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.69 - depth * 0.6, 0]}>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial roughness={0.9} />
      </mesh>

      {/* Bosuvchi blok */}
      <mesh position={[0, 0.5 - depth, 0]} castShadow>
        <boxGeometry args={[side, 0.4, side]} />
        <meshStandardMaterial />
      </mesh>

      {/* Ko‘rsatkich */}
      <mesh position={[3.2, 0.6, 0]}>
        <boxGeometry args={[0.08, 1.2, 0.08]} />
        <meshStandardMaterial />
      </mesh>
      <mesh position={[3.2, 0.1 + depth, 0]}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshStandardMaterial />
      </mesh>
    </group>
  );
}
