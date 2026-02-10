"use client";

import { useMemo } from "react";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function FrictionLab({ mass, mu, push }) {
  // Normal kuch: N = m*g (g=9.81)
  const g = 9.81;
  const N = mass * g;

  // Ishqalanish: Ff = mu * N
  const Ff = mu * N;

  // Natija: itarish kuchi yetarlimi?
  const canMove = push > Ff;

  // Harakat “intensivligi” (shunchaki vizual)
  const speed = useMemo(() => {
    if (!canMove) return 0;
    const x = (push - Ff) / (mass * 10);
    return clamp(x, 0, 1);
  }, [canMove, push, Ff, mass]);

  // Kub pozitsiyasi (vizual)
  const xPos = useMemo(() => (speed * 2.2), [speed]);

  return (
    <group>
      {/* Pol */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial roughness={0.9} metalness={0.0} />
      </mesh>

      {/* “Sirt” yo‘lagi */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.59, 0]}>
        <planeGeometry args={[8, 2]} />
        <meshStandardMaterial roughness={0.7} metalness={0.0} />
      </mesh>

      {/* Kub */}
      <mesh position={[xPos - 2, 0.1, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial />
      </mesh>

      {/* Natija “belgi” */}
      <mesh position={[2.2, 0.4, 0]}>
        <sphereGeometry args={[0.12, 24, 24]} />
        <meshStandardMaterial emissiveIntensity={1.2} />
      </mesh>

      {/* O‘q chiziq (faqat ko‘rsatish uchun) */}
      <mesh position={[-2, -0.55, 0]}>
        <boxGeometry args={[8, 0.02, 0.02]} />
        <meshStandardMaterial />
      </mesh>
    </group>
  );
}
