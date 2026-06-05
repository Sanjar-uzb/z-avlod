"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function DnaReplicationLab() {
  return <BiologyLabShell config={biologyLabs["dnk-replikatsiya"]} />;
}
