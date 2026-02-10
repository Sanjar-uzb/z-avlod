export type SeriesPoint = { t: number; x: number; v: number; a: number };

export function pushSeries(buf: SeriesPoint[], p: SeriesPoint, max = 300) {
  buf.push(p);
  if (buf.length > max) buf.splice(0, buf.length - max);
}

export function drawSeries(canvas: HTMLCanvasElement, data: SeriesPoint[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // axes
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(40, 10); ctx.lineTo(40, h - 20);
  ctx.lineTo(w - 10, h - 20);
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (data.length < 2) return;

  const t0 = data[0].t;
  const t1 = data[data.length - 1].t;
  const spanT = Math.max(0.001, t1 - t0);

  const minY = Math.min(...data.map(d => Math.min(d.x, d.v, d.a)));
  const maxY = Math.max(...data.map(d => Math.max(d.x, d.v, d.a)));
  const spanY = Math.max(1e-6, maxY - minY);

  const X = (t: number) => 40 + ((t - t0) / spanT) * (w - 55);
  const Y = (y: number) => (h - 20) - ((y - minY) / spanY) * (h - 40);

  const plot = (get: (d: SeriesPoint) => number) => {
    ctx.beginPath();
    ctx.moveTo(X(data[0].t), Y(get(data[0])));
    for (let i = 1; i < data.length; i++) ctx.lineTo(X(data[i].t), Y(get(data[i])));
    ctx.stroke();
  };

  // x(t), v(t), a(t) — rang bermadik (siz hohlasangiz keyin CSS bilan ajratamiz)
  plot(d => d.x);
  plot(d => d.v);
  plot(d => d.a);

  ctx.globalAlpha = 0.7;
  ctx.fillText("x(t), v(t), a(t)", 46, 16);
  ctx.globalAlpha = 1;
}
