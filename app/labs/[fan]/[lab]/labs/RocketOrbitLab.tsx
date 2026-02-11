"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { drawSeries, pushSeries, SeriesPoint } from "@/lib/chart";

// Fat line (qalin trail) — three/examples
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

type Params = {
  v0_kms: number; // km/s
  height_km: number; // altitude above Earth surface at start
  launchAzimuthDeg: number; // 0..360 in tangent plane
  timeScale: number; // 1 = realtime, 20 = 20x faster
  substeps: number; // physics substeps per fixed dt
};

const DEFAULT: Params = {
  v0_kms: 9.0,
  height_km: 0,
  launchAzimuthDeg: 90,
  timeScale: 20, // ✅ 20x default
  substeps: 8,
};

// --- Physics (real units) ---
const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // km^3/s^2 (Earth standard gravitational parameter)

// --- Render scale: 1000 km => 1 unit ---
const KM_TO_UNITS = 1 / 1000;

// Helpers
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function makeLaunchBasis(surfacePosKm: THREE.Vector3) {
  // radial outward
  const up = surfacePosKm.clone().normalize();

  // stable tangent axes
  const worldNorth = new THREE.Vector3(0, 1, 0);
  let east = new THREE.Vector3().crossVectors(worldNorth, up);
  if (east.lengthSq() < 1e-10) east = new THREE.Vector3(0, 0, 1).cross(up);
  east.normalize();

  const north = new THREE.Vector3().crossVectors(up, east).normalize();
  return { up, east, north };
}

// Orbital elements from r, v in km and km/s
type OrbitElems = {
  eps: number; // specific orbital energy km^2/s^2
  a: number | null; // semi-major axis km (null if eps ~ 0)
  e: number; // eccentricity
  rp: number | null; // periapsis radius km
  ra: number | null; // apoapsis radius km (null for escape/hyperbolic)
  state: "BOUND" | "PARABOLIC" | "ESCAPE";
};

function orbitalElements(rKm: THREE.Vector3, vKm: THREE.Vector3): OrbitElems {
  const r = rKm.length();
  const v = vKm.length();

  const eps = v * v / 2 - MU / r;

  // angular momentum
  const hVec = new THREE.Vector3().crossVectors(rKm, vKm);
  const h = hVec.length();

  // eccentricity vector: e = (v×h)/mu - r_hat
  const rHat = rKm.clone().normalize();
  const vxh = new THREE.Vector3().crossVectors(vKm, hVec);
  const eVec = vxh.multiplyScalar(1 / MU).sub(rHat);
  const e = eVec.length();

  // a = -mu/(2 eps) (if eps != 0)
  let state: OrbitElems["state"] = "BOUND";
  if (Math.abs(eps) < 1e-9) state = "PARABOLIC";
  else if (eps > 0) state = "ESCAPE";

  let a: number | null = null;
  if (Math.abs(eps) >= 1e-9) a = -MU / (2 * eps);

  // periapsis/apoapsis for bound ellipse: rp = a(1-e), ra = a(1+e)
  let rp: number | null = null;
  let ra: number | null = null;

  if (a !== null && state === "BOUND") {
    rp = a * (1 - e);
    ra = a * (1 + e);
  } else if (a !== null && state !== "BOUND") {
    // For escape/hyperbolic, rp still meaningful: rp = h^2 / (mu * (1 + e))
    // (works for conics), but ra is infinite.
    rp = (h * h) / (MU * (1 + e));
    ra = null;
  }

  return { eps, a, e, rp, ra, state };
}

function feedbackText(elems: OrbitElems, altKm: number, vKms: number) {
  if (elems.state === "ESCAPE") {
    return `✅ Qochish rejimi: energiya musbat (ε>0). Raketa Yer tortishishidan chiqib ketadi. (v≈${vKms.toFixed(
      2
    )} km/s)`;
  }
  if (elems.state === "PARABOLIC") {
    return `⚠️ Chegara holat (parabolik): ε≈0. Juda kichik o‘zgarish ham qaytish yoki qochishni keltiradi.`;
  }
  // bound
  if (altKm < 1) return `⚠️ Juda past: sirtga yaqin. Boshlanishda kuchli ishqalanish/atmosfera bo‘lsa, tez tushishi mumkin (biz atmosferani modellamadik).`;
  return `✅ Orbita rejimi: ε<0. Periapsis/apoapsis orqali trajektoriyani tahlil qiling.`;
}

