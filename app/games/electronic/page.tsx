"use client";

import { useEffect, useRef, useState } from "react";

type ComponentType =
  | "rezistor"
  | "kondensator"
  | "diod"
  | "led"
  | "npn"
  | "pnp"
  | "mosfet"
  | "rele"
  | "transformator"
  | "tugma"
  | "kalit"
  | "batareya"
  | "ground"
  | "mikro"
  | "timer555"
  | "opamp"
  | "logic"
  | "sensor";

type PinKey = "a" | "b";

type BoardComponent = {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
};

type Connection = {
  from: { id: string; pin: PinKey };
  to: { id: string; pin: PinKey };
  path: { x: number; y: number }[];
};

const COMPONENT_LIBRARY: Array<{
  type: ComponentType;
  label: string;
  icon: string;
  color: string;
  realColor: string;
}> = [
  { type: "rezistor", label: "Rezistor", icon: "Ω", color: "#f59e0b", realColor: "#d97706" },
  { type: "kondensator", label: "Kondensator", icon: "‖", color: "#38bdf8", realColor: "#0284c7" },
  { type: "diod", label: "Diod", icon: "▶|", color: "#a855f7", realColor: "#7c3aed" },
  { type: "led", label: "LED", icon: "💡", color: "#f97316", realColor: "#ea580c" },
  { type: "npn", label: "NPN", icon: "NPN", color: "#22c55e", realColor: "#15803d" },
  { type: "pnp", label: "PNP", icon: "PNP", color: "#38bdf8", realColor: "#0284c7" },
  { type: "mosfet", label: "MOSFET", icon: "M", color: "#8b5cf6", realColor: "#6d28d9" },
  { type: "rele", label: "Rele", icon: "⧉", color: "#fb7185", realColor: "#dc2626" },
  { type: "transformator", label: "Transformator", icon: "⟲", color: "#2dd4bf", realColor: "#0d9488" },
  { type: "tugma", label: "Tugma", icon: "⏺", color: "#0ea5e9", realColor: "#0284c7" },
  { type: "kalit", label: "Kalit", icon: "⟋", color: "#fb923c", realColor: "#d97706" },
  { type: "batareya", label: "Batareya", icon: "⎓", color: "#ef4444", realColor: "#991b1b" },
  { type: "ground", label: "Ground", icon: "⏚", color: "#94a3b8", realColor: "#475569" },
  { type: "mikro", label: "Arduino", icon: "A", color: "#2563eb", realColor: "#1e40af" },
  { type: "timer555", label: "555", icon: "5", color: "#14b8a6", realColor: "#0d9488" },
  { type: "opamp", label: "OpAmp", icon: "◊", color: "#eab308", realColor: "#ca8a04" },
  { type: "logic", label: "Gate", icon: "⊻", color: "#f472b6", realColor: "#db2777" },
  { type: "sensor", label: "Sensor", icon: "S", color: "#0f766e", realColor: "#134e4a" },
];

function getComponentMeta(type: ComponentType) {
  return COMPONENT_LIBRARY.find((item) => item.type === type)!;
}

function getPinPosition(component: BoardComponent, pin: PinKey): { x: number; y: number } {
  const cy = component.y + 38;
  if (pin === "a") return { x: component.x + 12, y: cy };
  return { x: component.x + 138, y: cy };
}

function routePath(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [from];
  const midX = (from.x + to.x) / 2;
  path.push({ x: midX, y: from.y });
  path.push({ x: midX, y: to.y });
  path.push(to);
  return path;
}

function findCompletePath(
  startId: string,
  startPin: PinKey,
  endId: string,
  endPin: PinKey,
  components: BoardComponent[]
): Connection {
  const startComp = components.find((c) => c.id === startId);
  const endComp = components.find((c) => c.id === endId);
  if (!startComp || !endComp) {
    return { from: { id: startId, pin: startPin }, to: { id: endId, pin: endPin }, path: [] };
  }
  const fromPos = getPinPosition(startComp, startPin);
  const toPos = getPinPosition(endComp, endPin);
  return {
    from: { id: startId, pin: startPin },
    to: { id: endId, pin: endPin },
    path: routePath(fromPos, toPos),
  };
}

