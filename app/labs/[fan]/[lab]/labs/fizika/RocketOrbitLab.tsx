"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

const Y_AXIS = new THREE.Vector3(0, 1, 0);

type Params = {
  v0_kms: number;
  height_km: number;
  azimuthDeg: number;
  timeScale: number;
  substeps: number;
  dragOn: boolean;
};

const DEFAULT: Params = {
  v0_kms: 7.8,
  height_km: 250,
  azimuthDeg: 90,
  timeScale: 80,
  substeps: 12,
  dragOn: false,
};

// Real units (km, s)
const EARTH_RADIUS_KM = 6371;
const MU = 398600.4418; // km^3/s^2
const KM_TO_UNITS = 1 / 1000; // 1000 km -> 1 unit

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

// Atmosfera modeli
function airDensity(altKm: number) {
  const H = 7.5;
  const h = clamp(altKm, 0, 120);
  return Math.exp(-h / H);
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

// Qalin real-time trail
function ThickTrailLite({
  pointsRef,
  maxPoints = 1400,
  widthPx = 6,
}: {
  pointsRef: React.MutableRefObject<THREE.Vector3[]>;
  maxPoints?: number;
  widthPx?: number;
}) {
  const geom = useMemo(() => new LineGeometry(), []);
  const mat = useMemo(
    () =>
      new LineMaterial({
        color: new THREE.Color(1.0, 0.95, 0.2),
        linewidth: widthPx,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        depthTest: false,
      }),
    [widthPx]
  );

  const line = useMemo(() => new Line2(geom, mat), [geom, mat]);
  const frameN = useRef(0);

  useFrame(({ size }) => {
    mat.resolution.set(size.width, size.height);

    frameN.current++;
    if (frameN.current % 2 !== 0) return;

    const pts = pointsRef.current;
    if (pts.length < 2) return;

    const start = Math.max(0, pts.length - maxPoints);
    const len = pts.length - start;

    const positions = new Array<number>(len * 3);
    for (let i = 0; i < len; i++) {
      const p = pts[start + i];
      const k = i * 3;
      positions[k] = p.x;
      positions[k + 1] = p.y;
      positions[k + 2] = p.z;
    }

    geom.setPositions(positions);

    if (frameN.current % 12 === 0) {
      line.computeLineDistances();
    }
  });

  return <primitive object={line} />;
}

// Oldindan hisoblangan trayektoriya
function PredictedOrbit({ params }: { params: Params }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = [];

    const startR = EARTH_RADIUS_KM + clamp(params.height_km, 0, 60000);
    const pos = new THREE.Vector3(startR, 0, 0);

    const { east, north } = makeLaunchBasis(pos);
    const az = toRad(params.azimuthDeg);

    const tangent = east
      .clone()
      .multiplyScalar(Math.cos(az))
      .add(north.clone().multiplyScalar(Math.sin(az)))
      .normalize();

    const vel = tangent.multiplyScalar(Math.max(0, params.v0_kms));
    const acc = new THREE.Vector3();

    const dt = 8;
    const steps = 1400;

    for (let i = 0; i < steps; i++) {
      const r = pos.length();
      if (r <= EARTH_RADIUS_KM) break;

      const r3 = Math.max(1e-9, r * r * r);
      acc.copy(pos).multiplyScalar(-MU / r3);

      vel.addScaledVector(acc, dt);
      pos.addScaledVector(vel, dt);

      points.push(
        new THREE.Vector3(
          pos.x * KM_TO_UNITS,
          pos.y * KM_TO_UNITS,
          pos.z * KM_TO_UNITS
        )
      );
    }

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [params]);

  const line = useMemo(() => {
    const lineGeo = new LineGeometry();
    const pts = geometry.attributes.position?.array as Float32Array | undefined;
    if (pts) {
      lineGeo.setPositions(Array.from(pts));
    }
    return new Line2(
      lineGeo,
      new LineMaterial({
        color: new THREE.Color(0, 1, 0.67),
        linewidth: 3,
        transparent: true,
        opacity: 0.6,
      })
    );
  }, [geometry]);

  return <primitive object={line} />;
}

