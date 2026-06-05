"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function MicrobiomeLab() {
  return <BiologyLabShell config={biologyLabs.probiotik} />;
}
