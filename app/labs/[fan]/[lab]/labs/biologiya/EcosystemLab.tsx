"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function EcosystemLab() {
  return <BiologyLabShell config={biologyLabs["ekologiya-sistem"]} />;
}
