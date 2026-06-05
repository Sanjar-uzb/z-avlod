"use client";

import React, { useMemo, useRef, useState } from "react";

type DeviceType = "computer" | "switch" | "hub";
type CableType = "straight" | "crossover";
type ConnectionStatus = "good" | "bad";

type Device = {
  id: string;
  name: string;
  type: DeviceType;
  x: number;
  y: number;
  ip: string;
  error: boolean;
};

type Connection = {
  id: string;
  a: string;
  b: string;
  cable: CableType;
  status: ConnectionStatus;
};

type Packet = {
  id: string;
  fromId: string;
  toId: string;
  progress: number;
  color: string;
  icon: string;
};

const DEVICE_LABEL: Record<DeviceType, string> = {
  computer: "Kompyuter",
  switch: "Switch",
  hub: "Hub",
};

const DEVICE_COLORS: Record<DeviceType, string> = {
  computer: "#2563eb",
  switch: "#16a34a",
  hub: "#f59e0b",
};

const DEVICE_IMAGE: Record<DeviceType, string> = {
  computer: "/images/network/computer.png",
  switch: "/images/network/switch.png",
  hub: "/images/network/hub.png",
};

const CABLE_LABEL: Record<CableType, string> = {
  straight: "To'g'ri (Straight)",
  crossover: "Crossover",
};

function expectedCableForPair(a: DeviceType, b: DeviceType): CableType {
  if (a === "computer" && b === "computer") return "crossover";
  if (a === "computer" && (b === "switch" || b === "hub")) return "straight";
  if (b === "computer" && (a === "switch" || a === "hub")) return "straight";
  return "crossover";
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("~");
}

function isValidIPv4(ip: string) {
  const value = ip.trim();
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const n = Number(part);
    return n >= 0 && n <= 255;
  });
}

function getEmojiByDevice(type: DeviceType) {
  if (type === "computer") return "💻";
  if (type === "switch") return "🔀";
  return "🟨";
}

function makeGridBackground() {
  return {
    backgroundColor: "#eef4fb",
    backgroundImage:
      "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.45) 1px, transparent 1px)",
    backgroundSize: "24px 24px",
  } as React.CSSProperties;
}

function btnStyle(active = false, color = "#e5e7eb", text = "#111827"): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: active ? color : "#f8fafc",
    color: active ? "#fff" : text,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.2,
  };
}

