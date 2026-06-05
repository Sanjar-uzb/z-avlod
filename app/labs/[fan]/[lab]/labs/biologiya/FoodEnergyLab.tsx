"use client";

import BiologyLabShell from "./BiologyLabShell";
import { biologyLabs } from "./biology-config";

export default function FoodEnergyLab() {
  return <BiologyLabShell config={biologyLabs["oziq-energiya"]} />;
}
