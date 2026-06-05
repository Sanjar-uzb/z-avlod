"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function ElectrolysisLab() {
  return <ChemistryLabShell config={chemistryLabs.elektroliz} />;
}
