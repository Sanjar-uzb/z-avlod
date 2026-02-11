"use client";

import Link from "next/link";
import labsData from "@/data/labs.json";
import { getLabComponent } from "./labs-registry";
import LabsNotFound from "./labs-notfound";

type LabEntry = { fan: string; lab: string; title: string; desc: string };
const labs = labsData as LabEntry[];

export default function LabClient({ fan, lab }: { fan: string; lab: string }) {
  const entry = labs.find((x: LabEntry) => x.fan === fan && x.lab === lab);

  if (!entry) {
    return <LabsNotFound />;
  }

  const Comp = getLabComponent(fan, lab);
  if (!Comp) {
    return (
      <div className="container">
        <div className="card">
          <div className="h2">Laboratoriya komponenti topilmadi</div>
          <p className="muted" style={{ marginTop: 6 }}>
            Bu URL ro‘yxatda bor, lekin komponent mappingda yo‘q: <b>{fan}/{lab}</b>
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <Link className="btn" href="/labs">Barcha laboratoriyalar</Link>
            <Link className="btn btnGhost" href="/">Bosh sahifa</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="h2">{entry.title}</div>
        <p className="muted" style={{ marginTop: 6 }}>{entry.desc}</p>
        <div className="row" style={{ marginTop: 10 }}>
          <span className="badge">Fan: {entry.fan}</span>
          <span className="badge">URL: {entry.lab}</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <Comp />
      </div>
    </div>
  );
}
