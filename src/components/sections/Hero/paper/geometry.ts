// Puro, senza canvas: dentro un ciclo di disegno nessun test lo vedrebbe, e qui un
// segno sbagliato non si nota guardando (la prima mappa affine specchiava le lettere).

export type PaperPoint = { x: number; y: number };

export type Triple = readonly [PaperPoint, PaperPoint, PaperPoint];

/** I sei numeri di `CanvasRenderingContext2D.transform`. */
export type Affine = readonly [number, number, number, number, number, number];

// Due sistemi 3x3 e non una formula compatta, che aveva due segni invertiti:
// sull'identita' deve restituire (1,0,0,1,0,0), e una prova lo verifica. `null` se
// il triangolo sorgente e' degenere.
export function affineMap(s: Triple, d: Triple): Affine | null {
  const [{ x: x0, y: y0 }, { x: x1, y: y1 }, { x: x2, y: y2 }] = s;
  const [{ x: u0, y: v0 }, { x: u1, y: v1 }, { x: u2, y: v2 }] = d;
  const D = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
  if (D === 0) return null;
  return [
    (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / D,
    (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / D,
    (x0 * (u1 - u2) + x1 * (u2 - u0) + x2 * (u0 - u1)) / D,
    (x0 * (v1 - v2) + x1 * (v2 - v0) + x2 * (v0 - v1)) / D,
    (x0 * (y1 * u2 - y2 * u1) + x1 * (y2 * u0 - y0 * u2) + x2 * (y0 * u1 - y1 * u0)) / D,
    (x0 * (y1 * v2 - y2 * v1) + x1 * (y2 * v0 - y0 * v2) + x2 * (y0 * v1 - y1 * v0)) / D,
  ];
}

/** Celle per lato della maglia. Dodici: sotto si vedono le facce, sopra si paga. */
export const GRID_SIDE = 12;

/** In frazione del lato del foglio. A 0,46 il foglio restava un quadrato rimpicciolito. */
export const RADIUS = 0.205;

/** Quanto il foglio si attorciglia mentre collassa, in radianti. */
const TWIST = 2.6;

/** Lo stesso generatore del resto del sito: seme fisso, pieghe identiche a
 *  ogni caricamento e diverse da lettera a lettera. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function smooth(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}

// La grana grossa e' voluta: tiene insieme le facce, e la carta si piega a pezzi
// invece di sbriciolarsi.
export function noiseField(r: () => number, n: number): (u: number, w: number) => number {
  const g: number[] = [];
  for (let i = 0; i < (n + 1) * (n + 1); i++) g.push(r());
  return (u, w) => {
    const x = u * n;
    const y = w * n;
    const a = Math.min(n - 1, Math.floor(x));
    const b = Math.min(n - 1, Math.floor(y));
    const fx = smooth(x - a);
    const fy = smooth(y - b);
    const p = g[b * (n + 1) + a];
    const q = g[b * (n + 1) + a + 1];
    const s = g[(b + 1) * (n + 1) + a];
    const t = g[(b + 1) * (n + 1) + a + 1];
    return p + (q - p) * fx + (s - p) * fy + (p - q - s + t) * fx * fy;
  };
}

export type Vertex = {
  /** Dove sta il vertice sul foglio disteso, in 0..1. */
  u: number;
  w: number;
  /** Dove finisce nella pallina, in frazione del lato e con l'origine al centro. */
  bx: number;
  by: number;
  /** Profondita' finta: decide chi sta sopra e quanta luce prende. */
  z: number;
  /** La carta non cede tutta insieme. */
  delay: number;
};

// Il raggio d'arrivo lo decide un campo di rumore indipendente da dove il vertice
// parte: il bordo finisce dentro e il foglio si ripiega su se stesso. Mappato su
// un disco, l'ordine si conservava e si leggeva il quadrato rimpicciolito.
export function buildMesh(seed: number): Vertex[] {
  const r = rng(seed);
  const cZ = noiseField(r, 3);
  const cR = noiseField(r, 3);
  const cA = noiseField(r, 4);
  const v: Vertex[] = [];
  for (let j = 0; j <= GRID_SIDE; j++) {
    for (let i = 0; i <= GRID_SIDE; i++) {
      const u = i / GRID_SIDE;
      const w = j / GRID_SIDE;
      const ang = Math.atan2(w - 0.5, u - 0.5) + (cA(u, w) - 0.5) * TWIST;
      const rr = 0.18 + 0.82 * cR(u, w);
      v.push({
        u,
        w,
        bx: Math.cos(ang) * RADIUS * rr,
        by: Math.sin(ang) * RADIUS * rr,
        z: cZ(u, w),
        delay: r() * 0.4,
      });
    }
  }
  return v;
}

export type Placed = PaperPoint & { z: number };

export function positions(
  mesh: readonly Vertex[],
  t: number,
  center: PaperPoint,
  side: number,
): Placed[] {
  return mesh.map((v) => {
    const tt = smooth(Math.max(0, (t - v.delay) / (1 - v.delay)));
    const px = v.u - 0.5;
    const py = v.w - 0.5;
    return {
      x: center.x + (px + (v.bx - px) * tt) * side,
      y: center.y + (py + (v.by - py) * tt) * side,
      z: v.z,
    };
  });
}

export type Cell = { i: number; j: number; z: number };

// Dalla piu' lontana alla piu' vicina: e' l'ordine in profondita', piu' dell'ombra,
// a far leggere una pallina invece di un collage piatto.
export function cellsByDepth(points: readonly Placed[]): Cell[] {
  const cells: Cell[] = [];
  const a = (i: number, j: number) => points[j * (GRID_SIDE + 1) + i].z;
  for (let j = 0; j < GRID_SIDE; j++) {
    for (let i = 0; i < GRID_SIDE; i++) {
      cells.push({ i, j, z: (a(i, j) + a(i + 1, j) + a(i + 1, j + 1) + a(i, j + 1)) / 4 });
    }
  }
  return cells.sort((p, q) => p.z - q.z);
}

/** Quanti gradini di opacita' del foglio si tengono in cache. */
export const SHADE_STEPS = 5;

// Zero fin quasi a un terzo: passando col cursore si increspa solo l'inchiostro.
// Disegnata subito, la carta era un quadrato del colore della pagina col bordo che si piegava.
export function veilFor(t: number): number {
  return Math.round(smooth(Math.max(0, (t - 0.3) / 0.35)) * (SHADE_STEPS - 1));
}
