"use client";

import Link from "next/link";
import labs from "@/data/labs.json";
import { getLabComponent } from "./labs-registry";
import LabNotFound from "./labs-notfound";

export default function LabClient({ fan, lab }: { fan: string; lab: string }) {
  const meta = labs.find((x) => x.fan === fan && x.lab === lab);
  const Comp = getLabComponent(fan, lab);

  if (!meta || !Comp) {
    return <LabNotFound fan={fan} lab={lab} />;
  }

  return (
    <div className="container">
      <div className="card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <div className="h1" style={{ marginBottom: 6 }}>{meta.title}</div>
            <div className="muted">{meta.desc}</div>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="badge">Fan: {fan}</span>
              <span className="badge">Lab: {lab}</span>
            </div>
          </div>
          <div className="row">
            <Link className="btn btnGhost" href="/labs">Barcha laboratoriyalar</Link>
            <Link className="btn btnGhost" href="/">Bosh sahifa</Link>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
        <Comp />
      </div>
    </div>
  );
}
