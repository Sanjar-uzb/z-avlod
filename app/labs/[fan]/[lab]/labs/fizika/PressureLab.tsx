"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Params = { voltage: number; resistance: number };

const DEFAULT: Params = { voltage: 12, resistance: 10 };

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

function Electron({ speed, phase }: { speed: number; phase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta * Math.min(Math.max(speed, 0.2), 8);
    if (ref.current) {
      ref.current.position.set(
        Math.cos(tRef.current + phase) * 2.8,
        0.15,
        Math.sin(tRef.current + phase) * 2.8
      );
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#fde047" emissive="#facc15" metalness={0.1} roughness={0.2} />
    </mesh>
  );
}

function OhmScene({
  current,
  voltage,
  resistance,
  electronCount,
}: {
  current: number;
  voltage: number;
  resistance: number;
  electronCount: number;
}) {
  return (
    <>
      <color attach="background" args={["#08131d"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <hemisphereLight args={["#dbeafe", "#102033", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0d1b2a" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[3, 0.05, 16, 100]} />
        <meshStandardMaterial
          color={current > 0.5 ? "#ff4d4d" : "#00aaff"}
          emissive={current > 0.5 ? "#ff8888" : "#88daff"}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.2, 0.35, 0.6]} />
        <meshStandardMaterial color="#8b4500" metalness={0.2} roughness={0.6} />
      </mesh>

      <mesh position={[0, 0.65, -2.4]}>
        <boxGeometry args={[0.6, 0.6, 0.4]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.85, -2.4]}>
        <boxGeometry args={[0.4, 0.2, 0.2]} />
        <meshStandardMaterial color="#f5222d" emissive="#ff9999" metalness={0.5} />
      </mesh>

      <SceneLabel position={[0, 1.45, -2.4]} text={`U = ${voltage.toFixed(1)} V`} />
      <SceneLabel position={[0, 0.98, 0]} text={`R = ${resistance.toFixed(0)} Ω`} background="rgba(254,243,199,0.96)" />
      <SceneLabel position={[2.9, 0.8, 0]} text={`I = ${current.toFixed(2)} A`} background="rgba(224,242,254,0.96)" />

      {Array.from({ length: electronCount }, (_, i) => (
        <Electron key={i} speed={current} phase={(Math.PI * 2 * i) / Math.max(1, electronCount)} />
      ))}

      <OrbitControls enablePan enableZoom />
    </>
  );
}

export default function PressureLab() {
  const [p, setP] = useState(DEFAULT);
  const [electronCount, setElectronCount] = useState(8);

  const current = useMemo(() => (p.resistance > 0 ? p.voltage / p.resistance : 0), [p.voltage, p.resistance]);
  const power = useMemo(() => p.voltage * current, [p.voltage, current]);

  return (
    <div style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="h2">Ohm qonuni (U = I x R)</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Batareya, rezistor va tok orasidagi bogliqlikni kuzating. Endi sahna ichida ham
            `U`, `R` va `I` belgilarini korishingiz mumkin.
          </p>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Batareya kuchlanishi U (V)</div>
              <input className="input" type="number" step="0.1" min="0" value={p.voltage} onChange={(e) => setP((x) => ({ ...x, voltage: Number(e.target.value) }))} />
            </div>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Rezistor R (ohm)</div>
              <input className="input" type="range" min="1" max="100" step="1" value={p.resistance} onChange={(e) => setP((x) => ({ ...x, resistance: Number(e.target.value) }))} />
              <div className="muted" style={{ marginTop: 6 }}>{p.resistance} ohm</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Olchovlar</div>
            <div className="row" style={{ alignItems: "center", gap: 8 }}>
              <span className="badge">U = {p.voltage.toFixed(1)} V</span>
              <span className="badge">R = {p.resistance} ohm</span>
              <span className="badge">I = {current.toFixed(3)} A</span>
              <span className="badge">P = {power.toFixed(2)} W</span>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              Formula: `I = U / R`. Qarshilik kamayganda tok ortadi, shuning uchun zarralar tezroq aylanadi.
            </p>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Belgilar</div>
            <div className="row" style={{ gap: 8 }}>
              <span className="badge">U - kuchlanish</span>
              <span className="badge">R - qarshilik</span>
              <span className="badge">I - tok kuchi</span>
              <span className="badge">P - quvvat</span>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Elektronlar soni</div>
            <input className="input" type="range" min="1" max="24" step="1" value={electronCount} onChange={(e) => setElectronCount(Number(e.target.value))} />
            <div className="muted" style={{ marginTop: 6 }}>{electronCount} ta zarralar korsatiladi</div>
          </div>
        </div>

        <div style={{ width: "min(740px, 100%)", height: 520, marginLeft: 12, flex: 1, minWidth: 320 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
            <Canvas camera={{ position: [5, 3, 6], fov: 55 }}>
              <OhmScene current={current} voltage={p.voltage} resistance={p.resistance} electronCount={electronCount} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
