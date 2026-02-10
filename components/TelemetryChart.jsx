"use client";

import { useMemo } from "react";

function scale(val, min, max) {
  if (max - min === 0) return 0.5;
  return (val - min) / (max - min);
}

function makePath(points, key, w, h, pad, minY, maxY) {
  if (!points.length) return "";
  const n = points.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const x = pad + (i / (n - 1 || 1)) * (w - pad * 2);
    const yv = points[i][key];
    const yn = 1 - scale(yv, minY, maxY);
    const y = pad + yn * (h - pad * 2);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d.trim();
}

export default function TelemetryChart({
  points,
  height = 180,
  title = "Grafiklar: v(t), a(t), x(t)",
}) {
  const w = 680;
  const h = height;
  const pad = 18;

  const stats = useMemo(() => {
    if (!points?.length) return null;

    const keys = ["v", "a", "x"];
    const ranges = {};
    for (const k of keys) {
      let min = Infinity, max = -Infinity;
      for (const p of points) {
        const v = Number(p[k] ?? 0);
        if (v < min) min = v;
        if (v > max) max = v;
      }
      // padding
      if (min === Infinity) { min = 0; max = 1; }
      if (min === max) { max = min + 1; }
      ranges[k] = { min, max };
    }
    return ranges;
  }, [points]);

  if (!points?.length || !stats) {
    return (
      <div className="card" style={{ marginTop: 12 }}>
        <div className="h3">{title}</div>
        <div className="muted">Hali ma’lumot yo‘q (labni ishga tushiring).</div>
      </div>
    );
  }

  const vPath = makePath(points, "v", w, h, pad, stats.v.min, stats.v.max);
  const aPath = makePath(points, "a", w, h, pad, stats.a.min, stats.a.max);
  const xPath = makePath(points, "x", w, h, pad, stats.x.min, stats.x.max);

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="h3">{title}</div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        style={{ display: "block", borderRadius: 14, border: "1px solid rgba(255,255,255,.10)", background: "rgba(255,255,255,.02)" }}
      >
        {/* grid */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = pad + (i / 4) * (h - pad * 2);
          return <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke="rgba(255,255,255,.08)" strokeWidth="1" />;
        })}

        {/* x(t) */}
        <path d={xPath} fill="none" stroke="rgba(122,167,255,.95)" strokeWidth="2.5" />
        {/* v(t) */}
        <path d={vPath} fill="none" stroke="rgba(89,209,143,.95)" strokeWidth="2.5" />
        {/* a(t) */}
        <path d={aPath} fill="none" stroke="rgba(255,204,102,.95)" strokeWidth="2.5" />
      </svg>

      <div className="row" style={{ marginTop: 10 }}>
        <span className="badge">x(t) — ko‘k</span>
        <span className="badge">v(t) — yashil</span>
        <span className="badge">a(t) — sariq</span>
      </div>

      <div className="muted" style={{ marginTop: 8 }}>
        v: {stats.v.min.toFixed(2)}..{stats.v.max.toFixed(2)} m/s • a: {stats.a.min.toFixed(2)}..{stats.a.max.toFixed(2)} m/s² • x: {stats.x.min.toFixed(2)}..{stats.x.max.toFixed(2)} m
      </div>
    </div>
  );
}
