import {
  GRID_SIDE,
  RADIUS,
  SHADE_STEPS,
  affineMap,
  cellsByDepth,
  positions,
  rng,
  type PaperPoint,
  type Triple,
  type Vertex,
} from "./geometry";

// Solo quello che senza canvas non ha senso: geometria e fisica stanno nei moduli
// accanto, dove una prova le vede.

/** Risoluzione della tela sorgente. Il foglio si ridisegna solo a gradini. */
const SOURCE_SIZE = 256;

/** `veil` e' quanto si vede la carta: a zero c'e' solo l'inchiostro. */
export function drawSource(
  letter: CanvasImageSource,
  veil: number,
  paperColor: string,
  lineColor: string,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SOURCE_SIZE;
  c.height = SOURCE_SIZE;
  const g = c.getContext("2d");
  if (!g) return c;

  if (veil > 0.01) {
    // Il bordo appena mosso, come le sagome del tavolo: un rettangolo esatto
    // in mezzo a un disegno fatto a mano si vede subito.
    const m = 6;
    const r = rng(97);
    const steps = 30;
    g.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const w = SOURCE_SIZE - 2 * m;
      let x: number;
      let y: number;
      if (t < 0.25) { x = m + w * (t / 0.25); y = m; }
      else if (t < 0.5) { x = m + w; y = m + w * ((t - 0.25) / 0.25); }
      else if (t < 0.75) { x = m + w * (1 - (t - 0.5) / 0.25); y = m + w; }
      else { x = m; y = m + w * (1 - (t - 0.75) / 0.25); }
      x += (r() - 0.5) * 4;
      y += (r() - 0.5) * 4;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.globalAlpha = veil;
    g.fillStyle = paperColor;
    g.fill();
    g.globalAlpha = veil * 0.5;
    g.strokeStyle = lineColor;
    g.lineWidth = 1.5;
    g.stroke();
    g.globalAlpha = 1;
  }

  const d = SOURCE_SIZE * 0.78;
  const o = (SOURCE_SIZE - d) / 2;
  g.drawImage(letter, o, o, d, d);
  return c;
}

/** Un triangolo di tessuto, deformato dalla sua mappa affine. */
function tri(
  g: CanvasRenderingContext2D,
  tex: CanvasImageSource,
  s: Triple,
  d: Triple,
): void {
  const m = affineMap(s, d);
  if (!m) return;
  g.save();
  // Il triangolo si allarga di mezzo pixel dal suo centro: senza, fra una
  // faccia e l'altra resta una cucitura chiara di antialiasing.
  const cx = (d[0].x + d[1].x + d[2].x) / 3;
  const cy = (d[0].y + d[1].y + d[2].y) / 3;
  const outset = (p: PaperPoint): PaperPoint => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const l = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / l) * 0.7, y: p.y + (dy / l) * 0.7 };
  };
  const e = [outset(d[0]), outset(d[1]), outset(d[2])];
  g.beginPath();
  g.moveTo(e[0].x, e[0].y);
  g.lineTo(e[1].x, e[1].y);
  g.lineTo(e[2].x, e[2].y);
  g.closePath();
  g.clip();
  g.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  g.drawImage(tex, 0, 0);
  g.restore();
}

/** `g` e' gia' scalato in pixel CSS e grande `size` x `size`. */
export function crumple(
  g: CanvasRenderingContext2D,
  tex: HTMLCanvasElement,
  mesh: readonly Vertex[],
  t: number,
  size: number,
  side: number,
): void {
  g.clearRect(0, 0, size, size);
  const center = { x: size / 2, y: size / 2 };

  if (t < 0.012) {
    g.drawImage(tex, center.x - side / 2, center.y - side / 2, side, side);
    return;
  }

  const points = positions(mesh, t, center, side);
  const cells = cellsByDepth(points);
  const S = tex.width;
  const s = (a: number, b: number): PaperPoint => ({ x: (a / GRID_SIDE) * S, y: (b / GRID_SIDE) * S });
  const d = (a: number, b: number) => points[b * (GRID_SIDE + 1) + a];

  for (const { i, j } of cells) {
    tri(g, tex, [s(i, j), s(i + 1, j), s(i + 1, j + 1)], [d(i, j), d(i + 1, j), d(i + 1, j + 1)]);
    tri(g, tex, [s(i, j), s(i + 1, j + 1), s(i, j + 1)], [d(i, j), d(i + 1, j + 1), d(i, j + 1)]);
  }

  // L'ombra, faccia per faccia e nello stesso ordine. La luce viene da
  // sinistra in alto; in piu' il bordo della pallina si scurisce, ed e' quello
  // che le da' volume.
  for (const { i, j } of cells) {
    const a = d(i, j);
    const b = d(i + 1, j);
    const q = d(i + 1, j + 1);
    const e = d(i, j + 1);
    const slope = (b.z - a.z) * -0.8 + (e.z - a.z) * -0.8;
    const mx = (a.x + b.x + q.x + e.x) / 4 - center.x;
    const my = (a.y + b.y + q.y + e.y) / 4 - center.y;
    const edge = Math.min(1, Math.hypot(mx, my) / (side * RADIUS * 1.05));
    const f = (Math.max(-1, Math.min(1, slope * 2.6)) - edge * edge * 0.55) * t;
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.lineTo(q.x, q.y);
    g.lineTo(e.x, e.y);
    g.closePath();
    g.fillStyle =
      f > 0
        ? `rgba(255,255,255,${Math.min(0.5, f * 0.5).toFixed(3)})`
        : `rgba(20,18,15,${Math.min(0.55, -f * 0.5).toFixed(3)})`;
    g.fill();
  }
}

export { SHADE_STEPS };
