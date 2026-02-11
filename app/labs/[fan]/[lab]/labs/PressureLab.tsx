"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type Params = { force: number; area: number };

const DEFAULT: Params = { force: 40, area: 10 };

export default function PressureLab() {
  const [p, setP] = useState(DEFAULT);

  const pressure = useMemo(() => p.force / Math.max(1e-6, p.area), [p.force, p.area]);
  const depth = useMemo(() => Math.min(2.2, pressure / 10), [pressure]); // vizual

  return (
    <div style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="h2">Bosim (P=F/S)</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Kuch bir xil bo‘lsa ham sirt kichrayganda bosim oshadi. Pastdagi “iz” chuqurligi bosimga bog‘liq.
          </p>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Kuch (F)</div>
              <input className="input" type="number" step="1" value={p.force}
                onChange={(e) => setP((x) => ({ ...x, force: Number(e.target.value) }))} />
            </div>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Sirt (S)</div>
              <input className="input" type="number" step="1" value={p.area}
                onChange={(e) => setP((x) => ({ ...x, area: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Natija</div>
            <div className="row" style={{ alignItems: "center" }}>
              <span className="badge">P = {pressure.toFixed(2)}</span>
              <span className="badge">Iz chuqurligi ≈ {depth.toFixed(2)}</span>
            </div>
            <p className="muted" style={{ marginTop: 8 }}>
              (Vizualizatsiya osonlashtirilgan: chuqurlik ~ bosim)
            </p>
          </div>
        </div>

        <div style={{ width: "min(740px, 100%)", height: 520, marginLeft: 12, flex: 1, minWidth: 320 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
            <Canvas camera={{ position: [4, 3, 5], fov: 55 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[3, 5, 2]} intensity={1.1} />

              {/* ground */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
                <planeGeometry args={[12, 12]} />
                <meshStandardMaterial roughness={0.95} metalness={0.05} />
              </mesh>

              {/* indentation (visual) */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -depth, 0]}>
                <circleGeometry args={[1.2, 48]} />
                <meshStandardMaterial roughness={0.8} metalness={0.05} />
              </mesh>

              {/* press plate: area changes */}
              <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[Math.max(0.4, p.area / 10), 0.3, Math.max(0.4, p.area / 10)]} />
                <meshStandardMaterial roughness={0.55} metalness={0.12} />
              </mesh>

              <OrbitControls enablePan enableZoom />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
