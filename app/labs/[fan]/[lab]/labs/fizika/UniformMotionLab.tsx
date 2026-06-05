"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Mode = "tekis" | "tezlanishli";

type SeriesPoint = {
  t: number;
  s: number;
  v: number;
  a: number;
};

type Params = {
  mode: Mode;
  v0: number; // km/h
  a: number; // m/s²
  timeScale: number;
};

const DEFAULT: Params = {
  mode: "tekis",
  v0: 36,
  a: 1,
  timeScale: 1,
};

const MAX_POINTS = 300;
const CHART_COLORS = {
  s: "#2563eb",
  v: "#16a34a",
  a: "#dc2626",
  axis: "#111827",
  grid: "#dbeafe",
  text: "#1f2937",
  panel: "#ffffff",
  panelBorder: "#d1d5db",
  road: "#4b5563",
  roadLine: "#f8fafc",
  skyTop: "#e0f2fe",
  skyBottom: "#f8fbff",
  needle: "#ef4444",
};

const toMs = (kmh: number) => kmh / 3.6;
const toKmh = (ms: number) => ms * 3.6;

function pushSeries(arr: SeriesPoint[], point: SeriesPoint, max = MAX_POINTS) {
  arr.push(point);
  if (arr.length > max) arr.shift();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawChart(canvas: HTMLCanvasElement, data: SeriesPoint[], mode: Mode) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#f8fbff");
  bg.addColorStop(1, "#eef6ff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  drawRoundedRect(ctx, 8, 8, w - 16, h - 16, 18);
  ctx.strokeStyle = "#bfdbfe";
  ctx.lineWidth = 2;
  ctx.stroke();

  const left = 80;
  const right = 28;
  const top = 80;
  const bottom = 70;
  const chartW = w - left - right;
  const chartH = h - top - bottom;
  const originX = left;
  const originY = h - bottom;

  ctx.fillStyle = CHART_COLORS.text;
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Harakat grafigi", 28, 38);

  ctx.font = "16px Arial";
  ctx.fillStyle = "#475569";
  ctx.fillText(
    mode === "tekis"
      ? "Tekis harakat: tezlik o'zgarmaydi"
      : "Tezlanishli harakat: tezlik vaqt o'tishi bilan ortadi",
    28,
    62
  );

  if (data.length < 2) {
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Grafikni ko'rish uchun simulyatsiyani boshlang", w / 2, h / 2);
    return;
  }

  const maxT = Math.max(data[data.length - 1].t, 1);
  const maxVal = Math.max(
    ...data.map((d) => d.s),
    ...data.map((d) => toKmh(d.v)),
    ...data.map((d) => Math.abs(d.a)),
    1
  );

  const scaleX = chartW / maxT;
  const scaleY = chartH / maxVal;

  // grid
  ctx.strokeStyle = CHART_COLORS.grid;
  ctx.lineWidth = 1;

  for (let i = 0; i <= 10; i++) {
    const x = originX + (chartW / 10) * i;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, originY);
    ctx.stroke();

    ctx.fillStyle = CHART_COLORS.text;
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(((maxT / 10) * i).toFixed(1), x, originY + 26);
  }

  for (let i = 0; i <= 8; i++) {
    const y = originY - (chartH / 8) * i;
    ctx.beginPath();
    ctx.moveTo(originX, y);
    ctx.lineTo(originX + chartW, y);
    ctx.stroke();

    ctx.fillStyle = CHART_COLORS.text;
    ctx.font = "14px Arial";
    ctx.textAlign = "right";
    ctx.fillText(((maxVal / 8) * i).toFixed(0), originX - 10, y + 5);
  }

  // axis
  ctx.strokeStyle = CHART_COLORS.axis;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(originX, top);
  ctx.lineTo(originX, originY);
  ctx.lineTo(originX + chartW, originY);
  ctx.stroke();

  // labels
  ctx.fillStyle = CHART_COLORS.axis;
  ctx.font = "bold 17px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Vaqt t (sekund)", originX + chartW / 2, h - 24);

  ctx.save();
  ctx.translate(28, top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Qiymat", 0, 0);
  ctx.restore();

  const drawLine = (
    getter: (d: SeriesPoint) => number,
    color: string,
    lineWidth = 4
  ) => {
    (ctx as CanvasRenderingContext2D).beginPath();
    (ctx as CanvasRenderingContext2D).strokeStyle = color;
    (ctx as CanvasRenderingContext2D).lineWidth = lineWidth;

    data.forEach((d, i) => {
      const x = originX + d.t * scaleX;
      const y = originY - getter(d) * scaleY;
      if (i === 0) (ctx as CanvasRenderingContext2D).moveTo(x, y);
      else (ctx as CanvasRenderingContext2D).lineTo(x, y);
    });
    (ctx as CanvasRenderingContext2D).stroke();
  };

  drawLine((d) => d.s, CHART_COLORS.s);
  drawLine((d) => toKmh(d.v), CHART_COLORS.v);
  drawLine((d) => Math.abs(d.a), CHART_COLORS.a);

  const last = data[data.length - 1];
  const markers = [
    { label: "s", value: last.s, color: CHART_COLORS.s, y: originY - last.s * scaleY },
    {
      label: "v",
      value: toKmh(last.v),
      color: CHART_COLORS.v,
      y: originY - toKmh(last.v) * scaleY,
    },
    {
      label: "a",
      value: Math.abs(last.a),
      color: CHART_COLORS.a,
      y: originY - Math.abs(last.a) * scaleY,
    },
  ];

  markers.forEach((m) => {
    const x = originX + last.t * scaleX;
    ctx.beginPath();
    ctx.fillStyle = m.color;
    ctx.arc(x, m.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Legend cards
  const legend = [
    { color: CHART_COLORS.s, text: "s — yo'l (metr)" },
    { color: CHART_COLORS.v, text: "v — tezlik (km/soat)" },
    { color: CHART_COLORS.a, text: "a — tezlanish (m/s²)" },
  ];

  legend.forEach((item, i) => {
    const lx = w - 255;
    const ly = 22 + i * 32;
    ctx.fillStyle = item.color;
    drawRoundedRect(ctx, lx, ly, 16, 16, 4);
    ctx.fill();
    ctx.fillStyle = CHART_COLORS.text;
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "left";
    ctx.fillText(item.text, lx + 24, ly + 13);
  });

  // Formula box
  const formula =
    mode === "tekis" ? "s = v₀ × t" : "s = v₀ × t + 1/2 × a × t²";
  drawRoundedRect(ctx, 22, h - 56, 265, 34, 10);
  ctx.fillStyle = "#dbeafe";
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Formula: ${formula}`, 34, h - 33);
}

function Speedometer({ speedMs }: { speedMs: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const displayedSpeed = Math.max(0, toKmh(speedMs));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = 125;
    const r = 100;
    const maxValue = 180;

    // background card
    drawRoundedRect(ctx, 8, 8, w - 16, h - 16, 18);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#111827";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Spidometr", cx, 36);

    // arc base
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 18;
    ctx.stroke();

    // colored zones
    const zones = [
      { from: 0, to: 60, color: "#22c55e" },
      { from: 60, to: 120, color: "#f59e0b" },
      { from: 120, to: 180, color: "#ef4444" },
    ];

    zones.forEach((z) => {
      const start = Math.PI + (z.from / maxValue) * Math.PI;
      const end = Math.PI + (z.to / maxValue) * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, end);
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 14;
      ctx.stroke();
    });

    // ticks and labels
    for (let i = 0; i <= maxValue; i += 10) {
      const angle = Math.PI + (i / maxValue) * Math.PI;
      const outer = r;
      const inner = i % 20 === 0 ? r - 16 : r - 10;

      const x1 = cx + Math.cos(angle) * inner;
      const y1 = cy + Math.sin(angle) * inner;
      const x2 = cx + Math.cos(angle) * outer;
      const y2 = cy + Math.sin(angle) * outer;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = "#1f2937";
      ctx.lineWidth = i % 20 === 0 ? 2.5 : 1.5;
      ctx.stroke();

      if (i % 20 === 0) {
        const tx = cx + Math.cos(angle) * (r - 30);
        const ty = cy + Math.sin(angle) * (r - 30);
        ctx.fillStyle = "#111827";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(String(i), tx, ty + 4);
      }
    }

    const angle = Math.PI + (Math.min(displayedSpeed, maxValue) / maxValue) * Math.PI;

    // needle
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * (r - 18), cy + Math.sin(angle) * (r - 18));
    ctx.strokeStyle = CHART_COLORS.needle;
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#111827";
    ctx.fill();

    drawRoundedRect(ctx, cx - 76, 152, 152, 42, 10);
    ctx.fillStyle = "#eff6ff";
    ctx.fill();
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${displayedSpeed.toFixed(0)} km/soat`, cx, 180);
  }, [displayedSpeed]);

  return <canvas ref={ref} width={300} height={210} />;
}

