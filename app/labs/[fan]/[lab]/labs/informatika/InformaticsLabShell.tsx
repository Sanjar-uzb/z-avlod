"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

export type InformaticsLabMode =
  | "complexity"
  | "structures"
  | "recursion"
  | "graph"
  | "packet"
  | "encryption"
  | "bruteforce"
  | "ai"
  | "database"
  | "hardware";

export type LabControl = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
};

export type LabMetric = {
  label: string;
  value: string;
};

export type InformaticsLabConfig = {
  title: string;
  summary: string;
  mode: InformaticsLabMode;
  defaults: Record<string, number>;
  controls: LabControl[];
  badges: string[];
  steps: string[];
  metrics: (values: Record<string, number>) => LabMetric[];
  insight: (values: Record<string, number>) => string;
};

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

function MovingCube({
  from,
  to,
  speed,
  phase,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  speed: number;
  phase: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(phase);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    const t = (Math.sin(timeRef.current) + 1) / 2;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    const z = from[2] + (to[2] - from[2]) * t;
    ref.current?.position.set(x, y, z);
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.18, 0.18, 0.18]} />
      <meshStandardMaterial color={color} emissive={color} />
    </mesh>
  );
}

function OrbitNode({
  radius,
  speed,
  height,
  phase,
  color,
}: {
  radius: number;
  speed: number;
  height: number;
  phase: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(phase);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    const angle = timeRef.current * Math.PI * 2;
    ref.current?.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} />
    </mesh>
  );
}

function PulseBlock({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = 0.75 + scale;
    ref.current.scale.x += (target - ref.current.scale.x) * delta * 2;
    ref.current.scale.y += (target - ref.current.scale.y) * delta * 2;
    ref.current.scale.z += (target - ref.current.scale.z) * delta * 2;
  });

  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.45, 0.45, 0.45]} />
      <meshStandardMaterial color={color} emissive={color} />
    </mesh>
  );
}

