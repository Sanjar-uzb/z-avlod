"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function AtomModelLab() {
  return <ChemistryLabShell config={chemistryLabs["atom-model"]} />;
}