function EarthLite({ radius }: { radius: number }) {
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial color="#1a3b8a" roughness={0.95} metalness={0.02} />
      </mesh>

      <mesh>
        <sphereGeometry args={[radius * 1.015, 48, 48]} />
        <meshBasicMaterial
          color="#8cc6ff"
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

function Scene({
  params,
  paused,
  seed,
  onImpact,
}: {
  params: Params;
  paused: boolean;
  seed: number;
  onImpact: (m: string) => void;
}) {
  const rocket = useRef<THREE.Group>(null);

  const rKm = useRef(new THREE.Vector3());
  const vKm = useRef(new THREE.Vector3());
  const aKm = useRef(new THREE.Vector3());

  const g = useRef(new THREE.Vector3());
  const gNext = useRef(new THREE.Vector3());
  const aNextRef = useRef(new THREE.Vector3());
  const dragA = useRef(new THREE.Vector3());
  const dragNext = useRef(new THREE.Vector3());
  const rNext = useRef(new THREE.Vector3());
  const vNext = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const tmpVec = useRef(new THREE.Vector3());

  const acc = useRef(0);
  const tSim = useRef(0);

  const fixedDt = 1 / 60;
  const trailPts = useRef<THREE.Vector3[]>([]);
  const stepCounter = useRef(0);

  function gravity(posKm: THREE.Vector3, out: THREE.Vector3) {
    const r = posKm.length();
    const r3 = Math.max(1e-9, r * r * r);
    return out.copy(posKm).multiplyScalar(-MU / r3);
  }

  useEffect(() => {
    acc.current = 0;
    tSim.current = 0;
    trailPts.current = [];
    stepCounter.current = 0;

    const startR = EARTH_RADIUS_KM + clamp(params.height_km, 0, 60000);
    const startPosKm = new THREE.Vector3(startR, 0, 0);

    rKm.current.copy(startPosKm);

    const { east, north } = makeLaunchBasis(startPosKm);
    const az = toRad(params.azimuthDeg);

    const tangent = east
      .clone()
      .multiplyScalar(Math.cos(az))
      .add(north.clone().multiplyScalar(Math.sin(az)))
      .normalize();

    vKm.current.copy(tangent.multiplyScalar(Math.max(0, params.v0_kms)));
    gravity(rKm.current, aKm.current);

    if (rocket.current) {
      rocket.current.position.set(
        rKm.current.x * KM_TO_UNITS,
        rKm.current.y * KM_TO_UNITS,
        rKm.current.z * KM_TO_UNITS
      );
      rocket.current.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        tangent
      );
      trailPts.current.push(rocket.current.position.clone());
    }

    onImpact("");
  }, [seed, params.v0_kms, params.height_km, params.azimuthDeg, onImpact]);

  useFrame((_, realDelta) => {
    if (paused || !rocket.current) return;

    acc.current += realDelta * clamp(params.timeScale, 1, 300);

    while (acc.current >= fixedDt) {
      acc.current -= fixedDt;

      const steps = clamp(Math.floor(params.substeps || 1), 1, 16);
      const h = fixedDt / steps;

      for (let s = 0; s < steps; s++) {
        const rNow = rKm.current.length();
        const altKm = rNow - EARTH_RADIUS_KM;

        gravity(rKm.current, g.current);

        dragA.current.set(0, 0, 0);
        if (params.dragOn) {
          const rho = airDensity(altKm);
          const speed = vKm.current.length();
          if (speed > 1e-6 && rho > 1e-6) {
            const k = 0.003;
            dragA.current.copy(vKm.current).multiplyScalar(-k * rho * speed);
          }
        }

        aKm.current.copy(g.current).add(dragA.current);

        rNext.current
          .copy(rKm.current)
          .addScaledVector(vKm.current, h)
          .addScaledVector(aKm.current, 0.5 * h * h);

        gravity(rNext.current, gNext.current);

        dragNext.current.set(0, 0, 0);
        if (params.dragOn) {
          const altNext = rNext.current.length() - EARTH_RADIUS_KM;
          const rho = airDensity(altNext);
          const speed = vKm.current.length();
          if (speed > 1e-6 && rho > 1e-6) {
            const k = 0.003;
            dragNext.current.copy(vKm.current).multiplyScalar(-k * rho * speed);
          }
        }

        aNextRef.current.copy(gNext.current).add(dragNext.current);

        vNext.current.copy(vKm.current);
        tmpVec.current.copy(aKm.current).add(aNextRef.current);
        vNext.current.addScaledVector(tmpVec.current, 0.5 * h);

        rKm.current.copy(rNext.current);
        vKm.current.copy(vNext.current);
        aKm.current.copy(aNextRef.current);

        const rr = rKm.current.length();
        if (rr <= EARTH_RADIUS_KM) {
          rKm.current.setLength(EARTH_RADIUS_KM);
          vKm.current.set(0, 0, 0);
          aKm.current.set(0, 0, 0);
          onImpact(
            "❗Raketa Yer sirtiga qaytdi. v0 ni oshirib yoki balandlikni kattalashtirib qayta sinab ko‘ring."
          );
          acc.current = 0;
          break;
        }

        rocket.current.position.set(
          rKm.current.x * KM_TO_UNITS,
          rKm.current.y * KM_TO_UNITS,
          rKm.current.z * KM_TO_UNITS
        );

        if (vKm.current.lengthSq() > 1e-10) {
          dir.current.copy(vKm.current).normalize();
          rocket.current.quaternion.setFromUnitVectors(Y_AXIS, dir.current);
        }

        stepCounter.current++;
        if (stepCounter.current % 2 === 0) {
          trailPts.current.push(rocket.current.position.clone());
          if (trailPts.current.length > 2200) {
            trailPts.current.splice(0, trailPts.current.length - 2200);
          }
        }

        tSim.current += h;
      }
    }
  });

  const earthR = EARTH_RADIUS_KM * KM_TO_UNITS;

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[8, 7, 5]} intensity={1.35} />

      <EarthLite radius={earthR} />

      {/* Oldindan ko‘rinadigan trayektoriya */}
      <PredictedOrbit params={params} />

      {/* Real raketa izi */}
      <ThickTrailLite pointsRef={trailPts} maxPoints={1400} widthPx={6} />

      <group ref={rocket}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.95, 16]} />
          <meshStandardMaterial color="#e7eefc" roughness={0.5} metalness={0.25} />
        </mesh>

        <mesh position={[0, 0.62, 0]}>
          <coneGeometry args={[0.16, 0.35, 16]} />
          <meshStandardMaterial color="#ffcc66" roughness={0.55} metalness={0.15} />
        </mesh>

        <mesh position={[0, 0.0, 0]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial
            emissive="#7aa7ff"
            emissiveIntensity={2.4}
            color="#0b1220"
          />
        </mesh>
      </group>

      <OrbitControls
        target={[0, 0, 0]}
        enableZoom
        enablePan
        minDistance={8}
        maxDistance={40}
      />
    </>
  );
}

