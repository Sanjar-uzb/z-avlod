"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "RAM va CPU ishlash simulyatsiyasi",
  summary: "CPU yuklamasi, RAM bandligi va data bus tezligi oshganda komponentlar orasidagi oqim qanday o'zgarishini kuzating.",
  mode: "hardware",
  defaults: { cpu: 65, ram: 58, bus: 50 },
  controls: [
    { key: "cpu", label: "CPU yuklama", min: 10, max: 100, step: 1, unit: "%" },
    { key: "ram", label: "RAM bandlik", min: 10, max: 100, step: 1, unit: "%" },
    { key: "bus", label: "Data bus", min: 10, max: 100, step: 1, unit: "%" },
  ],
  badges: ["CPU", "RAM", "Data bus"],
  steps: ["CPU yuklamasini oshiring.", "RAM bandligini kuzating.", "Data bus oqimini solishtiring."],
  metrics: (v) => [
    { label: "CPU", value: `${v.cpu.toFixed(0)} %` },
    { label: "RAM", value: `${v.ram.toFixed(0)} %` },
    { label: "Bus throughput", value: `${(v.bus * 0.9).toFixed(0)} %` },
  ],
  insight: (v) => (v.cpu > 80 && v.ram > 70 ? "CPU va RAM birga yuqori bo'lsa tizim ancha yuklanadi." : "Resurslar muvozanatda bo'lsa ishlash silliqroq bo'ladi."),
};

export default function CpuRamLab() {
  return <InformaticsLabShell config={config} />;
}