function InformaticsScene({
  mode,
  values,
}: {
  mode: InformaticsLabMode;
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
        <boxGeometry args={[6.4, 0.16, 4.2]} />
        <meshStandardMaterial color="#213547" roughness={0.7} />
      </mesh>

      {mode === "packet" && (
        <>
          <mesh position={[-2.2, 1, 0]}>
            <boxGeometry args={[1.2, 2.1, 1.1]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0c4a6e" />
          </mesh>
          <mesh position={[2.2, 1, 0]}>
            <boxGeometry args={[1.2, 2.1, 1.1]} />
            <meshStandardMaterial color="#22c55e" emissive="#14532d" />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <MovingCube key={i} from={[-1.5, 1, 0]} to={[1.5, 1, 0]} speed={0.4 + values.rate / 180} phase={i / 4} color={i % 2 === 0 ? "#f59e0b" : "#f472b6"} />
          ))}
          <SceneLabel position={[-2.2, 2.5, 0]} text="Client" />
          <SceneLabel position={[2.2, 2.5, 0]} text="Server" />
          <SceneLabel position={[0, 2.7, 0]} text={values.protocol > 50 ? "TCP paketlari" : "UDP paketlari"} />
        </>
      )}

      {mode === "encryption" && (
        <>
          <mesh position={[-2.1, 1, 0]}>
            <boxGeometry args={[1.4, 1.6, 0.3]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <torusKnotGeometry args={[0.55, 0.16, 100, 16]} />
            <meshStandardMaterial color="#f59e0b" emissive="#78350f" />
          </mesh>
          <mesh position={[2.1, 1, 0]}>
            <boxGeometry args={[1.4, 1.6, 0.3]} />
            <meshStandardMaterial color="#22c55e" emissive="#14532d" />
          </mesh>
          <SceneLabel position={[-2.1, 2.3, 0]} text="Plaintext" />
          <SceneLabel position={[0, 2.5, 0]} text={values.algorithm > 50 ? "RSA" : "AES"} />
          <SceneLabel position={[2.1, 2.3, 0]} text="Ciphertext" />
        </>
      )}

      {mode === "bruteforce" && (
        <>
          <mesh position={[0, 1.5, 0]}>
            <torusGeometry args={[0.7, 0.14, 12, 60]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1, 1.1, 0.6]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => (
            <PulseBlock key={i} position={[-2.4 + (i % 6) * 0.8, 0.5 + Math.floor(i / 6) * 0.7, 0]} scale={values.attempts / 260} color="#ef4444" />
          ))}
          <SceneLabel position={[0, 2.8, 0]} text={`Parol uzunligi = ${Math.round(values.length)}`} />
        </>
      )}

      {mode === "ai" && (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <OrbitNode key={`i-${i}`} radius={0.9} speed={0.14} height={0.7 + i * 0.35} phase={i / 5} color="#38bdf8" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <OrbitNode key={`h-${i}`} radius={1.5} speed={0.16} height={0.6 + (i % 3) * 0.5} phase={i / 6} color="#22c55e" />
          ))}
          {Array.from({ length: 3 }, (_, i) => (
            <OrbitNode key={`o-${i}`} radius={2.1} speed={0.18} height={0.8 + i * 0.55} phase={i / 4} color="#f59e0b" />
          ))}
          <SceneLabel position={[0, 3.3, 0]} text={`Natija = ${Math.min(99, values.data * 0.55 + values.model * 0.25 + values.learning * 0.15).toFixed(0)} %`} />
        </>
      )}

      {mode === "hardware" && (
        <>
          <mesh position={[-1.2, 1, 0]}>
            <boxGeometry args={[1.8, 1.8, 0.22]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0c4a6e" />
          </mesh>
          <mesh position={[1.6, 1, 0]}>
            <boxGeometry args={[0.42, 2.2, 1.2]} />
            <meshStandardMaterial color="#22c55e" emissive="#14532d" />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <MovingCube key={i} from={[-0.2, 1, 0]} to={[1.1, 1, 0]} speed={0.5 + values.bus / 180} phase={i / 6} color="#fde047" />
          ))}
          <SceneLabel position={[-1.2, 2.4, 0]} text={`CPU ${values.cpu.toFixed(0)} %`} />
          <SceneLabel position={[1.6, 2.6, 0]} text={`RAM ${values.ram.toFixed(0)} %`} />
        </>
      )}

      {mode === "graph" && (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <OrbitNode key={i} radius={1.1 + (i % 3) * 0.5} speed={0.12 + values.speed / 500} height={0.9 + (i % 2) * 0.5} phase={i / 8} color={i % 2 === 0 ? "#22c55e" : "#60a5fa"} />
          ))}
          <SceneLabel position={[0, 3, 0]} text={`Qisqa yo'l = ${Math.max(2, 12 - values.edges / 12).toFixed(0)} qadam`} />
        </>
      )}

      {mode === "structures" && (
        <>
          {Array.from({ length: 5 }, (_, i) => (
            <PulseBlock key={`s-${i}`} position={[-2.4, 0.35 + i * 0.45, 0]} scale={values.operations / 220} color="#38bdf8" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <PulseBlock key={`q-${i}`} position={[-0.8 + i * 0.45, 0.35, 0]} scale={values.items / 260} color="#f59e0b" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <PulseBlock key={`t-${i}`} position={[1.6 + (i % 2) * 0.5 - (Math.floor(i / 4) * 0.25), 0.35 + Math.floor(i / 2) * 0.55, (i % 2) * 0.45 - 0.2]} scale={values.depth / 280} color="#22c55e" />
          ))}
          <SceneLabel position={[-2.4, 3, 0]} text="Stack" />
          <SceneLabel position={[0, 1.4, 0]} text="Queue" />
          <SceneLabel position={[2.1, 3, 0]} text="Tree" />
        </>
      )}

      {mode === "recursion" && (
        <>
          {Array.from({ length: 3 }, (_, i) => (
            <PulseBlock key={`r1-${i}`} position={[0, 2.4 - i * 0.7, 0]} scale={values.depth / 280} color="#38bdf8" />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <PulseBlock key={`r2-${i}`} position={[-1.6 + i * 1.05, 1.1, 0]} scale={values.branching / 320} color="#f472b6" />
          ))}
          <SceneLabel position={[0, 3.2, 0]} text={`Call count = ${(values.depth * values.branching / 20).toFixed(0)}`} />
        </>
      )}

      {mode === "database" && (
        <>
          {Array.from({ length: 3 }, (_, i) => (
            <mesh key={`t-${i}`} position={[-2 + i * 2, 0.7 + i * 0.25, 0]}>
              <boxGeometry args={[1.2, 0.7, 0.3]} />
              <meshStandardMaterial color={i === 0 ? "#38bdf8" : i === 1 ? "#22c55e" : "#f59e0b"} emissive="#0f172a" />
            </mesh>
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <MovingCube key={i} from={[-2, 1.8, 0]} to={[2, 1.8, 0]} speed={0.3 + values.query / 250} phase={i / 5} color="#f472b6" />
          ))}
          <SceneLabel position={[0, 3.1, 0]} text={`Query = ${(values.query * 0.9 + values.relations * 0.3).toFixed(0)} ms`} />
        </>
      )}

      {mode === "complexity" && (
        <>
          <mesh position={[-2, 1.2, 0]}>
            <boxGeometry args={[0.7, 2 + values.size / 50, 0.7]} />
            <meshStandardMaterial color="#38bdf8" emissive="#2563eb" />
          </mesh>
          <mesh position={[-0.8, 1.4, 0]}>
            <boxGeometry args={[0.7, 2.2 + values.size / 34 - values.optimization / 180, 0.7]} />
            <meshStandardMaterial color="#22c55e" emissive="#166534" />
          </mesh>
          <mesh position={[0.4, 1.4, 0]}>
            <boxGeometry args={[0.7, 2 + (values.size * values.size) / 2600, 0.7]} />
            <meshStandardMaterial color="#ef4444" emissive="#991b1b" />
          </mesh>
          <SceneLabel position={[-2, 3.6, 0]} text="O(n)" />
          <SceneLabel position={[-0.8, 3.8, 0]} text="O(n log n)" />
          <SceneLabel position={[0.4, 4, 0]} text="O(n^2)" />
        </>
      )}

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

export default function InformaticsLabShell({ config }: { config: InformaticsLabConfig }) {
  const [values, setValues] = useState<Record<string, number>>(config.defaults);
  const metrics = useMemo(() => config.metrics(values), [config, values]);

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
              <InformaticsScene mode={config.mode} values={values} />
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
