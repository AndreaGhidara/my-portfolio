/**
 * La geometria dell'accartocciamento. Tutto puro: niente DOM, niente canvas.
 *
 * Sta separato dal disegno per la ragione imparata sul gesto della freccia —
 * quello che finisce dentro un ciclo di disegno nessun test lo vede piu', e in
 * questo modulo c'e' esattamente il genere di codice in cui un segno sbagliato
 * non si nota guardando: la prima stesura della mappa affine ne aveva due, e
 * disegnava le lettere specchiate.
 */

export type Punto = { x: number; y: number };

/** Una terna di vertici. */
export type Terna = readonly [Punto, Punto, Punto];

/** I sei numeri di `CanvasRenderingContext2D.transform`. */
export type Affine = readonly [number, number, number, number, number, number];

/**
 * La trasformazione affine che porta il triangolo `s` sul triangolo `d`.
 *
 * Derivata come DUE sistemi 3x3 — uno per la x, uno per la y — e non copiata
 * da una formula compatta. La versione compatta e' facile da sbagliare e
 * difficile da leggere: quella che avevo scritto per prima aveva due segni
 * invertiti, sull'identita' restituiva (1,0,0,-1,0,0) e disegnava tutto
 * capovolto. Con l'identita' questa restituisce (1,0,0,1,0,0), ed e' il modo
 * di accorgersene in un secondo — c'e' una prova che lo verifica.
 *
 * `null` quando il triangolo sorgente e' degenere: non c'e' niente da mappare.
 */
export function mappaAffine(s: Terna, d: Terna): Affine | null {
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
export const LATO = 12;

/**
 * Il raggio della pallina, in frazione del lato del foglio. Da qui esce un
 * diametro attorno al 40% del foglio, ed e' il numero che decide se la
 * pallina si legge come pallina: a 0,46 — la prima stesura — il foglio
 * restava un quadrato rimpicciolito.
 */
export const RAGGIO = 0.205;

/** Quanto il foglio si attorciglia mentre collassa, in radianti. */
const TORSIONE = 2.6;

/** Lo stesso generatore del resto del sito: seme fisso, pieghe identiche a
 *  ogni caricamento e diverse da lettera a lettera. */
export function rng(seme: number): () => number {
  let s = seme >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function lisci(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
}

/**
 * Un campo di rumore liscio su una griglia grossolana, interpolato.
 * La grana grossa e' voluta: e' quella che tiene insieme le facce, cosi' la
 * carta si piega a pezzi invece di sbriciolarsi.
 */
export function campo(r: () => number, n: number): (u: number, w: number) => number {
  const g: number[] = [];
  for (let i = 0; i < (n + 1) * (n + 1); i++) g.push(r());
  return (u, w) => {
    const x = u * n;
    const y = w * n;
    const a = Math.min(n - 1, Math.floor(x));
    const b = Math.min(n - 1, Math.floor(y));
    const fx = lisci(x - a);
    const fy = lisci(y - b);
    const p = g[b * (n + 1) + a];
    const q = g[b * (n + 1) + a + 1];
    const s = g[(b + 1) * (n + 1) + a];
    const t = g[(b + 1) * (n + 1) + a + 1];
    return p + (q - p) * fx + (s - p) * fy + (p - q - s + t) * fx * fy;
  };
}

export type Vertice = {
  /** Dove sta il vertice sul foglio disteso, in 0..1. */
  u: number;
  w: number;
  /** Dove finisce nella pallina, in frazione del lato e con l'origine al centro. */
  bx: number;
  by: number;
  /** Profondita' finta: decide chi sta sopra e quanta luce prende. */
  z: number;
  /** La carta non cede tutta insieme. */
  ritardo: number;
};

/**
 * La maglia di una lettera.
 *
 * Il punto e' il raggio d'arrivo: lo decide un campo di rumore INDIPENDENTE da
 * dove il vertice parte. La prima stesura mappava il quadrato su un disco, e
 * cosi' chi partiva dal bordo finiva sul bordo: l'ordine si conservava e
 * restava leggibile che fosse un foglio quadrato rimpicciolito. Scorrelando i
 * due raggi il bordo finisce DENTRO, il foglio si ripiega su se stesso, e la
 * pallina smette di essere leggibile — che e' tutto il punto. Una prova misura
 * quella scorrelazione, perche' e' la proprieta' e non un dettaglio.
 */
export function maglia(seme: number): Vertice[] {
  const r = rng(seme);
  const cZ = campo(r, 3);
  const cR = campo(r, 3);
  const cA = campo(r, 4);
  const v: Vertice[] = [];
  for (let j = 0; j <= LATO; j++) {
    for (let i = 0; i <= LATO; i++) {
      const u = i / LATO;
      const w = j / LATO;
      const ang = Math.atan2(w - 0.5, u - 0.5) + (cA(u, w) - 0.5) * TORSIONE;
      const rr = 0.18 + 0.82 * cR(u, w);
      v.push({
        u,
        w,
        bx: Math.cos(ang) * RAGGIO * rr,
        by: Math.sin(ang) * RAGGIO * rr,
        z: cZ(u, w),
        ritardo: r() * 0.4,
      });
    }
  }
  return v;
}

export type Posato = Punto & { z: number };

/** Dove sta ogni vertice a un dato grado di accartocciamento. */
export function posizioni(
  mesh: readonly Vertice[],
  t: number,
  centro: Punto,
  lato: number,
): Posato[] {
  return mesh.map((v) => {
    const tt = lisci(Math.max(0, (t - v.ritardo) / (1 - v.ritardo)));
    const px = v.u - 0.5;
    const py = v.w - 0.5;
    return {
      x: centro.x + (px + (v.bx - px) * tt) * lato,
      y: centro.y + (py + (v.by - py) * tt) * lato,
      z: v.z,
    };
  });
}

export type Cella = { i: number; j: number; z: number };

/**
 * Le celle dalla piu' lontana alla piu' vicina.
 *
 * Senza questo ordine le facce si coprono nell'ordine della griglia e il
 * risultato e' un collage piatto: e' l'ordinamento in profondita' — piu'
 * dell'ombra — a far leggere una pallina invece di un'immagine schiacciata.
 */
export function celleInProfondita(punti: readonly Posato[]): Cella[] {
  const celle: Cella[] = [];
  const a = (i: number, j: number) => punti[j * (LATO + 1) + i].z;
  for (let j = 0; j < LATO; j++) {
    for (let i = 0; i < LATO; i++) {
      celle.push({ i, j, z: (a(i, j) + a(i + 1, j) + a(i + 1, j + 1) + a(i, j + 1)) / 4 });
    }
  }
  return celle.sort((p, q) => p.z - q.z);
}

/** Quanti gradini di opacita' del foglio si tengono in cache. */
export const GRADINI = 5;

/**
 * Quanto si vede il foglio a un dato grado di piega, come indice di gradino.
 *
 * Zero fin quasi a un terzo: passando col cursore si increspa SOLO
 * l'inchiostro, e la carta compare mentre si appallottola — perche' e'
 * piegandosi che prende luce. Disegnata subito era un quadrato del colore
 * della pagina, e se ne vedeva solo il bordo piegarsi: era il difetto.
 */
export function veloPer(t: number): number {
  return Math.round(lisci(Math.max(0, (t - 0.3) / 0.35)) * (GRADINI - 1));
}
