"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Params = {
  height: number; // m
  gravity: number; // m/s^2
  bounce: number; // 0..1
  drag: number; // 0..0.2
  mass: number; // kg
  timeScale: number; // 0.2..3
};

type SamplePoint = {
  t: number;
  h: number;
  v: number;
};

const DEFAULT: Params = {
  height: 8,
  gravity: 9.8,
  bounce: 0.35,
  drag: 0.02,
  mass: 1,
  timeScale: 1,
};

const GROUND_Y = 0;
const BALL_RADIUS = 0.35;
const MAX_POINTS = 320;

function fmt(n: number, d = 2) {
  return Number.isFinite(n) ? n.toFixed(d) : "0.00";
}

function pushSeries(arr: SamplePoint[], p: SamplePoint, max = MAX_POINTS) {
  arr.push(p);
  if (arr.length > max) arr.shift();
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
      style={{
        background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
        border: "1px solid rgba(148,163,184,0.16)",
        boxShadow: "0 14px 30px rgba(0,0,0,0.16)",
        borderRadius: 20,
        padding: 18,
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
      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{title}</div>
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
      {sub ? <div style={{ marginTop: 8, color: "#cbd5e1", fontSize: 14 }}>{sub}</div> : null}
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

function drawChart(canvas: HTMLCanvasElement, data: SamplePoint[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#f8fbff");
  bg.addColorStop(1, "#eef6ff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const left = 68;
  const right = 24;
  const top = 52;
  const bottom = 56;
  const chartW = w - left - right;
  const chartH = h - top - bottom;
  const originX = left;
  const originY = h - bottom;

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px Arial";
  ctx.fillText("Grafik: h(t) va v(t)", 22, 30);

  if (data.length < 2) {
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Grafik uchun Play ni bosing", w / 2, h / 2);
    return;
  }

  const maxT = Math.max(data[data.length - 1].t, 1);
  const maxH = Math.max(...data.map((d) => d.h), 1);
  const maxV = Math.max(...data.map((d) => Math.abs(d.v)), 1);
  const maxVal = Math.max(maxH, maxV);

  const sx = chartW / maxT;
  const sy = chartH / maxVal;

  ctx.strokeStyle = "#dbeafe";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    const y = originY - (chartH / 8) * i;
    ctx.beginPath();
    ctx.moveTo(originX, y);
    ctx.lineTo(originX + chartW, y);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "13px Arial";
    ctx.textAlign = "right";
    ctx.fillText(((maxVal / 8) * i).toFixed(1), originX - 8, y + 4);
  }

  for (let i = 0; i <= 10; i++) {
    const x = originX + (chartW / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, originY);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(((maxT / 10) * i).toFixed(1), x, originY + 22);
  }

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(originX, top);
  ctx.lineTo(originX, originY);
  ctx.lineTo(originX + chartW, originY);
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 15px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Vaqt t (s)", originX + chartW / 2, h - 18);
  ctx.save();
  ctx.translate(22, top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Qiymat", 0, 0);
  ctx.restore();

  const drawLine = (getter: (d: SamplePoint) => number, color: string) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    data.forEach((d, i) => {
      const x = originX + d.t * sx;
      const y = originY - getter(d) * sy;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  drawLine((d) => d.h, "#2563eb");
  drawLine((d) => Math.abs(d.v), "#f59e0b");

  const legend = [
    { color: "#2563eb", text: "h — balandlik (m)" },
    { color: "#f59e0b", text: "|v| — tezlik (m/s)" },
  ];

  legend.forEach((item, i) => {
    const x = w - 190;
    const y = 18 + i * 26;
    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, 14, 14);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "left";
    ctx.fillText(item.text, x + 22, y + 12);
  });
}

function DropTrail({ pointsRef }: { pointsRef: React.MutableRefObject<THREE.Vector3[]> }) {
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

function FallScene({
  params,
  paused,
  seed,
  onSample,
}: {
  params: Params;
  paused: boolean;
  seed: number;
  onSample: (p: SamplePoint) => void;
}) {
  const ballRef = useRef<THREE.Mesh>(null);
  const accumulator = useRef(0);
  const state = useRef({ y: params.height, v: 0, t: 0, bounces: 0 });
  const trailPoints = useRef<THREE.Vector3[]>([new THREE.Vector3(0, params.height + BALL_RADIUS, 0)]);
  const fixedDt = 1 / 120;

  useEffect(() => {
    accumulator.current = 0;
    state.current = { y: params.height, v: 0, t: 0, bounces: 0 };
    trailPoints.current = [new THREE.Vector3(0, params.height + BALL_RADIUS, 0)];

    if (ballRef.current) {
      ballRef.current.position.set(0, params.height + BALL_RADIUS, 0);
      ballRef.current.rotation.set(0, 0, 0);
    }

    onSample({ t: 0, h: params.height, v: 0 });
  }, [seed, params.height, params.gravity, params.bounce, params.drag, params.mass, onSample]);

  useFrame((_, delta) => {
    if (!ballRef.current || paused) return;

    accumulator.current += delta * params.timeScale;

    while (accumulator.current >= fixedDt) {
      accumulator.current -= fixedDt;

      // pastga tushish uchun v ni kamaytiramiz, y ga qo'shamiz
      const dragAcc = (params.drag / Math.max(0.1, params.mass)) * state.current.v * Math.abs(state.current.v);
      state.current.v -= (params.gravity + dragAcc) * fixedDt;
      state.current.y += state.current.v * fixedDt;
      state.current.t += fixedDt;

      if (state.current.y <= GROUND_Y) {
        state.current.y = GROUND_Y;
        state.current.v = -state.current.v * params.bounce;
        state.current.bounces += 1;
        if (Math.abs(state.current.v) < 0.12) {
          state.current.v = 0;
        }
      }

      ballRef.current.position.y = state.current.y + BALL_RADIUS;
      ballRef.current.rotation.z -= state.current.v * 0.02;

      trailPoints.current.push(new THREE.Vector3(0, state.current.y + BALL_RADIUS, 0));
      if (trailPoints.current.length > 240) trailPoints.current.shift();

      onSample({
        t: state.current.t,
        h: Math.max(0, state.current.y),
        v: Math.abs(state.current.v),
      });
    }
  });

  return (
    <>
      <color attach="background" args={["#08131d"]} />
      <fog attach="fog" args={["#08131d", 6, 18]} />

      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow />
      <hemisphereLight args={["#d6f0ff", "#0a1d31", 0.45]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#0c1b2b" roughness={0.96} metalness={0.04} />
      </mesh>

      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[4, 0.04, 2]} />
        <meshStandardMaterial color="#102237" roughness={0.95} />
      </mesh>

      {Array.from({ length: 11 }, (_, i) => {
        const y = i;
        return (
          <group key={i}>
            <mesh position={[-0.85, y, 0]}>
              <boxGeometry args={[0.04, 0.02, 0.35]} />
              <meshStandardMaterial color="#33506d" />
            </mesh>
            <Html position={[-1.12, y, 0.25]} center distanceFactor={12}>
              <div style={{ color: "#cbd5e1", fontSize: 11, fontWeight: 700 }}>{y} m</div>
            </Html>
          </group>
        );
      })}

      <mesh ref={ballRef} position={[0, params.height + BALL_RADIUS, 0]} castShadow receiveShadow>
        <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#92400e"
          emissiveIntensity={0.18}
          roughness={0.28}
          metalness={0.08}
        />
      </mesh>

      <DropTrail pointsRef={trailPoints} />

      <SceneLabel
        position={[0, params.height + 1.1, 0]}
        text="Shar"
        background="rgba(254,243,199,0.96)"
      />
      <SceneLabel
        position={[1.35, params.height + 0.2, 0]}
        text={`Boshlang'ich balandlik = ${params.height.toFixed(1)} m`}
        background="rgba(224,242,254,0.96)"
      />
      <SceneLabel
        position={[1.1, 0.45, 0]}
        text="Yer sathi"
        background="rgba(220,252,231,0.96)"
      />

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.08} minDistance={4} maxDistance={11} />
    </>
  );
}

export default function FreeFallLab3D() {
  const [params, setParams] = useState(DEFAULT);
  const [paused, setPaused] = useState(true);
  const [seed, setSeed] = useState(1);
  const [latest, setLatest] = useState<SamplePoint>({ t: 0, h: DEFAULT.height, v: 0 });

  const series = useRef<SamplePoint[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const drawPending = useRef(false);

  const idealFallTime = useMemo(
    () => Math.sqrt((2 * params.height) / Math.max(0.1, params.gravity)),
    [params.height, params.gravity]
  );

  const explanation = useMemo(() => {
    if (params.gravity < 3) {
      return "g kichik bo‘lgani uchun shar sekinroq tushadi. Bu Oyga o‘xshash holat.";
    }
    if (params.gravity > 10.5) {
      return "g katta bo‘lgani uchun shar tezroq tushadi va tezlik tez ortadi.";
    }
    return "Yer sharoitiga yaqin holatda shar muntazam tezlanish bilan pastga tushadi.";
  }, [params.gravity]);

  const bounceText = useMemo(() => {
    if (params.bounce < 0.2) return "Qaytish kichik: shar yerga urilgach deyarli sakramaydi.";
    if (params.bounce < 0.6) return "Qaytish o‘rtacha: shar urilgach bir necha marta sakrashi mumkin.";
    return "Qaytish katta: shar elastikroq sakraydi.";
  }, [params.bounce]);

  function sample(p: SamplePoint) {
    pushSeries(series.current, p, MAX_POINTS);
    setLatest(p);

    if (!drawPending.current) {
      drawPending.current = true;
      requestAnimationFrame(() => {
        const c = chartRef.current;
        if (c) drawChart(c, series.current);
        drawPending.current = false;
      });
    }
  }

  function hardReset(next: Params) {
    series.current = [];
    setLatest({ t: 0, h: next.height, v: 0 });
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
    setLatest({ t: 0, h: next.height, v: 0 });
    setSeed((x) => x + 1);
    setPaused(true);
  }

  return (
    <div
      style={{
        padding: 18,
        background:
          "radial-gradient(circle at top right, rgba(56,189,248,0.08), transparent 22%), radial-gradient(circle at top left, rgba(245,158,11,0.08), transparent 18%), linear-gradient(180deg, #07111b 0%, #0a1420 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", maxWidth: 1400, margin: "0 auto", gap: 16 }}>
        <div
          style={{
            gridColumn: "span 12",
            background: "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(10,18,30,0.98))",
            border: "1px solid rgba(148,163,184,0.16)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
            borderRadius: 24,
            padding: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 760 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <Link href="/labs" className="btn btnGhost">
                  ← Ortga
                </Link>
                <Link href="/labs?fan=fizika" className="btn btnGhost">
                  Fizika laboratoriyalari
                </Link>
              </div>

              <div style={{ fontSize: 30, fontWeight: 800, color: "white" }}>
                Interaktiv 3D laboratoriya: erkin tushish
              </div>
              <p style={{ marginTop: 10, lineHeight: 1.8, fontSize: 15, color: "#cbd5e1" }}>
                Bu laboratoriyada shar turli balandlikdan tashlanadi. O‘quvchi gravitatsiya,
                tushish vaqti va tezlik qanday o‘zgarishini 3D sahna hamda grafik orqali kuzatadi.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 300 }}>
              <FormulaPill text="h(t) — balandlik" />
              <FormulaPill text="v = g · t (erkin tushishda)" />
              <FormulaPill text="t = √(2h / g)" />
              <FormulaPill text="Havo qarshiligi va massa ham ta'sir qiladi" />
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 16 }}>
          <div style={{ borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))", border: "1px solid rgba(148,163,184,0.16)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Boshqaruv paneli</div>

            <label style={{ display: "block", marginTop: 14, color: "#cbd5e1" }}>
              Boshlang'ich balandlik: {params.height.toFixed(1)} m
            </label>
            <input className="input" type="range" min="1" max="10" step="0.5" value={params.height} onChange={(e) => updateParams({ height: Number(e.target.value) })} />

            <label style={{ display: "block", marginTop: 12, color: "#cbd5e1" }}>
              Gravitatsiya g: {params.gravity.toFixed(1)} m/s²
            </label>
            <input className="input" type="range" min="1.6" max="15" step="0.1" value={params.gravity} onChange={(e) => updateParams({ gravity: Number(e.target.value) })} />

            <label style={{ display: "block", marginTop: 12, color: "#cbd5e1" }}>
              Qaytish (bounce): {params.bounce.toFixed(2)}
            </label>
            <input className="input" type="range" min="0" max="0.9" step="0.05" value={params.bounce} onChange={(e) => updateParams({ bounce: Number(e.target.value) })} />

            <label style={{ display: "block", marginTop: 12, color: "#cbd5e1" }}>
              Havo qarshiligi: {params.drag.toFixed(2)}
            </label>
            <input className="input" type="range" min="0" max="0.2" step="0.01" value={params.drag} onChange={(e) => updateParams({ drag: Number(e.target.value) })} />

            <label style={{ display: "block", marginTop: 12, color: "#cbd5e1" }}>
              Massa: {params.mass.toFixed(1)} kg
            </label>
            <input className="input" type="range" min="0.5" max="5" step="0.5" value={params.mass} onChange={(e) => updateParams({ mass: Number(e.target.value) })} />

            <label style={{ display: "block", marginTop: 12, color: "#cbd5e1" }}>
              Animatsiya tezligi: {params.timeScale.toFixed(2)}×
            </label>
            <input className="input" type="range" min="0.2" max="3" step="0.1" value={params.timeScale} onChange={(e) => updateParams({ timeScale: Number(e.target.value) })} />

            <div style={{ display: "flex", marginTop: 14, gap: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={() => setPaused((x) => !x)}>
                {paused ? "Play" : "Pause"}
              </button>
              <button className="btn btnGhost" onClick={reset}>
                Qayta boshlash
              </button>
              <button className="btn btnGhost" onClick={() => updateParams({ timeScale: 0.5 })}>
                Slow-mo
              </button>
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 18 }}>Tayyor tajribalar</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button className="btn btnGhost" onClick={() => applyPreset({ height: 5, gravity: 9.8, bounce: 0.2, drag: 0.02, mass: 1, timeScale: 1 })}>Yer</button>
              <button className="btn btnGhost" onClick={() => applyPreset({ height: 5, gravity: 1.6, bounce: 0.2, drag: 0.01, mass: 1, timeScale: 1 })}>Oy</button>
              <button className="btn btnGhost" onClick={() => applyPreset({ height: 8, gravity: 9.8, bounce: 0.6, drag: 0.01, mass: 1, timeScale: 1 })}>Sakrovchi shar</button>
              <button className="btn btnGhost" onClick={() => applyPreset({ height: 8, gravity: 9.8, bounce: 0.15, drag: 0.12, mass: 0.5, timeScale: 1 })}>Kuchli havo</button>
            </div>
          </div>

          <div style={{ borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))", border: "1px solid rgba(148,163,184,0.16)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Asosiy natijalar</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <span className="badge">h = {latest.h.toFixed(2)} m</span>
              <span className="badge">v = {latest.v.toFixed(2)} m/s</span>
              <span className="badge">t = {latest.t.toFixed(2)} s</span>
            </div>
          </div>

          <div style={{ borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))", border: "1px solid rgba(148,163,184,0.16)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Dinamik xulosa</div>
            <p style={{ marginTop: 10, lineHeight: 1.75, color: "#cbd5e1" }}>{explanation}</p>
            <p style={{ marginTop: 8, lineHeight: 1.75, color: "#cbd5e1" }}>{bounceText}</p>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 16 }}>
          <div style={{ borderRadius: 20, overflow: "hidden", minHeight: 560, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.98))", border: "1px solid rgba(148,163,184,0.16)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(148,163,184,0.12)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>3D tushish sahnasi</div>
                <div style={{ marginTop: 4, color: "#cbd5e1", fontSize: 14 }}>
                  Shar balandlikdan tushadi, yerga uriladi va qaytish parametri bo‘lsa sakraydi.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="badge">Erkin tushish</span>
                <span className="badge">Tezlik oshishi</span>
                <span className="badge">Balandlik kamayishi</span>
              </div>
            </div>

            <div style={{ height: 500 }}>
              <Canvas camera={{ position: [4.8, 4.6, 6.2], fov: 45 }} shadows>
                <FallScene params={params} paused={paused} seed={seed} onSample={sample} />
              </Canvas>
            </div>
          </div>

          <div style={{ borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))", border: "1px solid rgba(148,163,184,0.16)" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Grafik: h(t) va v(t)</div>
            <p style={{ marginTop: 8, color: "#cbd5e1", fontSize: 14 }}>
              Grafikda balandlikning kamayishi va tezlikning ortishi vaqt bo‘yicha ko‘rinadi.
            </p>
            <canvas ref={chartRef} width={760} height={250} style={{ width: "100%", borderRadius: 14, marginTop: 12, background: "rgba(255,255,255,0.03)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 16 }}>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard title="Joriy balandlik" value={`${fmt(latest.h, 2)} m`} sub="Shar balandligi" accent="#2563eb" />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard title="Joriy tezlik" value={`${fmt(latest.v, 2)} m/s`} sub="Tushishda ortadi" accent="#f59e0b" />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard title="Nazariy vaqt" value={`${fmt(idealFallTime, 2)} s`} sub="t = √(2h/g)" accent="#22c55e" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 16 }}>
            <div style={{ gridColumn: "span 4", borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))", border: "1px solid rgba(148,163,184,0.16)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Tushuncha</div>
              <p style={{ lineHeight: 1.7, marginTop: 8, color: "#cbd5e1" }}>
                Erkin tushishda jism pastga tomon muntazam tezlanadi. Shu sabab vaqt o‘tishi bilan tezlik ortadi.
              </p>
            </div>
            <div style={{ gridColumn: "span 4", borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))", border: "1px solid rgba(148,163,184,0.16)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Sinab ko‘ring</div>
              <p style={{ lineHeight: 1.7, marginTop: 8, color: "#cbd5e1" }}>
                g ni 9.8 va 1.6 ga qo‘yib solishtiring. Qaysi holatda shar sekinroq tushadi?
              </p>
            </div>
            <div style={{ gridColumn: "span 4", borderRadius: 20, padding: 18, background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))", border: "1px solid rgba(148,163,184,0.16)" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Xulosa</div>
              <p style={{ lineHeight: 1.7, marginTop: 8, color: "#cbd5e1" }}>
                Bu laboratoriya erkin tushishda balandlik, vaqt va tezlik orasidagi bog‘lanishni ko‘rsatadi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
