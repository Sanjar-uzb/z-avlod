"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import {
  BallCollider,
  Physics,
  RigidBody,
  useSphericalJoint,
  type RapierRigidBody,
} from "@react-three/rapier";
import * as THREE from "three";

type Params = {
  length: number;
  amplitude: number;
  gravity: number;
  damping: number;
  timeScale: number;
};

type Telemetry = {
  angleDeg: number;
  speed: number;
  height: number;
  pe: number;
  ke: number;
  total: number;
};

const DEFAULT: Params = {
  length: 2.2,
  amplitude: 25,
  gravity: 9.8,
  damping: 0.02,
  timeScale: 1,
};

const PIVOT_Y = 1.7;
const BOB_RADIUS = 0.25;

function fmt(n: number, d = 2) {
  return Number.isFinite(n) ? n.toFixed(d) : "0.00";
}

function FormulaPill({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 14,
        background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(148,163,184,0.18)",
        color: "#e2e8f0",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className="card"
      style={{
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.16)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 5,
          borderRadius: 999,
          background: accent,
          marginBottom: 12,
        }}
      />
      <div className="h3">{title}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginTop: 8,
          color: "white",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub ? (
        <div className="muted" style={{ marginTop: 8 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function SceneLabel({
  position,
  text,
  background = "rgba(255,255,255,0.96)",
  color = "#0f172a",
}: {
  position: [number, number, number];
  text: string;
  background?: string;
  color?: string;
}) {
  return (
    <Html position={position} center distanceFactor={8}>
      <div
        style={{
          padding: "7px 12px",
          borderRadius: 999,
          background,
          color,
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
          boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,255,255,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        {text}
      </div>
    </Html>
  );
}

function CameraRig() {
  useFrame(({ camera }) => {
    camera.position.lerp(new THREE.Vector3(4.2, 2.2, 6.2), 0.025);
    camera.lookAt(0, -0.8, 0);
  });

  return null;
}

function RopeVisual({
  anchorPosition,
  ballRef,
}: {
  anchorPosition: [number, number, number];
  ballRef: React.RefObject<RapierRigidBody | null>;
}) {
  const ropeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const body = ballRef.current;
    const rope = ropeRef.current;
    if (!body || !rope) return;

    const ball = body.translation();
    const start = new THREE.Vector3(...anchorPosition);
    const end = new THREE.Vector3(ball.x, ball.y, ball.z);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const direction = end.clone().sub(start);
    const length = direction.length();

    rope.position.copy(mid);
    rope.scale.set(1, Math.max(length, 0.001), 1);
    rope.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize()
    );
  });

  return (
    <mesh ref={ropeRef} castShadow>
      <cylinderGeometry args={[0.018, 0.018, 1, 12]} />
      <meshStandardMaterial color="#f8fafc" metalness={0.2} roughness={0.5} />
    </mesh>
  );
}

function EnergyBars({
  pe,
  ke,
  total,
}: {
  pe: number;
  ke: number;
  total: number;
}) {
  const peRatio = total > 0 ? pe / total : 0;
  const keRatio = total > 0 ? ke / total : 0;

  return (
    <Html position={[2.9, 1.45, 0]} transform distanceFactor={8}>
      <div
        style={{
          width: 230,
          padding: 16,
          borderRadius: 18,
          background: "rgba(15,23,42,0.84)",
          border: "1px solid rgba(148,163,184,0.18)",
          boxShadow: "0 16px 36px rgba(0,0,0,0.24)",
          color: "white",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            marginBottom: 14,
            color: "#e2e8f0",
          }}
        >
          Energiya taqsimoti
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "end",
            justifyContent: "center",
            gap: 24,
            height: 120,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 90,
                borderRadius: 14,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(148,163,184,0.12)",
                display: "flex",
                alignItems: "end",
                overflow: "hidden",
                boxShadow: peRatio > 0.6 ? "0 0 18px rgba(56,189,248,0.35)" : "none",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(6, peRatio * 100)}%`,
                  background: "linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 100%)",
                  transition: "height 120ms linear",
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#bae6fd" }}>
              Ep
            </div>
            <div style={{ fontSize: 11, color: "#cbd5e1" }}>{pe.toFixed(2)} J</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 90,
                borderRadius: 14,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(148,163,184,0.12)",
                display: "flex",
                alignItems: "end",
                overflow: "hidden",
                boxShadow: keRatio > 0.6 ? "0 0 18px rgba(245,158,11,0.35)" : "none",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(6, keRatio * 100)}%`,
                  background: "linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)",
                  transition: "height 120ms linear",
                }}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "#fde68a" }}>
              Ek
            </div>
            <div style={{ fontSize: 11, color: "#cbd5e1" }}>{ke.toFixed(2)} J</div>
          </div>
        </div>

        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,0.07)",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${peRatio * 100}%`,
              background: "#0ea5e9",
              transition: "width 120ms linear",
            }}
          />
          <div
            style={{
              width: `${keRatio * 100}%`,
              background: "#f59e0b",
              transition: "width 120ms linear",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
            fontSize: 11,
            color: "#cbd5e1",
          }}
        >
          <span>Potensial</span>
          <span>Jami: {total.toFixed(2)} J</span>
          <span>Kinetik</span>
        </div>
      </div>
    </Html>
  );
}

