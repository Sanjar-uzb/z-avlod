"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { BiologyLabDefinition, BiologyMode } from "./biology-config";

export type BiologyShellConfig = BiologyLabDefinition;

function SceneLabel({
  position,
  text,
  background = "rgba(255,255,255,0.94)",
}: {
  position: [number, number, number];
  text: string;
  background?: string;
}) {
  return (
    <Html position={position} center distanceFactor={8}>
      <div
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          background,
          color: "#0f172a",
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
          boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
        }}
      >
        {text}
      </div>
    </Html>
  );
}

function FlowDot({
  radius,
  height,
  speed,
  phase,
  color,
}: {
  radius: number;
  height: number;
  speed: number;
  phase: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const tRef = useRef(phase);

  useFrame((_, delta) => {
    tRef.current += delta * speed;
    const angle = tRef.current * Math.PI * 2;
    ref.current?.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 14, 14]} />
      <meshStandardMaterial color={color} emissive={color} />
    </mesh>
  );
}

function RisingParticle({
  x,
  z,
  color,
  speed = 0.6,
  spread = 0.08,
  phase = 0,
}: {
  x: number;
  z: number;
  color: string;
  speed?: number;
  spread?: number;
  phase?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(phase);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    const cycle = timeRef.current % 1;
    ref.current?.position.set(x + Math.sin(cycle * Math.PI * 4) * spread, 0.2 + cycle * 2.3, z);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} transparent opacity={0.84} />
    </mesh>
  );
}

