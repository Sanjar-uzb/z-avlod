"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function ReactivityLab() {
  return <ChemistryLabShell config={chemistryLabs.reaktivlik} />;
}