function RealPendulum({
  length,
  amplitudeDeg,
  damping,
  gravity,
  running,
  onTelemetry,
}: {
  length: number;
  amplitudeDeg: number;
  damping: number;
  gravity: number;
  running: boolean;
  onTelemetry: (data: Telemetry) => void;
}) {
  const anchorRef = useRef<RapierRigidBody | null>(null);
  const ballRef = useRef<RapierRigidBody | null>(null);
  const lastEmitRef = useRef(0);
  const anchorPosition: [number, number, number] = [0, PIVOT_Y, 0];

  useSphericalJoint(
    anchorRef as React.MutableRefObject<RapierRigidBody>,
    ballRef as React.MutableRefObject<RapierRigidBody>,
    [
      [0, 0, 0],
      [0, length, 0],
    ]
  );

  useEffect(() => {
    const ball = ballRef.current;
    if (!ball) return;

    const theta = (amplitudeDeg * Math.PI) / 180;
    const x = Math.sin(theta) * length;
    const y = PIVOT_Y - Math.cos(theta) * length;

    ball.setTranslation({ x, y, z: 0 }, true);
    ball.setLinvel({ x: 0, y: 0, z: 0 }, true);
    ball.setAngvel({ x: 0, y: 0, z: 0 }, true);
    lastEmitRef.current = 0;
  }, [amplitudeDeg, length]);

  useFrame((state) => {
    if (!running) return;

    const ball = ballRef.current;
    if (!ball) return;

    const position = ball.translation();
    const velocity = ball.linvel();
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const relativeX = position.x - anchorPosition[0];
    const relativeY = position.y - anchorPosition[1];
    const angle = Math.atan2(relativeX, -relativeY);

    const lowestY = PIVOT_Y - length;
    const height = Math.max(0, position.y - lowestY);

    const pe = gravity * height;
    const ke = 0.5 * speed * speed;

    if (state.clock.elapsedTime - lastEmitRef.current >= 0.05) {
      lastEmitRef.current = state.clock.elapsedTime;
      onTelemetry({
        angleDeg: Math.abs((angle * 180) / Math.PI),
        speed,
        height,
        pe,
        ke,
        total: pe + ke,
      });
    }
  });

  return (
    <>
      <RigidBody ref={anchorRef} type="fixed" position={anchorPosition}>
        <mesh castShadow>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshStandardMaterial color="#e2e8f0" emissive="#64748b" />
        </mesh>
      </RigidBody>

      <RigidBody
        ref={ballRef}
        colliders={false}
        linearDamping={damping * 0.8}
        angularDamping={damping * 1.3}
        position={[0, PIVOT_Y - length, 0]}
      >
        <BallCollider args={[BOB_RADIUS]} />
        <mesh castShadow>
          <sphereGeometry args={[BOB_RADIUS, 36, 36]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#fb923c"
            metalness={0.7}
            roughness={0.15}
            envMapIntensity={2}
          />
        </mesh>
      </RigidBody>

      <RopeVisual anchorPosition={anchorPosition} ballRef={ballRef} />

      <SceneLabel
        position={[0, PIVOT_Y + 0.38, 0]}
        text="Mayatnik osilish nuqtasi"
        background="rgba(224,242,254,0.96)"
      />
    </>
  );
}

function PendulumWorld({
  params,
  running,
  telemetry,
  onTelemetry,
}: {
  params: Params;
  running: boolean;
  telemetry: Telemetry;
  onTelemetry: (data: Telemetry) => void;
}) {
  return (
    <>
      <color attach="background" args={["#08131d"]} />
      <fog attach="fog" args={["#08131d", 4, 15]} />

      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow />
      <hemisphereLight args={["#d6f0ff", "#0a1d31", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0c1b2b" roughness={0.96} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.44, 0]}>
        <circleGeometry args={[1.25, 32]} />
        <meshBasicMaterial color="black" transparent opacity={0.22} />
      </mesh>

      <mesh position={[0, PIVOT_Y + 0.18, 0]}>
        <boxGeometry args={[2.1, 0.12, 0.4]} />
        <meshStandardMaterial color="#243447" roughness={0.72} />
      </mesh>

      <mesh position={[0, PIVOT_Y - params.length - 0.25, 0]}>
        <torusGeometry args={[params.length * 0.94, 0.01, 8, 80, Math.PI]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" />
      </mesh>

      <SceneLabel
        position={[-2.55, 1.35, 0]}
        text={`Burchak = ${telemetry.angleDeg.toFixed(1)}°`}
        background="rgba(254,243,199,0.96)"
      />

      <SceneLabel
        position={[-2.55, 0.85, 0]}
        text={`Tezlik = ${telemetry.speed.toFixed(2)} m/s`}
        background="rgba(220,252,231,0.96)"
      />

      <EnergyBars pe={telemetry.pe} ke={telemetry.ke} total={telemetry.total} />

      <Physics
        gravity={[0, -(params.gravity * params.timeScale), 0]}
        paused={!running}
        timeStep="vary"
      >
        <RealPendulum
          length={params.length}
          amplitudeDeg={params.amplitude}
          damping={params.damping}
          gravity={params.gravity}
          running={running}
          onTelemetry={onTelemetry}
        />
      </Physics>

      <CameraRig />
      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

export default function PendulumLabProfessional() {
  const [params, setParams] = useState(DEFAULT);
  const [running, setRunning] = useState(false);
  const [sceneKey, setSceneKey] = useState(1);
  const [telemetry, setTelemetry] = useState<Telemetry>({
    angleDeg: DEFAULT.amplitude,
    speed: 0,
    height:
      DEFAULT.length * (1 - Math.cos((DEFAULT.amplitude * Math.PI) / 180)),
    pe:
      DEFAULT.gravity *
      DEFAULT.length *
      (1 - Math.cos((DEFAULT.amplitude * Math.PI) / 180)),
    ke: 0,
    total:
      DEFAULT.gravity *
      DEFAULT.length *
      (1 - Math.cos((DEFAULT.amplitude * Math.PI) / 180)),
  });

  const period = useMemo(
    () =>
      2 *
      Math.PI *
      Math.sqrt(Math.max(0.1, params.length) / Math.max(0.1, params.gravity)),
    [params.length, params.gravity]
  );

  const explanation = useMemo(() => {
    if (params.length >= 3) {
      return "Uzunlik katta bo‘lgani uchun mayatnik sekinroq tebranadi.";
    }
    if (params.length <= 1.2) {
      return "Uzunlik kichik bo‘lgani uchun mayatnik tezroq tebranadi.";
    }
    return "Uzunlik o‘rtacha bo‘lgani uchun tebranish davri ham o‘rtacha qiymatda.";
  }, [params.length]);

  const dampingText = useMemo(() => {
    if (params.damping <= 0.01) {
      return "Damping juda kichik. Tebranish uzoq davom etadi.";
    }
    if (params.damping <= 0.05) {
      return "Damping o‘rtacha. Tebranish sekin-asta so‘nadi.";
    }
    return "Damping katta. Tebranish tezroq so‘nadi.";
  }, [params.damping]);

  const energyStateText = useMemo(() => {
    if (telemetry.pe > telemetry.ke * 1.5) {
      return "Mayatnik chekka holatga yaqin: potensial energiya katta.";
    }
    if (telemetry.ke > telemetry.pe * 1.5) {
      return "Mayatnik markazga yaqin: kinetik energiya katta.";
    }
    return "Mayatnik harakatda: energiya bir turdan ikkinchisiga almashmoqda.";
  }, [telemetry.pe, telemetry.ke]);

  function resetSimulation(nextParams = params) {
    setRunning(false);
    const initialHeight =
      nextParams.length * (1 - Math.cos((nextParams.amplitude * Math.PI) / 180));

    setTelemetry({
      angleDeg: nextParams.amplitude,
      speed: 0,
      height: initialHeight,
      pe: nextParams.gravity * initialHeight,
      ke: 0,
      total: nextParams.gravity * initialHeight,
    });

    setSceneKey((value) => value + 1);
  }

  function updateParams(patch: Partial<Params>) {
    const nextParams = { ...params, ...patch };
    setParams(nextParams);
    resetSimulation(nextParams);
  }

  function applyPreset(next: Params) {
    setParams(next);
    resetSimulation(next);
  }

  return (
    <div
      style={{
        padding: 18,
        background:
          "radial-gradient(circle at top right, rgba(56,189,248,0.08), transparent 22%), radial-gradient(circle at top left, rgba(245,158,11,0.08), transparent 18%), linear-gradient(180deg, #07111b 0%, #0a1420 100%)",
        minHeight: "100vh",
      }}
    >
      <div className="grid" style={{ maxWidth: 1400, margin: "0 auto", gap: 16 }}>
        <div
          className="card"
          style={{
            gridColumn: "span 12",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(10,18,30,0.98))",
            border: "1px solid rgba(148,163,184,0.16)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
          }}
        >
          <div
            className="row"
            style={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <Link href="/labs" className="btn btnGhost">
                  ← Ortga
                </Link>
                <Link href="/labs?fan=fizika" className="btn btnGhost">
                  Fizika laboratoriyalari
                </Link>
              </div>

              <div className="h2" style={{ fontSize: 30, color: "white" }}>
                Interaktiv 3D laboratoriya: matematik mayatnik
              </div>
              <p className="muted" style={{ marginTop: 10, lineHeight: 1.8, fontSize: 15 }}>
                Bu laboratoriyada mayatnikning tebranishi, energiya almashinuvi va davri
                3D muhitda kuzatiladi. O‘quvchi uzunlik, boshlang‘ich burchak, tortishish
                kuchi va dampingni o‘zgartirib, tebranish qanday o‘zgarishini amalda ko‘radi.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 300 }}>
              <FormulaPill text="T = 2π √(l / g)" />
              <FormulaPill text="Ep = mgh" />
              <FormulaPill text="Ek = mv² / 2" />
              <FormulaPill text="Chekkada Ep katta, markazda Ek katta bo‘ladi" />
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 16 }}>
          <div
            className="card"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div className="h3" style={{ color: "white" }}>Boshqaruv paneli</div>

            <label className="muted" style={{ display: "block", marginTop: 14 }}>
              Uzunlik: {params.length.toFixed(1)} m
            </label>
            <input
              className="input"
              type="range"
              min="0.8"
              max="4"
              step="0.1"
              value={params.length}
              onChange={(e) => updateParams({ length: Number(e.target.value) })}
            />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Boshlang‘ich burchak: {params.amplitude}°
            </label>
            <input
              className="input"
              type="range"
              min="5"
              max="60"
              step="1"
              value={params.amplitude}
              onChange={(e) => updateParams({ amplitude: Number(e.target.value) })}
            />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Tortishish kuchi g: {params.gravity.toFixed(1)} m/s²
            </label>
            <input
              className="input"
              type="range"
              min="1.6"
              max="12"
              step="0.1"
              value={params.gravity}
              onChange={(e) => updateParams({ gravity: Number(e.target.value) })}
            />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Damping: {params.damping.toFixed(2)}
            </label>
            <input
              className="input"
              type="range"
              min="0"
              max="0.12"
              step="0.01"
              value={params.damping}
              onChange={(e) => updateParams({ damping: Number(e.target.value) })}
            />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Vaqt tezligi: {params.timeScale.toFixed(1)}x
            </label>
            <input
              className="input"
              type="range"
              min="0.4"
              max="2"
              step="0.1"
              value={params.timeScale}
              onChange={(e) => updateParams({ timeScale: Number(e.target.value) })}
            />

            <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setRunning((value) => !value)}>
                {running ? "Pause" : "Play"}
              </button>
              <button className="btn btnGhost" onClick={() => resetSimulation()}>
                Qayta boshlash
              </button>
            </div>

            <div className="h3" style={{ marginTop: 18, color: "white" }}>Tayyor tajribalar</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button
                className="btn btnGhost"
                onClick={() =>
                  applyPreset({
                    length: 1.2,
                    amplitude: 20,
                    gravity: 9.8,
                    damping: 0.01,
                    timeScale: 1,
                  })
                }
              >
                Qisqa mayatnik
              </button>
              <button
                className="btn btnGhost"
                onClick={() =>
                  applyPreset({
                    length: 3.2,
                    amplitude: 25,
                    gravity: 9.8,
                    damping: 0.02,
                    timeScale: 1,
                  })
                }
              >
                Uzun mayatnik
              </button>
              <button
                className="btn btnGhost"
                onClick={() =>
                  applyPreset({
                    length: 2.2,
                    amplitude: 35,
                    gravity: 1.6,
                    damping: 0.01,
                    timeScale: 1,
                  })
                }
              >
                Oy sharoiti
              </button>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div className="h3" style={{ color: "white" }}>Asosiy natijalar</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <span className="badge">Burchak: {telemetry.angleDeg.toFixed(1)}°</span>
              <span className="badge">Tezlik: {telemetry.speed.toFixed(2)} m/s</span>
              <span className="badge">Davr: {period.toFixed(2)} s</span>
            </div>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>
              Kichik amplitudalarda mayatnik davri asosan uzunlik va g ga bog‘liq bo‘ladi.
            </p>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div className="h3" style={{ color: "white" }}>Energiya izohi</div>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.75 }}>
              {energyStateText}
            </p>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.75 }}>
              {dampingText}
            </p>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 16 }}>
          <div
            className="card"
            style={{
              padding: 0,
              overflow: "hidden",
              minHeight: 560,
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.98))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div className="h3" style={{ color: "white" }}>3D tebranish sahnasi</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Mayatnikning real harakati, energiya almashinuvi va burchak o‘zgarishi shu yerda kuzatiladi.
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className="badge">Tebranish</span>
                <span className="badge">Energiya almashinuvi</span>
                <span className="badge">Davrni kuzatish</span>
              </div>
            </div>

            <div style={{ height: 500 }}>
              <Canvas key={sceneKey} camera={{ position: [3.8, 1.8, 5.6], fov: 48 }} shadows>
                <PendulumWorld
                  params={params}
                  running={running}
                  telemetry={telemetry}
                  onTelemetry={setTelemetry}
                />
              </Canvas>
            </div>
          </div>

          <div className="grid" style={{ gap: 16 }}>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Burchak"
                value={`${fmt(telemetry.angleDeg, 1)}°`}
                sub="Joriy og‘ish burchagi"
                accent="#38bdf8"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Tezlik"
                value={`${fmt(telemetry.speed, 2)} m/s`}
                sub="Markazga yaqin joyda tezlik ortadi"
                accent="#22c55e"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Davr"
                value={`${fmt(period, 2)} s`}
                sub="T = 2π√(l/g)"
                accent="#a78bfa"
              />
            </div>
          </div>

          <div className="grid" style={{ gap: 16 }}>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Potensial energiya"
                value={`${fmt(telemetry.pe, 2)} J`}
                sub="Chekkada ko‘proq bo‘ladi"
                accent="#0ea5e9"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Kinetik energiya"
                value={`${fmt(telemetry.ke, 2)} J`}
                sub="Markazda ko‘proq bo‘ladi"
                accent="#f59e0b"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="To‘liq energiya"
                value={`${fmt(telemetry.total, 2)} J`}
                sub="Damping bo‘lsa asta kamayadi"
                accent="#ef4444"
              />
            </div>
          </div>

          <div className="grid" style={{ gap: 16 }}>
            <div className="card" style={{ gridColumn: "span 4" }}>
              <div className="h3">Tushuncha</div>
              <p className="muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
                Mayatnik chekka nuqtalarda deyarli to‘xtaydi, keyin yana markazga qaytadi.
              </p>
            </div>
            <div className="card" style={{ gridColumn: "span 4" }}>
              <div className="h3">Sinab ko‘ring</div>
              <p className="muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
                Uzunlikni 1 m va 3 m qilib solishtiring. Qaysi holatda tebranish sekinroq?
              </p>
            </div>
            <div className="card" style={{ gridColumn: "span 4" }}>
              <div className="h3">Xulosa</div>
              <p className="muted" style={{ lineHeight: 1.7, marginTop: 8 }}>
                Bu model tebranish, energiya almashinuvi va davr formulasini bitta real sahnada ko‘rsatadi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}