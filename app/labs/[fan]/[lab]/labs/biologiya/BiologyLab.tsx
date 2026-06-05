"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

type LabEntry = { fan: string; lab: string; title: string; desc: string };

export default function BiologyLab({ entry }: { entry: LabEntry }) {
  const definition = biologyLabs[entry.lab];

  if (!definition) {
    return (
      <div style={{ padding: 16 }}>
        <div className="card">
          <div className="h2">Biologiya laboratoriyasi topilmadi</div>
          <p className="muted" style={{ marginTop: 8 }}>Bu slug uchun konfiguratsiya hali tayyor emas.</p>
        </div>
      </div>
    );
  }

  return <BiologyLabShell config={definition} />;
}
