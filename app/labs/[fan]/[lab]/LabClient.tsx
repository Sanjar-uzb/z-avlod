"use client";

import React from "react";
import labsData from "@/data/labs.json";
import { getLabComponent } from "./labs-registry";
import LabsNotFound from "./labs-notfound";
import LabHero from "../../../../components/LabHero";
import BackButton from "../../../../components/BackButton";

type LabEntry = {
  fan: string;
  lab: string;
  title: string;
  desc: string;
};

const labs = labsData as LabEntry[];

type LabClientProps = {
  fan: string;
  lab: string;
};

export default function LabClient({ fan, lab }: LabClientProps) {
  const entry = React.useMemo(
    () => labs.find((x) => x.fan === fan && x.lab === lab),
    [fan, lab]
  );

  if (!entry) {
    return <LabsNotFound />;
  }

  const Comp = getLabComponent(fan, lab);

  if (!Comp) {
    return <LabsNotFound />;
  }

  const LabComponent = Comp as React.ComponentType<{ entry: LabEntry }>;

  return (
    <div className="container" style={{ marginTop: 16, paddingBottom: 20 }}>
      <BackButton href={`/labs?fan=${entry.fan}`} />
      <LabHero title={entry.title} subtitle={entry.desc} tags={[entry.fan]} />

      <div className="grid" style={{ gap: 18, gridTemplateColumns: "1.35fr 0.65fr", alignItems: "start" }}>
        <div className="card">
          <div className="h2">{entry.title}</div>
          <p className="muted" style={{ marginTop: 10, lineHeight: 1.8 }}>
            {entry.desc}
          </p>

          <div className="row" style={{ marginTop: 16, gap: 10, flexWrap: "wrap" }}>
            <span className="badge">Fan: {entry.fan}</span>
            <span className="badge">URL: {entry.lab}</span>
            <span className="badge">Interaktiv laboratoriya</span>
          </div>

          <div className="card" style={{ marginTop: 18, background: "rgba(15,23,42,0.92)", border: "1px solid rgba(148,163,184,0.12)" }}>
            <div className="h3">Sarlavha bo‘limi</div>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.75 }}>
              Bu sahifa interaktiv laboratoriya tajribasini sezilarli darajada yaxshilaydi.
            </p>
          </div>
        </div>

        <div className="card" style={{ minWidth: 260 }}>
          <div className="h3">Laboratoriya ma'lumotlari</div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <span className="badge">{entry.fan}</span>
            <span className="badge">{entry.lab}</span>
          </div>
          <div style={{ marginTop: 18 }}>
            <div className="h3">Tezkor izoh</div>
            <p className="muted" style={{ marginTop: 8, lineHeight: 1.75 }}>
              Sahifa zamonaviy ko‘rinishda. 
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 18 }}>
        <LabComponent entry={entry} />
      </div>
    </div>
  );
}