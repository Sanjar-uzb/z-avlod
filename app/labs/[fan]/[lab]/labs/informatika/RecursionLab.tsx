"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Rekursiya va backtracking",
  summary: "Recursive call daraxti qanday kengayishi va keyin qaytib chiqishini vizual korinishda ko'ring.",
  mode: "recursion",
  defaults: { depth: 50, branching: 45 },
  controls: [
    { key: "depth", label: "Chuqurlik", min: 10, max: 100, step: 1, unit: "%" },
    { key: "branching", label: "Tarmoqlanish", min: 10, max: 100, step: 1, unit: "%" },
  ],
  badges: ["Recursive call", "Base case", "Backtracking"],
  steps: ["Chuqurlikni oshiring.", "Tarmoqlanishni tanlang.", "Qaytish jarayonini kuzating."],
  metrics: (v) => [
    { label: "Call count", value: `${(v.depth * v.branching / 20).toFixed(0)}` },
    { label: "Stack load", value: `${(v.depth * 0.7).toFixed(0)} %` },
    { label: "Base case", value: `${Math.max(1, 10 - v.depth / 12).toFixed(0)} qadam` },
  ],
  insight: () => "Rekursiyada base case bo'lmasa chaqiriqlar cheksiz davom etishi mumkin.",
};

export default function RecursionLab() {
  return <InformaticsLabShell config={config} />;
}
