"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { drawSeries, pushSeries, SeriesPoint } from "@/lib/chart";

type Params = {
  v0_kms: number;           // km/s (initial)
  height_km: number;        // km
  azimuthDeg: number;       // 0..360 (tangent direction)
  timeScale: number;        // 0.2..50
  substeps: number;         // 1..60
  thrustOn: boolean;
  thrust_kms2: number;      // km/s^2 along velocity direction
  dragOn: boolean;          // simple atmosphere drag
};

const DEFAULT: Params = {
  v0_kms: 7.8,
  height_km: 0,
  azimuthDeg: 90,
  timeScale: 20,
  substeps: 12,
  thrustOn: false,
  thrust_kms2: 0.0,
  dragOn: true,
};

// Real units
const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // km^3/s^2
const KM_TO_UNITS = 1 / 1000;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function toRad(d: number) {
  return (d * Math.PI) / 180;
}

type OrbitElems = {
  eps: number; // km^2/s^2
  a: number | null; // km
  e: number;
  rp: number | null; // km
  ra: number | null; // km (null => escape)
  state: "BOUND" | "PARABOLIC" | "ESCAPE";
};

function orbitalElements(rKm: THREE.Vector3, vKm: THREE.Vector3): OrbitElems {
  const r = rKm.length();
  const v = vKm.length();

  const eps = v * v / 2 - MU / r;

  const hVec = new THREE.Vector3().crossVectors(rKm, vKm);
  const h = hVec.length();

  const rHat = rKm.clone().normalize();
  const vxh = new THREE.Vector3().crossVectors(vKm, hVec);
  const eVec = vxh.multiplyScalar(1 / MU).sub(rHat);
  const e = eVec.length();

  let state: OrbitElems["state"] = "BOUND";
  if (Math.abs(eps) < 1e-9) state = "PARABOLIC";
  else if (eps > 0) state = "ESCAPE";

  let a: number | null = null;
  if (Math.abs(eps) >= 1e-9) a = -MU / (2 * eps);

  let rp: number | null = null;
  let ra: number | null = null;

  if (a !== null && state === "BOUND") {
    rp = a * (1 - e);
    ra = a * (1 + e);
  } else {
    rp = (h * h) / (MU * (1 + e));
    ra = null;
  }

  return { eps, a, e, rp, ra, state };
}

function fmt(x: number | null, d = 3) {
  if (x === null || !Number.isFinite(x)) return "—";
  return x.toFixed(d);
}
function fmtKm(x: number | null) {
  if (x === null || !Number.isFinite(x)) return "—";
  return `${x.toFixed(0)} km`;
}

/** 100% stable trail: THREE.Line (always visible) */
function SimpleTrail({
  pointsRef,
  maxPoints = 4500,
}: {
  pointsRef: React.MutableRefObject<THREE.Vector3[]>;
  maxPoints?: number;
}) {
  const geom = useMemo(() => new THREE.BufferGeometry(), []);
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(1.0, 0.9, 0.25), // 🔥 sariq-yorqin
        transparent: true,
        opacity: 0.95,
      }),
    []
  );

  // create line once
  const line = useMemo(() => new THREE.Line(geom, mat), [geom, mat]);

  useFrame(() => {
    const pts = pointsRef.current;
    if (pts.length < 2) return;
    const sliced = pts.slice(Math.max(0, pts.length - maxPoints));
    geom.setFromPoints(sliced);
    geom.computeBoundingSphere();
  });

  return <primitive object={line} />;
}

