"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function OrganicSynthesisLab() {
  return <ChemistryLabShell config={chemistryLabs["organik-sintet"]} />;
}
