"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { drawSeries, pushSeries, SeriesPoint } from "@/lib/chart";

type Mode = "tekis" | "tezlanishli";

type Params = {
  mode: Mode;
  v0: number;        // m/s (units/s)
  a: number;         // m/s^2 (units/s^2)
  timeScale: number; // slowmo
};

const DEFAULT: Params = {
  mode: "tekis",
  v0: 2,
  a: 1,
  timeScale: 1,
};

function Scene({
  params,
  paused,
  onSample,
  seed,
}: {
  params: Params;
  paused: boolean;
  onSample: (p: SeriesPoint) => void;
  seed: number;
}) {
  const ball = useRef<THREE.Mesh>(null);
  const tSim = useRef(0);
  const acc = useRef(0);

  const fixedDt = 1 / 60;

  const state = useRef({ x: 0, v: DEFAULT.v0, a: 0 });

  useEffect(() => {
    tSim.current = 0;
    acc.current = 0;
    state.current = { x: 0, v: params.v0, a: params.mode === "tezlanishli" ? params.a : 0 };
    if (ball.current) ball.current.position.set(0, 0.25, 0);
    onSample({ t: 0, x: 0, v: state.current.v, a: state.current.a });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, params.mode, params.v0, params.a]);

  useFrame((_, realDelta) => {
    if (paused || !ball.current) return;

    acc.current += realDelta * params.timeScale;

    while (acc.current >= fixedDt) {
      acc.current -= fixedDt;

      // fixed timestep
      const a = params.mode === "tezlanishli" ? params.a : 0;
      state.current.a = a;
      state.current.v += a * fixedDt;
      state.current.x += state.current.v * fixedDt;

      // clamp in corridor
      if (state.current.x > 8) state.current.x = -8;

      ball.current.position.x = state.current.x;

      tSim.current += fixedDt;
      onSample({ t: tSim.current, x: state.current.x, v: state.current.v, a: state.current.a });
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

      <mesh ref={ball} position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial roughness={0.45} metalness={0.15} />
      </mesh>

      <gridHelper args={[30, 30]} />
      <OrbitControls enablePan enableZoom />
    </>
  );
}

export default function UniformMotionLab() {
  const [params, setParams] = useState<Params>(DEFAULT);
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

  const modeLabel = useMemo(() => (params.mode === "tekis" ? "Tekis" : "Tezlanishli"), [params.mode]);

  return (
    <div style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="h2">Tekis / tezlanishli harakat</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Rejimni tanlang va parametrlarni o‘zgartiring. Grafikda x(t), v(t), a(t) chiqadi.
          </p>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Rejim</div>
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  className={`btn ${params.mode === "tekis" ? "" : "btnGhost"}`}
                  onClick={() => setParams((p) => ({ ...p, mode: "tekis" }))}
                >
                  Tekis
                </button>
                <button
                  className={`btn ${params.mode === "tezlanishli" ? "" : "btnGhost"}`}
                  onClick={() => setParams((p) => ({ ...p, mode: "tezlanishli" }))}
                >
                  Tezlanishli
                </button>
              </div>
              <div className="muted" style={{ marginTop: 6 }}>Tanlangan: {modeLabel}</div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Boshlang‘ich tezlik v0 (m/s)</div>
              <input
                className="input"
                type="number"
                step="0.1"
                value={params.v0}
                onChange={(e) => setParams((p) => ({ ...p, v0: Number(e.target.value) }))}
              />
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Tezlanish a (m/s²)</div>
              <input
                className="input"
                type="number"
                step="0.1"
                value={params.a}
                disabled={params.mode !== "tezlanishli"}
                onChange={(e) => setParams((p) => ({ ...p, a: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 6 }}>
                Tezlanishli rejimda ishlaydi
              </div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Slow-motion (timeScale)</div>
              <input
                className="input"
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={params.timeScale}
                onChange={(e) => setParams((p) => ({ ...p, timeScale: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 6 }}>
                {params.timeScale}× (fixed dt = 1/60, real vaqt oqimi sekinlashadi)
              </div>
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
              <Scene params={params} paused={paused} onSample={sample} seed={seed} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
