"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function TitrationLab() {
  return <ChemistryLabShell config={chemistryLabs["ph-ojiz"]} />;
}
