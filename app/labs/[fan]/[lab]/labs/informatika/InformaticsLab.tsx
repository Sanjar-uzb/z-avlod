"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { informaticsLabs, type InformaticsLabDefinition, type InformaticsMode } from "./informatics-config";

type LabEntry = { fan: string; lab: string; title: string; desc: string };

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

function PulseBox({
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
    const target = 0.7 + scale;
    ref.current.scale.x += (target - ref.current.scale.x) * delta * 2;
    ref.current.scale.y += (target - ref.current.scale.y) * delta * 2;
    ref.current.scale.z += (target - ref.current.scale.z) * delta * 2;
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color={color} emissive={color} />
    </mesh>
  );
}

function OrbitNode({
  radius,
  speed,
  height,
  color,
  phase,
}: {
  radius: number;
  speed: number;
  height: number;
  color: string;
  phase: number;
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

function FlowBar({
  index,
  height,
  color,
}: {
  index: number;
  height: number;
  color: string;
}) {
  return (
    <mesh position={[-2.2 + index * 1.1, height / 2, 0]}>
      <boxGeometry args={[0.65, height, 0.65]} />
      <meshStandardMaterial color={color} emissive={color} />
    </mesh>
  );
}

function InformaticsScene({
  mode,
  values,
}: {
  mode: InformaticsMode;
  values: Record<string, number>;
}) {
  return (
    <>
      <color attach="background" args={["#08131d"]} />
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

      {mode === "complexity" && (
        <>
          <FlowBar index={0} height={1 + values.size / 45} color="#38bdf8" />
          <FlowBar index={1} height={1.2 + values.size / 34 - values.optimization / 180} color="#22c55e" />
          <FlowBar index={2} height={1 + (values.size * values.size) / 2600} color="#ef4444" />
          <SceneLabel position={[-2.2, 3.1, 0]} text="O(n)" />
          <SceneLabel position={[-1.1, 3.1, 0]} text="O(n log n)" />
          <SceneLabel position={[0, 3.1, 0]} text="O(n^2)" />
        </>
      )}

      {mode === "structures" && (
        <>
          {Array.from({ length: 5 }, (_, i) => (
            <PulseBox key={`s-${i}`} position={[-2.4, 0.35 + i * 0.45, 0]} scale={values.operations / 220} color="#38bdf8" />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <PulseBox key={`q-${i}`} position={[-0.8 + i * 0.45, 0.35, 0]} scale={values.nodes / 260} color="#f59e0b" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <PulseBox key={`t-${i}`} position={[1.6 + (i % 2) * 0.5 - (Math.floor(i / 4) * 0.25), 0.35 + Math.floor(i / 2) * 0.55, (i % 2) * 0.45 - 0.2]} scale={values.depth / 280} color="#22c55e" />
          ))}
          <SceneLabel position={[-2.4, 3, 0]} text="Stack" />
          <SceneLabel position={[0, 1.4, 0]} text="Queue" />
          <SceneLabel position={[2.1, 3, 0]} text="Tree" />
        </>
      )}

      {mode === "recursion" && (
        <>
          {Array.from({ length: 3 }, (_, i) => (
            <PulseBox key={`r1-${i}`} position={[0, 2.4 - i * 0.7, 0]} scale={values.depth / 280} color="#38bdf8" />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <PulseBox key={`r2-${i}`} position={[-1.6 + i * 1.05, 1.1, 0]} scale={values.branching / 320} color="#f472b6" />
          ))}
          <SceneLabel position={[0, 3.2, 0]} text={`Call count = ${(values.depth * values.branching / 20).toFixed(0)}`} />
        </>
      )}

      {mode === "graph" && (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <OrbitNode key={i} radius={1.2 + (i % 3) * 0.5} speed={0.12 + values.search / 500} height={0.9 + (i % 2) * 0.5} color={i % 2 === 0 ? "#22c55e" : "#60a5fa"} phase={i / 8} />
          ))}
          <SceneLabel position={[0, 3, 0]} text={`Connectivity = ${(values.edges * 0.9).toFixed(0)} %`} />
        </>
      )}

      {mode === "crypto" && (
        <>
          {Array.from({ length: 6 }, (_, i) => (
            <PulseBox key={i} position={[-2 + i * 0.8, 0.6 + (i % 2) * 0.6, 0]} scale={(values.rounds + values.key) / 420} color={i % 2 === 0 ? "#f59e0b" : "#22c55e"} />
          ))}
          <SceneLabel position={[0, 2.8, 0]} text={`Key = ${(values.key * 1.28).toFixed(0)} bit`} />
        </>
      )}

      {mode === "number" && (
        <>
          {Array.from({ length: Math.max(4, Math.round(values.bits)) }, (_, i) => (
            <PulseBox key={i} position={[-2.2 + i * 0.55, 0.7, 0]} scale={((Math.round(values.value) >> i) & 1) ? 0.5 : 0.08} color={((Math.round(values.value) >> i) & 1) ? "#38bdf8" : "#334155"} />
          ))}
          <SceneLabel position={[0, 2.5, 0]} text={`0x${Math.round(values.value).toString(16).toUpperCase()}`} />
        </>
      )}

      {mode === "security" && (
        <>
          {Array.from({ length: 8 }, (_, i) => (
            <PulseBox key={`a-${i}`} position={[-2 + i * 0.5, 0.7, -0.7]} scale={values.attacks / 260} color="#ef4444" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <PulseBox key={`f-${i}`} position={[-2 + i * 0.5, 0.7, 0.7]} scale={(values.firewall + values.sanitize) / 340} color="#22c55e" />
          ))}
          <SceneLabel position={[0, 2.8, 0]} text={`Blocked = ${Math.min(100, values.firewall * 0.6 + values.sanitize * 0.4).toFixed(0)} %`} />
        </>
      )}

      {mode === "ai" && (
        <>
          {Array.from({ length: 4 }, (_, i) => (
            <OrbitNode key={`i-${i}`} radius={0.9} speed={0.14} height={0.6 + i * 0.4} color="#38bdf8" phase={i / 5} />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <OrbitNode key={`h-${i}`} radius={1.5} speed={0.16} height={0.5 + (i % 3) * 0.5} color="#22c55e" phase={i / 6} />
          ))}
          {Array.from({ length: 3 }, (_, i) => (
            <OrbitNode key={`o-${i}`} radius={2.1} speed={0.18} height={0.8 + i * 0.55} color="#f59e0b" phase={i / 4} />
          ))}
          <SceneLabel position={[0, 3.3, 0]} text={`Accuracy = ${Math.min(99, values.data * 0.55 + values.neurons * 0.25 + values.learning * 0.15).toFixed(0)} %`} />
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
            <PulseBox key={`q-${i}`} position={[-2.2 + i * 0.9, 2.1, 0]} scale={values.query / 300} color="#f472b6" />
          ))}
          <SceneLabel position={[0, 3.1, 0]} text={`Query = ${(values.query * 0.9 + values.relations * 0.3).toFixed(0)} ms`} />
        </>
      )}

      {mode === "parallel" && (
        <>
          {Array.from({ length: Math.round(values.threads) }, (_, i) => (
            <mesh key={i} position={[-2.4 + i * (4.8 / Math.max(Math.round(values.threads) - 1, 1)), 0.9, 0]}>
              <boxGeometry args={[0.32, 1.4 + values.workload / 120, 0.32]} />
              <meshStandardMaterial color="#38bdf8" emissive="#2563eb" />
            </mesh>
          ))}
          <mesh position={[0, 2.5, 0]}>
            <torusGeometry args={[1.2, 0.08, 10, 80, Math.PI * (values.sync / 100 + 0.2)]} />
            <meshStandardMaterial color="#f59e0b" emissive="#78350f" />
          </mesh>
          <SceneLabel position={[0, 3.4, 0]} text={`Speedup = ${Math.max(1, (values.workload * 1.3) / Math.max(8, values.workload * 1.2 / Math.max(values.threads, 1) + values.sync * 0.5)).toFixed(2)}x`} />
        </>
      )}

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

