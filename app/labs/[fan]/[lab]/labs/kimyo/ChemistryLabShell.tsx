"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ChemistryLabDefinition, ChemistryMode } from "./chemistry-config";

type Point3D = [number, number, number];

export type ChemistryShellConfig = ChemistryLabDefinition;

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

function MovingDot({
  path,
  speed,
  phase,
  color,
}: {
  path: Point3D[];
  speed: number;
  phase: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const tRef = useRef(phase);

  const totalLength = useMemo(() => {
    let length = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const [x1, y1, z1] = path[i];
      const [x2, y2, z2] = path[i + 1];
      length += Math.hypot(x2 - x1, y2 - y1, z2 - z1);
    }
    return length || 1;
  }, [path]);

  function getPoint(t: number): Point3D {
    let distance = (t % 1) * totalLength;
    for (let i = 0; i < path.length - 1; i += 1) {
      const [x1, y1, z1] = path[i];
      const [x2, y2, z2] = path[i + 1];
      const segment = Math.hypot(x2 - x1, y2 - y1, z2 - z1);
      if (distance <= segment || i === path.length - 2) {
        const ratio = segment === 0 ? 0 : distance / segment;
        return [x1 + (x2 - x1) * ratio, y1 + (y2 - y1) * ratio, z1 + (z2 - z1) * ratio];
      }
      distance -= segment;
    }
    return path[path.length - 1];
  }

  useFrame((_, delta) => {
    tRef.current += delta * Math.max(0.12, speed * 0.003);
    const [x, y, z] = getPoint(tRef.current);
    ref.current?.position.set(x, y, z);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 18, 18]} />
      <meshStandardMaterial color={color} emissive={color} />
    </mesh>
  );
}

function BubbleColumn({
  count,
  x,
  z,
  color,
}: {
  count: number;
  x: number;
  z: number;
  color: string;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Bubble key={`${x}-${z}-${index}`} x={x} z={z} phase={index / Math.max(count, 1)} color={color} />
      ))}
    </>
  );
}

function Bubble({ x, z, phase, color }: { x: number; z: number; phase: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(phase);

  useFrame((_, delta) => {
    timeRef.current += delta * 0.6;
    const cycle = timeRef.current % 1;
    const y = 0.2 + cycle * 2.2;
    ref.current?.position.set(x + Math.sin(cycle * Math.PI * 4) * 0.08, y, z);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 12, 12]} />
      <meshStandardMaterial color={color} transparent opacity={0.8} roughness={0.05} metalness={0.1} />
    </mesh>
  );
}

