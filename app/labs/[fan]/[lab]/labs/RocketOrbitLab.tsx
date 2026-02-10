"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { drawSeries, pushSeries, SeriesPoint } from "@/src/lib/chart";

type Params = {
  v0_kms: number;      // km/s
  height_km: number;   // start altitude
  timeScale: number;   // 1 = realtime, 0.2 = slow-mo
  substeps: number;    // physics substeps
};

const DEFAULT: Params = {
  v0_kms: 9.0,
  height_km: 400,   // ~LEO
  timeScale: 1,
  substeps: 4,
};

// Scales (to keep numbers stable in JS)
const KM_TO_UNITS = 1 / 1000; // 1000 km => 1 unit
const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // km^3/s^2  (Earth standard gravitational parameter)

function Scene({
  params,
  paused,
  onSample,
}: {
  params: Params;
  paused: boolean;
  onSample: (p: SeriesPoint) => void;
}) {
  const rocket = useRef<THREE.Mesh>(null);
  const vel = useRef(new THREE.Vector3());
  const tSim = useRef(0);
  const acc = useRef(0);

  const fixedDt = 1 / 60; // seconds (SIM dt, constant!)

  const earthR = EARTH_RADIUS_KM * KM_TO_UNITS;

  const startPos = useMemo(() => {
    const r = (EARTH_RADIUS_KM + params.height_km) * KM_TO_UNITS;
    return new THREE.Vector3(r, 0, 0); // on x-axis
  }, [params.height_km]);

  // Tangential initial velocity (for orbit)
  useEffect(() => {
    tSim.current = 0;
    acc.current = 0;

    const v0 = params.v0_kms; // km/s
    // direction: +Z tangential
    vel.current.set(0, 0, v0 * KM_TO_UNITS); // units/s
    if (rocket.current) rocket.current.position.copy(startPos);

    // initial sample
    onSample({ t: 0, x: startPos.length() / KM_TO_UNITS - EARTH_RADIUS_KM, v: v0, a: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startPos, params.v0_kms]);

  useFrame((_, realDelta) => {
    if (paused || !rocket.current) return;

    // real slow-mo: dt stays fixed; we scale how much real time is fed into accumulator
    acc.current += realDelta * params.timeScale;

    while (acc.current >= fixedDt) {
      acc.current -= fixedDt;

      const steps = Math.max(1, Math.floor(params.substeps));
      const h = fixedDt / steps;

      for (let i = 0; i < steps; i++) {
        const p = rocket.current.position;

        // convert to km vector for gravity math
        const r_km = p.clone().multiplyScalar(1 / KM_TO_UNITS);
        const r = r_km.length();
        const r3 = Math.max(1e-6, r * r * r);

        // a_km = -mu * r_vec / r^3  (km/s^2)
        const a_km = r_km.clone().multiplyScalar(-MU / r3);

        // integrate (semi-implicit Euler)
        // vel (km/s)
        const v_km = vel.current.clone().multiplyScalar(1 / KM_TO_UNITS);
        v_km.addScaledVector(a_km, h);
        vel.current.copy(v_km.multiplyScalar(KM_TO_UNITS)); // back to units/s

        p.addScaledVector(vel.current, h);

        // collision-ish: if below Earth surface, reflect & damp (simple)
        const dist = p.length();
        if (dist < earthR) {
          // push back to surface
          p.setLength(earthR);
          // damp velocity and flip radial component
          const n = p.clone().normalize();
          const v = vel.current.clone();
          const vn = n.clone().multiplyScalar(v.dot(n));
          const vt = v.sub(vn);
          vel.current.copy(vt.addScaledVector(vn, -0.4)); // lose energy
        }

        tSim.current += h;
      }

      // sample for charts (km / km/s / km/s^2)
      const pkm = rocket.current.position.length() / KM_TO_UNITS;
      const alt = pkm - EARTH_RADIUS_KM;

      const v_kms = vel.current.length() / KM_TO_UNITS;
      // approximate a from gravity at current position:
      const a_kms2 = MU / Math.max(1e-6, (pkm * pkm)); // km/s^2 magnitude
      onSample({ t: tSim.current, x: alt, v: v_kms, a: a_kms2 });
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />

      {/* Earth */}
      <mesh>
        <sphereGeometry args={[earthR, 64, 64]} />
        <meshStandardMaterial metalness={0.1} roughness={0.85} />
      </mesh>

      {/* Rocket */}
      <mesh ref={rocket}>
        <coneGeometry args={[0.06, 0.18, 18]} />
        <meshStandardMaterial metalness={0.2} roughness={0.5} />
      </mesh>

      <gridHelper args={[10, 10]} />
      <OrbitControls enablePan enableZoom />
    </>
  );
}

export default function RocketOrbitLab() {
  const [params, setParams] = useState<Params>(DEFAULT);
  const [paused, setPaused] = useState(false);

  const series = useRef<SeriesPoint[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const [seed, setSeed] = useState(1); // reset trigger

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
          <div className="h2">Raketa: orbita va qochish tezligi</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Tezlikni (km/s) kiriting. Past bo‘lsa — qaytadi, o‘rtacha bo‘lsa — orbita, katta bo‘lsa — qochib ketadi.
          </p>

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Boshlang‘ich tezlik (km/s)</div>
              <input
                className="input"
                type="number"
                step="0.1"
                value={params.v0_kms}
                onChange={(e) => setParams((p) => ({ ...p, v0_kms: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 6 }}>
                Masalan: 7.8 (LEO), 11.2 (qochish), 15 (tez qochish)
              </div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Balandlik (km)</div>
              <input
                className="input"
                type="number"
                step="10"
                value={params.height_km}
                onChange={(e) => setParams((p) => ({ ...p, height_km: Number(e.target.value) }))}
              />
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
                {params.timeScale}× (dt=1/60 o‘zgarmaydi, faqat real vaqt oqimi sekinlashadi)
              </div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Substeps</div>
              <input
                className="input"
                type="number"
                min="1"
                max="12"
                value={params.substeps}
                onChange={(e) => setParams((p) => ({ ...p, substeps: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 6 }}>1..12 (barqarorlik uchun)</div>
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
            <div className="muted" style={{ marginTop: 8 }}>
              x — balandlik (km), v — tezlik (km/s), a — grav. tezlanish (km/s²)
            </div>
          </div>
        </div>

        <div style={{ width: "min(740px, 100%)", height: 560, marginLeft: 12, flex: 1, minWidth: 320 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
            <Canvas camera={{ position: [3, 2, 3], fov: 55 }}>
              <Scene key={seed} params={params} paused={paused} onSample={sample} />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
