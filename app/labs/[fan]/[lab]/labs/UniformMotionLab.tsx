"use client";

import { useEffect, useRef, useState } from "react";
import { drawSeries, pushSeries, SeriesPoint } from "@/src/lib/chart";

type Mode = "tekis" | "tezlanishli";

export default function UniformMotionLab() {
  const [mode, setMode] = useState<Mode>("tekis");
  const [paused, setPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(1);
  const [x0, setX0] = useState(0);
  const [v0, setV0] = useState(2);     // m/s (simple)
  const [a0, setA0] = useState(1);     // m/s^2
  const [seed, setSeed] = useState(1);

  const series = useRef<SeriesPoint[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  const t = useRef(0);
  const x = useRef(x0);
  const v = useRef(v0);

  const fixedDt = 1 / 60;
  const acc = useRef(0);

  function reset() {
    series.current = [];
    t.current = 0;
    x.current = x0;
    v.current = v0;
    setPaused(false);
    setSeed((s) => s + 1);
  }

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    x.current = x0;
    v.current = v0;
  }, [x0, v0]);

  useEffect(() => {
    const id = requestAnimationFrame(function loop(ts) {
      // use RAF with fixed step accumulator
      // we don't store previous ts globally to keep it short; simplest:
      requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let last = performance.now();

    const tick = () => {
      const now = performance.now();
      const realDelta = (now - last) / 1000;
      last = now;

      if (!paused) {
        acc.current += realDelta * timeScale;

        while (acc.current >= fixedDt) {
          acc.current -= fixedDt;

          const a = mode === "tekis" ? 0 : a0;

          // integrate
          v.current = v.current + a * fixedDt;
          x.current = x.current + v.current * fixedDt;

          t.current += fixedDt;

          pushSeries(series.current, { t: t.current, x: x.current, v: v.current, a }, 240);
          if (chartRef.current) drawSeries(chartRef.current, series.current);
        }
      }

      requestAnimationFrame(tick);
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, timeScale, mode, a0]);

  return (
    <div style={{ padding: 16 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">Tekis / tezlanishli harakat</div>
          <div className="muted">Rejimni tanlang va x(t), v(t), a(t) grafiklarini kuzating.</div>
        </div>

        <div className="row">
          <button className={`btn ${mode === "tekis" ? "" : "btnGhost"}`} onClick={() => setMode("tekis")}>
            Tekis
          </button>
          <button className={`btn ${mode === "tezlanishli" ? "" : "btnGhost"}`} onClick={() => setMode("tezlanishli")}>
            Tezlanishli
          </button>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="h3">x0</div>
          <input className="input" type="number" value={x0} onChange={(e) => setX0(Number(e.target.value))} />
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="h3">v0</div>
          <input className="input" type="number" value={v0} onChange={(e) => setV0(Number(e.target.value))} />
        </div>

        <div className="card" style={{ gridColumn: "span 4" }}>
          <div className="h3">a</div>
          <input
            className="input"
            type="number"
            value={a0}
            disabled={mode === "tekis"}
            onChange={(e) => setA0(Number(e.target.value))}
          />
          <div className="muted" style={{ marginTop: 6 }}>
            {mode === "tekis" ? "Tekis rejimda a=0" : "Tezlanishli rejimda a o‘zgaradi"}
          </div>
        </div>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={reset}>Reset</button>
        <button className="btn btnGhost" onClick={() => setPaused((p) => !p)}>{paused ? "Resume" : "Pause"}</button>
        <button className="btn btnGhost" onClick={() => setTimeScale(0.2)}>Slow-mo 0.2×</button>
        <button className="btn btnGhost" onClick={() => setTimeScale(1)}>Realtime 1×</button>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="h3">Grafik: x(t), v(t), a(t)</div>
        <canvas ref={chartRef} key={seed} width={900} height={220} style={{ width: "100%", borderRadius: 12 }} />
      </div>
    </div>
  );
}