function autoConnectComponents(components: BoardComponent[]): Connection[] {
  const connections: Connection[] = [];
  if (components.length < 2) return connections;

  const battery = components.find((c) => c.type === "batareya");
  const ground = components.find((c) => c.type === "ground");
  const others = components.filter((c) => c.type !== "batareya" && c.type !== "ground");

  if (battery && ground && others.length > 0) {
    others.forEach((comp) => {
      connections.push(findCompletePath(battery.id, "b", comp.id, "a", components));
      connections.push(findCompletePath(comp.id, "b", ground.id, "a", components));
    });
  }

  return connections;
}

function validateCircuit(components: BoardComponent[], connections: Connection[]): { valid: boolean; hasLED: boolean } {
  const hasBattery = components.some((c) => c.type === "batareya");
  const hasGround = components.some((c) => c.type === "ground");
  const hasLoad = components.some((c) => ["led", "rezistor", "diod"].includes(c.type));

  const validConnections = hasBattery && hasGround && connections.length > 0;
  const hasLED = components.some((c) => c.type === "led");

  return {
    valid: validConnections && hasLoad && hasLED,
    hasLED,
  };
}

function ComponentCard({ component, selected, onDown, onClick }: any) {
  const meta = getComponentMeta(component.type);

  return (
    <div
      style={{
        position: "absolute",
        left: component.x,
        top: component.y,
        width: 150,
        height: 76,
        borderRadius: 12,
        background: selected ? "rgba(34,197,94,.25)" : "rgba(22,163,74,.06)",
        border: selected ? "2px solid #22c55e" : "1px solid rgba(34,197,94,.3)",
        boxShadow: selected
          ? "0 0 20px rgba(34,197,94,.35), inset 0 0 12px rgba(34,197,94,.1)"
          : "0 4px 12px rgba(0,0,0,.2), inset 0 0 8px rgba(34,197,94,.05)",
        color: "#f0fdf4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 8,
        cursor: "grab",
        transform: `rotate(${component.rotation}deg)`,
        transformOrigin: "center",
        userSelect: "none",
        overflow: "hidden",
      } as React.CSSProperties}
      onPointerDown={onDown}
      onClick={onClick}
    >
      {/* Pin A */}
      <div
        style={{
          position: "absolute",
          left: 6,
          top: "50%",
          transform: "translateY(-50%)",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#86efac",
          border: "2px solid #22c55e",
          boxShadow: "0 0 4px rgba(34,197,94,.6)",
        }}
      />
      {/* Pin B */}
      <div
        style={{
          position: "absolute",
          right: 6,
          top: "50%",
          transform: "translateY(-50%)",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#86efac",
          border: "2px solid #22c55e",
          boxShadow: "0 0 4px rgba(34,197,94,.6)",
        }}
      />

      <div style={{ fontSize: 28, fontWeight: "bold", color: meta.realColor, marginBottom: 4 }}>
        {component.type === "led" ? "💡" : meta.icon}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
        {meta.label}
      </div>
    </div>
  );
}

function LEDGlow({ isActive }: { isActive: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        opacity: isActive ? 0.15 : 0,
        background: "radial-gradient(circle at center, #fbbf24, transparent 70%)",
        transition: "opacity .4s ease",
        zIndex: 1,
      }}
    />
  );
}

