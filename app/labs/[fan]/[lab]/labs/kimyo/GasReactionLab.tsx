"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function GasReactionLab() {
  return <ChemistryLabShell config={chemistryLabs["gaz-loviy"]} />;
}
