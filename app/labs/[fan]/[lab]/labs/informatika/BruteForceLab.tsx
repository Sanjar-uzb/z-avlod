"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Parol brute-force hujumi simulyatsiyasi",
  summary: "Parol uzunligi va urinishlar soni oshgani sari kombinatsiyalar soni va tahminiy vaqt qanday o'sishini ko'ring.",
  mode: "bruteforce",
  defaults: { length: 8, attempts: 55, charset: 62 },
  controls: [
    { key: "length", label: "Parol uzunligi", min: 4, max: 16, step: 1, unit: "belgi" },
    { key: "attempts", label: "Urinish tezligi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "charset", label: "Belgilar to'plami", min: 10, max: 90, step: 1, unit: "ta" },
  ],
  badges: ["Password", "Attempts", "Time"],
  steps: ["Parol uzunligini oshiring.", "Belgilar to'plamini kengaytiring.", "Tahminiy vaqtni solishtiring."],
  metrics: (v) => [
    { label: "Kombinatsiyalar", value: `${Math.round(v.charset ** Math.min(v.length, 8)).toExponential(2)}` },
    { label: "Attempts/s", value: `${(v.attempts * 1500).toFixed(0)}` },
    { label: "Tahminiy vaqt", value: `${Math.max(1, (v.length * v.charset * 12) / Math.max(v.attempts, 1)).toFixed(1)} s+` },
  ],
  insight: (v) => (v.length >= 12 ? "Uzun parol brute-force hujumini keskin qiyinlashtiradi." : "Qisqaroq parollar ancha tez topilishi mumkin."),
};

export default function BruteForceLab() {
  return <InformaticsLabShell config={config} />;
}
