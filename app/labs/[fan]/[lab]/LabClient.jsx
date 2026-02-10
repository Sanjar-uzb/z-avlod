"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import labs from "@/data/labs.json";
import LabScene from "@/components/LabScene";
import FrictionLab from "@/components/labs/physics/FrictionLab";

export default function LabClient({ params }) {
  const { fan, lab } = params;

  const meta = useMemo(
    () => labs.find((x) => x.fan === fan && x.lab === lab),
    [fan, lab]
  );

  const [mass, setMass] = useState(2);
  const [mu, setMu] = useState(0.4);
  const [push, setPush] = useState(10);

  if (!meta) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Laboratoriya topilmadi</div>
          <Link className="btn btnGhost" href="/labs">Orqaga</Link>
        </div>
      </div>
    );
  }

  const g = 9.81;
  const N = mass * g;
  const Ff = mu * N;
  const canMove = push > Ff;

  return (
    <div className="container">
      <div className="card hero">
        <div className="badgeRow">
          <span className="badge">Fan: {meta.fan}</span>
          <span className="badge">3D Lab</span>
        </div>
        <h1 className="heroTitle">{meta.title}</h1>
        <p className="heroSubtitle">{meta.desc}</p>
        <div className="row" style={{ marginTop: 10 }}>
          <Link className="btn btnGhost" href="/labs">Barcha laboratoriyalar</Link>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <div className="card" style={{ gridColumn: "span 8" }}>
          <div className="h2">3D tajriba</div>
          <LabScene>
            <FrictionLab mass={mass} mu={mu} push={push} />
          </LabScene>
          <p className="muted" style={{ marginTop: 10 }}>
            Parametrlarni o‘zgartiring va natijani kuzating.
          </p>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="h2">Boshqaruv</div>

          <div className="h3">Massa (kg): {mass.toFixed(1)}</div>
          <input className="input" type="range" min="1" max="10" step="0.5"
            value={mass} onChange={(e) => setMass(Number(e.target.value))} />

          <div className="h3" style={{ marginTop: 12 }}>
            Ishqalanish koeff. μ: {mu.toFixed(2)}
          </div>
          <input className="input" type="range" min="0.05" max="1.2" step="0.05"
            value={mu} onChange={(e) => setMu(Number(e.target.value))} />

          <div className="h3" style={{ marginTop: 12 }}>
            Itarish kuchi (N): {push.toFixed(0)}
          </div>
          <input className="input" type="range" min="0" max="120" step="1"
            value={push} onChange={(e) => setPush(Number(e.target.value))} />

          <hr className="hr" />

          <div className="h3">Natija</div>
          <div className="row">
            <span className="badge">N ≈ {N.toFixed(2)} N</span>
            <span className="badge">Ff ≈ {Ff.toFixed(2)} N</span>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <span className={`badge ${canMove ? "success" : "warn"}`}>
              {canMove ? "Harakat bor" : "Harakat yo‘q"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
