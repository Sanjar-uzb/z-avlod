"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import labs from "../../../../data/labs.json";
import LabScene from "../../../../components/LabScene";
import TelemetryChart from "../../../../components/TelemetryChart";

import MotionLab from "../../../../components/labs/physics/MotionLab";
import UniformMotionLab from "../../../../components/labs/physics/UniformMotionLab";
import NewtonLab from "../../../../components/labs/physics/NewtonLab";
import PressureLab from "../../../../components/labs/physics/PressureLab";
import BuoyancyLab from "../../../../components/labs/physics/BuoyancyLab";

function pickLab(meta) {
  if (!meta) return null;
  switch (meta.component) {
    case "physics/MotionLab": return "motion";
    case "physics/UniformMotionLab": return "uniform";
    case "physics/NewtonLab": return "newton";
    case "physics/PressureLab": return "pressure";
    case "physics/BuoyancyLab": return "buoyancy";
    default: return null;
  }
}

export default function LabClient({ params }) {
  const { fan, lab } = params;

  const meta = useMemo(
    () => labs.find((x) => x.fan === fan && x.lab === lab),
    [fan, lab]
  );

  const kind = useMemo(() => pickLab(meta), [meta]);

  // ----- global controls -----
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1); // 1 | 0.5 | 0.25
  const [mode, setMode] = useState("tekis"); // uniform lab rejimi: tekis | tezlanishli

  // ----- telemetry -----
  const [tele, setTele] = useState({ v: 0, a: 0, x: 0, z: 0 });
  const [points, setPoints] = useState([]);

  // record throttling
  const lastPushRef = useRef(0);

  const pushTelemetry = (t) => {
    setTele(t);

    const now = performance.now();
    if (paused) return;

    // har 90ms da bitta nuqta yozamiz
    if (now - lastPushRef.current < 90) return;
    lastPushRef.current = now;

    setPoints((prev) => {
      const next = [...prev, { ...t, ts: now }];
      // limit
      if (next.length > 220) next.shift();
      return next;
    });
  };

  const labRef = useRef(null);

  function hardReset() {
    setPoints([]);
    setTele({ v: 0, a: 0, x: 0, z: 0 });
    // child reset
    labRef.current?.reset?.();
  }

  // ----- controls (labga qarab) -----
  const [mass, setMass] = useState(2);
  const [friction, setFriction] = useState(0.2);
  const [initV, setInitV] = useState(4);
  const [acc, setAcc] = useState(1.5);
  const [force, setForce] = useState(12);

  const [area, setArea] = useState(0.02);
  const [pressForce, setPressForce] = useState(80);

  const [objDensity, setObjDensity] = useState(600);
  const [fluidDensity, setFluidDensity] = useState(1000);
  const [volume, setVolume] = useState(0.003);

  // URL xato bo‘lsa ham — shu yerda mavjud lablarni ko‘rsatib qo‘yamiz
  if (!meta) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Laboratoriya topilmadi</div>
          <p className="muted">
            Siz ochgan URL ro‘yxatda yo‘q. Quyidagilardan birini tanlang:
          </p>

          <div className="grid" style={{ marginTop: 12 }}>
            {labs.filter(x => x.fan === fan).map((x) => (
              <div className="card" style={{ gridColumn: "span 6" }} key={`${x.fan}-${x.lab}`}>
                <div className="itemTitle">{x.title}</div>
                <p className="muted">{x.desc}</p>
                <Link className="btn" href={`/labs/${x.fan}/${x.lab}`}>Ochish</Link>
              </div>
            ))}
          </div>

          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn btnGhost" href="/labs">Barcha laboratoriyalar</Link>
            <Link className="btn btnGhost" href="/">Bosh sahifa</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!kind) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Komponent ulanmagan</div>
          <p className="muted">meta.component: {meta.component}</p>
          <Link className="btn btnGhost" href="/labs">Orqaga</Link>
        </div>
      </div>
    );
  }

  // chart title dynamic
  const chartTitle = useMemo(() => {
    if (kind === "pressure") return "Bosim lab: (bu labda v/a/x emas, faqat vizual + hisob)";
    return "Grafiklar: x(t), v(t), a(t)";
  }, [kind]);

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

          <button className="btn" onClick={hardReset}>Reset</button>

          <button className={`btn ${paused ? "btnGhost" : ""}`} onClick={() => setPaused(p => !p)}>
            {paused ? "Resume" : "Pause"}
          </button>

          <span className="badge">Slow-motion:</span>
          <button className={`btn btnGhost ${timeScale === 1 ? "" : ""}`} onClick={() => setTimeScale(1)}>1x</button>
          <button className={`btn btnGhost ${timeScale === 0.5 ? "" : ""}`} onClick={() => setTimeScale(0.5)}>0.5x</button>
          <button className={`btn btnGhost ${timeScale === 0.25 ? "" : ""}`} onClick={() => setTimeScale(0.25)}>0.25x</button>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        {/* 3D */}
        <div className="card" style={{ gridColumn: "span 8" }}>
          <div className="h2">3D tajriba</div>

          <LabScene>
            {kind === "motion" && (
              <MotionLab
                ref={labRef}
                paused={paused}
                timeScale={timeScale}
                mass={mass}
                friction={friction}
                initV={initV}
                onTelemetry={pushTelemetry}
              />
            )}

            {kind === "uniform" && (
              <UniformMotionLab
                ref={labRef}
                paused={paused}
                timeScale={timeScale}
                mode={mode}
                mass={mass}
                friction={friction}
                initV={initV}
                acc={acc}
                onTelemetry={pushTelemetry}
              />
            )}

            {kind === "newton" && (
              <NewtonLab
                ref={labRef}
                paused={paused}
                timeScale={timeScale}
                mass={mass}
                friction={friction}
                force={force}
                onTelemetry={pushTelemetry}
              />
            )}

            {kind === "pressure" && (
              <PressureLab
                ref={labRef}
                force={pressForce}
                area={area}
              />
            )}

            {kind === "buoyancy" && (
              <BuoyancyLab
                ref={labRef}
                paused={paused}
                timeScale={timeScale}
                objDensity={objDensity}
                fluidDensity={fluidDensity}
                volume={volume}
                onTelemetry={pushTelemetry}
              />
            )}
          </LabScene>

          <div className="row" style={{ marginTop: 10 }}>
            <span className="badge">v ≈ {tele.v.toFixed(2)} m/s</span>
            <span className="badge">a ≈ {tele.a.toFixed(2)} m/s²</span>
            <span className="badge">x ≈ {tele.x.toFixed(2)} m</span>
          </div>

          {/* Charts */}
          <TelemetryChart points={kind === "pressure" ? [] : points} title={chartTitle} />
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
              <hr className="hr" />
              <div className="h3">Rejim</div>
              <div className="row">
                <button className={`btn ${mode === "tekis" ? "" : "btnGhost"}`} onClick={() => setMode("tekis")}>
                  Tekis (a=0)
                </button>
                <button className={`btn ${mode === "tezlanishli" ? "" : "btnGhost"}`} onClick={() => setMode("tezlanishli")}>
                  Tezlanishli (a=const)
                </button>
              </div>

              <div className="h3" style={{ marginTop: 12 }}>
                Tezlanish a (m/s²): {acc.toFixed(2)}
              </div>
              <input className="input" type="range" min="-3" max="3" step="0.05"
                value={acc} onChange={(e) => setAcc(Number(e.target.value))} />
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
                Bu labda doimiy kuch beriladi. Massa oshsa tezlanish kamayadi (F=ma).
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
              <span className="badge">P = F/S ≈ {(pressForce / area).toFixed(0)} Pa</span>
            </>
          )}

          {kind === "buoyancy" && (
            <>
              <div className="h3">Jism zichligi ρ (kg/m³): {objDensity.toFixed(0)}</div>
              <input className="input" type="range" min="200" max="3000" step="20"
                value={objDensity} onChange={(e) => setObjDensity(Number(e.target.value))} />

              <div className="h3" style={{ marginTop: 12 }}>
                Suyuqlik zichligi ρₛ (kg/m³): {fluidDensity.toFixed(0)}
              </div>
              <input className="input" type="range" min="700" max="1400" step="10"
                value={fluidDensity} onChange={(e) => setFluidDensity(Number(e.target.value))} />

              <div className="h3" style={{ marginTop: 12 }}>
                Hajm V (m³): {volume.toFixed(4)}
              </div>
              <input className="input" type="range" min="0.001" max="0.01" step="0.0005"
                value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