function DoubleHelix({
  openFactor,
  strandFactor,
}: {
  openFactor: number;
  strandFactor: number;
}) {
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const t = i / 13;
        const angle = t * Math.PI * 6;
        const spread = 0.7 + openFactor * 0.5;
        const y = 0.25 + t * 2.6;
        const x1 = Math.cos(angle) * spread;
        const z1 = Math.sin(angle) * 0.55;
        const x2 = -Math.cos(angle) * spread;
        const z2 = -Math.sin(angle) * 0.55;

        return (
          <group key={i}>
            <mesh position={[x1, y, z1]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#60a5fa" emissive="#2563eb" />
            </mesh>
            <mesh position={[x2, y, z2]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#f472b6" emissive="#be185d" />
            </mesh>
            <mesh position={[0, y, 0]} rotation={[0, angle, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, spread * 2 * strandFactor, 10]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function BiologyScene({
  mode,
  values,
}: {
  mode: BiologyMode;
  values: Record<string, number>;
}) {
  return (
    <>
      <color attach="background" args={["#07131d"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 4]} intensity={1.2} />
      <hemisphereLight args={["#d8f2ff", "#102033", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#0d1b2a" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[6.2, 0.16, 4]} />
        <meshStandardMaterial color="#213547" roughness={0.7} />
      </mesh>

      {mode === "photosynthesis" && (
        <>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[1.35, 36, 36]} />
            <meshStandardMaterial color="#22c55e" emissive="#166534" transparent opacity={0.75} />
          </mesh>
          {Array.from({ length: Math.max(4, Math.round(values.light / 18)) }, (_, i) => (
            <mesh key={i} position={[-2.6 + i * 0.5, 2.9, -0.6 + (i % 2) * 1.2]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#fde047" emissive="#facc15" />
            </mesh>
          ))}
          {Array.from({ length: Math.max(4, Math.round(values.co2 / 18)) }, (_, i) => (
            <RisingParticle key={`o-${i}`} x={-0.5 + (i % 4) * 0.35} z={0} color="#bfdbfe" speed={0.4 + i * 0.02} phase={i / 8} />
          ))}
          <SceneLabel position={[0, 2.7, 0]} text={`O2 = ${((values.light + values.co2 + values.water) / 30).toFixed(1)}`} />
        </>
      )}

      {mode === "cell" && (
        <>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[1.8, 40, 40]} />
            <meshStandardMaterial color="#93c5fd" transparent opacity={0.28} />
          </mesh>
          {Array.from({ length: Math.round(values.nucleus) }, (_, i) => (
            <mesh key={i} position={[i * 0.25 - 0.15, 1.1, 0]}>
              <sphereGeometry args={[0.42, 24, 24]} />
              <meshStandardMaterial color="#a855f7" emissive="#7e22ce" />
            </mesh>
          ))}
          {Array.from({ length: Math.round(values.mitochondria) }, (_, i) => (
            <mesh key={`m-${i}`} position={[-1 + (i % 4) * 0.65, 0.55 + Math.floor(i / 4) * 0.45, -0.6 + (i % 2) * 1.1]}>
              <sphereGeometry args={[0.14, 18, 18]} />
              <meshStandardMaterial color="#f97316" emissive="#c2410c" />
            </mesh>
          ))}
          {Array.from({ length: Math.round(values.ribosomes / 4) }, (_, i) => (
            <mesh key={`r-${i}`} position={[-1.2 + (i % 5) * 0.5, 1.65 - (i % 3) * 0.3, -0.8 + (i % 4) * 0.4]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}
          <SceneLabel position={[0, 3.2, 0]} text={`ATP = ${(values.mitochondria * 8).toFixed(0)} %`} />
        </>
      )}

      {mode === "dna" && (
        <>
          <DoubleHelix openFactor={values.helicase / 100} strandFactor={values.polymerase / 100} />
          <SceneLabel position={[0, 3.2, 0]} text={`Nusxa aniqligi = ${Math.min(99, 60 + values.polymerase * 0.35).toFixed(0)} %`} />
        </>
      )}

      {mode === "microbiome" && (
        <>
          <mesh position={[0, 0.85, 0]}>
            <torusGeometry args={[1.8, 0.45, 24, 80, Math.PI * 1.65]} />
            <meshStandardMaterial color="#fb7185" emissive="#be123c" />
          </mesh>
          {Array.from({ length: Math.max(6, Math.round(values.probiotic / 8)) }, (_, i) => (
            <mesh key={`p-${i}`} position={[-1.2 + (i % 6) * 0.45, 0.65 + Math.floor(i / 6) * 0.25, -0.4 + (i % 3) * 0.4]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color="#22c55e" emissive="#166534" />
            </mesh>
          ))}
          {Array.from({ length: Math.max(3, Math.round(values.harmful / 14)) }, (_, i) => (
            <mesh key={`h-${i}`} position={[-0.8 + (i % 4) * 0.5, 0.55 + Math.floor(i / 4) * 0.32, 0.4]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#f97316" emissive="#9a3412" />
            </mesh>
          ))}
          <SceneLabel position={[0, 2.9, 0]} text={`Muvozanat = ${Math.max(0, values.probiotic + values.fiber * 0.4 - values.harmful * 0.6).toFixed(0)} %`} />
        </>
      )}

      {mode === "ecosystem" && (
        <>
          <mesh position={[0, 0.4, 0]}>
            <coneGeometry args={[1.6, 2.4, 4]} />
            <meshStandardMaterial color="#22c55e" emissive="#14532d" />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <coneGeometry args={[1.15, 1.7, 4]} />
            <meshStandardMaterial color="#f59e0b" emissive="#78350f" />
          </mesh>
          <mesh position={[0, 2.1, 0]}>
            <coneGeometry args={[0.7, 1.2, 4]} />
            <meshStandardMaterial color="#ef4444" emissive="#991b1b" />
          </mesh>
          <SceneLabel position={[0, 3.3, 0]} text={`Barqarorlik = ${Math.max(0, 100 - Math.abs(values.plants - values.herbivores) - Math.abs(values.predators - 30)).toFixed(0)} %`} />
        </>
      )}

      {mode === "neuron" && (
        <>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.55, 28, 28]} />
            <meshStandardMaterial color="#a855f7" emissive="#6b21a8" />
          </mesh>
          <mesh position={[1.6, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 3.2, 18]} />
            <meshStandardMaterial color="#93c5fd" />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => (
            <FlowDot key={i} radius={0.35 + i * 0.32} height={1.1} speed={0.25 + values.speed / 250} phase={i / 8} color="#facc15" />
          ))}
          <SceneLabel position={[0, 3, 0]} text={`Impuls = ${(values.stimulus * 0.7 + values.synapse * 0.3).toFixed(0)} %`} />
        </>
      )}

      {mode === "circulation" && (
        <>
          <mesh position={[0, 1.25, 0]}>
            <sphereGeometry args={[0.7, 28, 28]} />
            <meshStandardMaterial color="#ef4444" emissive="#991b1b" />
          </mesh>
          {Array.from({ length: 10 }, (_, i) => (
            <FlowDot key={i} radius={1.4 + (i % 3) * 0.28} height={1.1 + (i % 2) * 0.2} speed={values.heartbeat / 220} phase={i / 10} color="#fca5a5" />
          ))}
          <SceneLabel position={[0, 3.1, 0]} text={`Qon oqimi = ${(values.heartbeat * values.vessel / 100).toFixed(0)} %`} />
        </>
      )}

      {mode === "genetics" && (
        <>
          <mesh position={[-0.8, 1.1, 0]}>
            <boxGeometry args={[0.9, 1.6, 0.14]} />
            <meshStandardMaterial color="#60a5fa" />
          </mesh>
          <mesh position={[0.8, 1.1, 0]}>
            <boxGeometry args={[0.9, 1.6, 0.14]} />
            <meshStandardMaterial color="#f472b6" />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[0, 0.45 + i * 0.28, 0]}>
              <boxGeometry args={[1.6, 0.06, 0.1]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#f8fafc" : "#fde047"} />
            </mesh>
          ))}
          <SceneLabel position={[0, 3.1, 0]} text={`Dominant fenotip = ${(values.dominant * 0.75).toFixed(0)} %`} />
        </>
      )}

      {mode === "food" && (
        <>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[2.6, 0.5, 1.8]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
          <mesh position={[0, 1.05, 0]}>
            <boxGeometry args={[1.9, 0.45, 1.3]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[0, 1.62, 0]}>
            <boxGeometry args={[1.1, 0.4, 0.9]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
          <SceneLabel position={[0, 2.8, 0]} text={`Energiya yo'qotish = ${values.loss.toFixed(0)} %`} />
        </>
      )}

      {mode === "microbe" && (
        <>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 1.9, 28]} />
            <meshStandardMaterial color="#bfdbfe" transparent opacity={0.22} />
          </mesh>
          {Array.from({ length: Math.max(8, Math.round(values.bacteria / 6)) }, (_, i) => (
            <mesh key={`b-${i}`} position={[-1 + (i % 6) * 0.35, 0.25 + Math.floor(i / 6) * 0.28, -0.45 + (i % 3) * 0.45]}>
              <sphereGeometry args={[0.08 + (i % 2) * 0.03, 12, 12]} />
              <meshStandardMaterial color="#f97316" emissive="#c2410c" />
            </mesh>
          ))}
          <mesh position={[0, 1.9, 0]}>
            <sphereGeometry args={[0.35 + values.antibiotic / 180, 24, 24]} />
            <meshStandardMaterial color="#22c55e" transparent opacity={0.2} />
          </mesh>
          <SceneLabel position={[0, 3.05, 0]} text={`Koloniya = ${Math.max(0, values.bacteria - values.antibiotic * 0.7 + values.resistance * 0.4).toFixed(0)} %`} />
        </>
      )}

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

export default function BiologyLabShell({ config }: { config: BiologyShellConfig }) {
  const [values, setValues] = useState<Record<string, number>>(config.defaults);
  const metrics = config.metrics(values);

  return (
    <div style={{ padding: 16 }}>
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 12" }}>
          <div className="h2">{config.title}</div>
          <p className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>{config.summary}</p>
          <div className="row" style={{ marginTop: 12 }}>
            {config.badges.map((badge) => (
              <span key={badge} className="badge">{badge}</span>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 14 }}>
          <div className="card">
            <div className="h3">Boshqaruv</div>
            {config.controls.map((control) => (
              <div key={control.key} style={{ marginTop: 12 }}>
                <label className="muted">
                  {control.label}: {values[control.key].toFixed(control.step < 1 ? 1 : 0)} {control.unit}
                </label>
                <input
                  className="input"
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={values[control.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [control.key]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>

          <div className="card">
            <div className="h3">Amaliy qadamlar</div>
            {config.steps.map((step, index) => (
              <div key={step} className="module" style={{ marginTop: index === 0 ? 10 : 8 }}>
                <div className="moduleTitle">{index + 1}-qadam</div>
                <div className="muted">{step}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="h3">Kuzatuv</div>
            <p className="muted" style={{ lineHeight: 1.7 }}>{config.insight(values)}</p>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: 520 }}>
            <Canvas camera={{ position: [5.8, 4.2, 6.4], fov: 44 }}>
              <BiologyScene mode={config.mode} values={values} />
            </Canvas>
          </div>

          <div className="grid">
            {metrics.map((metric) => (
              <div key={metric.label} className="card" style={{ gridColumn: "span 4" }}>
                <div className="h3">{metric.label}</div>
                <div className="h2" style={{ marginBottom: 0 }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
