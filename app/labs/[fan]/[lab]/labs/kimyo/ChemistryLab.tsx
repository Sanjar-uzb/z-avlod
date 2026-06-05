"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

type LabEntry = { fan: string; lab: string; title: string; desc: string };

export default function ChemistryLab({ entry }: { entry: LabEntry }) {
  const definition = chemistryLabs[entry.lab];

  if (!definition) {
    return (
      <div style={{ padding: 16 }}>
        <div className="card">
          <div className="h2">Kimyo laboratoriyasi topilmadi</div>
          <p className="muted" style={{ marginTop: 8 }}>Bu slug uchun konfiguratsiya hozircha tayyor emas.</p>
        </div>
      </div>
    );
  }

  return <ChemistryLabShell config={definition} />;
}
