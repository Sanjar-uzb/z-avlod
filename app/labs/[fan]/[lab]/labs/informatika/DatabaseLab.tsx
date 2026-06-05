"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Malumotlar bazasi va sorovlar",
  summary: "Jadvallar, bog'lanishlar va query oqimi orasidagi aloqani ko'rib, JOIN va indeks ta'sirini tushuning.",
  mode: "database",
  defaults: { query: 60, relations: 55 },
  controls: [
    { key: "query", label: "Query yuklamasi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "relations", label: "Bog'lanishlar", min: 10, max: 100, step: 1, unit: "%" },
  ],
  badges: ["Table", "Join", "Query"],
  steps: ["Query yuklamasini oshiring.", "Bog'lanishlarni ko'paytiring.", "Query oqimini kuzating."],
  metrics: (v) => [
    { label: "Query time", value: `${(v.query * 0.9 + v.relations * 0.3).toFixed(0)} ms` },
    { label: "Join murakkabligi", value: `${(v.relations * 0.9).toFixed(0)} %` },
    { label: "Index foydasi", value: `${Math.max(0, 100 - v.query * 0.3).toFixed(0)} %` },
  ],
  insight: () => "Bog'lanishlar ko'paygani sari query optimizatsiyasi juda muhim bo'ladi.",
};

export default function DatabaseLab() {
  return <InformaticsLabShell config={config} />;
}
