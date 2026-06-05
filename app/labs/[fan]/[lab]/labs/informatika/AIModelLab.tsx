"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Suniy intellekt oddiy modeli",
  summary: "Input berilganda model ichki qatlamlar orqali natija chiqarishini va data sifati ta'sirini ko'ring.",
  mode: "ai",
  defaults: { data: 70, model: 55, learning: 45 },
  controls: [
    { key: "data", label: "Data sifati", min: 10, max: 100, step: 1, unit: "%" },
    { key: "model", label: "Model hajmi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "learning", label: "Learning rate", min: 10, max: 100, step: 1, unit: "%" },
  ],
  badges: ["Input", "Model", "Output"],
  steps: ["Data sifatini oshiring.", "Model hajmini o'zgartiring.", "Natija foizini kuzating."],
  metrics: (v) => [
    { label: "Accuracy", value: `${Math.min(99, v.data * 0.55 + v.model * 0.25 + v.learning * 0.15).toFixed(0)} %` },
    { label: "Loss", value: `${Math.max(0.05, 1.2 - v.learning / 110 - v.data / 180).toFixed(2)}` },
    { label: "Parametrlar", value: `${(v.model * 1.8).toFixed(0)}` },
  ],
  insight: () => "AI model uchun data sifati ko'pincha model hajmidan ham muhimroq bo'ladi.",
};

export default function AIModelLab() {
  return <InformaticsLabShell config={config} />;
}
