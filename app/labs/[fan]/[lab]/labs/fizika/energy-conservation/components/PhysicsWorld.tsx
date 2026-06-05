"use client";

import { Physics } from "@react-three/rapier";
import type { ReactNode } from "react";

export default function PhysicsWorld({
  children,
  paused,
}: {
  children: ReactNode;
  paused: boolean;
}) {
  return (
    <Physics gravity={[0, -9.81, 0]} paused={paused} timeStep="vary">
      {children}
    </Physics>
  );
}