export default function NetworkLabPro() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const [devices, setDevices] = useState<Device[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [toolDeviceType, setToolDeviceType] = useState<DeviceType>("computer");
  const [selectedCable, setSelectedCable] = useState<CableType>("straight");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [statusMessage, setStatusMessage] = useState("Qurilmalarni qo'shing va ulang.");
  const [packets, setPackets] = useState<Packet[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<Record<string, boolean>>({});

  const computerDevices = useMemo(() => devices.filter((d) => d.type === "computer"), [devices]);

  const hint = selectedDeviceId
    ? `Endi ${devices.find((d) => d.id === selectedDeviceId)?.name ?? "qurilma"} uchun ikkinchi qurilmani tanlang`
    : "Kabel ulash uchun ketma-ket 2 ta qurilmani bosing";

  const addDevice = () => {
    const count = devices.filter((d) => d.type === toolDeviceType).length + 1;
    const id = `${toolDeviceType}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    setDevices((prev) => [
      ...prev,
      {
        id,
        name: `${DEVICE_LABEL[toolDeviceType]} ${count}`,
        type: toolDeviceType,
        x: 40 + ((prev.length * 140) % 780),
        y: 60 + ((prev.length * 100) % 460),
        ip: toolDeviceType === "computer" ? "" : "",
        error: false,
      },
    ]);

    setStatusMessage(`${DEVICE_LABEL[toolDeviceType]} qo'shildi.`);
  };

  const removeDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    setConnections((prev) => prev.filter((c) => c.a !== id && c.b !== id));
    setPackets((prev) => prev.filter((p) => p.fromId !== id && p.toId !== id));
    if (selectedDeviceId === id) setSelectedDeviceId(null);
    if (selectedSourceId === id) setSelectedSourceId(null);
    setStatusMessage("Qurilma o'chirildi.");
  };

  const removeConnection = (id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    setPackets((prev) => prev.filter((p) => pairKey(p.fromId, p.toId) !== id));
    setStatusMessage("Kabel o'chirildi.");
  };

  const connectSelected = (targetId: string) => {
    if (!selectedDeviceId) {
      setSelectedDeviceId(targetId);
      return;
    }

    if (selectedDeviceId === targetId) {
      setSelectedDeviceId(null);
      return;
    }

    const a = devices.find((d) => d.id === selectedDeviceId);
    const b = devices.find((d) => d.id === targetId);
    if (!a || !b) {
      setSelectedDeviceId(null);
      return;
    }

    const expected = expectedCableForPair(a.type, b.type);
    const status: ConnectionStatus = selectedCable === expected ? "good" : "bad";
    const id = pairKey(a.id, b.id);

    setConnections((prev) => {
      const rest = prev.filter((c) => c.id !== id);
      return [...rest, { id, a: a.id, b: b.id, cable: selectedCable, status }];
    });

    setSelectedDeviceId(null);
    setStatusMessage(
      status === "good"
        ? `${a.name} ↔ ${b.name} to'g'ri ulandi.`
        : `${a.name} ↔ ${b.name} noto'g'ri kabel bilan ulandi.`
    );
  };

  const clearBoard = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    setDevices([]);
    setConnections([]);
    setPackets([]);
    setSelectedDeviceId(null);
    setSelectedSourceId(null);
    setDraggingId(null);
    setStatusMessage("Ish maydoni tozalandi.");
  };

  const autoAssignIPs = () => {
    let host = 2;
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type !== "computer") return d;
        const nextIp = `192.168.1.${host}`;
        host += 1;
        return { ...d, ip: nextIp };
      })
    );
    setStatusMessage("Har bir kompyuterga alohida IP manzil berildi.");
  };

  const setDeviceIP = (id: string, ip: string) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, ip } : d)));
  };

  const resetErrors = () => {
    setDevices((prev) => prev.map((d) => ({ ...d, error: false })));
    setStatusMessage("Xatolik belgisi tozalandi.");
  };

  const getDeviceById = (id: string) => devices.find((d) => d.id === id);

  const buildGraph = () => {
    const graph: Record<string, string[]> = {};
    devices.forEach((d) => {
      graph[d.id] = [];
    });
    connections.forEach((c) => {
      graph[c.a] ??= [];
      graph[c.b] ??= [];
      graph[c.a].push(c.b);
      graph[c.b].push(c.a);
    });
    return graph;
  };

  const findPathsFromSource = (sourceId: string) => {
    const graph = buildGraph();
    const visited = new Set<string>([sourceId]);
    const parent: Record<string, string | null> = { [sourceId]: null };
    const queue = [sourceId];

    while (queue.length) {
      const current = queue.shift()!;
      for (const next of graph[current] || []) {
        if (!visited.has(next)) {
          visited.add(next);
          parent[next] = current;
          queue.push(next);
        }
      }
    }

    const result: string[][] = [];

    devices
      .filter((d) => d.type === "computer" && d.id !== sourceId && visited.has(d.id))
      .forEach((target) => {
        const path: string[] = [];
        let cur: string | null = target.id;
        while (cur) {
          path.unshift(cur);
          cur = parent[cur] ?? null;
        }
        if (path.length > 1) result.push(path);
      });

    return result;
  };

  const startPacketAnimation = (sourceId: string) => {
    const source = getDeviceById(sourceId);
    if (!source || source.type !== "computer") {
      setStatusMessage("Xat jo'natish uchun avval kompyuterni manba sifatida tanlang.");
      return;
    }

    if (!isValidIPv4(source.ip)) {
      setStatusMessage("Manba kompyuter IP manzili noto'g'ri yoki bo'sh.");
      return;
    }

    if (!connections.length) {
      setStatusMessage("Avval qurilmalarni kabel bilan ulang.");
      return;
    }

    const paths = findPathsFromSource(sourceId);
    if (!paths.length) {
      setStatusMessage("Tanlangan kompyuterdan boshqa kompyuterlarga yo'l topilmadi.");
      return;
    }

    const packetsToAnimate: Packet[] = [];
    const badComputerIds = new Set<string>();

    paths.forEach((path, pathIndex) => {
      let hasBadOnThisPath = false;
      for (let i = 0; i < path.length - 1; i += 1) {
        const fromId = path[i];
        const toId = path[i + 1];
        const conn = connections.find((c) => c.id === pairKey(fromId, toId));
        if (conn?.status === "bad") hasBadOnThisPath = true;
        packetsToAnimate.push({
          id: `packet_${pathIndex}_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          fromId,
          toId,
          progress: 0,
          color: conn?.status === "bad" ? "#dc2626" : "#16a34a",
          icon: conn?.status === "bad" ? "✖" : "✉",
        });
      }
      if (hasBadOnThisPath) badComputerIds.add(path[path.length - 1]);
    });

    setDevices((prev) => prev.map((d) => ({ ...d, error: false })));
    setPackets(packetsToAnimate);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    let startedAt: number | null = null;
    const durationPerHop = 900;

    const animate = (time: number) => {
      if (startedAt === null) startedAt = time;
      const elapsed = time - startedAt;

      setPackets((prev) =>
        prev.map((packet, index) => {
          const delay = index * 180;
          const localElapsed = Math.max(0, elapsed - delay);
          const progress = Math.min(localElapsed / durationPerHop, 1);
          return { ...packet, progress };
        })
      );

      const done = packetsToAnimate.every((_, index) => elapsed - index * 180 >= durationPerHop);

      if (!done) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        setDevices((prev) =>
          prev.map((d) => ({
            ...d,
            error: badComputerIds.has(d.id),
          }))
        );
        window.setTimeout(() => setPackets([]), 500);
        setStatusMessage(
          badComputerIds.size > 0
            ? `Xat jo'natildi. ${badComputerIds.size} ta kompyuterga noto'g'ri kabel sababli xat yetib bormadi.`
            : "Xat jo'natildi. Barcha kompyuterlarga muvaffaqiyatli yetib bordi."
        );
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingId || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setDevices((prev) =>
      prev.map((d) =>
        d.id === draggingId
          ? {
              ...d,
              x: Math.max(16, Math.min(x, rect.width - 150)),
              y: Math.max(16, Math.min(y, rect.height - 150)),
            }
          : d
      )
    );
  };

  const onMouseUp = () => setDraggingId(null);

  return (
    <div style={{ minHeight: "100vh", background: "#e8eef6", padding: 16, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 16,
            borderRadius: 24,
            padding: 24,
            color: "#fff",
            background: "linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
            boxShadow: "0 10px 30px rgba(15,23,42,.18)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>Mini Cisco Packet Tracer</h1>
          <p style={{ marginTop: 10, marginBottom: 0, fontSize: 16, color: "#dbeafe" }}>
            Tarmoq qurilmalarini joylashtirish, kabel ulash, IP kiritish va paket jo'natishni ko'rsatish uchun mini simulyator.
          </p>
          <div
            style={{
              marginTop: 16,
              borderRadius: 16,
              background: "rgba(255,255,255,0.1)",
              padding: 14,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <div>
              <strong>Rasm fayllari:</strong> public/images/network/computer.png, public/images/network/switch.png, public/images/network/hub.png
            </div>
            <div>
              <strong>src yozilishi:</strong> /images/network/computer.png ko'rinishida bo'lishi kerak.
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
          <aside
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 20,
              boxShadow: "0 10px 25px rgba(15,23,42,.08)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 24, color: "#111827" }}>Boshqaruv paneli</h2>
              <p style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>Packet Tracer uslubidagi amaliy laboratoriya muhiti.</p>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Qurilma tanlash</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(["computer", "switch", "hub"] as DeviceType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setToolDeviceType(type)}
                    style={btnStyle(toolDeviceType === type, "#0f172a")}
                  >
                    {DEVICE_LABEL[type]}
                  </button>
                ))}
              </div>
              <button
                onClick={addDevice}
                style={{
                  ...btnStyle(true, "#2563eb"),
                  width: "100%",
                  marginTop: 10,
                }}
              >
                {DEVICE_LABEL[toolDeviceType]} qo'shish
              </button>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Kabel tanlash</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(["straight", "crossover"] as CableType[]).map((cable) => (
                  <button
                    key={cable}
                    onClick={() => setSelectedCable(cable)}
                    style={btnStyle(selectedCable === cable, "#059669")}
                  >
                    {CABLE_LABEL[cable]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Amallar</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={autoAssignIPs} style={btnStyle(true, "#111827")}>IP avtomatik</button>
                <button onClick={resetErrors} style={btnStyle(false)}>Xatolikni tozalash</button>
                <button
                  onClick={() => {
                    const source = selectedSourceId || computerDevices[0]?.id;
                    if (!source) {
                      setStatusMessage("Xat jo'natish uchun kamida bitta kompyuter qo'shing.");
                      return;
                    }
                    startPacketAnimation(source);
                  }}
                  style={btnStyle(true, "#ea580c")}
                >
                  Xat jo'natish
                </button>
                <button onClick={clearBoard} style={btnStyle(true, "#dc2626")}>Oynani tozalash</button>
              </div>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14, background: "#f8fafc" }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Holat</div>
              <div style={{ color: "#334155", fontSize: 14, lineHeight: 1.5 }}>{statusMessage}</div>
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 8 }}>{hint}</div>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Kompyuterlar</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {computerDevices.length === 0 ? (
                  <div style={{ padding: 12, borderRadius: 14, background: "#f8fafc", color: "#64748b", fontSize: 14 }}>
                    Hozircha kompyuter yo'q.
                  </div>
                ) : (
                  computerDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => {
                        setSelectedSourceId(device.id);
                        setStatusMessage(`${device.name} xat jo'natish manbasi qilib tanlandi.`);
                      }}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: `1px solid ${selectedSourceId === device.id ? "#60a5fa" : "#e5e7eb"}`,
                        background: selectedSourceId === device.id ? "#eff6ff" : "#fff",
                        color: selectedSourceId === device.id ? "#1d4ed8" : "#334155",
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        fontSize: 14,
                      }}
                    >
                      <span>{device.name}</span>
                      <span style={{ fontSize: 12 }}>{device.ip || "IP yo'q"}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div style={{ border: "1px solid #e5e7eb", borderRadius: 18, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 10, color: "#1f2937" }}>Ulanishlar</div>
              <div style={{ maxHeight: 280, overflow: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {connections.length === 0 ? (
                  <div style={{ padding: 12, borderRadius: 14, background: "#f8fafc", color: "#64748b", fontSize: 14 }}>
                    Ulanishlar hali mavjud emas.
                  </div>
                ) : (
                  connections.map((conn) => {
                    const a = getDeviceById(conn.a);
                    const b = getDeviceById(conn.b);
                    return (
                      <div
                        key={conn.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#1f2937", fontSize: 14 }}>
                            {a?.name} ↔ {b?.name}
                          </div>
                          <div style={{ fontSize: 13, color: conn.status === "good" ? "#059669" : "#dc2626" }}>
                            {CABLE_LABEL[conn.cable]} — {conn.status === "good" ? "To'g'ri" : "Noto'g'ri"}
                          </div>
                        </div>
                        <button onClick={() => removeConnection(conn.id)} style={btnStyle(true, "#dc2626")}>O'chirish</button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          <section
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 14,
              boxShadow: "0 10px 25px rgba(15,23,42,.08)",
              minHeight: 860,
            }}
          >
            <div
              ref={boardRef}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{
                position: "relative",
                minHeight: 820,
                width: "100%",
                overflow: "hidden",
                borderRadius: 22,
                border: "1px solid #dbe4f0",
                ...makeGridBackground(),
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  zIndex: 4,
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontWeight: 700,
                  color: "#334155",
                  boxShadow: "0 6px 18px rgba(15,23,42,.08)",
                }}
              >
                Jixozlarni joylashtirish oynasi
              </div>

              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                {connections.map((conn) => {
                  const a = getDeviceById(conn.a);
                  const b = getDeviceById(conn.b);
                  if (!a || !b) return null;

                  const x1 = a.x + 60;
                  const y1 = a.y + 45;
                  const x2 = b.x + 60;
                  const y2 = b.y + 45;
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  return (
                    <g key={conn.id}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={conn.status === "good" ? "#2e7d32" : "#d32f2f"}
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeDasharray={conn.status === "good" ? undefined : "10 8"}
                      />
                      <foreignObject x={midX - 34} y={midY - 14} width={68} height={28} style={{ pointerEvents: "auto" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeConnection(conn.id);
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 999,
                            border: "1px solid #e5e7eb",
                            background: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#475569",
                            cursor: "pointer",
                          }}
                          title="Kabelni o'chirish"
                        >
                          ✕ kabel
                        </button>
                      </foreignObject>
                    </g>
                  );
                })}

                {packets.map((packet) => {
                  const from = getDeviceById(packet.fromId);
                  const to = getDeviceById(packet.toId);
                  if (!from || !to) return null;

                  const x1 = from.x + 60;
                  const y1 = from.y + 45;
                  const x2 = to.x + 60;
                  const y2 = to.y + 45;
                  const cx = x1 + (x2 - x1) * packet.progress;
                  const cy = y1 + (y2 - y1) * packet.progress;

                  return (
                    <g key={packet.id}>
                      <circle cx={cx} cy={cy} r={18} fill={packet.color} opacity={0.16} />
                      <circle cx={cx} cy={cy} r={11} fill={packet.color} opacity={0.96} />
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">
                        {packet.icon}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {devices.map((device) => {
                const selected = selectedDeviceId === device.id;
                const sourceSelected = selectedSourceId === device.id;
                const ipInvalid = device.type === "computer" && device.ip.trim() !== "" && !isValidIPv4(device.ip);
                const failed = imageFailed[device.id];

                return (
                  <div
                    key={device.id}
                    style={{
                      position: "absolute",
                      left: device.x,
                      top: device.y,
                      width: 126,
                      zIndex: 3,
                      cursor: "pointer",
                      userSelect: "none",
                      borderRadius: 18,
                      border: `2px solid ${selected ? "#2563eb" : "#cbd5e1"}`,
                      background: "#fff",
                      padding: 10,
                      boxShadow: "0 8px 20px rgba(15,23,42,.10)",
                      outline: sourceSelected ? "3px solid #fcd34d" : device.error ? "3px solid #fca5a5" : "none",
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingId(device.id);
                      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      connectSelected(device.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (device.type === "computer") {
                        setSelectedSourceId(device.id);
                        setStatusMessage(`${device.name} xat jo'natish manbasi qilib tanlandi.`);
                      }
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{DEVICE_LABEL[device.type]}</div>
                        <div style={{ fontSize: 14, color: DEVICE_COLORS[device.type], fontWeight: 800, lineHeight: 1.15 }}>{device.name}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDevice(device.id);
                        }}
                        style={{
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          background: "#f8fafc",
                          color: "#475569",
                          padding: "4px 8px",
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                        title="Qurilmani o'chirish"
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 72, background: "#f8fafc", borderRadius: 14, marginBottom: 8 }}>
                      {failed ? (
                        <div style={{ fontSize: 36 }}>{getEmojiByDevice(device.type)}</div>
                      ) : (
                        <img
                          src={DEVICE_IMAGE[device.type]}
                          alt={device.name}
                          draggable={false}
                          style={{ width: 56, height: 56, objectFit: "contain" }}
                          onError={() => setImageFailed((prev) => ({ ...prev, [device.id]: true }))}
                        />
                      )}
                    </div>

                    {device.type === "computer" && (
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>IP address</label>
                        <input
                          type="text"
                          value={device.ip}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setDeviceIP(device.id, e.target.value)}
                          placeholder="192.168.1.2"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            borderRadius: 10,
                            border: `1px solid ${ipInvalid ? "#f87171" : "#cbd5e1"}`,
                            background: ipInvalid ? "#fef2f2" : "#fff",
                            color: ipInvalid ? "#b91c1c" : "#111827",
                            padding: "8px 10px",
                            fontSize: 14,
                            outline: "none",
                          }}
                        />
                        {ipInvalid && <div style={{ marginTop: 4, fontSize: 11, color: "#dc2626", fontWeight: 600 }}>IPv4 noto'g'ri format.</div>}
                      </div>
                    )}

                    {sourceSelected && (
                      <div style={{ marginTop: 8, borderRadius: 10, background: "#fffbeb", color: "#b45309", padding: "6px 8px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>
                        Manba kompyuter
                      </div>
                    )}

                    {device.error && (
                      <div style={{ marginTop: 8, borderRadius: 10, background: "#fef2f2", color: "#dc2626", padding: "6px 8px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>
                        ⚠ Xat yetib bormadi
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
