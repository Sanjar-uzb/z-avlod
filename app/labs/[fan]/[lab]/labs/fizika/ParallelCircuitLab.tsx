"use client";

import Link from "next/link";
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
  r1: 12,
  r2: 24,
};

function fmt(n: number, d = 2) {
  return Number.isFinite(n) ? n.toFixed(d) : "0.00";
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

function Dot({
  path,
  speed,
  phase,
  color,
}: {
  path: Point3D[];
  speed: number;
  phase: number;
  color: string;
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
    tRef.current += delta * Math.max(0.12, speed * 0.18);
    const [x, y, z] = getPoint(tRef.current);
    ref.current?.position.set(x, y, z);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
    </mesh>
  );
}

function CurrentArrow({
  position,
  rotationY = 0,
  color = "#38bdf8",
}: {
  position: [number, number, number];
  rotationY?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[0.42, 0.05, 0.12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.25, 0, 0]}>
        <coneGeometry args={[0.12, 0.22, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function BranchResistor({
  position,
  color,
  label,
}: {
  position: [number, number, number];
  color: string;
  label: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.1, 0.38, 0.54]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} />
      </mesh>
      <Html position={[0, 0.42, 0]} center distanceFactor={8}>
        <div
          style={{
            padding: "4px 9px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            background: "rgba(255,255,255,0.95)",
            color: "#0f172a",
            border: "1px solid rgba(148,163,184,0.18)",
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
    <group position={[-3.5, 0.4, 0]}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 20]} />
        <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.25} />
      </mesh>

      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.55} />
      </mesh>

      <mesh position={[0, -0.42, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.15]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.4} roughness={0.32} />
      </mesh>

      <SceneLabel
        position={[0, 0.95, 0]}
        text={`U = ${voltage.toFixed(1)} V`}
        background="rgba(224,242,254,0.96)"
      />
    </group>
  );
}

