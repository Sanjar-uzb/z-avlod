"use client";

import { useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

type Params = {
  m1: number;
  m2: number;
  v1: number;
  v2: number;
  restitution: number;
  timeScale: number;
};

type Simulation = {
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  collided: boolean;
};

const DEFAULT: Params = {
  m1: 2,
  m2: 3,
  v1: 4,
  v2: 0,
  restitution: 0.9,
  timeScale: 1,
};

function createInitialState(params: Params): Simulation {
  return {
    x1: -3.8,
    x2: 0.2,
    v1: params.v1,
    v2: params.v2,
    collided: false,
  };
}

function CollisionScene({
  params,
  running,
  state,
  onChange,
}: {
  params: Params;
  running: boolean;
  state: Simulation;
  onChange: (nextState: Simulation) => void;
}) {
  useFrame((_, delta) => {
    if (!running) return;

    const dt = delta * params.timeScale;
    let next = { ...state };
    const radius1 = 0.25;
    const radius2 = 0.32;

    if (!next.collided && next.x1 + radius1 >= next.x2 - radius2) {
      const { m1, m2, restitution } = params;
      const u1 = next.v1;
      const u2 = next.v2;

      const v1f =
        ((m1 - restitution * m2) / (m1 + m2)) * u1 +
        (((1 + restitution) * m2) / (m1 + m2)) * u2;
      const v2f =
        (((1 + restitution) * m1) / (m1 + m2)) * u1 +
        ((m2 - restitution * m1) / (m1 + m2)) * u2;

      next = { ...next, v1: v1f, v2: v2f, collided: true };
    }

    next = {
      ...next,
      x1: next.x1 + next.v1 * dt,
      x2: next.x2 + next.v2 * dt,
    };

    onChange(next);
  });

  return (
    <>
      <color attach="background" args={["#07131e"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 4]} intensity={1.25} />
      <hemisphereLight args={["#d0f0ff", "#0e1e2d", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#0d1b2a" roughness={0.96} />
      </mesh>

      <gridHelper args={[16, 16, "#224e74", "#163047"]} position={[0, 0.01, 0]} />

      <mesh position={[state.x1, 0.28, 0]}>
        <sphereGeometry args={[0.25, 34, 34]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" roughness={0.2} />
      </mesh>

      <mesh position={[state.x2, 0.32, 0]}>
        <sphereGeometry args={[0.32, 34, 34]} />
        <meshStandardMaterial color="#f97316" emissive="#fb923c" roughness={0.22} />
      </mesh>

      <mesh position={[-5.5, 0.08, 0]}>
        <boxGeometry args={[0.2, 0.16, 1]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      <mesh position={[5.5, 0.08, 0]}>
        <boxGeometry args={[0.2, 0.16, 1]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.08} />
    </>
  );
}

export default function ImpulseLab() {
  const [params, setParams] = useState(DEFAULT);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<Simulation>(() => createInitialState(DEFAULT));

  const momentumBefore = params.m1 * params.v1 + params.m2 * params.v2;
  const momentumNow = params.m1 * state.v1 + params.m2 * state.v2;
  const energyBefore = 0.5 * params.m1 * params.v1 * params.v1 + 0.5 * params.m2 * params.v2 * params.v2;
  const energyNow = 0.5 * params.m1 * state.v1 * state.v1 + 0.5 * params.m2 * state.v2 * state.v2;

  const verdict = useMemo(() => {
    if (!state.collided) return "Hali toqnashuv bo'lmadi. Sharlar yaqinlashmoqda.";
    if (params.restitution > 0.8) return "Toqnashuv deyarli elastik: impuls saqlanadi, energiya ham deyarli saqlanadi.";
    if (params.restitution > 0.3) return "Qisman elastik toqnashuv: impuls saqlanadi, lekin energiyaning bir qismi yo'qotiladi.";
    return "Yopishuvga yaqin toqnashuv: umumiy impuls saqlanadi, energiya ancha kamayadi.";
  }, [params.restitution, state.collided]);

  function reset(nextParams = params) {
    setRunning(false);
    setState(createInitialState(nextParams));
  }

  return (
    <div style={{ padding: 16 }}>
      <div className="grid">
        <div className="card" style={{ gridColumn: "span 12" }}>
          <div className="h2">Impuls va zarba</div>
          <p className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
            Ikki shar toqnashganda massa va tezliklar qanday natija berishini kuzating.
            Asosiy maqsad: umumiy impuls saqlanishini korish.
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="badge">1-qadam: massalarni tanlang</span>
            <span className="badge">2-qadam: tezliklarni bering</span>
            <span className="badge">3-qadam: natijani kuzating</span>
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 14 }}>
          <div className="card">
            <div className="h3">Boshqaruv</div>

            <label className="muted">Shar 1 massasi: {params.m1.toFixed(1)} kg</label>
            <input className="input" type="range" min="0.5" max="5" step="0.1" value={params.m1} onChange={(e) => setParams((prev) => ({ ...prev, m1: Number(e.target.value) }))} />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Shar 2 massasi: {params.m2.toFixed(1)} kg
            </label>
            <input className="input" type="range" min="0.5" max="5" step="0.1" value={params.m2} onChange={(e) => setParams((prev) => ({ ...prev, m2: Number(e.target.value) }))} />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Shar 1 tezligi: {params.v1.toFixed(1)} m/s
            </label>
            <input className="input" type="range" min="0" max="8" step="0.1" value={params.v1} onChange={(e) => setParams((prev) => ({ ...prev, v1: Number(e.target.value) }))} />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Shar 2 tezligi: {params.v2.toFixed(1)} m/s
            </label>
            <input className="input" type="range" min="-3" max="4" step="0.1" value={params.v2} onChange={(e) => setParams((prev) => ({ ...prev, v2: Number(e.target.value) }))} />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Elastiklik: {params.restitution.toFixed(2)}
            </label>
            <input className="input" type="range" min="0" max="1" step="0.05" value={params.restitution} onChange={(e) => setParams((prev) => ({ ...prev, restitution: Number(e.target.value) }))} />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Vaqt tezligi: {params.timeScale.toFixed(1)}x
            </label>
            <input className="input" type="range" min="0.4" max="2" step="0.1" value={params.timeScale} onChange={(e) => setParams((prev) => ({ ...prev, timeScale: Number(e.target.value) }))} />

            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn" onClick={() => setRunning((value) => !value)}>
                {running ? "Pause" : "Start"}
              </button>
              <button className="btn btnGhost" onClick={() => reset()}>
                Qayta boshlash
              </button>
            </div>
          </div>

          <div className="card">
            <div className="h3">Hozirgi holat</div>
            <div className="row" style={{ gap: 8 }}>
              <span className="badge">v1 = {state.v1.toFixed(2)} m/s</span>
              <span className="badge">v2 = {state.v2.toFixed(2)} m/s</span>
              <span className="badge">{state.collided ? "Toqnashuv boldi" : "Yaqinlashmoqda"}</span>
            </div>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.7 }}>{verdict}</p>
          </div>

          <div className="card">
            <div className="h3">Formulalar</div>
            <div className="row" style={{ gap: 8 }}>
              <span className="badge">p = m x v</span>
              <span className="badge">Pumumiy = p1 + p2</span>
              <span className="badge">Ek = 1/2 x m x v^2</span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: 500 }}>
            <Canvas camera={{ position: [0, 5.3, 7.4], fov: 42 }}>
              <CollisionScene params={params} running={running} state={state} onChange={setState} />
            </Canvas>
          </div>

          <div className="grid">
            <div className="card" style={{ gridColumn: "span 3" }}>
              <div className="h3">Impuls oldin</div>
              <div className="h2" style={{ marginBottom: 0 }}>{momentumBefore.toFixed(2)}</div>
              <p className="muted" style={{ marginTop: 8 }}>kg m/s</p>
            </div>
            <div className="card" style={{ gridColumn: "span 3" }}>
              <div className="h3">Impuls keyin</div>
              <div className="h2" style={{ marginBottom: 0 }}>{momentumNow.toFixed(2)}</div>
              <p className="muted" style={{ marginTop: 8 }}>Natija shu qiymatga yaqin bolishi kerak.</p>
            </div>
            <div className="card" style={{ gridColumn: "span 3" }}>
              <div className="h3">Energiya oldin</div>
              <div className="h2" style={{ marginBottom: 0 }}>{energyBefore.toFixed(2)}</div>
              <p className="muted" style={{ marginTop: 8 }}>J</p>
            </div>
            <div className="card" style={{ gridColumn: "span 3" }}>
              <div className="h3">Energiya keyin</div>
              <div className="h2" style={{ marginBottom: 0 }}>{energyNow.toFixed(2)}</div>
              <p className="muted" style={{ marginTop: 8 }}>Elastiklik kamayganda bu ham kamayadi.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
