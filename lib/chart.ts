export type SeriesPoint = { t: number; x: number; v: number; a: number };

export function pushSeries(arr: SeriesPoint[], p: SeriesPoint, max = 260) {
  arr.push(p);
  if (arr.length > max) arr.splice(0, arr.length - max);
}

function norm(v: number, min: number, max: number) {
  if (max - min < 1e-9) return 0.5;
  return (v - min) / (max - min);
}

export function drawSeries(canvas: HTMLCanvasElement, series: SeriesPoint[]) {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // bg
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(0, 0, w, h);

  if (series.length < 2) return;

  const t0 = series[0].t;
  const t1 = series[series.length - 1].t;

  const xs = series.map((p) => p.x);
  const vs = series.map((p) => p.v);
  const as = series.map((p) => p.a);

  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const vmin = Math.min(...vs), vmax = Math.max(...vs);
  const amin = Math.min(...as), amax = Math.max(...as);

  // grid
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    const y = (h * i) / 6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  function plot(getY: (p: SeriesPoint) => number, yMin: number, yMax: number, stroke: string) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < series.length; i++) {
      const p = series[i];
      const tx = norm(p.t, t0, t1);
      const ty = norm(getY(p), yMin, yMax);

      const x = tx * (w - 20) + 10;
      const y = (1 - ty) * (h - 20) + 10;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // x(t), v(t), a(t)
  plot((p) => p.x, xmin, xmax, "rgba(122,167,255,0.95)"); // x
  plot((p) => p.v, vmin, vmax, "rgba(89,209,143,0.95)");  // v
  plot((p) => p.a, amin, amax, "rgba(255,204,102,0.95)"); // a

  // legend
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("x(t)", 12, 16);
  ctx.fillText("v(t)", 52, 16);
  ctx.fillText("a(t)", 92, 16);
}
