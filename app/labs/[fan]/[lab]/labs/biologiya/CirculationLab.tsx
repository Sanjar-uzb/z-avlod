"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function CirculationLab() {
  return <BiologyLabShell config={biologyLabs["qon-tizimi"]} />;
}
