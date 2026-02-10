"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import labs from "@/data/labs.json";
import LabScene from "@/components/LabScene";
import FrictionLab from "@/components/labs/physics/FrictionLab";

export default function LabPage({ params }) {
  const { fan, lab } = params;

  const meta = useMemo(
    () => labs.find((x) => x.fan === fan && x.lab === lab),
    [fan, lab]
  );

  // Friction params (demo)
  const [mass, setMass] = useState(2);     // kg
  const [mu, setMu] = useState(0.4);       // ishqalanish koeff
  const [push, setPush] = useState(10);    // N

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

  // Hisob-kitob (matn paneli uchun)
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
            Kubni aylantirib ko‘rish mumkin. Parametrlarni o‘zgartiring va natijani kuzating.
          </p>
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="h2">Boshqaruv</div>

          <div className="h3">Massa (kg): {mass.toFixed(1)}</div>
          <input
            className="input"
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={mass}
            onChange={(e) => setMass(Number(e.target.value))}
          />

          <div className="h3" style={{ marginTop: 12 }}>
            Ishqalanish koeff. μ: {mu.toFixed(2)}
          </div>
          <input
            className="input"
            type="range"
            min="0.05"
            max="1.2"
            step="0.05"
            value={mu}
            onChange={(e) => setMu(Number(e.target.value))}
          />

          <div className="h3" style={{ marginTop: 12 }}>
            Itarish kuchi (N): {push.toFixed(0)}
          </div>
          <input
            className="input"
            type="range"
            min="0"
            max="120"
            step="1"
            value={push}
            onChange={(e) => setPush(Number(e.target.value))}
          />

          <hr className="hr" />

          <div className="h3">Natija (hisob-kitob)</div>
          <div className="list">
            <div className="row">
              <span className="badge">N = m·g</span>
              <span className="muted">≈ {N.toFixed(2)} N</span>
            </div>
            <div className="row">
              <span className="badge">Ff = μ·N</span>
              <span className="muted">≈ {Ff.toFixed(2)} N</span>
            </div>
            <div className="row">
              <span className={`badge ${canMove ? "success" : "warn"}`}>
                {canMove ? "Harakat bor" : "Harakat yo‘q"}
              </span>
              <span className="muted">
                {canMove ? "Push > Ff" : "Push ≤ Ff"}
              </span>
            </div>
          </div>

          <hr className="hr" />

          <div className="h3">Tushuncha</div>
          <p className="muted">
            Sirt “qo‘polroq” bo‘lsa (μ katta), ishqalanish kuchi oshadi va kubni siljitish
            qiyinlashadi.
          </p>
        </div>
      </div>
    </div>
  );
}
