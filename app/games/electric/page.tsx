"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveElectricGameResult } from "@/lib/storage";

type BaseNode = "panel" | "switch" | "lamp" | "socket";
type NodeId =
  | "panel"
  | "switch"
  | "lamp1"
  | "lamp2"
  | "lamp3"
  | "lamp4"
  | "socket1"
  | "socket2"
  | "socket3";

type WireType = "phase" | "neutral";
type Mode = "idle" | "phase" | "neutral" | "erase";

type Wire = {
  id: number;
  from: NodeId;
  to: NodeId;
  type: WireType;
};

type Point = {
  x: number;
  y: number;
};

type Level = {
  id: number;
  elements: BaseNode[];
};

const LEVELS: Level[] = [
  { id: 1, elements: ["panel", "socket"] },
  { id: 2, elements: ["panel", "switch", "lamp"] },
  { id: 3, elements: ["panel", "switch", "lamp", "socket"] },
  { id: 4, elements: ["panel", "switch", "lamp", "lamp", "socket"] },
  { id: 5, elements: ["panel", "switch", "lamp", "lamp", "socket", "socket"] },
  { id: 6, elements: ["panel", "switch", "lamp", "lamp", "lamp", "socket"] },
  { id: 7, elements: ["panel", "switch", "lamp", "lamp", "socket", "socket"] },
  { id: 8, elements: ["panel", "switch", "lamp", "lamp", "lamp", "socket", "socket"] },
  { id: 9, elements: ["panel", "switch", "lamp", "lamp", "lamp", "socket", "socket", "socket"] },
  { id: 10, elements: ["panel", "switch", "lamp", "lamp", "lamp", "lamp", "socket", "socket", "socket"] },
];

const STAGE = {
  width: 1240,
  height: 540,
};

const BASE_POSITIONS: Record<NodeId, Point> = {
  panel: { x: 80, y: 200 },
  switch: { x: 400, y: 400 },

  lamp1: { x: 700, y: 70 },
  lamp2: { x: 860, y: 70 },
  lamp3: { x: 700, y: 190 },
  lamp4: { x: 860, y: 190 },

  socket1: { x: 700, y: 330 },
  socket2: { x: 860, y: 330 },
  socket3: { x: 1020, y: 330 },
};

function getBaseType(nodeId: NodeId): BaseNode {
  if (nodeId === "panel") return "panel";
  if (nodeId === "switch") return "switch";
  if (nodeId.startsWith("lamp")) return "lamp";
  return "socket";
}

function samePair(a1: NodeId, b1: NodeId, a2: NodeId, b2: NodeId) {
  return (a1 === a2 && b1 === b2) || (a1 === b2 && b1 === a2);
}

function normalizePair(a: NodeId, b: NodeId) {
  return [a, b].sort().join("-");
}

function getRequiredCounts(level: Level) {
  return {
    lamps: level.elements.filter(e => e === "lamp").length,
    sockets: level.elements.filter(e => e === "socket").length,
    hasSwitch: level.elements.includes("switch"),
  };
}

function getActiveNodeIds(level: Level): NodeId[] {
  const { lamps, sockets, hasSwitch } = getRequiredCounts(level);
  const ids: NodeId[] = ["panel"];

  if (hasSwitch) ids.push("switch");

  const lampIds: NodeId[] = ["lamp1", "lamp2", "lamp3", "lamp4"];
  const socketIds: NodeId[] = ["socket1", "socket2", "socket3"];

  ids.push(...lampIds.slice(0, lamps));
  ids.push(...socketIds.slice(0, sockets));

  return ids;
}

