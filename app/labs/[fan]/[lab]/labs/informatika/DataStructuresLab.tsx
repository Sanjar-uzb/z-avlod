"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Ma'lumot strukturalari",
  summary: "Stack, queue va tree qanday joylashishini va operatsiya tezligi oshganda elementlar qanday ko'rinishini kuzating.",
  mode: "structures",
  defaults: { items: 55, depth: 45, operations: 60 },
  controls: [
    { key: "items", label: "Elementlar", min: 10, max: 100, step: 1, unit: "%" },
    { key: "depth", label: "Tree chuqurligi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "operations", label: "Operatsiya tezligi", min: 10, max: 100, step: 1, unit: "%" },
  ],
  badges: ["Stack", "Queue", "Tree"],
  steps: ["Elementlar sonini tanlang.", "Tree chuqurligini oshiring.", "Joylashuvni solishtiring."],
  metrics: (v) => [
    { label: "Stack", value: `${(v.operations * 0.8).toFixed(0)} ops` },
    { label: "Queue", value: `${(v.items * 0.7).toFixed(0)} element` },
    { label: "Tree", value: `${(2 + v.depth / 18).toFixed(0)} daraja` },
  ],
  insight: () => "Har bir struktura ma'lumotni boshqacha tartibda saqlaydi va qaytaradi.",
};

export default function DataStructuresLab() {
  return <InformaticsLabShell config={config} />;
}