function ChemistryScene({
  mode,
  values,
}: {
  mode: ChemistryMode;
  values: Record<string, number>;
}) {
  const titrationMix = Math.min(1, values.drops / Math.max(values.concentration, 1));
  const beakerColor = new THREE.Color(mode === "titration" ? "#ec4899" : "#38bdf8").lerp(
    new THREE.Color("#f8fafc"),
    mode === "titration" ? titrationMix : 0.15
  );

  const catalystWave = (values.catalyst ?? 50) / 100;
  const path: Point3D[] = [
    [-2.8, 0.15, -1.8],
    [-2.8, 0.15, 1.8],
    [2.8, 0.15, 1.8],
    [2.8, 0.15, -1.8],
    [-2.8, 0.15, -1.8],
  ];

  return (
    <>
      <color attach="background" args={["#08131d"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 3]} intensity={1.2} />
      <hemisphereLight args={["#d8f2ff", "#101f31", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#0d1b2a" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[5.6, 0.16, 3.6]} />
        <meshStandardMaterial color="#243447" roughness={0.7} />
      </mesh>

      {(mode === "titration" || mode === "gas" || mode === "electrolysis" || mode === "reactivity" || mode === "thermo") && (
        <>
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[2.4, 2.2, 1.6]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.18} metalness={0.25} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <boxGeometry args={[2.2, 1.4, 1.4]} />
            <meshStandardMaterial color={beakerColor} transparent opacity={0.72} />
          </mesh>
        </>
      )}

      {mode === "titration" && (
        <>
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 2.4, 20]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color="#f472b6" emissive="#f472b6" />
          </mesh>
          <SceneLabel position={[0, 3.7, 0]} text={`Tomchi = ${values.drops.toFixed(0)}`} />
          <SceneLabel position={[1.6, 1.3, 0]} text={`pH ~= ${(2 + values.drops / 18).toFixed(1)}`} background="rgba(252,231,243,0.96)" />
        </>
      )}

      {mode === "gas" && (
        <>
          <BubbleColumn count={Math.max(4, Math.round(values.reactants / 12))} x={-0.4} z={0} color="#bfdbfe" />
          <BubbleColumn count={Math.max(4, Math.round(values.temperature / 18))} x={0.35} z={0.12} color="#93c5fd" />
          <mesh position={[0, 2.1, 0]}>
            <sphereGeometry args={[0.72 + values.reactants / 180, 24, 24]} />
            <meshStandardMaterial color="#7dd3fc" transparent opacity={0.2} />
          </mesh>
          <SceneLabel position={[0, 3.2, 0]} text={`Bosim = ${((values.reactants * values.temperature) / Math.max(values.vessel, 1)).toFixed(1)} kPa`} />
        </>
      )}

      {mode === "electrolysis" && (
        <>
          <mesh position={[-0.65, 1.25, 0]}>
            <boxGeometry args={[0.16, 1.6, 0.16]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0.65, 1.25, 0]}>
            <boxGeometry args={[0.16, 1.6, 0.16]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <BubbleColumn count={Math.max(3, Math.round(values.voltage / 3))} x={-0.65} z={0} color="#fef08a" />
          <BubbleColumn count={Math.max(3, Math.round(values.ions / 12))} x={0.65} z={0} color="#a5f3fc" />
          <SceneLabel position={[-1.5, 2.2, 0]} text="Katod (-)" background="rgba(224,242,254,0.96)" />
          <SceneLabel position={[1.5, 2.2, 0]} text="Anod (+)" background="rgba(254,226,226,0.96)" />
        </>
      )}

      {mode === "reactivity" && (
        <>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.7, 1, 0.35]} />
            <meshStandardMaterial color="#f59e0b" emissive="#78350f" />
          </mesh>
          <BubbleColumn count={Math.max(3, Math.round((values.metal + values.acid) / 20))} x={0.45} z={0} color="#c4b5fd" />
          <SceneLabel position={[0, 2.3, 0]} text={`Faollik = ${(values.metal * 0.4 + values.acid * 0.35).toFixed(0)} %`} />
        </>
      )}

      {mode === "thermo" && (
        <>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.6 + values.heat / 260, 30, 30]} />
            <meshStandardMaterial color={values.heat > 50 ? "#fb7185" : "#60a5fa"} emissive={values.heat > 50 ? "#be123c" : "#1d4ed8"} transparent opacity={0.7} />
          </mesh>
          <SceneLabel position={[0, 2.3, 0]} text={`dT = ${((values.heat * values.reaction) / Math.max(values.mass, 1) / 3).toFixed(1)} C`} />
        </>
      )}

      {mode === "atom" && (
        <>
          <mesh position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.38, 28, 28]} />
            <meshStandardMaterial color="#f97316" emissive="#ea580c" />
          </mesh>
          {Array.from({ length: Math.max(1, Math.round(values.electrons)) }, (_, index) => (
            <OrbitElectron
              key={index}
              radius={0.9 + (index % Math.max(1, Math.round(values.shells))) * 0.42}
              speed={0.45 + (index % 5) * 0.08}
              phase={index / Math.max(values.electrons, 1)}
            />
          ))}
          <SceneLabel position={[0, 1.9, 0]} text={`p = ${values.protons.toFixed(0)}, e = ${values.electrons.toFixed(0)}`} />
        </>
      )}

      {mode === "periodic" && (
        <>
          <mesh position={[0, 0.65, 0]}>
            <sphereGeometry args={[0.28 + values.group / 22, 28, 28]} />
            <meshStandardMaterial color={values.group < 10 ? "#fbbf24" : "#67e8f9"} emissive="#0f766e" />
          </mesh>
          {Array.from({ length: Math.max(2, Math.round(values.period + 2)) }, (_, index) => (
            <OrbitElectron key={index} radius={0.7 + index * 0.28} speed={0.32 + index * 0.03} phase={index / 10} />
          ))}
          <SceneLabel position={[0, 2.3, 0]} text={`Period ${values.period.toFixed(0)} | Guruh ${values.group.toFixed(0)}`} />
        </>
      )}

      {mode === "organic" && (
        <>
          <OrganicGroup x={-0.9 + values.bond / 120} color="#60a5fa" />
          <OrganicGroup x={0.9 - values.bond / 120} color="#f472b6" />
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.8 * (values.bond / 100), 12]} />
            <meshStandardMaterial color="#f8fafc" emissive="#94a3b8" />
          </mesh>
          <SceneLabel position={[0, 2.1, 0]} text={`Bog hosil bo'lishi = ${values.bond.toFixed(0)} %`} />
        </>
      )}

      {mode === "catalyst" && (
        <>
          <mesh position={[0, 0.45 + (1 - catalystWave) * 0.9, 0]}>
            <torusGeometry args={[1.2, 0.05, 8, 60, Math.PI]} />
            <meshStandardMaterial color="#f59e0b" emissive="#78350f" />
          </mesh>
          {Array.from({ length: 8 }, (_, index) => (
            <MovingDot key={index} path={path} speed={values.particles + values.temp} phase={index / 8} color="#a7f3d0" />
          ))}
          <SceneLabel position={[0, 2.6, 0]} text={`Ea = ${(85 - values.catalyst * 0.45).toFixed(1)} kJ/mol`} />
        </>
      )}

      {mode === "enzyme" && (
        <>
          <mesh position={[-0.2, 0.7, 0]}>
            <torusKnotGeometry args={[0.45, 0.16, 100, 16]} />
            <meshStandardMaterial color="#22c55e" emissive="#166534" />
          </mesh>
          <mesh position={[0.9 - values.substrate / 120, 0.72, 0]}>
            <sphereGeometry args={[0.23, 28, 28]} />
            <meshStandardMaterial color="#f97316" emissive="#9a3412" />
          </mesh>
          <SceneLabel position={[0, 2.1, 0]} text={`Ferment aktivligi = ${Math.max(0, 100 - Math.abs(values.temp - 37) * 3 + values.enzyme * 0.2).toFixed(0)} %`} />
        </>
      )}

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.05} />
    </>
  );
}

function OrbitElectron({ radius, speed, phase }: { radius: number; speed: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const timeRef = useRef(phase);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
    const angle = timeRef.current * Math.PI * 2;
    ref.current?.position.set(Math.cos(angle) * radius, 0.7, Math.sin(angle) * radius);
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.7, 0]}>
        <torusGeometry args={[radius, 0.01, 8, 80]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" />
      </mesh>
    </>
  );
}

function OrganicGroup({ x, color }: { x: number; color: string }) {
  return (
    <group position={[x, 0.75, 0]}>
      <mesh position={[-0.25, 0, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} />
      </mesh>
      <mesh position={[0.25, 0, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.5, 12]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

export default function ChemistryLabShell({ config }: { config: ChemistryShellConfig }) {
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
              <ChemistryScene mode={config.mode} values={values} />
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
