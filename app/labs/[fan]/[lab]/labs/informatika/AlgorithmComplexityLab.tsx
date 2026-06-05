"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Algoritm tahlili va murakkablik",
  summary: "O(n), O(n log n) va O(n^2) algoritmlari hajm oshgani sari qanchalik farq qilishini balandliklar orqali kuzating.",
  mode: "complexity",
  defaults: { size: 60, optimization: 55 },
  controls: [
    { key: "size", label: "Ma'lumot hajmi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "optimization", label: "Optimizatsiya", min: 0, max: 100, step: 1, unit: "%" },
  ],
  badges: ["O(n)", "O(n log n)", "O(n^2)"],
  steps: ["Hajmni oshiring.", "Ustunlarni solishtiring.", "Optimizatsiya tasirini kuzating."],
  metrics: (v) => [
    { label: "O(n)", value: `${(v.size * 0.9).toFixed(0)} ms` },
    { label: "O(n log n)", value: `${(v.size * 1.25 - v.optimization * 0.2).toFixed(0)} ms` },
    { label: "O(n^2)", value: `${((v.size * v.size) / 18).toFixed(0)} ms` },
  ],
  insight: (v) => (v.size > 70 ? "Katta hajmda sekin algoritmlar darhol seziladi." : "Kichik hajmda farq kamroq ko'rinadi."),
};

export default function AlgorithmComplexityLab() {
  return <InformaticsLabShell config={config} />;
}
