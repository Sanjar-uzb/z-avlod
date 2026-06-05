"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

type Telemetry = {
  time: number;
  velocity: number;
  height: number;
  progress: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function AnimatedBall({
  angleDeg,
  startHeight,
  paused,
  runId,
  onTelemetry,
}: {
  angleDeg: number;
  startHeight: number;
  paused: boolean;
  runId: number;
  onTelemetry: (payload: Telemetry) => void;
}) {
  const ballRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const progressRef = useRef(0);
  const timeRef = useRef(0);
  const lastEmitRef = useRef(0);

  const pathLength = 5.8;

  useEffect(() => {
    progressRef.current = 0;
    timeRef.current = 0;
    lastEmitRef.current = 0;
  }, [runId, angleDeg, startHeight]);

  useFrame((_, delta) => {
    if (!paused) {
      const dt = Math.min(delta, 0.033);
      timeRef.current += dt;
      progressRef.current = Math.min(1, progressRef.current + dt * 0.24);
    }

    const progress = progressRef.current;
    const x = -2.7 + progress * pathLength;
    const y = 0.22 + startHeight * (1 - progress);
    const velocity = Math.sqrt(Math.max(0, 2 * 9.81 * startHeight * progress));

    if (ballRef.current) {
      ballRef.current.position.set(x, y, 0);
      ballRef.current.rotation.z -= velocity * delta * 0.8;
    }

    if (glowRef.current) {
      glowRef.current.position.set(x, y + 0.35, 0);
      glowRef.current.intensity = 0.8 + progress * 0.7;
    }

    if (timeRef.current - lastEmitRef.current >= 0.08 || progress >= 1) {
      lastEmitRef.current = timeRef.current;
      onTelemetry({
        time: timeRef.current,
        velocity,
        height: clamp(startHeight * (1 - progress), 0, startHeight),
        progress,
      });
    }
  });

  return (
    <>
      <pointLight ref={glowRef} color="#f59e0b" distance={4.5} />
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial color="#f97316" emissive="#fdba74" roughness={0.3} metalness={0.1} />
      </mesh>
    </>
  );
}

function EnergyWorld({
  angleDeg,
  startHeight,
  paused,
  runId,
  onTelemetry,
}: {
  angleDeg: number;
  startHeight: number;
  paused: boolean;
  runId: number;
  onTelemetry: (payload: Telemetry) => void;
}) {
  const angle = (angleDeg * Math.PI) / 180;

  return (
    <>
      <color attach="background" args={["#07111f"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 4]} intensity={1} />
      <hemisphereLight args={["#bfe5ff", "#0d2236", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color="#0b1a2e" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.02, 0]} rotation={[0, 0, -angle]}>
        <boxGeometry args={[6.2, 0.16, 1.8]} />
        <meshStandardMaterial color="#2c7a64" roughness={0.72} metalness={0.08} />
      </mesh>

      <mesh position={[0, 0.11, -0.42]} rotation={[0, 0, -angle]}>
        <boxGeometry args={[6.05, 0.03, 0.08]} />
        <meshBasicMaterial color="#86efac" transparent opacity={0.45} />
      </mesh>

      <mesh position={[-2.9, startHeight / 2, 0]}>
        <boxGeometry args={[0.12, startHeight + 0.12, 0.12]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#164e63" />
      </mesh>

      <mesh position={[-2.75, startHeight + 0.08, 0]}>
        <boxGeometry args={[0.45, 0.05, 0.12]} />
        <meshStandardMaterial color="#bae6fd" emissive="#0ea5e9" />
      </mesh>

      <mesh position={[-2.78, startHeight + 0.25, 0]}>
        <boxGeometry args={[0.22, 0.18, 0.18]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#7dd3fc" />
      </mesh>

      <AnimatedBall
        angleDeg={angleDeg}
        startHeight={startHeight}
        paused={paused}
        runId={runId}
        onTelemetry={onTelemetry}
      />

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.03} />
    </>
  );
}

export default function Scene({
  angleDeg,
  startHeight,
  runId,
  paused,
  onTelemetry,
}: {
  angleDeg: number;
  startHeight: number;
  runId: number;
  paused: boolean;
  onTelemetry: (payload: Telemetry) => void;
}) {
  return (
    <Canvas
      camera={{ position: [6.2, 4.2, 7], fov: 42 }}
      dpr={[1, 1.2]}
      gl={{ antialias: false, powerPreference: "low-power" }}
    >
      <EnergyWorld
        angleDeg={angleDeg}
        startHeight={startHeight}
        paused={paused}
        runId={runId}
        onTelemetry={onTelemetry}
      />
    </Canvas>
  );
}
