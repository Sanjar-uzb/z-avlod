"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Graf algoritmlari",
  summary: "Graf tugunlari ustida BFS, DFS va shortest path farqini tugunlar yoritilishi orqali ko'ring.",
  mode: "graph",
  defaults: { edges: 65, speed: 55 },
  controls: [
    { key: "edges", label: "Bog'lanishlar", min: 10, max: 100, step: 1, unit: "%" },
    { key: "speed", label: "Qidiruv tezligi", min: 10, max: 100, step: 1, unit: "%" },
  ],
  badges: ["BFS", "DFS", "Shortest path"],
  steps: ["Bog'lanishlarni oshiring.", "Qidiruv tezligini tanlang.", "Yoritilgan yo'lni kuzating."],
  metrics: (v) => [
    { label: "Connectivity", value: `${(v.edges * 0.9).toFixed(0)} %` },
    { label: "Shortest path", value: `${Math.max(2, 12 - v.edges / 12).toFixed(0)} qadam` },
    { label: "Traversal", value: `${(v.speed * 0.8).toFixed(0)} %` },
  ],
  insight: () => "BFS qatlamlab yuradi, DFS esa chuqurlikka kirib boradi.",
};

export default function GraphAlgorithmsLab() {
  return <InformaticsLabShell config={config} />;
}