function MotionCanvas({
  params,
  paused,
  onSample,
  seed,
}: {
  params: Params;
  paused: boolean;
  onSample: (p: SeriesPoint) => void;
  seed: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tSim = useRef(0);
  const acc = useRef(0);
  const lastTime = useRef(0);
  const roadOffset = useRef(0);
  const fixedDt = 1 / 60;

  const state = useRef({ s: 0, v: 0, a: 0 });

  useEffect(() => {
    tSim.current = 0;
    acc.current = 0;
    lastTime.current = 0;
    roadOffset.current = 0;

    state.current = {
      s: 0,
      v: toMs(params.v0),
      a: params.mode === "tezlanishli" ? params.a : 0,
    };

    onSample({
      t: 0,
      s: 0,
      v: state.current.v,
      a: state.current.a,
    });
  }, [seed, params.mode, params.v0, params.a, onSample]);

  useEffect(() => {
    let anim = 0;

    function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number) {
      // body
      ctx.fillStyle = "#2563eb";
      drawRoundedRect(ctx, x - 65, y - 28, 130, 30, 10);
      ctx.fill();

      // roof
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.moveTo(x - 35, y - 28);
      ctx.lineTo(x - 10, y - 52);
      ctx.lineTo(x + 34, y - 52);
      ctx.lineTo(x + 56, y - 28);
      ctx.closePath();
      ctx.fill();

      // windows
      ctx.fillStyle = "#dbeafe";
      ctx.beginPath();
      ctx.moveTo(x - 24, y - 30);
      ctx.lineTo(x - 6, y - 47);
      ctx.lineTo(x + 16, y - 47);
      ctx.lineTo(x + 28, y - 30);
      ctx.closePath();
      ctx.fill();

      // wheels
      [x - 38, x + 38].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, y + 5, 14, 0, Math.PI * 2);
        ctx.fillStyle = "#111827";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(wx, y + 5, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#9ca3af";
        ctx.fill();
      });
    }

    function loop(time: number) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      if (lastTime.current === 0) lastTime.current = time;
      const delta = (time - lastTime.current) / 1000;
      lastTime.current = time;

      if (!paused) {
        acc.current += delta * params.timeScale;

        while (acc.current >= fixedDt) {
          acc.current -= fixedDt;

          const a = params.mode === "tezlanishli" ? params.a : 0;
          state.current.a = a;
          state.current.s += state.current.v * fixedDt + 0.5 * a * fixedDt * fixedDt;
          state.current.v += a * fixedDt;
          roadOffset.current += state.current.v * 8;
          tSim.current += fixedDt;

          onSample({
            t: tSim.current,
            s: state.current.s,
            v: state.current.v,
            a: state.current.a,
          });
        }
      }

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, CHART_COLORS.skyTop);
      sky.addColorStop(1, CHART_COLORS.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // sun
      ctx.beginPath();
      ctx.arc(w - 80, 58, 28, 0, Math.PI * 2);
      ctx.fillStyle = "#fde68a";
      ctx.fill();

      // clouds
      const clouds = [120, 340, 580, 810];
      clouds.forEach((cx, i) => {
        const cy = 50 + (i % 2) * 18;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 10, 20, 0, Math.PI * 2);
        ctx.arc(cx + 40, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      });

      // grass
      ctx.fillStyle = "#86efac";
      ctx.fillRect(0, h - 160, w, 35);

      // road
      const roadY = h - 125;
      ctx.fillStyle = CHART_COLORS.road;
      ctx.fillRect(0, roadY, w, 90);

      ctx.fillStyle = CHART_COLORS.roadLine;
      for (let i = 0; i < 18; i++) {
        const x = i * 90 - (roadOffset.current % 90);
        drawRoundedRect(ctx, x, roadY + 40, 48, 8, 4);
        ctx.fill();
      }

      // distance board
      drawRoundedRect(ctx, 22, 20, 180, 70, 16);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
      ctx.strokeStyle = "#bfdbfe";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Vaqt: ${tSim.current.toFixed(1)} s`, 36, 48);
      ctx.fillText(`Yo'l: ${state.current.s.toFixed(1)} m`, 36, 76);

      // car stays near center
      drawCar(ctx, w / 2, roadY + 28);
    }

    const animate = (time: number) => {
      loop(time);
      anim = requestAnimationFrame(animate);
    };

    anim = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(anim);
  }, [paused, params, onSample]);

  return (
    <canvas
      ref={canvasRef}
      width={1000}
      height={320}
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #d1d5db",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
        minWidth: 180,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            background: color,
          }}
        />
        <span style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

