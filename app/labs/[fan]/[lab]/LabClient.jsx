"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import labs from "../../../../data/labs.json";
import LabScene from "../../../../components/LabScene";

import MotionLab from "../../../../components/labs/physics/MotionLab";
import UniformMotionLab from "../../../../components/labs/physics/UniformMotionLab";
import NewtonLab from "../../../../components/labs/physics/NewtonLab";
import PressureLab from "../../../../components/labs/physics/PressureLab";
import BuoyancyLab from "../../../../components/labs/physics/BuoyancyLab";

function pickLab(meta) {
  if (!meta) return null;
  switch (meta.component) {
    case "physics/MotionLab":
      return "motion";
    case "physics/UniformMotionLab":
      return "uniform";
    case "physics/NewtonLab":
      return "newton";
    case "physics/PressureLab":
      return "pressure";
    case "physics/BuoyancyLab":
      return "buoyancy";
    default:
      return null;
  }
}

export default function LabClient({ params }) {
  const { fan, lab } = params;

  const meta = useMemo(
    () => labs.find((x) => x.fan === fan && x.lab === lab),
    [fan, lab]
  );

  const kind = useMemo(() => pickLab(meta), [meta]);

  // umumiy telemetriya
  const [tele, setTele] = useState({ v: 0, a: 0, x: 0, z: 0 });

  // ---- Controls (labga qarab ishlatiladi) ----
  const [mass, setMass] = useState(2);              // kg
  const [force, setForce] = useState(12);           // N
  const [friction, setFriction] = useState(0.25);   // 0..1

  const [initV, setInitV] = useState(4);            // m/s
  const [acc, setAcc] = useState(1.5);              // m/s^2

  const [area, setArea] = useState(0.02);           // m^2 (sirt)
  const [pressForce, setPressForce] = useState(80); // N

  const [objDensity, setObjDensity] = useState(600);   // kg/m3
  const [waterDensity, setWaterDensity] = useState(1000); // kg/m3
  const [volume, setVolume] = useState(0.003);         // m3

  if (!meta) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Laboratoriya topilmadi</div>
          <p className="muted">
            Bu URL labs.json ichida yo‘q. /labs sahifasidan laboratoriyani tanlang.
          </p>
          <Link className="btn btnGhost" href="/labs">Orqaga</Link>
        </div>
      </div>
    );
  }

  if (!kind) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Laboratoriya komponenti ulanmagan</div>
          <p className="muted">meta.component: {meta.component}</p>
          <Link className="btn btnGhost" href="/labs">Orqaga</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card hero">
        <div className="badgeRow">
          <span className="badge">Fan: {meta.fan}</span>
          <span className="badge">3D Lab</span>
          <span className="badge">URL: {meta.lab}</span>
        </div>

        <h1 className="heroTitle">{meta.title}</h1>
        <p className="heroSubtitle">{meta.desc}</p>

        <div className="row" style={{ marginTop: 10 }}>
          <Link className="btn btnGhost" href="/labs">Barcha laboratoriyalar</Link>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        {/* 3D */}
        <div className="card" style={{ gridColumn: "span 8" }}>
          <div className="h2">3D tajriba</div>

          <LabScene>
            {kind === "motion" && (
              <MotionLab
                mass={mass}
                friction={friction}
                initV={initV}
                onTelemetry={setTele}
              />
            )}

            {kind === "uniform" && (
              <UniformMotionLab
                mass={mass}
                friction={friction}
                modeAcc={acc}
                initV={initV}
                onTelemetry={setTele}
              />
            )}

            {kind === "newton" && (
              <NewtonLab
                mass={mass}
                friction={friction}
                force={force}
                onTelemetry={setTele}
              />
            )}

            {kind === "pressure" && (
              <PressureLab
                force={pressForce}
                area={area}
              />
            )}

            {kind === "buoyancy" && (
              <BuoyancyLab
                objDensity={objDensity}
                fluidDensity={waterDensity}
                volume={volume}
                onTelemetry={setTele}
              />
            )}
          </LabScene>

          <div className="row" style={{ marginTop: 10 }}>
            <span className="badge">v ≈ {tele.v.toFixed(2)} m/s</span>
            <span className="badge">a ≈ {tele.a.toFixed(2)} m/s²</span>
            <span className="badge">x ≈ {tele.x.toFixed(2)} m</span>
          </div>

          <p className="muted" style={{ marginTop: 10 }}>
            Sahna aylantiriladi. Parametrlarni o‘zgartiring va natijani kuzating.
          </p>
        </div>

        {/* Controls */}
        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="h2">Boshqaruv</div>

          {(kind === "motion" || kind === "uniform" || kind === "newton") && (
            <>
              <div className="h3">Massa (kg): {mass.toFixed(1)}</div>
              <input className="input" type="range" min="0.5" max="10" step="0.5"
                value={mass} onChange={(e) => setMass(Number(e.target.value))} />

              <div className="h3" style={{ marginTop: 12 }}>
                Ishqalanish (0..1): {friction.toFixed(2)}
              </div>
              <input className="input" type="range" min="0" max="1" step="0.02"
                value={friction} onChange={(e) => setFriction(Number(e.target.value))} />
            </>
          )}

          {(kind === "motion" || kind === "uniform") && (
            <>
              <div className="h3" style={{ marginTop: 12 }}>
                Boshlang‘ich tezlik v0 (m/s): {initV.toFixed(1)}
              </div>
              <input className="input" type="range" min="0" max="12" step="0.2"
                value={initV} onChange={(e) => setInitV(Number(e.target.value))} />
            </>
          )}

          {kind === "uniform" && (
            <>
              <div className="h3" style={{ marginTop: 12 }}>
                Tezlanish a (m/s²): {acc.toFixed(2)}
              </div>
              <input className="input" type="range" min="-3" max="3" step="0.05"
                value={acc} onChange={(e) => setAcc(Number(e.target.value))} />
              <p className="muted" style={{ marginTop: 8 }}>
                Rejim: sahnada “Tekis (a=0)” va “Tekis o‘zgaruvchan (a=const)” tugmalari bor.
              </p>
            </>
          )}

          {kind === "newton" && (
            <>
              <div className="h3" style={{ marginTop: 12 }}>
                Kuch (N): {force.toFixed(0)}
              </div>
              <input className="input" type="range" min="0" max="120" step="1"
                value={force} onChange={(e) => setForce(Number(e.target.value))} />
              <p className="muted" style={{ marginTop: 8 }}>
                “Itarish” tugmasini bosib kuch impulsini bering. F=ma ni kuzating.
              </p>
            </>
          )}

          {kind === "pressure" && (
            <>
              <div className="h3">Kuch F (N): {pressForce.toFixed(0)}</div>
              <input className="input" type="range" min="10" max="300" step="5"
                value={pressForce} onChange={(e) => setPressForce(Number(e.target.value))} />

              <div className="h3" style={{ marginTop: 12 }}>
                Sirt S (m²): {area.toFixed(3)}
              </div>
              <input className="input" type="range" min="0.005" max="0.08" step="0.001"
                value={area} onChange={(e) => setArea(Number(e.target.value))} />

              <hr className="hr" />
              <div className="h3">Hisob</div>
              <div className="row">
                <span className="badge">
                  P = F/S ≈ {(pressForce / area).toFixed(0)} Pa
                </span>
              </div>
            </>
          )}

          {kind === "buoyancy" && (
            <>
              <div className="h3">Jism zichligi ρ (kg/m³): {objDensity.toFixed(0)}</div>
              <input className="input" type="range" min="200" max="3000" step="20"
                value={objDensity} onChange={(e) => setObjDensity(Number(e.target.value))} />

              <div className="h3" style={{ marginTop: 12 }}>
                Suyuqlik zichligi ρₛ (kg/m³): {waterDensity.toFixed(0)}
              </div>
              <input className="input" type="range" min="700" max="1400" step="10"
                value={waterDensity} onChange={(e) => setWaterDensity(Number(e.target.value))} />

              <div className="h3" style={{ marginTop: 12 }}>
                Hajm V (m³): {volume.toFixed(4)}
              </div>
              <input className="input" type="range" min="0.001" max="0.01" step="0.0005"
                value={volume} onChange={(e) => setVolume(Number(e.target.value))} />

              <hr className="hr" />
              <p className="muted">
                ρ(jism) &lt; ρ(suv) bo‘lsa ko‘pincha suzadi, katta bo‘lsa cho‘kadi.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
