/** L'aritmetica del percorso, senza DOM, perche' si possa provare in un test.
 *  I numeri sono tarati nel prototipo del percorso orizzontale: cambiarli qui
 *  senza ripassare da li' e' ritarare a occhio chiuso. */

/** In pixel del binario. */
export type TrackPoint = readonly [number, number];

/** Gradi e rem. */
export type Pose = { rotation: number; offset: number };

export const TRACK_PARAMS = {
  /** Px di scroll per px di strada: il pollice spinge piu' di una rotella. Vive
   *  nel CSS, che calcola l'altezza del track; qui perche' il numero sia uno. */
  speed: { fine: 1.2, coarse: 1.8 },
  /** Altezze di palco a fila ferma: il filo si completa, l'arrivo si accende e cade. */
  tail: 1.4,
  /** Il minore fra i rem e i vw. */
  sheet: { rem: 26, vw: 82 },
  air: 12,
  /** Il minore fra i rem e i vw. */
  arrival: { rem: 18, vw: 70 },
  amplitude: 3.5,
  waves: 1,
  /** Frazione di schermo che il filo pieno lascia tratteggiata prima del foglio
   *  dei numeri: e' il tratto che la coda riempie prima che il foglio si accenda. */
  gap: 0.18,
  /** Frazione di schermo dal centro entro cui una tappa e' arrivata. */
  arrivalThreshold: 0.25,
  /** In frazione della coda: filo pieno, foglio acceso, inizio della caduta. */
  timings: { filled: 0.4, lit: 0.65, falls: 0.75 },
} as const;

/** Rotazioni tutte diverse: con la stessa inclinazione i fogli si leggono come
 *  una griglia storta, non come fogli appoggiati uno per uno. */
export const POSES: readonly Pose[] = [
  { rotation: -1.1, offset: -1.5 },
  { rotation: 0.7, offset: 1.75 },
  { rotation: -0.4, offset: -0.5 },
  { rotation: 1.3, offset: 1.25 },
];

/** Misurata in Chrome, non scelta: il caso peggiore e' 360px di larghezza in
 *  italiano (593px), arrotondato per un carattere di ripiego piu' largo. Si
 *  confronta con il palco vero, 100svh: `min-height` sul telefono segue il
 *  viewport a barre nascoste. Un iPhone SE (circa 548px) resta in colonna. */
export const MIN_HEIGHT = 600;

export const ARRIVAL_POSE: Pose = { rotation: -0.8, offset: 0 };

/** In ciclo: una quinta tappa riprende dalla prima. */
export function poseAt(i: number): Pose {
  return POSES[i % POSES.length];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Una gobba sola nel tratto d'ingresso, che e' mezzo tratto. La prima maniglia
 *  di ogni gobba continua la pendenza della precedente: i tratti non sono lunghi
 *  uguali, e senza l'onda fa uno spigolo. */
export function wavePath(points: readonly TrackPoint[], amplitude: number, waves: number): string {
  let d = `M${points[0][0]},${points[0][1]}`;
  let sign = -1;
  let slope: number | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const n = i === 0 ? 1 : waves;
    for (let k = 0; k < n; k++) {
      const xa = ax + ((bx - ax) * k) / n;
      const ya = ay + ((by - ay) * k) / n;
      const xb = ax + ((bx - ax) * (k + 1)) / n;
      const yb = ay + ((by - ay) * (k + 1)) / n;
      const w = xb - xa;
      const c1y =
        slope === null ? ya + (yb - ya) / 3 + sign * amplitude : ya + (slope * w) / 3;
      const c2y = ya + (2 * (yb - ya)) / 3 + sign * amplitude;
      d += ` C${xa + w / 3},${c1y} ${xa + (2 * w) / 3},${c2y} ${xb},${yb}`;
      // Un tratto largo zero (fogli ancora in colonna) non ha pendenza: dividere
      // darebbe Infinity o NaN, che il browser rifiuta. Si tiene quella di prima.
      if (w !== 0) slope = (yb - c2y) / (w / 3);
      sign = -sign;
    }
  }
  return d;
}

/** Dall'altezza del track, che il CSS ha gia' calcolato con la velocita': la
 *  velocita' vive in un posto solo. Mai window.innerHeight, che sul telefono
 *  cambia con la barra del browser. */
export function travel({
  track,
  stage,
  tail,
}: {
  track: number;
  stage: number;
  tail: number;
}): number {
  return Math.max(0, track - stage * (1 + tail));
}

/** `p` il viaggio, `q` la coda a fila ferma; il resto si ricava da `q`. Si
 *  chiama a ogni fotogramma: solo conti. */
export function phases({
  done,
  travel: travelPx,
  tail,
  height,
}: {
  done: number;
  travel: number;
  tail: number;
  height: number;
}) {
  const { filled, lit, falls } = TRACK_PARAMS.timings;
  const tailPx = tail * height;
  // Un viaggio o una coda nulli sono gia' compiuti: senza, 0/0 da' NaN e il
  // NaN finisce dritto in una custom property.
  const p = travelPx > 0 ? clamp01(done / travelPx) : 1;
  const q = tailPx > 0 ? clamp01((done - travelPx) / tailPx) : 1;
  const light = clamp01((q - filled) / (lit - filled));
  return {
    p,
    q,
    filled01: clamp01(q / filled),
    light,
    fall: clamp01((q - falls) / (1 - falls)),
    jolt: Math.sin(Math.PI * light),
  };
}

/** Durante il viaggio segue il centro dello schermo, ma si ferma un varco prima
 *  del foglio dei numeri; a varco pieno salta a `arrivalEnd`, e il salto non si
 *  vede perche' l'onda passa dietro il foglio. */
export function filledLine({
  x,
  width,
  arrivalEdge,
  arrivalEnd,
  q,
}: {
  x: number;
  width: number;
  arrivalEdge: number;
  arrivalEnd: number;
  q: number;
}): number {
  const filled01 = clamp01(q / TRACK_PARAMS.timings.filled);
  if (filled01 >= 1) return Math.max(0, arrivalEnd);
  const centre = x + width / 2;
  const gap = width * TRACK_PARAMS.gap;
  return Math.max(0, Math.min(centre, arrivalEdge - gap) + filled01 * gap);
}

export function arrived({
  stopCentre,
  x,
  width,
}: {
  stopCentre: number;
  x: number;
  width: number;
}): boolean {
  return stopCentre < x + width / 2 + width * TRACK_PARAMS.arrivalThreshold;
}

/** I due margini sono mezzo schermo meno mezzo oggetto, e lo schermo sparisce:
 *  per questo la stessa formula si scrive in CSS per l'altezza del track. */
export function trackRoute({
  n,
  sheet,
  air,
  arrival,
}: {
  n: number;
  sheet: number;
  air: number;
  arrival: number;
}): number {
  return (n - 0.5) * sheet + n * air + arrival / 2;
}