/** Qalin + fade trail (Line2) */
function FadeTrail({
  pointsRef,
  maxPoints = 1400,
  width = 3.5, // px
}: {
  pointsRef: React.MutableRefObject<THREE.Vector3[]>;
  maxPoints?: number;
  width?: number;
}) {
  const { size } = useThree();

  const trail = useMemo(() => {
    const geom = new LineGeometry();
    // Positions are a flat array [x,y,z,x,y,z,...]
    geom.setPositions([0, 0, 0, 0, 0, 0]);

    const mat = new LineMaterial({
      color: new THREE.Color(0.48, 0.65, 1.0),
      linewidth: width, // px
      transparent: true,
      opacity: 0.0, // start invisible until we have points
      depthTest: true,
      depthWrite: false,
    });

    mat.resolution.set(size.width, size.height);

    const line = new Line2(geom, mat);
    line.computeLineDistances();
    return { line, geom, mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trail.mat.resolution.set(size.width, size.height);
    trail.mat.linewidth = width;
  }, [size.width, size.height, width, trail.mat]);

  useFrame(() => {
    const pts = pointsRef.current;
    const n = Math.min(pts.length, maxPoints);
    if (n < 2) {
      trail.mat.opacity = 0.0;
      return;
    }

    // Build positions (only last n points)
    const start = pts.length - n;
    const pos: number[] = new Array(n * 3);

    let k = 0;
    for (let i = start; i < pts.length; i++) {
      const p = pts[i];
      pos[k++] = p.x;
      pos[k++] = p.y;
      pos[k++] = p.z;
    }

    trail.geom.setPositions(pos);
    trail.line.computeLineDistances();
    
    const fullness = clamp(n / maxPoints, 0, 1);
    trail.mat.opacity = 0.25 + 0.65 * fullness; // 0.25..0.9
  });

  return <primitive object={trail.line} />;
}

/** Earth with day + night maps */
function Earth({ radius }: { radius: number }) {
  const tex = useMemo(() => {
    const loader = new THREE.TextureLoader();

    // If images missing, loader will error; we just ignore and use fallback color
    const day = loader.load(
      "/textures/earth_day.jpg",
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
      },
      undefined,
      () => {}
    );

    const night = loader.load(
      "/textures/earth_night.jpg",
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
      },
      undefined,
      () => {}
    );

    return { day, night };
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[radius, 96, 96]} />
      <meshStandardMaterial
        map={tex.day}
        emissive={new THREE.Color(1, 1, 1)}
        emissiveMap={tex.night}
        emissiveIntensity={0.85}
        metalness={0.05}
        roughness={0.9}
        color="#1a3b8a" // fallback
      />
    </mesh>
  );
}

