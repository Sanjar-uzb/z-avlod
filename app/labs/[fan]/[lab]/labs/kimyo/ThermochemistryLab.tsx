"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function ThermochemistryLab() {
  return <ChemistryLabShell config={chemistryLabs.termokimyo} />;
}
