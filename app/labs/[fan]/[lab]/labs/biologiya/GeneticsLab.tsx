"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function GeneticsLab() {
  return <BiologyLabShell config={biologyLabs["genetik-analiz"]} />;
}