function Atmosphere({ radius }: { radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.012, 96, 96]} />
      <meshBasicMaterial
        color="#8cc6ff"
        transparent
        opacity={0.12}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function Scene({
  params,
  paused,
  seed,
  onSample,
  onElems,
}: {
  params: Params;
  paused: boolean;
  seed: number;
  onSample: (p: SeriesPoint) => void;
  onElems: (e: OrbitElems, altKm: number, vKms: number) => void;
}) {
  const rocket = useRef<THREE.Group | null>(null);

  // Physics state in km and km/s
  const rKm = useRef(new THREE.Vector3());
  const vKm = useRef(new THREE.Vector3());
  const aKm = useRef(new THREE.Vector3()); // acceleration km/s^2

  const acc = useRef(0);
  const tSim = useRef(0);

  // Trail points in scene units
  const trailPts = useRef<THREE.Vector3[]>([]);

  const fixedDt = 1 / 60;
  const earthRadiusUnits = EARTH_RADIUS_KM * KM_TO_UNITS;

  // Compute gravity acceleration at position (km)
  function gravity(posKm: THREE.Vector3) {
    const r = posKm.length();
    const r3 = Math.max(1e-9, r * r * r);
    return posKm.clone().multiplyScalar(-MU / r3);
  }

  useEffect(() => {
    acc.current = 0;
    tSim.current = 0;
    trailPts.current = [];

    // Start at +X point on surface
    const startR = EARTH_RADIUS_KM + clamp(params.height_km, 0, 60000);
    const startPosKm = new THREE.Vector3(startR, 0, 0);
    rKm.current.copy(startPosKm);

    const { up, east, north } = makeLaunchBasis(startPosKm);

    // Rocket stands vertical (up)
    if (rocket.current) {
      rocket.current.position.set(
        startPosKm.x * KM_TO_UNITS,
        startPosKm.y * KM_TO_UNITS,
        startPosKm.z * KM_TO_UNITS
      );
      rocket.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
    }

    // Initial velocity in tangent plane
    const az = toRad(params.launchAzimuthDeg);
    const tangent = east.clone().multiplyScalar(Math.cos(az)).add(north.clone().multiplyScalar(Math.sin(az))).normalize();

// ✅ add small radial "lift-off" component so it launches from surface visibly
    const radial = up.clone(); // outward
    const lift = 0.18;         // 0..0.35 (qancha katta bo‘lsa, shuncha tikroq start)
    const dir0 = tangent.clone().multiplyScalar(1 - lift).add(radial.multiplyScalar(lift)).normalize();

    vKm.current.copy(dir0.multiplyScalar(Math.max(0, params.v0_kms)));


    // Initial acceleration for Verlet
    aKm.current.copy(gravity(rKm.current));

    // Initial sample
    const alt = startR - EARTH_RADIUS_KM;
    const v0 = params.v0_kms;
    const a0 = aKm.current.length();
    onSample({ t: 0, x: alt, v: v0, a: a0 });

    const elems = orbitalElements(rKm.current, vKm.current);
    onElems(elems, alt, v0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, params.v0_kms, params.height_km, params.launchAzimuthDeg]);

  useFrame((_, realDelta) => {
    if (paused || !rocket.current) return;

    // Fast forward / slow mo
    acc.current += realDelta * clamp(params.timeScale, 0.05, 20);

    while (acc.current >= fixedDt) {
      acc.current -= fixedDt;

      const steps = clamp(Math.floor(params.substeps || 1), 1, 40);
      const h = fixedDt / steps;

      for (let s = 0; s < steps; s++) {
        // --- Velocity-Verlet ---
        // r_{n+1} = r_n + v_n dt + 0.5 a_n dt^2
        const rNext = rKm.current
          .clone()
          .addScaledVector(vKm.current, h)
          .addScaledVector(aKm.current, 0.5 * h * h);

        // a_{n+1} = g(r_{n+1})
        const aNext = gravity(rNext);

        // v_{n+1} = v_n + 0.5 (a_n + a_{n+1}) dt
        const vNext = vKm.current.clone().addScaledVector(aKm.current.clone().add(aNext), 0.5 * h);

        rKm.current.copy(rNext);
        vKm.current.copy(vNext);
        aKm.current.copy(aNext);

        // Simple surface constraint (bounce/damp)
        const rLen = rKm.current.length();
        if (rLen < EARTH_RADIUS_KM) {
          rKm.current.setLength(EARTH_RADIUS_KM);
          // damp radial component
          const n = rKm.current.clone().normalize();
          const v = vKm.current.clone();
          const vn = n.clone().multiplyScalar(v.dot(n));
          const vt = v.sub(vn);
          vKm.current.copy(vt.addScaledVector(vn, -0.35));
          // recompute acceleration after correction
          aKm.current.copy(gravity(rKm.current));
        }

        tSim.current += h;
      }

      // Update render position
      rocket.current.position.set(rKm.current.x * KM_TO_UNITS, rKm.current.y * KM_TO_UNITS, rKm.current.z * KM_TO_UNITS);

      // Keep rocket vertical (radial up)
      const v = vKm.current.clone();
      if (v.lengthSq() > 1e-10) {
        const dir = v.normalize(); // direction in km-space
        rocket.current.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir
        );
      }

      // Trail
      trailPts.current.push(rocket.current.position.clone());
      if (trailPts.current.length > 5000) trailPts.current.splice(0, trailPts.current.length - 5000);

      // Samples
      const rNow = rKm.current.length();
      const alt = rNow - EARTH_RADIUS_KM;
      const vNow = vKm.current.length();
      const aNow = aKm.current.length();

      onSample({ t: tSim.current, x: alt, v: vNow, a: aNow });

      // Update orbit elements periodically
      if (Math.floor(tSim.current * 4) % 6 === 0) {
        const elems = orbitalElements(rKm.current, vKm.current);
        onElems(elems, alt, vNow);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 6, 3]} intensity={1.35} />

      {/* Earth */}
      <Earth radius={earthRadiusUnits} />
      <Atmosphere radius={earthRadiusUnits} />

      {/* Trail */}
      <FadeTrail pointsRef={trailPts} maxPoints={2200} width={6} />

      {/* Rocket (bigger & visible) */}
      <group ref={rocket}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.85, 24]} />
          <meshStandardMaterial metalness={0.35} roughness={0.45} color="#e7eefc" />
        </mesh>

        <mesh position={[0, 0.52, 0]}>
          <coneGeometry args={[0.11, 0.28, 24]} />
          <meshStandardMaterial metalness={0.25} roughness={0.55} color="#ffcc66" />
        </mesh>

        {/* bright marker for visibility */}
        <mesh position={[0, 0.0, 0]}>
          <sphereGeometry args={[0.055, 20, 20]} />
          <meshStandardMaterial emissive="#7aa7ff" emissiveIntensity={2.6} color="#0b1220" />
        </mesh>

        {/* tiny fins */}
        <mesh position={[0.0, -0.33, 0.12]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.16, 0.08, 0.02]} />
          <meshStandardMaterial metalness={0.2} roughness={0.7} color="#7aa7ff" />
        </mesh>
        <mesh position={[0.12, -0.33, 0.0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.02, 0.08, 0.16]} />
          <meshStandardMaterial metalness={0.2} roughness={0.7} color="#7aa7ff" />
        </mesh>
      </group>

      <gridHelper args={[10, 10]} />

      {/* Camera: free (zoom in/out), not attached to rocket */}
      <OrbitControls enableZoom enablePan />
    </>
  );
}

