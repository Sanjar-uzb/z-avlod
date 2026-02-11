"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { drawSeries, pushSeries, SeriesPoint } from "@/lib/chart";

type Params = {
  mass: number;
  force: number;
  friction: number; // 0..1
  timeScale: number;
};

const DEFAULT: Params = { mass: 2, force: 4, friction: 0.15, timeScale: 1 };

function Scene({
  params,
  paused,
  seed,
  onSample,
}: {
  params: Params;
  paused: boolean;
  seed: number;
  onSample: (p: SeriesPoint) => void;
}) {
  const box = useRef<THREE.Mesh>(null);
  const tSim = useRef(0);
  const acc = useRef(0);

  const fixedDt = 1 / 60;
  const st = useRef({ x: 0, v: 0 });

  useEffect(() => {
    tSim.current = 0;
    acc.current = 0;
    st.current = { x: 0, v: 0 };
    if (box.current) box.current.position.set(0, 0.25, 0);
    onSample({ t: 0, x: 0, v: 0, a: params.force / params.mass });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, params.mass, params.force, params.friction]);

  useFrame((_, realDelta) => {
    if (paused || !box.current) return;

    acc.current += realDelta * params.timeScale;

    while (acc.current >= fixedDt) {
      acc.current -= fixedDt;

      const a = params.force / Math.max(1e-6, params.mass);
      st.current.v += a * fixedDt;

      // friction as velocity damping
      st.current.v *= Math.max(0, 1 - params.friction * fixedDt * 6);

      st.current.x += st.current.v * fixedDt;

      if (st.current.x > 8) st.current.x = -8;

      box.current.position.x = st.current.x;

      tSim.current += fixedDt;
      onSample({ t: tSim.current, x: st.current.x, v: st.current.v, a });
    }
  });

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh ref={box} position={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial roughness={0.55} metalness={0.1} />
      </mesh>
      <gridHelper args={[30, 30]} />
      <OrbitControls enablePan enableZoom />
    </>
  );
}

export default function NewtonLawsLab() {
  const [params, setParams] = useState(DEFAULT);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(1);

  const series = useRef<SeriesPoint[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  function sample(p: SeriesPoint) {
    pushSeries(series.current, p, 260);
    const c = chartRef.current;
    if (c) drawSeries(c, series.current);
  }

  function reset() {
    series.current = [];
    setSeed((x) => x + 1);
    setPaused(false);
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="h2">Nyuton qonunlari: F=ma</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Kuchi va massani o‘zgartirib tezlanishni kuzating. Ishqalanish v ni sekin pasaytiradi.
          </p>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Massa (kg)</div>
              <input className="input" type="number" step="0.5" value={params.mass}
                onChange={(e) => setParams((p) => ({ ...p, mass: Number(e.target.value) }))} />
            </div>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Kuch (N)</div>
              <input className="input" type="number" step="0.5" value={params.force}
                onChange={(e) => setParams((p) => ({ ...p, force: Number(e.target.value) }))} />
            </div>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Ishqalanish</div>
              <input className="input" type="range" min="0" max="1" step="0.01" value={params.friction}
                onChange={(e) => setParams((p) => ({ ...p, friction: Number(e.target.value) }))} />
              <div className="muted" style={{ marginTop: 6 }}>{params.friction}</div>
            </div>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Slow-motion</div>
              <input className="input" type="range" min="0.05" max="1" step="0.05" value={params.timeScale}
                onChange={(e) => setParams((p) => ({ ...p, timeScale: Number(e.target.value) }))} />
              <div className="muted" style={{ marginTop: 6 }}>{params.timeScale}×</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={reset}>Reset</button>
            <button className="btn btnGhost" onClick={() => setPaused((x) => !x)}>
              {paused ? "Resume" : "Pause"}
            </button>
            <button className="btn btnGhost" onClick={() => setParams((p) => ({ ...p, timeScale: 0.2 }))}>
              Slow-mo 0.2×
            </button>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Grafik: x(t), v(t), a(t)</div>
            <canvas ref={chartRef} width={520} height={180} style={{ width: "100%", borderRadius: 12 }} />
          </div>
        </div>

        <div style={{ width: "min(740px, 100%)", height: 520, marginLeft: 12, flex: 1, minWidth: 320 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
            <Canvas camera={{ position: [6, 3, 6], fov: 55 }}>
              <Scene params={params} paused={paused} seed={seed} onSample={sample} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
