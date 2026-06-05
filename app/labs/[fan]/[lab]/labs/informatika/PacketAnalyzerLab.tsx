"use client";

import InformaticsLabShell, { type InformaticsLabConfig } from "./InformaticsLabShell";

const config: InformaticsLabConfig = {
  title: "Tarmoq paketlarini analiz qilish",
  summary: "Client dan serverga paketlar borishini, TCP va UDP farqini hamda paket tarkibini Wiresharkga o'xshash mantiqda ko'ring.",
  mode: "packet",
  defaults: { rate: 60, payload: 55, protocol: 70 },
  controls: [
    { key: "rate", label: "Paket tezligi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "payload", label: "Payload hajmi", min: 10, max: 100, step: 1, unit: "%" },
    { key: "protocol", label: "TCP vs UDP", min: 0, max: 100, step: 1, unit: "%" },
  ],
  badges: ["Client", "Server", "TCP/UDP"],
  steps: ["Paket tezligini oshiring.", "Protocol slayderini suring.", "Paket oqimini kuzating."],
  metrics: (v) => [
    { label: "Payload", value: `${(v.payload * 12).toFixed(0)} byte` },
    { label: "Paket/s", value: `${(v.rate * 0.8).toFixed(0)}` },
    { label: "Protocol", value: v.protocol > 50 ? "TCP" : "UDP" },
  ],
  insight: (v) => (v.protocol > 50 ? "TCP ishonchli uzatishni, UDP esa tezroq uzatishni ifodalaydi." : "UDP tezroq, lekin qayta jo'natish mexanizmi yo'q."),
};

export default function PacketAnalyzerLab() {
  return <InformaticsLabShell config={config} />;
}
