"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { drawSeries, pushSeries, SeriesPoint } from "@/lib/chart";

type Params = {
  mass: number;
  force: number;
  friction: number;
  timeScale: number;
};

const DEFAULT: Params = {
  mass: 2,
  force: 8.5,
  friction: 0.08,
  timeScale: 1,
};

function fmt(n: number, d = 2) {
  return Number.isFinite(n) ? n.toFixed(d) : "0.00";
}

function FormulaPill({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 14,
        background: "rgba(15,23,42,0.7)",
        border: "1px solid rgba(148,163,184,0.18)",
        color: "#e2e8f0",
        fontWeight: 700,
        fontSize: 14,
      }}
    >
      {text}
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      className="card"
      style={{
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.16)",
      }}
    >
      <div
        style={{
          width: 42,
          height: 5,
          borderRadius: 999,
          background: accent,
          marginBottom: 12,
        }}
      />
      <div className="h3">{title}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginTop: 8,
          color: "white",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      {sub ? (
        <div className="muted" style={{ marginTop: 8 }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function SceneLabel({
  position,
  text,
  background = "rgba(255,255,255,0.96)",
  color = "#0f172a",
}: {
  position: [number, number, number];
  text: string;
  background?: string;
  color?: string;
}) {
  return (
    <Html position={position} center distanceFactor={8}>
      <div
        style={{
          padding: "7px 12px",
          borderRadius: 999,
          background,
          color,
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
          boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
          border: "1px solid rgba(255,255,255,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        {text}
      </div>
    </Html>
  );
}

function ForceArrow({
  force,
  friction,
}: {
  force: number;
  friction: number;
}) {
  const arrowLength = Math.max(0.8, Math.min(3.2, force * 0.28));
  const frictionLength = Math.max(0.25, Math.min(1.8, friction * 4));

  return (
    <>
      <group position={[0, 1.45, 0]}>
        <mesh position={[arrowLength / 2, 0, 0]}>
          <boxGeometry args={[arrowLength, 0.08, 0.08]} />
          <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.45} />
        </mesh>
        <mesh position={[arrowLength + 0.22, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.14, 0.34, 12]} />
          <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.45} />
        </mesh>
        <SceneLabel
          position={[arrowLength / 2, 0.34, 0]}
          text={`F = ${force.toFixed(1)} N`}
          background="rgba(220,252,231,0.96)"
        />
      </group>

      <group position={[0, 1.0, 0]}>
        <mesh position={[-frictionLength / 2, 0, 0]}>
          <boxGeometry args={[frictionLength, 0.06, 0.06]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[-frictionLength - 0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.12, 0.26, 12]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.35} />
        </mesh>
        <SceneLabel
          position={[-Math.max(0.55, frictionLength / 2), 0.24, 0]}
          text={`Ishqalanish = ${friction.toFixed(2)}`}
          background="rgba(254,226,226,0.96)"
        />
      </group>
    </>
  );
}

function MotionTrail({
  pointsRef,
}: {
  pointsRef: React.MutableRefObject<THREE.Vector3[]>;
}) {
  const geometry = useMemo(() => new THREE.BufferGeometry(), []);
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useFrame(() => {
    geometry.setFromPoints(pointsRef.current);
    geometry.computeBoundingSphere();
  });

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return <primitive object={line} />;
}

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
  const ball = useRef<THREE.Mesh>(null);
  const accumulator = useRef(0);
  const trailPoints = useRef<THREE.Vector3[]>([new THREE.Vector3(0, 0.5, 0)]);
  const st = useRef({ x: 0, v: 0, t: 0 });
  const radius = 0.5;
  const fixedDt = 1 / 60;

  useEffect(() => {
    accumulator.current = 0;
    st.current = { x: 0, v: 0, t: 0 };
    trailPoints.current = [new THREE.Vector3(0, radius, 0)];

    if (ball.current) {
      ball.current.position.set(0, radius, 0);
      ball.current.rotation.set(0, 0, 0);
    }

    onSample({
      t: 0,
      x: 0,
      v: 0,
      a: params.force / Math.max(1e-6, params.mass),
    });
  }, [seed, params.mass, params.force, params.friction, onSample]);

  useFrame((_, delta) => {
    if (!ball.current || paused) return;

    accumulator.current += delta * params.timeScale;

    while (accumulator.current >= fixedDt) {
      accumulator.current -= fixedDt;

      const a = params.force / Math.max(1e-6, params.mass);

      st.current.v += a * fixedDt;
      st.current.v *= Math.max(0, 1 - params.friction * fixedDt * 6);
      st.current.x += st.current.v * fixedDt;
      st.current.t += fixedDt;

      if (st.current.x > 8) st.current.x = -8;
      if (st.current.x < -8) st.current.x = 8;

      ball.current.position.x = st.current.x;
      ball.current.rotation.z -= st.current.v * 0.04;

      trailPoints.current.push(new THREE.Vector3(st.current.x, radius, 0));
      if (trailPoints.current.length > 220) {
        trailPoints.current.shift();
      }

      onSample({
        t: st.current.t,
        x: st.current.x,
        v: st.current.v,
        a,
      });
    }
  });

  return (
    <>
      <color attach="background" args={["#08131d"]} />
      <fog attach="fog" args={["#08131d", 6, 14]} />

      <ambientLight intensity={0.78} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} castShadow />
      <hemisphereLight args={["#d6f0ff", "#0a1d31", 0.4]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#0c1b2b" roughness={0.96} metalness={0.05} />
      </mesh>

      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[18, 0.04, 2.6]} />
        <meshStandardMaterial color="#102237" roughness={0.95} />
      </mesh>

      {Array.from({ length: 17 }, (_, i) => {
        const x = -8 + i;
        return (
          <group key={i}>
            <mesh position={[x, 0.03, 0]}>
              <boxGeometry args={[0.03, 0.03, 2.2]} />
              <meshStandardMaterial color="#27445f" />
            </mesh>
            <Html position={[x, 0.16, 1.25]} center distanceFactor={12}>
              <div style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 700 }}>{x}</div>
            </Html>
          </group>
        );
      })}

      <gridHelper args={[24, 24, "#33506d", "#203346"]} />

      <mesh ref={ball} position={[0, radius, 0]} castShadow receiveShadow>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#92400e"
          emissiveIntensity={0.2}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      <MotionTrail pointsRef={trailPoints} />

      <SceneLabel
        position={[0, 1.9, 0]}
        text="Shar"
        background="rgba(254,243,199,0.96)"
      />

      <ForceArrow force={params.force} friction={params.friction} />

      <SceneLabel
        position={[-5.2, 1.05, 0]}
        text={`m = ${params.mass.toFixed(1)} kg`}
        background="rgba(224,242,254,0.96)"
      />

      <OrbitControls enablePan enableZoom maxPolarAngle={Math.PI / 2.1} />
    </>
  );
}

