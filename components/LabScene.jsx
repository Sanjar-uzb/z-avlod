"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

export default function LabScene({ children }) {
  return (
    <div
      style={{
        width: "100%",
        height: 460,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(255,255,255,.02)",
      }}
    >
      <Canvas shadows camera={{ position: [6, 4, 8], fov: 45 }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 10, 6]} intensity={1.2} castShadow />
        <Environment preset="city" />
        {children}
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  );
}
