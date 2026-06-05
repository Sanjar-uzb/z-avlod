"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import SubjectNav from "../SubjectNav";

type Params = {
  densityObject: number;
  densityLiquid: number;
  volume: number;
};

const DEFAULT: Params = {
  densityObject: 700,
  densityLiquid: 1000,
  volume: 0.004,
};

function LiquidScene({
  params,
  floatRatio,
}: {
  params: Params;
  floatRatio: number;
}) {
  const cubeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!cubeRef.current) return;
    const targetY = 0.3 + (1 - floatRatio) * 1.1;
    cubeRef.current.position.y += (targetY - cubeRef.current.position.y) * 0.08;
  });

  const liquidColor = params.densityLiquid >= 1000 ? "#38bdf8" : "#67e8f9";

  return (
    <>
      <color attach="background" args={["#08141d"]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 3]} intensity={1.2} />
      <hemisphereLight args={["#d7f5ff", "#0d2133", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#102033" roughness={0.96} />
      </mesh>

      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[4.2, 2.8, 2.2]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.28} roughness={0.2} metalness={0.2} />
      </mesh>

      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[4, 2, 2]} />
        <meshStandardMaterial color={liquidColor} transparent opacity={0.65} roughness={0.12} metalness={0.05} />
      </mesh>

      <mesh ref={cubeRef} position={[0, 0.8, 0]}>
        <boxGeometry args={[0.72, 0.72, 0.72]} />
        <meshStandardMaterial color="#f97316" emissive="#7c2d12" roughness={0.28} metalness={0.12} />
      </mesh>

      <mesh position={[2.1, 1.8, 0]}>
        <boxGeometry args={[0.06, 2.2, 0.06]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>

      <mesh position={[2.1, 0.5 + floatRatio * 1.0, 0]}>
        <boxGeometry args={[0.24, 0.05, 0.12]} />
        <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" />
      </mesh>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.08} />
    </>
  );
}

export default function BuoyancyLab() {
  const [params, setParams] = useState(DEFAULT);

  const g = 9.8;
  const mass = params.densityObject * params.volume;
  const weight = mass * g;
  const buoyancy = params.densityLiquid * params.volume * g;
  const floatRatio = Math.min(1, params.densityLiquid / Math.max(params.densityObject, 1));
  const stateText =
    params.densityObject < params.densityLiquid
      ? "Jism suzadi"
      : params.densityObject === params.densityLiquid
      ? "Jism suyuqlik ichida muallaq turadi"
      : "Jism chokadi";

  const explanation = useMemo(() => {
    if (params.densityObject < params.densityLiquid) {
      return "Jism zichligi suyuqlik zichligidan kichik, shuning uchun Arximed kuchi uni yuqoriga kotaradi.";
    }
    if (params.densityObject === params.densityLiquid) {
      return "Jism va suyuqlik zichligi teng. Ogirlik va kotaruvchi kuch bir-birini muvozanatlaydi.";
    }
    return "Jism zichligi suyuqlikdan katta. Ogirlik kuchi ustun kelgani uchun jism pastga tushadi.";
  }, [params.densityLiquid, params.densityObject]);

  return (
    <div style={{ padding: 16 }}>
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 12" }}>
          <div className="h2">Arximed kuchi va suzish</div>
          <p className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
            Jismning zichligi va suyuqlik zichligi orqali suzish yoki chokishni kuzating.
          </p>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 14 }}>
          <div className="card">
            <div className="h3">Boshqaruv</div>

            <label className="muted">Jism zichligi: {params.densityObject.toFixed(0)} kg/m^3</label>
            <input className="input" type="range" min="300" max="1800" step="10" value={params.densityObject} onChange={(e) => setParams((prev) => ({ ...prev, densityObject: Number(e.target.value) }))} />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Suyuqlik zichligi: {params.densityLiquid.toFixed(0)} kg/m^3
            </label>
            <input className="input" type="range" min="600" max="1400" step="10" value={params.densityLiquid} onChange={(e) => setParams((prev) => ({ ...prev, densityLiquid: Number(e.target.value) }))} />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Jism hajmi: {params.volume.toFixed(3)} m^3
            </label>
            <input className="input" type="range" min="0.002" max="0.01" step="0.001" value={params.volume} onChange={(e) => setParams((prev) => ({ ...prev, volume: Number(e.target.value) }))} />
          </div>

          <div className="card">
            <div className="h3">Xulosa</div>
            <div className="row" style={{ gap: 8 }}>
              <span className="badge">{stateText}</span>
              <span className="badge">Suzish ulushi: {(floatRatio * 100).toFixed(0)}%</span>
            </div>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>{explanation}</p>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: 500 }}>
            <Canvas camera={{ position: [4.5, 3.8, 6], fov: 44 }}>
              <LiquidScene params={params} floatRatio={floatRatio} />
            </Canvas>
          </div>

          <div className="grid">
            <div className="card" style={{ gridColumn: "span 4" }}>
              <div className="h3">Ogirlik kuchi</div>
              <div className="h2" style={{ marginBottom: 0 }}>{weight.toFixed(2)} N</div>
              <p className="muted" style={{ marginTop: 8 }}>F = m x g</p>
            </div>
            <div className="card" style={{ gridColumn: "span 4" }}>
              <div className="h3">Arximed kuchi</div>
              <div className="h2" style={{ marginBottom: 0 }}>{buoyancy.toFixed(2)} N</div>
              <p className="muted" style={{ marginTop: 8 }}>Fa = rho x V x g</p>
            </div>
            <div className="card" style={{ gridColumn: "span 4" }}>
              <div className="h3">Taqqoslash</div>
              <div className="h2" style={{ marginBottom: 0 }}>{(buoyancy - weight).toFixed(2)} N</div>
              <p className="muted" style={{ marginTop: 8 }}>Musbat bolsa jism yuqoriga intiladi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
