"use client";

import { useEffect, useMemo, useRef } from "react";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../store/useSimStore";

const G = 9.81;
const SAMPLE_INTERVAL = 0.12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function Ball({
  mass,
  angleDeg,
  startHeight,
  rampLength,
  runId,
  paused,
}: {
  mass: number;
  angleDeg: number;
  startHeight: number;
  rampLength: number;
  runId: number;
  paused: boolean;
}) {
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const lastSampleRef = useRef(0);
  const releasedRef = useRef(false);
  const setLive = useSimStore((state) => state.setLive);
  const addSample = useSimStore((state) => state.addSample);

  const angle = (angleDeg * Math.PI) / 180;
  const radius = 0.22;
  const rampThickness = 0.18;
  const startOffset = 0.72;
  const centerY = startHeight / 2;
  const localX = -rampLength / 2 + startOffset;
  const normalOffset = radius + rampThickness / 2 + 0.02;
  const startX = Math.cos(angle) * localX + Math.sin(angle) * normalOffset;
  const startY = centerY - Math.sin(angle) * localX + Math.cos(angle) * normalOffset;
  const totalEnergy = useMemo(() => mass * G * startHeight, [mass, startHeight]);

  useEffect(() => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) return;
    rigidBody.setTranslation({ x: startX, y: startY, z: 0 }, true);
    rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
    lastSampleRef.current = 0;
    releasedRef.current = false;
  }, [runId, startX, startY]);

  useEffect(() => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) return;

    if (paused) {
      releasedRef.current = false;
      rigidBody.sleep();
      return;
    }

    rigidBody.wakeUp();

    if (!releasedRef.current) {
      const push = 0.18;
      rigidBody.applyImpulse(
        {
          x: Math.cos(angle) * push,
          y: -Math.sin(angle) * push,
          z: 0,
        },
        true
      );
      releasedRef.current = true;
    }
  }, [angle, paused]);

  useFrame((state) => {
    const rigidBody = rigidBodyRef.current;
    if (!rigidBody) return;

    const position = rigidBody.translation();
    const velocityVector = rigidBody.linvel();
    const velocity = Math.sqrt(
      velocityVector.x * velocityVector.x +
        velocityVector.y * velocityVector.y +
        velocityVector.z * velocityVector.z
    );
    const baseHeight = Math.max(0, position.y - radius);
    const height = Math.min(startHeight, baseHeight);
    const progress = clamp((startHeight - height) / Math.max(startHeight, 0.001), 0, 1);
    const time = state.clock.elapsedTime;

    setLive({ velocity, height, progress, time });

    if (time - lastSampleRef.current < SAMPLE_INTERVAL) return;
    lastSampleRef.current = time;

    const kinetic = 0.5 * mass * velocity * velocity;
    const potential = mass * G * height;
    addSample({
      time,
      velocity,
      kinetic,
      potential,
      total: totalEnergy,
      height,
      progress,
    });
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="ball"
      mass={mass}
      friction={0.42}
      restitution={0.06}
      linearDamping={0.08}
      angularDamping={0.12}
      position={[startX, startY, 0]}
    >
      <mesh rotation={[0, 0, angle * 1.2]}>
        <sphereGeometry args={[radius, 20, 20]} />
        <meshStandardMaterial color="#f97316" emissive="#fdba74" roughness={0.3} metalness={0.1} />
      </mesh>
    </RigidBody>
  );
}
