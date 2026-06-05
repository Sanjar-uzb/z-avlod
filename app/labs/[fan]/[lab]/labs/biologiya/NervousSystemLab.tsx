"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function NervousSystemLab() {
  return <BiologyLabShell config={biologyLabs["asab-sistema"]} />;
}
