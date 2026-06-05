"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type Params = {
  voltage: number;
  r1: number;
  r2: number;
};

type Point3D = [number, number, number];

const DEFAULT: Params = {
  voltage: 12,
  r1: 10,
  r2: 20,
};

function formatNum(n: number, digits = 2) {
  return Number.isFinite(n) ? n.toFixed(digits) : "0.00";
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

function MovingCharge({
  path,
  speed,
  phase,
}: {
  path: Point3D[];
  speed: number;
  phase: number;
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
        return [
          x1 + (x2 - x1) * ratio,
          y1 + (y2 - y1) * ratio,
          z1 + (z2 - z1) * ratio,
        ];
      }

      distance -= segment;
    }

    return path[path.length - 1];
  }

  useFrame((_, delta) => {
    tRef.current += delta * Math.max(0.12, speed * 0.22);
    const [x, y, z] = getPoint(tRef.current);
    ref.current?.position.set(x, y, z);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={1.4} />
    </mesh>
  );
}

function CurrentArrow({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.42, 0.05, 0.12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.25, 0, 0]}>
        <coneGeometry args={[0.12, 0.22, 12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function ResistorBody({
  position,
  label,
}: {
  position: [number, number, number];
  label: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.1, 0.4, 0.56]} />
        <meshStandardMaterial color="#f59e0b" emissive="#78350f" emissiveIntensity={0.3} />
      </mesh>
      <Html position={[0, 0.42, 0]} center distanceFactor={8}>
        <div
          style={{
            padding: "4px 8px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            background: "rgba(255,251,235,0.96)",
            color: "#7c2d12",
            border: "1px solid rgba(245,158,11,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function Battery3D({ voltage }: { voltage: number }) {
  return (
    <group position={[-3.45, 0.38, 0]}>
      <mesh>
        <cylinderGeometry args={[0.34, 0.34, 0.85, 24]} />
        <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.22} />
      </mesh>

      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.2, 0.18, 0.2]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.55} />
      </mesh>

      <mesh position={[0, -0.43, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.15]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.3} />
      </mesh>

      <SceneLabel
        position={[0, 0.95, 0]}
        text={`U = ${voltage.toFixed(1)} V`}
        background="rgba(224,242,254,0.96)"
      />
    </group>
  );
}

