import {
  GRADINI,
  LATO,
  RAGGIO,
  celleInProfondita,
  mappaAffine,
  posizioni,
  rng,
  type Punto,
  type Terna,
  type Vertice,
} from "./geometria";

/**
 * Il disegno su tela. Qui c'e' solo quello che senza un canvas non ha senso:
 * la geometria e la fisica stanno nei due moduli accanto, dove una prova le
 * vede. Se questo file cresce oltre il disegnare, e' il segno che dentro ci e'
 * finita della logica che andava di la'.
 */

/** Risoluzione della tela sorgente. Il foglio si ridisegna solo a gradini. */
const SORG = 256;

/** Il foglio con sopra la lettera. `velo` e' quanto si vede la carta: a zero
 *  c'e' solo l'inchiostro, ed e' cosi' finche' la piega non comincia. */
export function sorgente(
  lettera: CanvasImageSource,
  velo: number,
  carta: string,
  riga: string,
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = SORG;
  c.height = SORG;
  const g = c.getContext("2d");
  if (!g) return c;

  if (velo > 0.01) {
    // Il bordo appena mosso, come le sagome del tavolo: un rettangolo esatto
    // in mezzo a un disegno fatto a mano si vede subito.
    const m = 6;
    const r = rng(97);
    const passi = 30;
    g.beginPath();
    for (let i = 0; i <= passi; i++) {
      const t = i / passi;
      const w = SORG - 2 * m;
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
    g.globalAlpha = velo;
    g.fillStyle = carta;
    g.fill();
    g.globalAlpha = velo * 0.5;
    g.strokeStyle = riga;
    g.lineWidth = 1.5;
    g.stroke();
    g.globalAlpha = 1;
  }

  const d = SORG * 0.78;
  const o = (SORG - d) / 2;
  g.drawImage(lettera, o, o, d, d);
  return c;
}

/** Un triangolo di tessuto, deformato dalla sua mappa affine. */
function tri(
  g: CanvasRenderingContext2D,
  tex: CanvasImageSource,
  s: Terna,
  d: Terna,
): void {
  const m = mappaAffine(s, d);
  if (!m) return;
  g.save();
  // Il triangolo si allarga di mezzo pixel dal suo centro: senza, fra una
  // faccia e l'altra resta una cucitura chiara di antialiasing.
  const cx = (d[0].x + d[1].x + d[2].x) / 3;
  const cy = (d[0].y + d[1].y + d[2].y) / 3;
  const fuori = (p: Punto): Punto => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const l = Math.hypot(dx, dy) || 1;
    return { x: p.x + (dx / l) * 0.7, y: p.y + (dy / l) * 0.7 };
  };
  const e = [fuori(d[0]), fuori(d[1]), fuori(d[2])];
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

/** Disegna il foglio a un dato grado di accartocciamento dentro `g`, che si
 *  assume gia' scalato in pixel CSS e grande `misura` x `misura`. */
export function accartoccia(
  g: CanvasRenderingContext2D,
  tex: HTMLCanvasElement,
  mesh: readonly Vertice[],
  t: number,
  misura: number,
  lato: number,
): void {
  g.clearRect(0, 0, misura, misura);
  const centro = { x: misura / 2, y: misura / 2 };

  if (t < 0.012) {
    g.drawImage(tex, centro.x - lato / 2, centro.y - lato / 2, lato, lato);
    return;
  }

  const punti = posizioni(mesh, t, centro, lato);
  const celle = celleInProfondita(punti);
  const S = tex.width;
  const s = (a: number, b: number): Punto => ({ x: (a / LATO) * S, y: (b / LATO) * S });
  const d = (a: number, b: number) => punti[b * (LATO + 1) + a];

  for (const { i, j } of celle) {
    tri(g, tex, [s(i, j), s(i + 1, j), s(i + 1, j + 1)], [d(i, j), d(i + 1, j), d(i + 1, j + 1)]);
    tri(g, tex, [s(i, j), s(i + 1, j + 1), s(i, j + 1)], [d(i, j), d(i + 1, j + 1), d(i, j + 1)]);
  }

  // L'ombra, faccia per faccia e nello stesso ordine. La luce viene da
  // sinistra in alto; in piu' il bordo della pallina si scurisce, ed e' quello
  // che le da' volume.
  for (const { i, j } of celle) {
    const a = d(i, j);
    const b = d(i + 1, j);
    const q = d(i + 1, j + 1);
    const e = d(i, j + 1);
    const pend = (b.z - a.z) * -0.8 + (e.z - a.z) * -0.8;
    const mx = (a.x + b.x + q.x + e.x) / 4 - centro.x;
    const my = (a.y + b.y + q.y + e.y) / 4 - centro.y;
    const bordo = Math.min(1, Math.hypot(mx, my) / (lato * RAGGIO * 1.05));
    const f = (Math.max(-1, Math.min(1, pend * 2.6)) - bordo * bordo * 0.55) * t;
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

export { GRADINI };