export default function ElectricPro() {
  const [mode, setMode] = useState<Mode>("idle");
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [wires, setWires] = useState<Wire[]>([]);

  const [panelOn, setPanelOn] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);

  const [fire, setFire] = useState(false);

  const [flowDots, setFlowDots] = useState<
    { id: number; wireId: number; t: number; color: string }[]
  >([]);

  const [levelIndex, setLevelIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());
  const completedSavedRef = useRef(false);

  // Save result when game completes
  useEffect(() => {
    if (completed && !completedSavedRef.current) {
      completedSavedRef.current = true;
      const completionTime = Math.floor((Date.now() - startTime) / 1000);
      saveElectricGameResult({
        levelsCompleted: 10,
        completionTime: completionTime,
      });
    }
  }, [completed, startTime]);

  const currentLevel = LEVELS[levelIndex];
  const { lamps: requiredLampCount, sockets: requiredSocketCount, hasSwitch } =
    getRequiredCounts(currentLevel);
  const activeNodeIds = useMemo(() => getActiveNodeIds(currentLevel), [currentLevel]);

  const levelAdvancingRef = useRef(false);

  function wireExists(ws: Wire[], from: NodeId, to: NodeId, type?: WireType) {
    const key = normalizePair(from, to);
    return ws.some(w => {
      const same = normalizePair(w.from, w.to) === key;
      if (!same) return false;
      return type ? w.type === type : true;
    });
  }

  function getWireByPair(ws: Wire[], from: NodeId, to: NodeId) {
    const key = normalizePair(from, to);
    return ws.find(w => normalizePair(w.from, w.to) === key);
  }

  function resetOnlyBoard() {
    setMode("idle");
    setSelected(null);
    setWires([]);
    setPanelOn(false);
    setSwitchOn(false);
    setFire(false);
    setFlowDots([]);
  }

  function resetAll() {
    levelAdvancingRef.current = false;
    setCompleted(false);
    setLevelIndex(0);
    resetOnlyBoard();
  }

  function goToNextLevel() {
    if (levelAdvancingRef.current) return;
    levelAdvancingRef.current = true;

    setTimeout(() => {
      if (levelIndex < LEVELS.length - 1) {
        setLevelIndex(prev => prev + 1);
        setMode("idle");
        setSelected(null);
        setWires([]);
        setPanelOn(false);
        setSwitchOn(false);
        setFire(false);
        setFlowDots([]);
        levelAdvancingRef.current = false;
      } else {
        setCompleted(true);
      }
    }, 900);
  }

  function isAllowedWire(
    from: NodeId,
    to: NodeId,
    type: WireType,
    level: Level = currentLevel
  ) {
    const activeIds = getActiveNodeIds(level);
    if (!activeIds.includes(from) || !activeIds.includes(to)) return false;

    const fromBase = getBaseType(from);
    const toBase = getBaseType(to);

    const switchExists = level.elements.includes("switch");

    if (type === "phase") {
      if (
        switchExists &&
        ((fromBase === "panel" && toBase === "switch") ||
          (fromBase === "switch" && toBase === "panel"))
      ) {
        return true;
      }

      if (
        switchExists &&
        ((fromBase === "switch" && toBase === "lamp") ||
          (fromBase === "lamp" && toBase === "switch"))
      ) {
        return true;
      }

      if (
        (fromBase === "panel" && toBase === "socket") ||
        (fromBase === "socket" && toBase === "panel")
      ) {
        return true;
      }
    }

    if (type === "neutral") {
      if (
        (fromBase === "lamp" && toBase === "panel") ||
        (fromBase === "panel" && toBase === "lamp")
      ) {
        return true;
      }

      if (
        (fromBase === "socket" && toBase === "panel") ||
        (fromBase === "panel" && toBase === "socket")
      ) {
        return true;
      }
    }

    return false;
  }

  function removeWireById(wireId: number) {
    const next = wires.filter(w => w.id !== wireId);
    setWires(next);
  }

  function validate(currentWires: Wire[], currentPanelOn = panelOn, currentSwitchOn = switchOn) {
    let hasError = false;

    for (const wire of currentWires) {
      if (!isAllowedWire(wire.from, wire.to, wire.type, currentLevel)) {
        hasError = true;
        break;
      }
    }

    const pairTypeCounts = new Map<string, number>();
    currentWires.forEach(w => {
      const key = `${normalizePair(w.from, w.to)}-${w.type}`;
      pairTypeCounts.set(key, (pairTypeCounts.get(key) || 0) + 1);
    });

    for (const count of pairTypeCounts.values()) {
      if (count > 1) {
        hasError = true;
        break;
      }
    }

    const activeLampIds = activeNodeIds.filter(id => getBaseType(id) === "lamp");
    const activeSocketIds = activeNodeIds.filter(id => getBaseType(id) === "socket");

    const lampStates = activeLampIds.map(lampId => {
      const switchPhase = hasSwitch
        ? wireExists(currentWires, "panel", "switch", "phase") &&
          wireExists(currentWires, "switch", lampId, "phase")
        : false;

      const lampNeutral = wireExists(currentWires, lampId, "panel", "neutral");
      return !hasError && currentPanelOn && (!hasSwitch || currentSwitchOn) && switchPhase && lampNeutral;
    });

    const socketStates = activeSocketIds.map(socketId => {
      const socketPhase = wireExists(currentWires, "panel", socketId, "phase");
      const socketNeutral = wireExists(currentWires, socketId, "panel", "neutral");
      return !hasError && currentPanelOn && socketPhase && socketNeutral;
    });

    const poweredLampCount = lampStates.filter(Boolean).length;
    const poweredSocketCount = socketStates.filter(Boolean).length;

    setFire(hasError);

    if (
      !hasError &&
      currentPanelOn &&
      poweredLampCount === requiredLampCount &&
      poweredSocketCount === requiredSocketCount &&
      currentWires.length > 0 &&
      !completed
    ) {
      goToNextLevel();
    }
  }

  useEffect(() => {
    validate(wires, panelOn, switchOn);
  }, [wires, panelOn, switchOn, levelIndex]);

  function handleNodeClick(id: NodeId) {
    if (!activeNodeIds.includes(id)) return;
    if (mode === "idle") return;

    if (mode === "erase") {
      if (!selected) {
        setSelected(id);
        return;
      }

      if (selected === id) return;

      const found = getWireByPair(wires, selected, id);
      if (found) {
        removeWireById(found.id);
      }
      setSelected(null);
      return;
    }

    if (mode === "phase" || mode === "neutral") {
      if (!selected) {
        setSelected(id);
        return;
      }

      if (selected === id) return;

      if (wireExists(wires, selected, id, mode)) {
        setSelected(null);
        return;
      }

      const nextWire: Wire = {
        id: Date.now() + Math.random(),
        from: selected,
        to: id,
        type: mode,
      };

      const next = [...wires, nextWire];
      setWires(next);
      setSelected(null);
    }
  }

  useEffect(() => {
    if (!panelOn || fire || wires.length === 0) {
      setFlowDots([]);
      return;
    }

    const powered: { wireId: number; color: string }[] = [];

    wires.forEach(wire => {
      if (!isAllowedWire(wire.from, wire.to, wire.type, currentLevel)) return;

      const fromBase = getBaseType(wire.from);
      const toBase = getBaseType(wire.to);

      const isLampPath =
        (samePair(wire.from, wire.to, "panel", "switch") && wire.type === "phase") ||
        ((fromBase === "switch" && toBase === "lamp") ||
          (fromBase === "lamp" && toBase === "switch")) && wire.type === "phase" ||
        ((fromBase === "lamp" && toBase === "panel") ||
          (fromBase === "panel" && toBase === "lamp")) && wire.type === "neutral";

      const isSocketPath =
        ((fromBase === "panel" && toBase === "socket") ||
          (fromBase === "socket" && toBase === "panel")) &&
        (wire.type === "phase" || wire.type === "neutral");

      if (isLampPath) {
        if (
          samePair(wire.from, wire.to, "panel", "switch")
            ? switchOn
            : wire.type === "neutral"
              ? panelOn
              : switchOn
        ) {
          powered.push({
            wireId: wire.id,
            color: wire.type === "phase" ? "#22c55e" : "#60a5fa",
          });
        }
      }

      if (isSocketPath) {
        powered.push({
          wireId: wire.id,
          color: wire.type === "phase" ? "#22c55e" : "#60a5fa",
        });
      }
    });

    const spawnInterval = setInterval(() => {
      setFlowDots(prev => [
        ...prev,
        ...powered.map(item => ({
          id: Math.random(),
          wireId: item.wireId,
          t: 0,
          color: item.color,
        })),
      ]);
    }, 220);

    return () => clearInterval(spawnInterval);
  }, [panelOn, switchOn, wires, fire, levelIndex]);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      setFlowDots(prev =>
        prev
          .map(dot => ({
            ...dot,
            t: dot.t + 0.03,
          }))
          .filter(dot => dot.t <= 1)
      );
    }, 30);

    return () => clearInterval(moveInterval);
  }, []);

  function getAnchor(nodeId: NodeId): Point {
    const p = BASE_POSITIONS[nodeId];
    const base = getBaseType(nodeId);

    if (base === "panel") return { x: p.x + 95, y: p.y + 32 };
    if (base === "switch") return { x: p.x + 28, y: p.y + 34 };
    if (base === "lamp") return { x: p.x + 38, y: p.y + 56 };
    return { x: p.x + 36, y: p.y + 36 };
  }

  function getOffsetForWire(wire: Wire): Point {
    const pair = normalizePair(wire.from, wire.to);

    const hasBoth = wires.some(
      w => normalizePair(w.from, w.to) === pair && w.type !== wire.type
    );

    if (!hasBoth) return { x: 0, y: 0 };

    if (wire.type === "phase") {
      return { x: 0, y: -8 };
    }

    return { x: 0, y: 8 };
  }

  function getPolylinePoints(wire: Wire) {
    const a = getAnchor(wire.from);
    const b = getAnchor(wire.to);
    const midX = (a.x + b.x) / 2;
    const offset = getOffsetForWire(wire);

    return [
      { x: a.x + offset.x, y: a.y + offset.y },
      { x: midX + offset.x, y: a.y + offset.y },
      { x: midX + offset.x, y: b.y + offset.y },
      { x: b.x + offset.x, y: b.y + offset.y },
    ];
  }

  function pointsToString(points: Point[]) {
    return points.map(p => `${p.x},${p.y}`).join(" ");
  }

  function interpolate(points: Point[], t: number): Point {
    const segments = points.slice(0, -1).map((p, i) => ({
      a: p,
      b: points[i + 1],
      len: Math.hypot(points[i + 1].x - p.x, points[i + 1].y - p.y),
    }));

    const total = segments.reduce((sum, s) => sum + s.len, 0);
    let distance = total * t;

    for (const seg of segments) {
      if (distance <= seg.len) {
        const ratio = seg.len === 0 ? 0 : distance / seg.len;
        return {
          x: seg.a.x + (seg.b.x - seg.a.x) * ratio,
          y: seg.a.y + (seg.b.y - seg.a.y) * ratio,
        };
      }
      distance -= seg.len;
    }

    return points[points.length - 1];
  }

  const flowPositions = useMemo(() => {
    return flowDots
      .map(dot => {
        const wire = wires.find(w => w.id === dot.wireId);
        if (!wire) return null;

        const points = getPolylinePoints(wire);
        const pos = interpolate(points, dot.t);

        return {
          id: dot.id,
          x: pos.x,
          y: pos.y,
          color: dot.color,
        };
      })
      .filter(Boolean) as { id: number; x: number; y: number; color: string }[];
  }, [flowDots, wires]);

  const toolbarButton: React.CSSProperties = {
    padding: "10px 16px",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  };

  function modeColor(target: Mode, activeBg: string) {
    return mode === target
      ? { background: activeBg, color: "#fff" }
      : { background: "#ffffff", color: "#0f172a" };
  }

  function lampIsOn(lampId: NodeId) {
    if (getBaseType(lampId) !== "lamp") return false;
    if (!panelOn || fire || !hasSwitch || !switchOn) return false;

    return (
      wireExists(wires, "panel", "switch", "phase") &&
      wireExists(wires, "switch", lampId, "phase") &&
      wireExists(wires, lampId, "panel", "neutral")
    );
  }

  function socketIsOn(socketId: NodeId) {
    if (getBaseType(socketId) !== "socket") return false;
    if (!panelOn || fire) return false;

    return (
      wireExists(wires, "panel", socketId, "phase") &&
      wireExists(wires, socketId, "panel", "neutral")
    );
  }

  const objectiveText = (() => {
    const parts = ["panel"];
    if (hasSwitch) parts.push("switch");
    for (let i = 0; i < requiredLampCount; i++) parts.push("lamp");
    for (let i = 0; i < requiredSocketCount; i++) parts.push("socket");
    return parts.join(", ");
  })();

  return (
    <div
      style={{
        width: STAGE.width,
        height: STAGE.height,
        position: "relative",
        overflow: "hidden",
        borderRadius: 22,
        background: "linear-gradient(180deg, #0b1a2a 0%, #102640 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 16px 44px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 60,
          display: "flex",
          gap: 10,
          padding: 10,
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          flexWrap: "wrap",
          maxWidth: 500,
        }}
      >
        <button
          onClick={() => {
            setMode("phase");
            setSelected(null);
          }}
          style={{ ...toolbarButton, ...modeColor("phase", "#ef4444") }}
        >
          ➕ Musbat
        </button>

        <button
          onClick={() => {
            setMode("neutral");
            setSelected(null);
          }}
          style={{ ...toolbarButton, ...modeColor("neutral", "#2563eb") }}
        >
          ➖ Manfiy
        </button>

        <button
          onClick={() => {
            setMode("erase");
            setSelected(null);
          }}
          style={{ ...toolbarButton, ...modeColor("erase", "#f59e0b") }}
        >
          ✂️ O‘chirgich
        </button>

        <button
          onClick={() => {
            setMode("idle");
            setSelected(null);
          }}
          style={{ ...toolbarButton, ...modeColor("idle", "#6b7280") }}
        >
          ⛔ Stop
        </button>

        <button
          onClick={resetOnlyBoard}
          style={{
            ...toolbarButton,
            background: "#ffffff",
            color: "#0f172a",
          }}
        >
          🔄 Bosqichni qayta
        </button>

        <button
          onClick={resetAll}
          style={{
            ...toolbarButton,
            background: "#d1fae5",
            color: "#064e3b",
          }}
        >
          🕹 Boshidan
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 50,
          minWidth: 210,
          padding: "12px 14px",
          borderRadius: 16,
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
          color: "#fff",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        <div>Level: <b>{currentLevel.id} / {LEVELS.length}</b></div>
        
      </div>

      {completed && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 90,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
            color: "#fff",
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 800 }}>🎉 Tabriklaymiz!</div>
          <div style={{ fontSize: 20 }}>Barcha 10 ta bosqich tugadi</div>
          <button
            onClick={resetAll}
            style={{
              padding: "12px 22px",
              borderRadius: 14,
              border: "none",
              background: "#22c55e",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            Qayta boshlash
          </button>
        </div>
      )}

      <svg
        width={STAGE.width}
        height={STAGE.height}
        style={{ position: "absolute", inset: 0, zIndex: 5 }}
      >
        {wires.map(wire => {
          const points = getPolylinePoints(wire);
          const pointsString = pointsToString(points);
          const baseColor = wire.type === "phase" ? "#ff3b30" : "#3b82f6";
          const activeColor = wire.type === "phase" ? "#22c55e" : "#60a5fa";

          return (
            <g key={wire.id}>
              <polyline
                points={pointsString}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ cursor: mode === "erase" ? "pointer" : "default" }}
                onClick={() => {
                  if (mode === "erase") {
                    removeWireById(wire.id);
                    setSelected(null);
                  }
                }}
              />

              <polyline
                points={pointsString}
                fill="none"
                stroke={baseColor}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {panelOn && !fire && (
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke={activeColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="14 16"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-60"
                    dur={wire.type === "phase" ? "0.9s" : "1.1s"}
                    repeatCount="indefinite"
                  />
                </polyline>
              )}
            </g>
          );
        })}
      </svg>

      {panelOn &&
        !fire &&
        flowPositions.map(dot => (
          <div
            key={dot.id}
            style={{
              position: "absolute",
              left: dot.x - 4,
              top: dot.y - 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: dot.color,
              boxShadow: `0 0 10px ${dot.color}, 0 0 20px ${dot.color}`,
              zIndex: 8,
              pointerEvents: "none",
            }}
          />
        ))}

      <img
        src="/z-avlod/electric/panel.png"
        alt="panel"
        onClick={() => handleNodeClick("panel")}
        style={{
          position: "absolute",
          left: BASE_POSITIONS.panel.x,
          top: BASE_POSITIONS.panel.y,
          width: 92,
          height: "auto",
          display: "block",
          zIndex: 20,
          cursor: mode !== "idle" ? "pointer" : "default",
          userSelect: "none",
          outline: selected === "panel" ? "3px solid #22c55e" : "none",
          borderRadius: 10,
        }}
      />

      <img
        src={`/z-avlod/electric/${panelOn ? "breaker_on.png" : "breaker_off.png"}`}
        alt="breaker"
        onClick={() => setPanelOn(prev => !prev)}
        style={{
          position: "absolute",
          left: BASE_POSITIONS.panel.x + 96,
          top: BASE_POSITIONS.panel.y + 7,
          height: 54,
          width: "auto",
          maxWidth: 34,
          objectFit: "contain",
          display: "block",
          zIndex: 22,
          cursor: "pointer",
          userSelect: "none",
        }}
      />

      {hasSwitch && (
        <img
          src={`/z-avlod/electric/${switchOn ? "switch_on.png" : "switch_off.png"}`}
          alt="switch"
          onClick={() => {
            setSwitchOn(prev => !prev);
            if (mode !== "idle" && mode !== "erase") {
              handleNodeClick("switch");
            }
          }}
          style={{
            position: "absolute",
            left: BASE_POSITIONS.switch.x,
            top: BASE_POSITIONS.switch.y,
            width: 32,
            height: "auto",
            display: "block",
            zIndex: 25,
            cursor: "pointer",
            userSelect: "none",
            outline: selected === "switch" ? "3px solid #22c55e" : "none",
            borderRadius: 10,
          }}
        />
      )}

      {activeNodeIds
        .filter(id => getBaseType(id) === "lamp")
        .map(lampId => {
          const pos = BASE_POSITIONS[lampId];
          const on = lampIsOn(lampId);

          return (
            <img
              key={lampId}
              src={`/z-avlod/electric/${on ? "lamp_on.png" : "lamp_off.png"}`}
              alt={lampId}
              onClick={() => handleNodeClick(lampId)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 90,
                height: "auto",
                display: "block",
                zIndex: 25,
                cursor: mode !== "idle" ? "pointer" : "default",
                userSelect: "none",
                outline: selected === lampId ? "3px solid #22c55e" : "none",
                borderRadius: 10,
                filter: on ? "drop-shadow(0 0 10px rgba(255,230,120,0.7))" : "none",
              }}
            />
          );
        })}

      {activeNodeIds
        .filter(id => getBaseType(id) === "socket")
        .map(socketId => {
          const pos = BASE_POSITIONS[socketId];
          const on = socketIsOn(socketId);

          return (
            <img
              key={socketId}
              src={`/z-avlod/electric/${on ? "socket_on.png" : "socket.png"}`}
              alt={socketId}
              onClick={() => handleNodeClick(socketId)}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 82,
                height: "auto",
                display: "block",
                objectFit: "contain",
                zIndex: 25,
                cursor: mode !== "idle" ? "pointer" : "default",
                userSelect: "none",
                outline: selected === socketId ? "3px solid #22c55e" : "none",
                borderRadius: 10,
                filter: on ? "drop-shadow(0 0 10px rgba(34,197,94,0.7))" : "none",
              }}
            />
          );
        })}

      {fire && (
        <img
          src="/z-avlod/electric/fire.png"
          alt="fire"
          style={{
            position: "absolute",
            left: 520,
            top: 250,
            width: 90,
            height: "auto",
            zIndex: 30,
            pointerEvents: "none",
            filter: "drop-shadow(0 0 18px rgba(255,120,0,0.8))",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 16,
          zIndex: 60,
          padding: "10px 14px",
          borderRadius: 14,
          background: "rgba(255,255,255,0.07)",
          color: "#dbeafe",
          fontSize: 13,
          maxWidth: 860,
        }}
      >
        
        <b>Simni o‘chirish uchun:</b> O‘chirgich rejimida sim ustiga bosing yoki 2 ta elementni ketma-ket bosing.{" "}
        <b>O‘yin qoidasi:</b> har bosqich to‘g‘ri bajarilganda avtomatik keyingi bosqichga o‘tadi.
      </div>
    </div>
  );
}