function CircuitScene({
  current,
  voltage,
  r1,
  r2,
  u1,
  u2,
}: {
  current: number;
  voltage: number;
  r1: number;
  r2: number;
  u1: number;
  u2: number;
}) {
  const path: Point3D[] = [
    [-3.4, 0.18, -1.2],
    [-3.4, 0.18, 1.2],
    [-1.6, 0.18, 1.2],
    [0, 0.18, 1.2],
    [1.7, 0.18, 1.2],
    [3.4, 0.18, 1.2],
    [3.4, 0.18, -1.2],
    [-3.4, 0.18, -1.2],
  ];

  return (
    <>
      <color attach="background" args={["#07111b"]} />
      <fog attach="fog" args={["#07111b", 8, 18]} />

      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} />
      <hemisphereLight args={["#d8f2ff", "#0f1b2d", 0.45]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color="#0b1726" roughness={0.98} />
      </mesh>

      <mesh position={[0, -0.005, 0]}>
        <boxGeometry args={[8.8, 0.02, 3.6]} />
        <meshStandardMaterial color="#102237" roughness={0.95} />
      </mesh>

      <mesh position={[0, 0.12, 1.2]}>
        <boxGeometry args={[7.1, 0.12, 0.16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.12, -1.2]}>
        <boxGeometry args={[6.8, 0.12, 0.16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.38} />
      </mesh>
      <mesh position={[-3.4, 0.12, 0]}>
        <boxGeometry args={[0.16, 0.12, 2.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.38} />
      </mesh>
      <mesh position={[3.4, 0.12, 0]}>
        <boxGeometry args={[0.16, 0.12, 2.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.38} />
      </mesh>

      <ResistorBody position={[-0.95, 0.22, 1.2]} label="R1" />
      <ResistorBody position={[1.25, 0.22, 1.2]} label="R2" />

      <Battery3D voltage={voltage} />

      <SceneLabel
        position={[-0.95, 0.98, 1.2]}
        text={`R1 = ${r1.toFixed(0)} Ω | U1 = ${u1.toFixed(2)} V`}
        background="rgba(254,243,199,0.96)"
      />
      <SceneLabel
        position={[1.25, 0.98, 1.2]}
        text={`R2 = ${r2.toFixed(0)} Ω | U2 = ${u2.toFixed(2)} V`}
        background="rgba(254,243,199,0.96)"
      />
      <SceneLabel
        position={[3.1, 0.85, -1.2]}
        text={`I = ${current.toFixed(3)} A`}
        background="rgba(220,252,231,0.96)"
      />

      <CurrentArrow position={[-2.2, 0.34, 1.55]} rotationY={0} />
      <CurrentArrow position={[0.2, 0.34, 1.55]} rotationY={0} />
      <CurrentArrow position={[2.5, 0.34, 1.55]} rotationY={0} />
      <CurrentArrow position={[3.75, 0.34, 0]} rotationY={-Math.PI / 2} />
      <CurrentArrow position={[0, 0.34, -1.55]} rotationY={Math.PI} />
      <CurrentArrow position={[-3.75, 0.34, 0]} rotationY={Math.PI / 2} />

      {Array.from({ length: 12 }, (_, index) => (
        <MovingCharge key={index} path={path} speed={current} phase={index / 12} />
      ))}

      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2.08}
        minDistance={5.5}
        maxDistance={11}
        target={[0, 0.2, 0]}
      />
    </>
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

export default function SeriesCircuitLabProfessional() {
  const [params, setParams] = useState(DEFAULT);

  const rTotal = params.r1 + params.r2;
  const current = rTotal > 0 ? params.voltage / rTotal : 0;
  const u1 = current * params.r1;
  const u2 = current * params.r2;
  const p1 = current * current * params.r1;
  const p2 = current * current * params.r2;
  const pTotal = p1 + p2;

  const explanation = useMemo(() => {
    if (params.r1 > params.r2) {
      return "R1 katta bo‘lgani uchun U1 kuchlanish tushuvi ham kattaroq bo‘ladi.";
    }
    if (params.r2 > params.r1) {
      return "R2 katta bo‘lgani uchun U2 kuchlanish tushuvi ham kattaroq bo‘ladi.";
    }
    return "R1 va R2 teng bo‘lsa, kuchlanish teng taqsimlanadi.";
  }, [params.r1, params.r2]);

  const currentExplanation = useMemo(() => {
    if (current < 0.25) {
      return "Umumiy qarshilik katta, shu sabab tok kichik.";
    }
    if (current < 0.6) {
      return "Tok o‘rtacha qiymatda. Zanjir barqaror ishlamoqda.";
    }
    return "Tok nisbatan katta. Qarshilik kamaygani yoki kuchlanish oshgani seziladi.";
  }, [current]);

  function applyPreset(next: Params) {
    setParams(next);
  }

  return (
    <div
      style={{
        padding: 18,
        background:
          "radial-gradient(circle at top right, rgba(14,165,233,0.08), transparent 28%), linear-gradient(180deg, #07111b 0%, #0a1420 100%)",
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
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div className="h2" style={{ fontSize: 30, color: "white" }}>
                3D laboratoriya: elektr zanjirini ketma-ket ulash
              </div>
              <p className="muted" style={{ marginTop: 10, lineHeight: 1.8, fontSize: 15 }}>
                Ushbu laboratoriya ketma-ket ulangan ikki rezistordan iborat elektr zanjirini
                3D formatda ko‘rsatadi. O‘quvchi kuchlanish, umumiy qarshilik, tok kuchi,
                kuchlanish tushuvi va quvvatning qanday o‘zgarishini real vaqtda kuzatadi.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 280 }}>
              <FormulaPill text="R = R1 + R2" />
              <FormulaPill text="I = U / R" />
              <FormulaPill text="U = U1 + U2" />
              <FormulaPill text="Ketma-ket ulanishda tok bir xil: I1 = I2 = I" />
            </div>
          </div>
        </div>

        <div style={{ gridColumn: "span 4", display: "grid", gap: 16 }}>
          <div
            className="card"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div className="h3" style={{ color: "white" }}>Boshqaruv paneli</div>

            <label className="muted" style={{ display: "block", marginTop: 14 }}>
              Manba kuchlanishi U = {params.voltage.toFixed(1)} V
            </label>
            <input
              className="input"
              type="range"
              min="1"
              max="24"
              step="0.5"
              value={params.voltage}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, voltage: Number(e.target.value) }))
              }
            />

            <label className="muted" style={{ display: "block", marginTop: 16 }}>
              Qarshilik R1 = {params.r1.toFixed(0)} Ω
            </label>
            <input
              className="input"
              type="range"
              min="2"
              max="60"
              step="1"
              value={params.r1}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, r1: Number(e.target.value) }))
              }
            />

            <label className="muted" style={{ display: "block", marginTop: 16 }}>
              Qarshilik R2 = {params.r2.toFixed(0)} Ω
            </label>
            <input
              className="input"
              type="range"
              min="2"
              max="60"
              step="1"
              value={params.r2}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, r2: Number(e.target.value) }))
              }
            />

            <div className="h3" style={{ marginTop: 18, color: "white" }}>Tayyor tajribalar</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button
                className="btn btnGhost"
                onClick={() => applyPreset({ voltage: 12, r1: 10, r2: 20 })}
              >
                12V / 10Ω / 20Ω
              </button>
              <button
                className="btn btnGhost"
                onClick={() => applyPreset({ voltage: 24, r1: 10, r2: 10 })}
              >
                24V / 10Ω / 10Ω
              </button>
              <button
                className="btn btnGhost"
                onClick={() => applyPreset({ voltage: 9, r1: 30, r2: 15 })}
              >
                9V / 30Ω / 15Ω
              </button>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div className="h3" style={{ color: "white" }}>Muhim tushunchalar</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <span className="badge">U — manba kuchlanishi</span>
              <span className="badge">R1, R2 — qarshiliklar</span>
              <span className="badge">R — umumiy qarshilik</span>
              <span className="badge">I — umumiy tok</span>
              <span className="badge">U1, U2 — kuchlanish tushuvi</span>
              <span className="badge">P1, P2 — quvvat</span>
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div className="h3" style={{ color: "white" }}>Dinamik xulosa</div>
            <p className="muted" style={{ marginTop: 10, lineHeight: 1.75 }}>
              {explanation}
            </p>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.75 }}>
              {currentExplanation}
            </p>
          </div>
        </div>

        <div style={{ gridColumn: "span 8", display: "grid", gap: 16 }}>
          <div
            className="card"
            style={{
              padding: 0,
              overflow: "hidden",
              minHeight: 560,
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.98))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
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
                <div className="h3" style={{ color: "white" }}>3D zanjir sahnasi</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  Ko‘k strelkalar tok yo‘nalishini, sariq sharlar esa zaryadlar harakatini ko‘rsatadi.
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className="badge">Tok bir xil</span>
                <span className="badge">Kuchlanish taqsimlanadi</span>
                <span className="badge">R ortsa I kamayadi</span>
              </div>
            </div>

            <div style={{ height: 500 }}>
              <Canvas camera={{ position: [0, 5.2, 7.4], fov: 42 }}>
                <CircuitScene
                  current={current}
                  voltage={params.voltage}
                  r1={params.r1}
                  r2={params.r2}
                  u1={u1}
                  u2={u2}
                />
              </Canvas>
            </div>
          </div>

          <div className="grid" style={{ gap: 16 }}>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Umumiy qarshilik"
                value={`${formatNum(rTotal, 1)} Ω`}
                sub="R = R1 + R2"
                accent="#f59e0b"
              />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Umumiy tok"
                value={`${formatNum(current, 3)} A`}
                sub="I = U / R"
                accent="#22c55e"
              />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Kuchlanish U1"
                value={`${formatNum(u1, 2)} V`}
                sub="1-rezistordagi tushuv"
                accent="#38bdf8"
              />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Kuchlanish U2"
                value={`${formatNum(u2, 2)} V`}
                sub="2-rezistordagi tushuv"
                accent="#a78bfa"
              />
            </div>
          </div>

          <div className="grid" style={{ gap: 16 }}>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="P1 quvvat"
                value={`${formatNum(p1, 2)} W`}
                sub="1-rezistorda ajralayotgan quvvat"
                accent="#fb7185"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="P2 quvvat"
                value={`${formatNum(p2, 2)} W`}
                sub="2-rezistorda ajralayotgan quvvat"
                accent="#f97316"
              />
            </div>
            <div style={{ gridColumn: "span 4" }}>
              <StatCard
                title="Umumiy quvvat"
                value={`${formatNum(pTotal, 2)} W`}
                sub="P = P1 + P2"
                accent="#06b6d4"
              />
            </div>
          </div>

          <div
            className="card"
            style={{
              background: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(8,15,27,0.96))",
              border: "1px solid rgba(148,163,184,0.16)",
            }}
          >
            <div className="h3" style={{ color: "white" }}>O‘quvchi uchun xulosa</div>
            <ul
              style={{
                color: "#cbd5e1",
                marginTop: 12,
                lineHeight: 1.9,
                paddingLeft: 18,
              }}
            >
              <li>Ketma-ket ulanishda barcha elementlardan bir xil tok o‘tadi.</li>
              <li>Umumiy qarshilik alohida qarshiliklar yig‘indisiga teng bo‘ladi.</li>
              <li>Qarshilik kattalashsa, tok kamayadi.</li>
              <li>Kuchlanish elementlar bo‘yicha taqsimlanadi: U = U1 + U2.</li>
              <li>Qaysi rezistor kattaroq bo‘lsa, o‘sha yerda kuchlanish tushuvi ham kattaroq bo‘ladi.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}