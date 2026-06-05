"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function CellStructureLab() {
  return <BiologyLabShell config={biologyLabs["hujayra-daraja"]} />;
}
