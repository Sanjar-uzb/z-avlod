"use client";

import ChemistryLabShell from "./ChemistryLabShell";
import { chemistryLabs } from "./chemistry-config";

export default function BiochemistryLab() {
  return <ChemistryLabShell config={chemistryLabs.biokimyo} />;
}
