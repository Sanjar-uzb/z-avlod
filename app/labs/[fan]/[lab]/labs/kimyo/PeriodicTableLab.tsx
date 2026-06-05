"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function PeriodicTableLab() {
  return <ChemistryLabShell config={chemistryLabs["periodic-jadval"]} />;
}
