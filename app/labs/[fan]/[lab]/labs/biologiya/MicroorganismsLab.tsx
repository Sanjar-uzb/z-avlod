"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function MicroorganismsLab() {
  return <BiologyLabShell config={biologyLabs.mikroorganizmlar} />;
}