export default function NewtonLawsLabProfessional() {
  const [params, setParams] = useState(DEFAULT);
  const [paused, setPaused] = useState(true);
  const [seed, setSeed] = useState(1);

  const [latest, setLatest] = useState<SeriesPoint>({
    t: 0,
    x: 0,
    v: 0,
    a: DEFAULT.force / DEFAULT.mass,
  });

  const series = useRef<SeriesPoint[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const drawPending = useRef(false);

  const acceleration = useMemo(
    () => params.force / Math.max(1e-6, params.mass),
    [params.force, params.mass]
  );

  const explanation = useMemo(() => {
    if (params.force > params.mass * 2) {
      return "Kuch massaga nisbatan katta bo‘lgani uchun jism tezroq tezlanadi.";
    }
    if (params.mass > params.force * 1.5) {
      return "Massa katta bo‘lgani uchun shu kuch ta’sirida tezlanish kichikroq bo‘ladi.";
    }
    return "Kuch va massa muvozanatli bo‘lgani uchun tezlanish o‘rtacha qiymatda.";
  }, [params.force, params.mass]);

  const frictionText = useMemo(() => {
    if (params.friction <= 0.08) {
      return "Ishqalanish kichik. Jism osonroq siljiydi va tezlik uzoqroq saqlanadi.";
    }
    if (params.friction <= 0.3) {
      return "Ishqalanish o‘rtacha. Jismning tezligi asta-sekin kamayadi.";
    }
    return "Ishqalanish katta. Jismning tezligi tezroq pasayadi.";
  }, [params.friction]);

  function sample(p: SeriesPoint) {
    pushSeries(series.current, p, 260);
    setLatest(p);

    if (!drawPending.current) {
      drawPending.current = true;
      requestAnimationFrame(() => {
        const c = chartRef.current;
        if (c) drawSeries(c, series.current);
        drawPending.current = false;
      });
    }
  }

  function hardReset(next: Params) {
    series.current = [];
    setLatest({
      t: 0,
      x: 0,
      v: 0,
      a: next.force / Math.max(1e-6, next.mass),
    });
    setSeed((x) => x + 1);
    setPaused(true);
  }

  function updateParams(patch: Partial<Params>) {
    const next = { ...params, ...patch };
    setParams(next);
    hardReset(next);
  }

  function reset() {
    hardReset(params);
  }

  function applyPreset(next: Params) {
    setParams(next);
    series.current = [];
    setLatest({
      t: 0,
      x: 0,
      v: 0,
      a: next.force / Math.max(1e-6, next.mass),
    });
    setSeed((x) => x + 1);
    setPaused(true);
  }

  return (
    <div
      style={{
        padding: 18,
        background:
          "radial-gradient(circle at top right, rgba(34,197,94,0.08), transparent 22%), radial-gradient(circle at top left, rgba(56,189,248,0.08), transparent 18%), linear-gradient(180deg, #07111b 0%, #0a1420 100%)",
        minHeight: "100vh",
      }}
    >
      <div className="grid" style={{ maxWidth: 1400, margin: "0 auto", gap: 16 }}>
        <div
          className="card"
          style={{
            gridColumn: "span 12",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(10,18,30,0.98))",
            border: "1px solid rgba(148,163,184,0.16)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
          }}
        >
          <div
            className="row"
            style={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <Link href="/labs" className="btn btnGhost">
                  ← Ortga
                </Link>
                <Link href="/labs?fan=fizika" className="btn btnGhost">
                  Fizika laboratoriyalari
                </Link>
              </div>

              <div className="h2" style={{ fontSize: 30, color: "white" }}>
                Interaktiv 3D laboratoriya: Nyutonning ikkinchi qonuni
              </div>
              <p className="muted" style={{ marginTop: 10, lineHeight: 1.8, fontSize: 15 }}>
                Bu laboratoriyada jismga ta’sir qilayotgan kuch, massa va ishqalanish
                o‘zgartiriladi. O‘quvchi <strong>F = ma</strong> bog‘lanishini 3D sahna va
                grafik orqali ko‘radi.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 300 }}>
              <FormulaPill text="F = m · a" />
              <FormulaPill text="a = F / m" />
              <FormulaPill text="Ishqalanish tezlikni kamaytiradi" />
              <FormulaPill text="Grafik: x(t), v(t), a(t)" />
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 16 }}>
          <div className="card">
            <div className="h3">Boshqaruv paneli</div>

            <label className="muted" style={{ display: "block", marginTop: 14 }}>
              Massa: {params.mass.toFixed(1)} kg
            </label>
            <input
              className="input"
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={params.mass}
              onChange={(e) => updateParams({ mass: Number(e.target.value) })}
            />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Kuch: {params.force.toFixed(1)} N
            </label>
            <input
              className="input"
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={params.force}
              onChange={(e) => updateParams({ force: Number(e.target.value) })}
            />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Ishqalanish: {params.friction.toFixed(2)}
            </label>
            <input
              className="input"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={params.friction}
              onChange={(e) => updateParams({ friction: Number(e.target.value) })}
            />

            <label className="muted" style={{ display: "block", marginTop: 12 }}>
              Animatsiya tezligi: {params.timeScale.toFixed(2)}×
            </label>
            <input
              className="input"
              type="range"
              min="0.05"
              max="2"
              step="0.05"
              value={params.timeScale}
              onChange={(e) => updateParams({ timeScale: Number(e.target.value) })}
            />

            <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setPaused((x) => !x)}>
                {paused ? "Play" : "Pause"}
              </button>
              <button className="btn btnGhost" onClick={reset}>
                Qayta boshlash
              </button>
              <button className="btn btnGhost" onClick={() => updateParams({ timeScale: 0.2 })}>
                Slow-mo
              </button>
            </div>

            <div className="h3" style={{ marginTop: 18 }}>Tayyor tajribalar</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button
                className="btn btnGhost"
                onClick={() =>
                  applyPreset({ mass: 2, force: 8.5, friction: 0.08, timeScale: 1 })
                }
              >
                Asosiy holat
              </button>
              <button
                className="btn btnGhost"
                onClick={() =>
                  applyPreset({ mass: 5, force: 4, friction: 0.15, timeScale: 1 })
                }
              >
                Katta massa
              </button>
              <button
                className="btn btnGhost"
                onClick={() =>
                  applyPreset({ mass: 2, force: 12, friction: 0.05, timeScale: 1.2 })
                }
              >
                Katta kuch
              </button>
            </div>
          </div>

          <div className="card">
            <div className="h3">Asosiy natijalar</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <span className="badge">a = {acceleration.toFixed(2)} m/s²</span>
              <span className="badge">v = {latest.v.toFixed(2)} m/s</span>
              <span className="badge">x = {latest.x.toFixed(2)} m</span>
              <span className="badge">t = {latest.t.toFixed(2)} s</span>
            </div>
          </div>

          <div className="card">
            <div className="h3">Dinamik xulosa</div>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.75 }}>
              {explanation}
            </p>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.75 }}>
              {frictionText}
            </p>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 16 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: 560 }}>
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(148,163,184,0.12)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div className="h3">3D harakat sahnasi</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Endi harakat aniq ko‘rinadi: shar, iz chizig‘i va koordinata belgilar bilan.
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className="badge">Shar</span>
                <span className="badge">Harakat izi</span>
                <span className="badge">Kuch va ishqalanish</span>
              </div>
            </div>

            <div style={{ height: 500 }}>
              <Canvas camera={{ position: [4.8, 2.7, 4.8], fov: 48 }} shadows>
                <Scene params={params} paused={paused} seed={seed} onSample={sample} />
              </Canvas>
            </div>
          </div>

          <div className="card">
            <div className="h3">Grafik: x(t), v(t), a(t)</div>
            <p className="muted" style={{ marginTop: 8 }}>
              Grafikda yo‘l, tezlik va tezlanishning vaqt bo‘yicha o‘zgarishini kuzating.
            </p>
            <canvas
              ref={chartRef}
              width={760}
              height={220}
              style={{
                width: "100%",
                borderRadius: 14,
                marginTop: 12,
                background: "rgba(255,255,255,0.03)",
              }}
            />
          </div>

          <div className="grid" style={{ gap: 16 }}>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Tezlanish"
                value={`${fmt(acceleration, 2)} m/s²`}
                sub="a = F / m"
                accent="#22c55e"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Tezlik"
                value={`${fmt(latest.v, 2)} m/s`}
                sub="Har vaqt yangilanadi"
                accent="#38bdf8"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Ko‘chish"
                value={`${fmt(latest.x, 2)} m`}
                sub="Jismning joriy holati"
                accent="#f59e0b"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}