export default function UniformMotionLabPretty() {
  const [params, setParams] = useState<Params>(DEFAULT);
  const [paused, setPaused] = useState(false);
  const [seed, setSeed] = useState(1);
  const [speedMs, setSpeedMs] = useState(toMs(DEFAULT.v0));
  const [latest, setLatest] = useState<SeriesPoint>({ t: 0, s: 0, v: toMs(DEFAULT.v0), a: 0 });

  const chartRef = useRef<HTMLCanvasElement>(null);
  const seriesRef = useRef<SeriesPoint[]>([]);

  const formulaText = useMemo(() => {
    return params.mode === "tekis"
      ? "Tekis harakatda tezlik o'zgarmaydi. Yo'l vaqtga to'g'ri proporsional ortadi."
      : "Tezlanishli harakatda tezlik ortib boradi. Shu sabab yo'l ham tezroq o'sadi.";
  }, [params.mode]);

  const sample = React.useCallback(
    (point: SeriesPoint) => {
      pushSeries(seriesRef.current, point);
      setSpeedMs(point.v);
      setLatest(point);

      requestAnimationFrame(() => {
        if (chartRef.current) {
          drawChart(chartRef.current, seriesRef.current, params.mode);
        }
      });
    },
    [params.mode]
  );

  function reset() {
    seriesRef.current = [];
    setSeed((s) => s + 1);
    setPaused(false);
  }

  function handleModeChange(mode: Mode) {
    setParams((prev) => ({ ...prev, mode }));
    seriesRef.current = [];
    setSeed((s) => s + 1);
    setPaused(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #eff6ff 0%, #f8fbff 100%)",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div
          style={{
            background: "white",
            border: "1px solid #dbeafe",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 30px rgba(37,99,235,0.08)",
            marginBottom: 20,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 36, color: "#0f172a" }}>Harakat laboratoriyasi</h1>
          <p style={{ margin: "10px 0 0 0", fontSize: 18, color: "#475569", lineHeight: 1.5 }}>
            Maktab o'quvchilari uchun sodda ko'rinish: mashina harakatini kuzating, spidometrni ko'ring va grafikdan
            yo'l, tezlik hamda tezlanish qanday o'zgarishini tushuning.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #d1d5db",
              borderRadius: 24,
              padding: 22,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#0f172a" }}>
                  Harakat turi
                </label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => handleModeChange("tekis")}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 12,
                      border: params.mode === "tekis" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      background: params.mode === "tekis" ? "#dbeafe" : "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Tekis harakat
                  </button>
                  <button
                    onClick={() => handleModeChange("tezlanishli")}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 12,
                      border: params.mode === "tezlanishli" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                      background: params.mode === "tezlanishli" ? "#dbeafe" : "#fff",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Tezlanishli harakat
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#0f172a" }}>
                  Boshlang'ich tezlik v₀: {params.v0} km/soat
                </label>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={1}
                  value={params.v0}
                  onChange={(e) => setParams((p) => ({ ...p, v0: Number(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#0f172a" }}>
                  Vaqt tezligi: {params.timeScale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min={0.5}
                  max={4}
                  step={0.5}
                  value={params.timeScale}
                  onChange={(e) => setParams((p) => ({ ...p, timeScale: Number(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#0f172a" }}>
                  Tezlanish a: {params.a.toFixed(1)} m/s²
                </label>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={params.a}
                  disabled={params.mode === "tekis"}
                  onChange={(e) => setParams((p) => ({ ...p, a: Number(e.target.value) }))}
                  style={{ width: "100%", opacity: params.mode === "tekis" ? 0.5 : 1 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  padding: "12px 20px",
                  borderRadius: 14,
                  border: "none",
                  background: "#2563eb",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Qayta boshlash
              </button>
              <button
                onClick={() => setPaused((x) => !x)}
                style={{
                  padding: "12px 20px",
                  borderRadius: 14,
                  border: "1px solid #cbd5e1",
                  background: "white",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {paused ? "Davom ettirish" : "To'xtatish"}
              </button>
            </div>

            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 16,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: 17,
                lineHeight: 1.55,
              }}
            >
              <strong>Tushuntirish:</strong> {formulaText}
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <StatCard label="Tezlik" value={`${toKmh(latest.v).toFixed(1)} km/soat`} color={CHART_COLORS.v} />
            <StatCard label="Bosib o'tilgan yo'l" value={`${latest.s.toFixed(1)} m`} color={CHART_COLORS.s} />
            <StatCard label="Tezlanish" value={`${latest.a.toFixed(1)} m/s²`} color={CHART_COLORS.a} />
            <StatCard label="Vaqt" value={`${latest.t.toFixed(1)} s`} color="#7c3aed" />
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #d1d5db",
              borderRadius: 24,
              padding: 14,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <Speedometer speedMs={speedMs} />
          </div>

          <div
            style={{
              background: "white",
              border: "1px solid #d1d5db",
              borderRadius: 24,
              padding: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <MotionCanvas params={params} paused={paused} onSample={sample} seed={seed} />
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            background: "white",
            border: "1px solid #d1d5db",
            borderRadius: 24,
            padding: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}
        >
          <canvas
            ref={chartRef}
            width={1060}
            height={470}
            style={{ width: "100%", height: "auto", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}