export default function RocketOrbitLab() {
  const [params, setParams] = useState<Params>(DEFAULT);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(1);
  const [impactMsg, setImpactMsg] = useState("");

  function reset() {
    setSeed((x) => x + 1);
    setPaused(false);
    setImpactMsg("");
  }

  function preset(v: number) {
    setParams((p) => ({ ...p, v0_kms: v }));
    setSeed((x) => x + 1);
    setPaused(false);
    setImpactMsg("");
  }

  const subjects = [
    { name: "Fizika", href: "/labs?fan=fizika" },
    { name: "Kimyo", href: "/labs?fan=kimyo" },
    { name: "Biologiya", href: "/labs?fan=biologiya" },
    { name: "Informatika", href: "/labs?fan=informatika" },
  ];

  return (
    <div style={{ padding: 16 }}>
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div style={{ flex: 1, minWidth: 320, maxWidth: 520 }}>
          <div
            className="row"
            style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}
          >
            {subjects.map((subject) => (
              <Link key={subject.href} className="btn btnGhost" href={subject.href}>
                {subject.name}
              </Link>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 20,
              borderRadius: 24,
              background: "linear-gradient(135deg, rgba(59,130,246,0.16), rgba(191,219,254,0.9))",
              border: "1px solid rgba(59,130,246,0.18)",
              boxShadow: "0 18px 38px rgba(59,130,246,0.12)",
            }}
          >
            <div className="h2" style={{ marginBottom: 10 }}>
              Raketa: orbita va qochish tezligi
            </div>
            <p className="muted" style={{ marginTop: 0, lineHeight: 1.75 }}>
              Raketa tezligi yetarli bo‘lsa, u Yer atrofida aylanishi mumkin.
              Tezlik juda past bo‘lsa Yerga qaytadi, juda katta bo‘lsa qochib ketadi.
              Yashil chiziq — oldindan hisoblangan trayektoriya, sariq chiziq — real harakat izi.
            </p>
            <div className="row" style={{ marginTop: 14, gap: 8, flexWrap: "wrap" }}>
              <span className="badge">Orbita</span>
              <span className="badge">Qochish tezligi</span>
              <span className="badge">Vazn va balandlik</span>
            </div>
          </div>

          {impactMsg ? (
            <div className="card" style={{ marginTop: 12 }}>
              <div className="muted">{impactMsg}</div>
            </div>
          ) : null}

          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">v₀ (km/s)</div>
              <input
                className="input"
                type="number"
                step="0.1"
                value={params.v0_kms}
                onChange={(e) =>
                  setParams((p) => ({ ...p, v0_kms: Number(e.target.value) }))
                }
              />

              <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
                <button className="btn btnGhost" onClick={() => preset(7.8)}>
                  7.8
                </button>
                <button className="btn btnGhost" onClick={() => preset(9.8)}>
                  9.8
                </button>
                <button className="btn btnGhost" onClick={() => preset(11.2)}>
                  11.2
                </button>
                <button className="btn btnGhost" onClick={() => preset(15)}>
                  15
                </button>
              </div>

              <div className="muted" style={{ marginTop: 8 }}>
                Tavsiya: orbita ko‘rish uchun h = 200..400 km, Drag OFF qilib sinang.
              </div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Balandlik h (km)</div>
              <input
                className="input"
                type="number"
                step="10"
                value={params.height_km}
                onChange={(e) =>
                  setParams((p) => ({ ...p, height_km: Number(e.target.value) }))
                }
              />
              <div className="muted" style={{ marginTop: 8 }}>
                200–500 km orbitani ko‘rish uchun qulay.
              </div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Azimut (°)</div>
              <input
                className="input"
                type="number"
                min="0"
                max="360"
                value={params.azimuthDeg}
                onChange={(e) =>
                  setParams((p) => ({ ...p, azimuthDeg: Number(e.target.value) }))
                }
              />
              <div className="muted" style={{ marginTop: 8 }}>
                90° — tangensial uchish, orbitaga mos holat.
              </div>
            </div>

            <div className="card" style={{ gridColumn: "span 6" }}>
              <div className="h3">Vaqt tezligi (1..300×)</div>
              <input
                className="input"
                type="range"
                min="1"
                max="300"
                step="1"
                value={params.timeScale}
                onChange={(e) =>
                  setParams((p) => ({ ...p, timeScale: Number(e.target.value) }))
                }
              />
              <div className="muted" style={{ marginTop: 8 }}>
                {params.timeScale.toFixed(0)}×
              </div>

              <div className="h3" style={{ marginTop: 12 }}>
                Substeps (1..16)
              </div>
              <input
                className="input"
                type="number"
                min="1"
                max="16"
                value={params.substeps}
                onChange={(e) =>
                  setParams((p) => ({ ...p, substeps: Number(e.target.value) }))
                }
              />
              <div className="muted" style={{ marginTop: 8 }}>
                Tez vaqt rejimida 12–16 tavsiya qilinadi.
              </div>

              <label className="row" style={{ marginTop: 10, gap: 8 }}>
                <input
                  type="checkbox"
                  checked={params.dragOn}
                  onChange={(e) =>
                    setParams((p) => ({ ...p, dragOn: e.target.checked }))
                  }
                />
                <span className="muted">Atmosfera qarshiligi (drag) ON/OFF</span>
              </label>
            </div>
          </div>

          <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={reset}>
              Reset
            </button>
            <button className="btn btnGhost" onClick={() => setPaused((x) => !x)}>
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>

        <div
          style={{
            width: "min(900px, 100%)",
            height: 660,
            marginLeft: 12,
            flex: 1,
            minWidth: 340,
          }}
        >
          <div
            className="card"
            style={{ padding: 0, overflow: "hidden", height: "100%" }}
          >
            <Canvas camera={{ position: [0, 10, 16], fov: 45 }}>
              <Scene
                params={params}
                paused={paused}
                seed={seed}
                onImpact={(m) => setImpactMsg(m)}
              />
            </Canvas>
          </div>
        </div>
      </div>
    </div>
  );
}