function ParallelScene({
  totalCurrent,
  i1,
  i2,
  voltage,
  r1,
  r2,
}: {
  totalCurrent: number;
  i1: number;
  i2: number;
  voltage: number;
  r1: number;
  r2: number;
}) {
  const loop: Point3D[] = [
    [-3.5, 0.15, -1.6],
    [-3.5, 0.15, 1.8],
    [3.5, 0.15, 1.8],
    [3.5, 0.15, -1.6],
    [-3.5, 0.15, -1.6],
  ];

  const branchTop: Point3D[] = [
    [-1.2, 0.15, 1.8],
    [-1.2, 0.15, 3.4],
    [1.2, 0.15, 3.4],
    [1.2, 0.15, 1.8],
  ];

  const branchBottom: Point3D[] = [
    [-1.2, 0.15, 1.8],
    [-1.2, 0.15, 0.5],
    [1.2, 0.15, 0.5],
    [1.2, 0.15, 1.8],
  ];

  return (
    <>
      <color attach="background" args={["#07141e"]} />
      <fog attach="fog" args={["#07141e", 8, 18]} />

      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 4]} intensity={1.2} />
      <hemisphereLight args={["#d8f2ff", "#101f31", 0.35]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color="#0c1b2b" roughness={0.96} />
      </mesh>

      <mesh position={[0, -0.005, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#102237" roughness={0.98} />
      </mesh>

      <mesh position={[0, 0.12, -1.6]}>
        <boxGeometry args={[7, 0.12, 0.16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.12, 1.8]}>
        <boxGeometry args={[7, 0.12, 0.16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>
      <mesh position={[-3.5, 0.12, 0.1]}>
        <boxGeometry args={[0.16, 0.12, 3.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>
      <mesh position={[3.5, 0.12, 0.1]}>
        <boxGeometry args={[0.16, 0.12, 3.4]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>

      <mesh position={[0, 0.12, 3.4]}>
        <boxGeometry args={[2.4, 0.12, 0.16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.12, 0.5]}>
        <boxGeometry args={[2.4, 0.12, 0.16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>
      <mesh position={[-1.2, 0.12, 2.6]}>
        <boxGeometry args={[0.16, 0.12, 1.6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>
      <mesh position={[1.2, 0.12, 2.6]}>
        <boxGeometry args={[0.16, 0.12, 1.6]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.35} roughness={0.36} />
      </mesh>

      <BranchResistor position={[0, 0.24, 3.4]} color="#22c55e" label="R1" />
      <BranchResistor position={[0, 0.24, 0.5]} color="#38bdf8" label="R2" />

      <Battery3D voltage={voltage} />

      <SceneLabel
        position={[0, 0.95, 3.4]}
        text={`R1 = ${r1.toFixed(0)} Ω | I1 = ${i1.toFixed(2)} A`}
        background="rgba(220,252,231,0.96)"
      />
      <SceneLabel
        position={[0, 0.95, 0.5]}
        text={`R2 = ${r2.toFixed(0)} Ω | I2 = ${i2.toFixed(2)} A`}
        background="rgba(224,242,254,0.96)"
      />
      <SceneLabel
        position={[2.8, 1.05, 1.8]}
        text={`I = ${totalCurrent.toFixed(2)} A`}
        background="rgba(254,249,195,0.96)"
      />

      <CurrentArrow position={[-2.3, 0.34, 1.8]} rotationY={0} color="#facc15" />
      <CurrentArrow position={[2.2, 0.34, 1.8]} rotationY={0} color="#facc15" />
      <CurrentArrow position={[0, 0.34, 3.75]} rotationY={0} color="#22c55e" />
      <CurrentArrow position={[0, 0.34, 0.85]} rotationY={0} color="#38bdf8" />
      <CurrentArrow position={[3.75, 0.34, 0]} rotationY={-Math.PI / 2} color="#facc15" />
      <CurrentArrow position={[-3.75, 0.34, 0]} rotationY={Math.PI / 2} color="#facc15" />

      {Array.from({ length: 8 }, (_, index) => (
        <Dot
          key={`main-${index}`}
          path={loop}
          speed={totalCurrent}
          phase={index / 8}
          color="#facc15"
        />
      ))}
      {Array.from({ length: 6 }, (_, index) => (
        <Dot
          key={`top-${index}`}
          path={branchTop}
          speed={i1}
          phase={index / 6}
          color="#4ade80"
        />
      ))}
      {Array.from({ length: 6 }, (_, index) => (
        <Dot
          key={`bottom-${index}`}
          path={branchBottom}
          speed={i2}
          phase={index / 6}
          color="#60a5fa"
        />
      ))}

      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2.08}
        minDistance={5.5}
        maxDistance={11}
        target={[0, 0.2, 1.2]}
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

export default function ParallelCircuitLabProfessional() {
  const [params, setParams] = useState(DEFAULT);

  const inverse = 1 / params.r1 + 1 / params.r2;
  const rTotal = inverse > 0 ? 1 / inverse : 0;
  const i1 = params.voltage / params.r1;
  const i2 = params.voltage / params.r2;
  const totalCurrent = i1 + i2;

  const explanation = useMemo(() => {
    if (params.r1 > params.r2) {
      return "R1 kattaroq bo‘lgani uchun uning tarmog‘idagi tok I1 kichikroq bo‘ladi.";
    }
    if (params.r2 > params.r1) {
      return "R2 kattaroq bo‘lgani uchun uning tarmog‘idagi tok I2 kichikroq bo‘ladi.";
    }
    return "R1 va R2 teng bo‘lsa, tarmoqlardagi toklar ham teng bo‘ladi.";
  }, [params.r1, params.r2]);

  const currentSummary = useMemo(() => {
    if (totalCurrent < 0.7) return "Umumiy tok kichik. Tarmoqlardagi qarshiliklar katta.";
    if (totalCurrent < 1.5) return "Umumiy tok o‘rtacha. Parallel ulanish aniq kuzatilmoqda.";
    return "Umumiy tok katta. Qarshiliklar kamaygan yoki kuchlanish ortgan.";
  }, [totalCurrent]);

  function applyPreset(next: Params) {
    setParams(next);
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
                3D laboratoriya: elektr zanjirini parallel ulash
              </div>
              <p className="muted" style={{ marginTop: 10, lineHeight: 1.8, fontSize: 15 }}>
                Bu laboratoriyada parallel ulanishdagi tok taqsimoti 3D ko‘rinishda namoyish etiladi.
                O‘quvchi kuchlanish barcha tarmoqlarda bir xil bo‘lishini, umumiy tok esa tarmoq
                toklarining yig‘indisiga teng ekanini real vaqtda kuzatadi.
              </p>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 300 }}>
              <FormulaPill text="1 / R = 1 / R1 + 1 / R2" />
              <FormulaPill text="I = I1 + I2" />
              <FormulaPill text="U = U1 = U2" />
              <FormulaPill text="Parallel ulanishda kuchlanish tarmoqlarda bir xil bo‘ladi" />
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
                onClick={() => applyPreset({ voltage: 12, r1: 12, r2: 24 })}
              >
                12V / 12Ω / 24Ω
              </button>
              <button
                className="btn btnGhost"
                onClick={() => applyPreset({ voltage: 24, r1: 12, r2: 12 })}
              >
                24V / 12Ω / 12Ω
              </button>
              <button
                className="btn btnGhost"
                onClick={() => applyPreset({ voltage: 9, r1: 30, r2: 10 })}
              >
                9V / 30Ω / 10Ω
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
              <span className="badge">R1, R2 — tarmoq qarshiliklari</span>
              <span className="badge">I1, I2 — tarmoq toklari</span>
              <span className="badge">I — umumiy tok</span>
              <span className="badge">U1 = U2 = U</span>
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
              {currentSummary}
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
                  Sariq sharlar — umumiy tok, yashil va ko‘k sharlar — tarmoq toklarini bildiradi.
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <span className="badge">I = I1 + I2</span>
                <span className="badge">U barcha tarmoqlarda bir xil</span>
                <span className="badge">R kamayganda I ortadi</span>
              </div>
            </div>

            <div style={{ height: 500 }}>
              <Canvas camera={{ position: [0, 5.4, 7.4], fov: 42 }}>
                <ParallelScene
                  totalCurrent={totalCurrent}
                  i1={i1}
                  i2={i2}
                  voltage={params.voltage}
                  r1={params.r1}
                  r2={params.r2}
                />
              </Canvas>
            </div>
          </div>

          <div className="grid" style={{ gap: 16 }}>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Umumiy qarshilik"
                value={`${fmt(rTotal, 2)} Ω`}
                sub="1/R = 1/R1 + 1/R2"
                accent="#f59e0b"
              />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Tarmoq toki I1"
                value={`${fmt(i1, 3)} A`}
                sub="I1 = U / R1"
                accent="#22c55e"
              />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Tarmoq toki I2"
                value={`${fmt(i2, 3)} A`}
                sub="I2 = U / R2"
                accent="#38bdf8"
              />
            </div>
            <div style={{ gridColumn: "span 3" }}>
              <StatCard
                title="Umumiy tok I"
                value={`${fmt(totalCurrent, 3)} A`}
                sub="I = I1 + I2"
                accent="#eab308"
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
            <div className="h3" style={{ color: "white" }}>Kuchlanish va tarmoqlar</div>
            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
              <span className="badge">U = {params.voltage.toFixed(2)} V</span>
              <span className="badge">U1 = {params.voltage.toFixed(2)} V</span>
              <span className="badge">U2 = {params.voltage.toFixed(2)} V</span>
              <span className="badge">R1 = {params.r1.toFixed(0)} Ω</span>
              <span className="badge">R2 = {params.r2.toFixed(0)} Ω</span>
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
              <li>Parallel ulanishda barcha tarmoqlarda kuchlanish bir xil bo‘ladi.</li>
              <li>Har bir tarmoq toki o‘z qarshiligiga bog‘liq bo‘ladi.</li>
              <li>Qarshilik qanchalik kichik bo‘lsa, shu tarmoqdagi tok shunchalik katta bo‘ladi.</li>
              <li>Umumiy tok tarmoq toklarining yig‘indisiga teng: I = I1 + I2.</li>
              <li>Parallel ulanishda umumiy qarshilik har bir alohida qarshilikdan kichik bo‘lishi mumkin.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}