export default function InformaticsLab({ entry }: { entry: LabEntry }) {
  const definition: InformaticsLabDefinition | undefined = informaticsLabs[entry.lab];
  const [values, setValues] = useState<Record<string, number>>(definition?.defaults ?? {});

  if (!definition) {
    return (
      <div style={{ padding: 16 }}>
        <div className="card">
          <div className="h2">Informatika laboratoriyasi topilmadi</div>
          <p className="muted" style={{ marginTop: 8 }}>Bu slug uchun konfiguratsiya hali tayyor emas.</p>
        </div>
      </div>
    );
  }

  const metrics = definition.metrics(values);

  return (
    <div style={{ padding: 16 }}>
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 12" }}>
          <div className="h2">{definition.title}</div>
          <p className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>{definition.summary}</p>
          <div className="row" style={{ marginTop: 12 }}>
            {definition.badges.map((badge) => (
              <span key={badge} className="badge">{badge}</span>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 14 }}>
          <div className="card">
            <div className="h3">Boshqaruv</div>
            {definition.controls.map((control) => (
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
            {definition.steps.map((step, index) => (
              <div key={step} className="module" style={{ marginTop: index === 0 ? 10 : 8 }}>
                <div className="moduleTitle">{index + 1}-qadam</div>
                <div className="muted">{step}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="h3">Kuzatuv</div>
            <p className="muted" style={{ lineHeight: 1.7 }}>{definition.insight(values)}</p>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: 520 }}>
            <Canvas camera={{ position: [5.8, 4.2, 6.4], fov: 44 }}>
              <InformaticsScene mode={definition.mode} values={values} />
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