function fmtKm(x: number | null) {
  if (x === null || !Number.isFinite(x)) return "—";
  return `${x.toFixed(0)} km`;
}
function fmtNum(x: number | null, d = 3) {
  if (x === null || !Number.isFinite(x)) return "—";
  return x.toFixed(d);
}

export default function RocketOrbitLab() {
  const [params, setParams] = useState<Params>(DEFAULT);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(1);

  const series = useRef<SeriesPoint[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const [elems, setElems] = useState<OrbitElems | null>(null);
  const [altKm, setAltKm] = useState(0);
  const [vKms, setVKms] = useState(0);

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

  function applyNow() {
    series.current = [];
    setSeed((x) => x + 1);
    setPaused(false);
  }

  function preset(v: number) {
    setParams((p) => ({ ...p, v0_kms: v }));
    series.current = [];
    setSeed((x) => x + 1);
    setPaused(false);
  }

  function onElems(e: OrbitElems, alt: number, v: number) {
    setElems(e);
    setAltKm(alt);
    setVKms(v);
  }

  const notebookFeedback = useMemo(() => {
    if (!elems) return "—";
    return feedbackText(elems, altKm, vKms);
  }, [elems, altKm, vKms]);

  const periAlt = useMemo(() => {
    if (!elems?.rp) return null;
    return elems.rp - EARTH_RADIUS_KM;
  }, [elems]);

  const apoAlt = useMemo(() => {
    if (!elems?.ra) return null;
    return elems.ra - EARTH_RADIUS_KM;
  }, [elems]);

  return (
    <div style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* LEFT: LAB NOTEBOOK / CONTROL PANEL */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 520 }}>
          <div className="h2">Raketa laboratoriyasi (PRO)</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Format: <b>katalog → tajriba → natija → xulosa</b>. Tezlikni kiriting va trajektoriyani kuzating.
          </p>

          {/* LAB NOTEBOOK */}
          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Lab daftari</div>

            <div className="muted" style={{ marginTop: 8 }}>
              <b>Kiritilgan parametrlar</b>
            </div>
            <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
              <span className="badge">v₀: {params.v0_kms.toFixed(2)} km/s</span>
              <span className="badge">h: {params.height_km.toFixed(0)} km</span>
              <span className="badge">azimut: {params.launchAzimuthDeg.toFixed(0)}°</span>
              <span className="badge">time: {params.timeScale.toFixed(1)}×</span>
              <span className="badge">substeps: {params.substeps}</span>
            </div>

            <hr className="hr" />

            <div className="muted" style={{ marginTop: 6 }}>
              <b>O‘lchovlar (real vaqt)</b>
            </div>
            <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
              <span className="badge">Alt: {altKm.toFixed(0)} km</span>
              <span className="badge">v: {vKms.toFixed(2)} km/s</span>
              <span className="badge">Rejim: {elems ? (elems.state === "BOUND" ? "Orbita" : elems.state === "ESCAPE" ? "Qochish" : "Chegara") : "—"}</span>
            </div>

            <hr className="hr" />

            <div className="muted" style={{ marginTop: 6 }}>
              <b>Orbital hisoblar</b>
            </div>
            <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
              <span className="badge">ε: {elems ? fmtNum(elems.eps, 3) : "—"} km²/s²</span>
              <span className="badge">a: {elems ? fmtKm(elems.a) : "—"}</span>
              <span className="badge">e: {elems ? fmtNum(elems.e, 4) : "—"}</span>
              <span className="badge">Periapsis: {elems ? fmtKm(elems.rp) : "—"} (alt {periAlt === null ? "—" : periAlt.toFixed(0) + " km"})</span>
              <span className="badge">Apoapsis: {elems ? (elems.ra ? fmtKm(elems.ra) : "∞") : "—"} (alt {apoAlt === null ? "—" : apoAlt.toFixed(0) + " km"})</span>
            </div>

            <hr className="hr" />

            <div className="muted">
              <b>Xulosa (feedback)</b>
            </div>
            <div className="muted" style={{ marginTop: 6, lineHeight: 1.65 }}>
              {notebookFeedback}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">v₀ (km/s)</div>
              <input
                className="input"
                type="number"
                step="0.1"
                value={params.v0_kms}
                onChange={(e) => setParams((p) => ({ ...p, v0_kms: Number(e.target.value) }))}
              />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn btnGhost" onClick={() => preset(7.8)}>7.8</button>
                <button className="btn btnGhost" onClick={() => preset(9.8)}>9.8</button>
                <button className="btn btnGhost" onClick={() => preset(11.2)}>11.2</button>
                <button className="btn btnGhost" onClick={() => preset(15)}>15</button>
              </div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Balandlik h (km)</div>
              <input
                className="input"
                type="number"
                step="10"
                value={params.height_km}
                onChange={(e) => setParams((p) => ({ ...p, height_km: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>0 = Yer sirtidan</div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Azimut (°)</div>
              <input
                className="input"
                type="number"
                min="0"
                max="360"
                value={params.launchAzimuthDeg}
                onChange={(e) => setParams((p) => ({ ...p, launchAzimuthDeg: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>90° — tangens yo‘nalish</div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Tezlik ko‘paytirgich (timeScale)</div>
              <input
                className="input"
                type="range"
                min="0.2"
                max="20"
                step="0.2"
                value={params.timeScale}
                onChange={(e) => setParams((p) => ({ ...p, timeScale: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>{params.timeScale.toFixed(1)}×</div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Substeps</div>
              <input
                className="input"
                type="number"
                min="1"
                max="40"
                value={params.substeps}
                onChange={(e) => setParams((p) => ({ ...p, substeps: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>Velocity-Verlet + substeps = barqaror</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={reset}>Reset</button>
            <button className="btn btnGhost" onClick={() => setPaused((x) => !x)}>
              {paused ? "Resume" : "Pause"}
            </button>
            <button className="btn btnGhost" onClick={applyNow}>Apply & Run</button>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Grafik: x(t), v(t), a(t)</div>
            <canvas ref={chartRef} width={520} height={180} style={{ width: "100%", borderRadius: 12 }} />
            <div className="muted" style={{ marginTop: 8 }}>
              x — balandlik (km), v — tezlik (km/s), a — grav. tezlanish (km/s²)
            </div>
          </div>

          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            Teksturalar: <span className="kbd">public/textures/earth_day.jpg</span> va{" "}
            <span className="kbd">public/textures/earth_night.jpg</span> qo‘ying.
          </div>
        </div>

        {/* RIGHT: 3D VIEW */}
        <div style={{ width: "min(860px, 100%)", height: 640, marginLeft: 12, flex: 1, minWidth: 340 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
            <Canvas camera={{ position: [3.4, 2.4, 3.4], fov: 55 }}>
              <Scene params={params} paused={paused} seed={seed} onSample={sample} onElems={onElems} />
            </Canvas>
          </div>

          <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
            Kamera erkin (OrbitControls): aylantirish/zoom. Trail qalin chiziq bo‘lib ko‘rinadi.
          </div>
        </div>
      </div>
    </div>
  );
}
