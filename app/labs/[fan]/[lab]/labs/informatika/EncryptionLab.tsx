"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Shifrlash laboratoriyasi",
  summary: "Matn AES yoki RSA mantiqida shifrlanib, keyin decrypt qilinishi bloklar va kalit orqali ko'rsatiladi.",
  mode: "encryption",
  defaults: { algorithm: 35, key: 60, rounds: 45 },
  controls: [
    { key: "algorithm", label: "AES vs RSA", min: 0, max: 100, step: 1, unit: "%" },
    { key: "key", label: "Kalit kuchi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "rounds", label: "Roundlar", min: 1, max: 100, step: 1, unit: "ta" },
  ],
  badges: ["Encrypt", "Decrypt", "Key"],
  steps: ["Algoritmni tanlang.", "Kalit kuchini oshiring.", "Ciphertext bloklarini kuzating."],
  metrics: (v) => [
    { label: "Algoritm", value: v.algorithm > 50 ? "RSA" : "AES" },
    { label: "Kalit", value: `${(v.key * 1.28).toFixed(0)} bit` },
    { label: "Roundlar", value: `${v.rounds.toFixed(0)}` },
  ],
  insight: () => "Shifrlashda kalit va algoritm birgalikda xavfsizlikni belgilaydi.",
};

export default function EncryptionLab() {
  return <InformaticsLabShell config={config} />;
}