export default function ElectronicCAD() {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [components, setComponents] = useState<BoardComponent[]>([]);
  const [selectedType, setSelectedType] = useState<ComponentType>("rezistor");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState("Komponentlarni qo'shing va sxema qarang.");
  const [palettePointer, setPalettePointer] = useState<{ type: ComponentType; startX: number; startY: number; pointerId: number } | null>(null);
  const [paletteDrag, setPaletteDrag] = useState<{ type: ComponentType; x: number; y: number } | null>(null);

  const connections = autoConnectComponents(components);
  const { valid: circuitValid, hasLED } = validateCircuit(components, connections);
  const selectedComponent = components.find((c) => c.id === selectedId);

  useEffect(() => {
    if (!palettePointer) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== palettePointer.pointerId) return;
      const dx = e.clientX - palettePointer.startX;
      const dy = e.clientY - palettePointer.startY;
      if (Math.hypot(dx, dy) > 8) {
        setPaletteDrag({ type: palettePointer.type, x: e.clientX, y: e.clientY });
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== palettePointer.pointerId) return;
      if (paletteDrag && boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const x = Math.max(0, Math.min(1440 - 150, (e.clientX - rect.left) / zoom - 75));
          const y = Math.max(0, Math.min(860 - 76, (e.clientY - rect.top) / zoom - 38));
          setComponents((prev) => [
            ...prev,
            {
              id: `${palettePointer.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              type: palettePointer.type,
              x,
              y,
              rotation: 0,
            },
          ]);
          setStatus(`${getComponentMeta(palettePointer.type).label} qo'shildi.`);
        }
      } else {
        setSelectedType(palettePointer.type);
      }
      setPalettePointer(null);
      setPaletteDrag(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [palettePointer, paletteDrag, zoom]);

  const onPaletteDown = (type: ComponentType) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    setPalettePointer({ type, startX: e.clientX, startY: e.clientY, pointerId: e.pointerId });
  };

  const onComponentDown = (e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragging({ id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
    setSelectedId(id);
  };

  const onBoardMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1440 - 150, (e.clientX - rect.left) / zoom - dragging.offsetX));
    const y = Math.max(0, Math.min(860 - 76, (e.clientY - rect.top) / zoom - dragging.offsetY));
    setComponents((prev) => prev.map((c) => (c.id === dragging.id ? { ...c, x, y } : c)));
  };

  const onBoardUp = () => setDragging(null);

  const removeComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setSelectedId(null);
    setStatus("Komponent o'chirildi.");
  };

  const rotateComponent = () => {
    if (!selectedComponent) return;
    setComponents((prev) =>
      prev.map((c) => (c.id === selectedComponent.id ? { ...c, rotation: (c.rotation + 90) % 360 } : c))
    );
  };

  const copyComponent = () => {
    if (!selectedComponent) return;
    const copy = {
      ...selectedComponent,
      id: `${selectedComponent.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: selectedComponent.x + 24,
      y: selectedComponent.y + 24,
    };
    setComponents((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    setStatus("Komponent nusxalandi.");
  };

  const clearBoard = () => {
    setComponents([]);
    setSelectedId(null);
    setStatus("Board tozalandi.");
  };

  const boardStyle: React.CSSProperties = {
    position: "relative",
    width: 1440,
    height: 860,
    borderRadius: 0,
    overflow: "hidden",
    background: `
      linear-gradient(90deg, #064e3b 0%, #047857 50%, #059669 100%),
      repeating-linear-gradient(
        0deg,
        rgba(255,255,255,.02) 0px,
        rgba(255,255,255,.02) 1px,
        transparent 1px,
        transparent 40px
      ),
      repeating-linear-gradient(
        90deg,
        rgba(255,255,255,.02) 0px,
        rgba(255,255,255,.02) 1px,
        transparent 1px,
        transparent 40px
      )
    `,
    boxShadow: "inset 0 0 80px rgba(0,0,0,.6), 0 30px 100px rgba(0,0,0,.4)",
    border: "1px solid rgba(255,255,255,.08)",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a3c1f 0%, #0d5c2e 100%)", padding: 20, boxSizing: "border-box" }}>
      <LEDGlow isActive={circuitValid} />
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <section style={{ borderRadius: 16, padding: 24, marginBottom: 16, background: "linear-gradient(135deg, rgba(5,65,35,.9), rgba(5,102,56,.8))", boxShadow: "0 16px 48px rgba(0,0,0,.35)", border: "1px solid rgba(34,197,94,.15)" }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#d1fae5" }}>🎛️ Elektron sxema CAD</h1>
          <p style={{ marginTop: 8, color: "rgba(209,250,229,.78)", fontSize: 14 }}>
            Komponentlarni drag-drop qiling. Sxema avtomatik bog'lanadi. Barcha komponentlar to'g'ri ulansa LED yonadi.
          </p>
          <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#d1fae5" }}>
              📦 Komponentlar: <strong>{components.length}</strong>
            </div>
            <div style={{ fontSize: 13, color: "#d1fae5" }}>
              🔌 Ulanishlar: <strong>{connections.length}</strong>
            </div>
            <div style={{ fontSize: 13, color: circuitValid ? "#4ade80" : "#fca5a5" }}>
              ⚡ Holat: <strong>{circuitValid ? "✓ FAOL - LED YONDI!" : hasLED ? "❌ NOSOZLANGAN" : "⚠️ TUGALLANMAGAN"}</strong>
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 280px", gap: 16, alignItems: "start" }}>
          <aside style={{ background: "rgba(5,102,56,.4)", borderRadius: 12, padding: 16, border: "1px solid rgba(34,197,94,.2)" }}>
            <h2 style={{ margin: 0, fontSize: 18, color: "#d1fae5" }}>Komponentlar</h2>
            <p style={{ marginTop: 6, marginBottom: 12, color: "rgba(209,250,229,.6)", fontSize: 12 }}>Tanlang yoki drag qiling</p>
            <div style={{ display: "grid", gap: 8, maxHeight: "calc(100vh - 300px)", overflowY: "auto" }}>
              {COMPONENT_LIBRARY.map((item) => (
                <button
                  key={item.type}
                  onPointerDown={onPaletteDown(item.type as ComponentType)}
                  onClick={() => setSelectedType(item.type as ComponentType)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: selectedType === item.type ? "2px solid #4ade80" : "1px solid rgba(34,197,94,.25)",
                    background: selectedType === item.type ? "rgba(74,222,128,.15)" : "rgba(255,255,255,.03)",
                    color: "#d1fae5",
                    cursor: "grab",
                    fontWeight: 600,
                    fontSize: 13,
                    transition: "all .15s ease",
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <button onClick={rotateComponent} disabled={!selectedComponent} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(34,197,94,.25)", background: "rgba(255,255,255,.03)", color: "#d1fae5", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                🔄 Aylantirish
              </button>
              <button onClick={copyComponent} disabled={!selectedComponent} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(34,197,94,.25)", background: "rgba(255,255,255,.03)", color: "#d1fae5", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                📋 Nusxalash
              </button>
              <button onClick={() => selectedComponent && removeComponent(selectedComponent.id)} disabled={!selectedComponent} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(220,38,38,.25)", background: "rgba(220,38,38,.08)", color: "#fca5a5", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                🗑️ O'chirish
              </button>
              <button onClick={clearBoard} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(220,38,38,.25)", background: "rgba(220,38,38,.08)", color: "#fca5a5", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
                🔄 Boardni reset
              </button>
            </div>

            <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "rgba(5,102,56,.6)", border: "1px solid rgba(74,222,128,.2)" }}>
              <div style={{ fontSize: 12, color: "#d1fae5", lineHeight: 1.6 }}>
                <strong>ℹ️ Avtomatik routing:</strong> Komponentlar avtomatik bog'lanadi va sariq-yashil simlar chiziladi.
              </div>
            </div>
          </aside>

          <section style={{ position: "relative", overflow: "hidden", borderRadius: 8, background: "rgba(0,0,0,.2)", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            <div style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(5,65,35,.8)", borderBottom: "1px solid rgba(34,197,94,.15)" }}>
              <div style={{ color: "#d1fae5", fontSize: 13, fontWeight: 700 }}>PCB LAYOUT</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button onClick={() => setZoom((v) => Math.max(0.6, v - 0.1))} style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(34,197,94,.3)", background: "rgba(255,255,255,.05)", color: "#d1fae5", cursor: "pointer" }}>
                  −
                </button>
                <span style={{ color: "#d1fae5", fontWeight: 700, minWidth: 40, textAlign: "center", fontSize: 12 }}>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom((v) => Math.min(2, v + 0.1))} style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid rgba(34,197,94,.3)", background: "rgba(255,255,255,.05)", color: "#d1fae5", cursor: "pointer" }}>
                  +
                </button>
              </div>
            </div>
            <div style={{ padding: 12, overflow: "auto", height: "calc(100vh - 300px)" }}>
              <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: 1440, height: 860 }}>
                <div ref={boardRef} onPointerMove={onBoardMove} onPointerUp={onBoardUp} onPointerLeave={onBoardUp} onClick={() => setSelectedId(null)} style={boardStyle}>
                  {/* Connections SVG */}
                  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 1440 860">
                    <defs>
                      <filter id="wire-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {connections.map((conn, idx) => (
                      <g key={idx}>
                        {conn.path.length > 1 && (
                          <polyline
                            points={conn.path.map((p) => `${p.x},${p.y}`).join(" ")}
                            stroke="#22c55e"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#wire-glow)"
                            opacity={circuitValid ? 0.95 : 0.7}
                          />
                        )}
                      </g>
                    ))}
                  </svg>

                  {/* Components */}
                  {components.map((comp) => (
                    <ComponentCard
                      key={comp.id}
                      component={comp}
                      selected={selectedId === comp.id}
                      onDown={(e: React.PointerEvent<HTMLDivElement>) => onComponentDown(e, comp.id)}
                      onClick={() => setSelectedId(comp.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside style={{ background: "rgba(5,102,56,.4)", borderRadius: 12, padding: 16, border: "1px solid rgba(34,197,94,.2)", height: "fit-content" }}>
            <h2 style={{ margin: 0, fontSize: 16, color: "#d1fae5" }}>📊 Analiz</h2>
            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ padding: 10, borderRadius: 8, background: "rgba(5,102,56,.6)", border: "1px solid rgba(74,222,128,.2)" }}>
                <div style={{ fontSize: 11, color: "rgba(209,250,229,.6)" }}>Batareya</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80", marginTop: 4 }}>
                  {components.some((c) => c.type === "batareya") ? "5V ✓" : "0V ✗"}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: "rgba(5,102,56,.6)", border: "1px solid rgba(74,222,128,.2)" }}>
                <div style={{ fontSize: 11, color: "rgba(209,250,229,.6)" }}>Ground</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80", marginTop: 4 }}>
                  {components.some((c) => c.type === "ground") ? "✓ Bor" : "✗ Yo'q"}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: "rgba(5,102,56,.6)", border: "1px solid rgba(74,222,128,.2)" }}>
                <div style={{ fontSize: 11, color: "rgba(209,250,229,.6)" }}>LED</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: circuitValid ? "#22c55e" : "#fca5a5", marginTop: 4 }}>
                  {circuitValid ? "💡 YONDI!" : hasLED ? "⚠️ Ulandi" : "✗ Yo'q"}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: "rgba(5,102,56,.6)", border: "1px solid rgba(74,222,128,.2)" }}>
                <div style={{ fontSize: 11, color: "rgba(209,250,229,.6)" }}>Holat</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#d1fae5", marginTop: 6, lineHeight: 1.6 }}>{status}</div>
              </div>
            </div>
          </aside>
        </div>

        {/* Palette Drag Preview */}
        {paletteDrag && (
          <div
            style={{
              position: "fixed",
              left: paletteDrag.x - 75,
              top: paletteDrag.y - 38,
              width: 150,
              height: 76,
              pointerEvents: "none",
              opacity: 0.9,
              zIndex: 9999,
              borderRadius: 12,
              background: "rgba(22,163,74,.4)",
              border: "2px dashed #4ade80",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "#d1fae5",
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 12px 30px rgba(34,197,94,.4)",
            }}
          >
            {getComponentMeta(paletteDrag.type).icon}
            <div style={{ marginTop: 4 }}>Dasturga tashla</div>
          </div>
        )}
      </div>
    </div>
  );
}