/** Optional: Earth texture if exists, otherwise simple material */
function Earth({ radius }: { radius: number }) {
  // If you have textures, keep them in public/textures/...
  const tex = useMemo(() => {
    const loader = new THREE.TextureLoader();
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
        color="#1a3b8a"
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

function makeLaunchBasis(surfacePosKm: THREE.Vector3) {
  const up = surfacePosKm.clone().normalize();
  const worldNorth = new THREE.Vector3(0, 1, 0);

  let east = new THREE.Vector3().crossVectors(worldNorth, up);
  if (east.lengthSq() < 1e-10) east = new THREE.Vector3(0, 0, 1).cross(up);
  east.normalize();

  const north = new THREE.Vector3().crossVectors(up, east).normalize();
  return { up, east, north };
}

// Simple atmosphere density (0..120km), exponential
function airDensity(altKm: number) {
  const H = 7.5;
  const h = clamp(altKm, 0, 120);
  return Math.exp(-h / H);
}

function Scene({
  params,
  paused,
  seed,
  onSample,
  onElems,
  onImpact,
}: {
  params: Params;
  paused: boolean;
  seed: number;
  onSample: (p: SeriesPoint) => void;
  onElems: (e: OrbitElems, altKm: number, vKms: number) => void;
  onImpact: (msg: string) => void;
}) {
  const rocket = useRef<THREE.Group>(null);

  // Physics state (km, km/s, km/s^2)
  const rKm = useRef(new THREE.Vector3());
  const vKm = useRef(new THREE.Vector3());
  const aKm = useRef(new THREE.Vector3());

  const acc = useRef(0);
  const tSim = useRef(0);

  const trailPts = useRef<THREE.Vector3[]>([]);

  const fixedDt = 1 / 60;
  const earthR_units = EARTH_RADIUS_KM * KM_TO_UNITS;

  function gravity(posKm: THREE.Vector3) {
    const r = posKm.length();
    const r3 = Math.max(1e-9, r * r * r);
    return posKm.clone().multiplyScalar(-MU / r3);
  }

  useEffect(() => {
    acc.current = 0;
    tSim.current = 0;
    trailPts.current = [];

    // Start at +X axis (equator point)
    const startR = EARTH_RADIUS_KM + clamp(params.height_km, 0, 60000);
    const startPosKm = new THREE.Vector3(startR, 0, 0);
    rKm.current.copy(startPosKm);

    // Tangent direction (IMPORTANT: 100% tangential for orbit)
    const { up, east, north } = makeLaunchBasis(startPosKm);
    const az = toRad(params.azimuthDeg);
    const tangent = east.clone().multiplyScalar(Math.cos(az)).add(north.clone().multiplyScalar(Math.sin(az))).normalize();

    vKm.current.copy(tangent.multiplyScalar(Math.max(0, params.v0_kms)));
    aKm.current.copy(gravity(rKm.current));

    // init render
    if (rocket.current) {
      rocket.current.position.set(rKm.current.x * KM_TO_UNITS, rKm.current.y * KM_TO_UNITS, rKm.current.z * KM_TO_UNITS);
      // orient along velocity direction
      rocket.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
      trailPts.current.push(rocket.current.position.clone());
    }

    const alt = startR - EARTH_RADIUS_KM;
    onSample({ t: 0, x: alt, v: vKm.current.length(), a: aKm.current.length() });
    onElems(orbitalElements(rKm.current, vKm.current), alt, vKm.current.length());
    onImpact("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, params.v0_kms, params.height_km, params.azimuthDeg]);

  useFrame((_, realDelta) => {
    if (paused || !rocket.current) return;

    // allow up to 50x
    acc.current += realDelta * clamp(params.timeScale, 0.05, 50);

    while (acc.current >= fixedDt) {
      acc.current -= fixedDt;

      const steps = clamp(Math.floor(params.substeps || 1), 1, 60);
      const h = fixedDt / steps;

      for (let s = 0; s < steps; s++) {
        const rNow = rKm.current.length();
        const altKm = rNow - EARTH_RADIUS_KM;

        const g = gravity(rKm.current);

        // Thrust along velocity
        let thrustA = new THREE.Vector3(0, 0, 0);
        if (params.thrustOn && params.thrust_kms2 > 0) {
          const dir = vKm.current.lengthSq() > 1e-10 ? vKm.current.clone().normalize() : rKm.current.clone().normalize();
          thrustA = dir.multiplyScalar(params.thrust_kms2);
        }

        // Drag (only meaningful low altitude)
        let dragA = new THREE.Vector3(0, 0, 0);
        if (params.dragOn) {
          const rho = airDensity(altKm);
          const v = vKm.current.clone();
          const speed = v.length();
          if (speed > 1e-6 && rho > 1e-6) {
            const k = 0.0035; // tuning
            dragA = v.multiplyScalar(-k * rho * speed);
          }
        }

        const aTotal = g.clone().add(thrustA).add(dragA);

        // Velocity-Verlet
        const rNext = rKm.current.clone().addScaledVector(vKm.current, h).addScaledVector(aKm.current, 0.5 * h * h);

        // recompute a at next
        const altNext = rNext.length() - EARTH_RADIUS_KM;
        const gNext = gravity(rNext);

        let thrustNext = new THREE.Vector3(0, 0, 0);
        if (params.thrustOn && params.thrust_kms2 > 0) {
          const dir = vKm.current.lengthSq() > 1e-10 ? vKm.current.clone().normalize() : rNext.clone().normalize();
          thrustNext = dir.multiplyScalar(params.thrust_kms2);
        }

        let dragNext = new THREE.Vector3(0, 0, 0);
        if (params.dragOn) {
          const rho = airDensity(altNext);
          const v = vKm.current.clone();
          const speed = v.length();
          if (speed > 1e-6 && rho > 1e-6) {
            const k = 0.0035;
            dragNext = v.multiplyScalar(-k * rho * speed);
          }
        }

        const aNext = gNext.clone().add(thrustNext).add(dragNext);
        const vNext = vKm.current.clone().addScaledVector(aKm.current.clone().add(aNext), 0.5 * h);

        rKm.current.copy(rNext);
        vKm.current.copy(vNext);
        aKm.current.copy(aNext);

        // If hits ground: STOP (no bounce, no reflect)
        const rr = rKm.current.length();
        if (rr <= EARTH_RADIUS_KM) {
          rKm.current.setLength(EARTH_RADIUS_KM);
          vKm.current.set(0, 0, 0);
          aKm.current.set(0, 0, 0);
          onImpact("❗Raketa Yer sirtiga tushdi (impact). Parametrlarni o‘zgartirib qayta sinab ko‘ring.");
          // break all stepping for this frame
          acc.current = 0;
          break;
        }

        // update render + dense trail (every substep)
        rocket.current.position.set(rKm.current.x * KM_TO_UNITS, rKm.current.y * KM_TO_UNITS, rKm.current.z * KM_TO_UNITS);
        if (vKm.current.lengthSq() > 1e-10) {
          const dir = vKm.current.clone().normalize();
          rocket.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        }
        trailPts.current.push(rocket.current.position.clone());
        if (trailPts.current.length > 9000) trailPts.current.splice(0, trailPts.current.length - 9000);

        tSim.current += h;
      }

      // sample charts
      const alt = rKm.current.length() - EARTH_RADIUS_KM;
      onSample({ t: tSim.current, x: alt, v: vKm.current.length(), a: aKm.current.length() });

      // update orbit elems frequently
      const e = orbitalElements(rKm.current, vKm.current);
      onElems(e, alt, vKm.current.length());
    }
  });

  const earthR = EARTH_RADIUS_KM * KM_TO_UNITS;
  const padPos = useMemo(() => new THREE.Vector3(earthR, 0, 0), [earthR]);

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 6, 3]} intensity={1.35} />

      <Earth radius={earthR} />
      <Atmosphere radius={earthR} />

      {/* Launch pad */}
      <mesh position={padPos}>
        <cylinderGeometry args={[0.22, 0.25, 0.06, 24]} />
        <meshStandardMaterial metalness={0.25} roughness={0.65} color="#2a385b" />
      </mesh>

      {/* Trail */}
      <SimpleTrail pointsRef={trailPts} maxPoints={4500} />

      {/* Rocket (bigger & visible) */}
      <group ref={rocket}>
        <mesh>
          <cylinderGeometry args={[0.11, 0.11, 0.95, 26]} />
          <meshStandardMaterial metalness={0.35} roughness={0.45} color="#e7eefc" />
        </mesh>

        <mesh position={[0, 0.6, 0]}>
          <coneGeometry args={[0.14, 0.32, 26]} />
          <meshStandardMaterial metalness={0.25} roughness={0.55} color="#ffcc66" />
        </mesh>

        <mesh position={[0, 0.0, 0]}>
          <sphereGeometry args={[0.065, 18, 18]} />
          <meshStandardMaterial emissive="#7aa7ff" emissiveIntensity={2.6} color="#0b1220" />
        </mesh>
      </group>

      <gridHelper args={[10, 10]} />
      <OrbitControls enableZoom enablePan />
    </>
  );
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
  const [impactMsg, setImpactMsg] = useState("");

  function sample(p: SeriesPoint) {
    pushSeries(series.current, p, 260);
    const c = chartRef.current;
    if (c) drawSeries(c, series.current);
  }

  function onElems(e: OrbitElems, alt: number, v: number) {
    setElems(e);
    setAltKm(alt);
    setVKms(v);
  }

  function reset() {
    series.current = [];
    setSeed((x) => x + 1);
    setPaused(false);
  }

  function preset(v: number) {
    setImpactMsg("");
    setParams((p) => ({ ...p, v0_kms: v }));
    series.current = [];
    setSeed((x) => x + 1);
    setPaused(false);
  }

  const periAlt = useMemo(() => (elems?.rp ? elems.rp - EARTH_RADIUS_KM : null), [elems]);
  const apoAlt = useMemo(() => (elems?.ra ? elems.ra - EARTH_RADIUS_KM : null), [elems]);

  const verdict = useMemo(() => {
    if (!elems) return "—";
    if (elems.state === "ESCAPE") return "✅ Qochish (escape): ε > 0";
    if (elems.state === "PARABOLIC") return "⚠️ Chegara holat: ε ≈ 0";
    // bound
    if (periAlt !== null && periAlt < 0) return "❗Periapsis Yer ichida (impact bo‘ladi). v0 yoki balandlikni oshiring.";
    return "✅ Orbita (bound): ε < 0";
  }, [elems, periAlt]);

  return (
    <div style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 320, maxWidth: 560 }}>
          <div className="h2">Raketa: orbita va qochish tezligi (FINAL)</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Muhim: orbita chiqishi uchun boshlang‘ich tezlik <b>100% tangensial</b> (azimut) beriladi.
            Drag ON bo‘lsa, pastda tezlik “yeyiladi”.
          </p>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Lab daftari</div>
            <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
              <span className="badge">v₀: {params.v0_kms.toFixed(2)} km/s</span>
              <span className="badge">h: {params.height_km.toFixed(0)} km</span>
              <span className="badge">azimut: {params.azimuthDeg.toFixed(0)}°</span>
              <span className="badge">time: {params.timeScale.toFixed(1)}×</span>
              <span className="badge">substeps: {params.substeps}</span>
            </div>

            <hr className="hr" />

            <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
              <span className="badge">Alt: {altKm.toFixed(0)} km</span>
              <span className="badge">v: {vKms.toFixed(2)} km/s</span>
              <span className="badge">Thrust: {params.thrustOn ? "ON" : "OFF"} ({params.thrust_kms2.toFixed(3)} km/s²)</span>
              <span className="badge">Drag: {params.dragOn ? "ON" : "OFF"}</span>
            </div>

            <hr className="hr" />

            <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
              <span className="badge">ε: {elems ? fmt(elems.eps, 3) : "—"} km²/s²</span>
              <span className="badge">a: {elems ? fmtKm(elems.a) : "—"}</span>
              <span className="badge">e: {elems ? fmt(elems.e, 4) : "—"}</span>
              <span className="badge">Peri: {elems ? fmtKm(elems.rp) : "—"} (alt {periAlt === null ? "—" : periAlt.toFixed(0) + " km"})</span>
              <span className="badge">Apo: {elems ? (elems.ra ? fmtKm(elems.ra) : "∞") : "—"} (alt {apoAlt === null ? "—" : apoAlt.toFixed(0) + " km"})</span>
            </div>

            <hr className="hr" />
            <div className="muted" style={{ lineHeight: 1.65 }}>
              <b>Xulosa:</b> {impactMsg ? impactMsg : verdict}
            </div>
          </div>

          {/* Controls */}
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
                <button className="btn btnGhost" onClick={() => preset(10.0)}>10</button>
                <button className="btn btnGhost" onClick={() => preset(11.2)}>11.2</button>
                <button className="btn btnGhost" onClick={() => preset(15)}>15</button>
              </div>
              <div className="muted" style={{ marginTop: 8 }}>
                0 km balandlik + Drag ON bo‘lsa 7.8 ham pasayishi mumkin. Test uchun h=200..400 km qo‘ying.
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
              <div className="muted" style={{ marginTop: 8 }}>Orbita uchun 200–500 km qulay.</div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Azimut (°)</div>
              <input
                className="input"
                type="number"
                min="0"
                max="360"
                value={params.azimuthDeg}
                onChange={(e) => setParams((p) => ({ ...p, azimuthDeg: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>90° — tangens, orbita uchun ideal.</div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">timeScale (0.2..50×)</div>
              <input
                className="input"
                type="range"
                min="0.2"
                max="50"
                step="0.2"
                value={params.timeScale}
                onChange={(e) => setParams((p) => ({ ...p, timeScale: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>{params.timeScale.toFixed(1)}×</div>

              <div className="h3" style={{ marginTop: 12 }}>Substeps</div>
              <input
                className="input"
                type="number"
                min="1"
                max="60"
                value={params.substeps}
                onChange={(e) => setParams((p) => ({ ...p, substeps: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>50× uchun 20–40 tavsiya.</div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Thrust (km/s²)</div>
              <input
                className="input"
                type="range"
                min="0"
                max="0.06"
                step="0.001"
                value={params.thrust_kms2}
                onChange={(e) => setParams((p) => ({ ...p, thrust_kms2: Number(e.target.value) }))}
              />
              <div className="muted" style={{ marginTop: 8 }}>{params.thrust_kms2.toFixed(3)} km/s²</div>

              <label className="row" style={{ marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={params.thrustOn}
                  onChange={(e) => setParams((p) => ({ ...p, thrustOn: e.target.checked }))}
                />
                <span className="muted">Dvigatel (Thrust) ON/OFF</span>
              </label>

              <label className="row" style={{ marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={params.dragOn}
                  onChange={(e) => setParams((p) => ({ ...p, dragOn: e.target.checked }))}
                />
                <span className="muted">Atmospheric drag ON/OFF</span>
              </label>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => { setImpactMsg(""); reset(); }}>Reset</button>
            <button className="btn btnGhost" onClick={() => setPaused((x) => !x)}>
              {paused ? "Resume" : "Pause"}
            </button>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="h3">Grafik: x(t), v(t), a(t)</div>
            <canvas ref={chartRef} width={520} height={180} style={{ width: "100%", borderRadius: 12 }} />
            <div className="muted" style={{ marginTop: 8 }}>
              Ilmiy ish uchun: tajriba natijalarini kuzatish va tahlil qilish (x, v, a).
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ width: "min(900px, 100%)", height: 700, marginLeft: 12, flex: 1, minWidth: 340 }}>
          <div className="card" style={{ padding: 0, overflow: "hidden", height: "100%" }}>
            <Canvas camera={{ position: [3.6, 2.5, 3.6], fov: 55 }}>
              <Scene
                params={params}
                paused={paused}
                seed={seed}
                onSample={sample}
                onElems={onElems}
                onImpact={(m) => setImpactMsg(m)}
              />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
