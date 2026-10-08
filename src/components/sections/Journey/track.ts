/**
 * L'aritmetica del percorso orizzontale, senza DOM. Il componente misura (le
 * altezze dal palco, i centri dei fogli dal binario) e passa i numeri qui: cosi'
 * la parte che si sbaglia si prova in un test, e il componente resta un filo
 * che porta misure dentro e custom property fuori.
 *
 * I numeri sono quelli tarati nel prototipo
 * (docs/prototipi/2026-09-27-journey-in-orizzontale.html): cambiarli qui senza
 * ripassare da li' e' ritarare a occhio chiuso.
 */

/** Un punto del tracciato, in pixel del binario: [x, y]. */
export type TrackPoint = readonly [number, number];

/** Inclinazione in gradi e scostamento verticale in rem di un foglio. */
export type Pose = { rotation: number; offset: number };

export const TRACK_PARAMS = {
  /**
   * Px di scroll per ogni px di strada orizzontale. Sul puntatore grossolano
   * serve piu' corsa: la spinta del pollice porta via molto di piu' di una
   * rotella, e la fila correrebbe via. Il componente non la legge: vive nel
   * CSS, che calcola l'altezza del track; qui sta perche' il numero sia uno.
   */
  speed: { fine: 1.2, coarse: 1.8 },
  /** Altezze di palco a fila ferma: il filo si completa, l'arrivo si accende e cade. */
  tail: 1.4,
  /** Larghezza di una tappa: il minore fra i rem e i vw. */
  sheet: { rem: 26, vw: 82 },
  /** Rem di aria fra una tappa e l'altra (e fra l'ultima e l'arrivo). */
  air: 12,
  /** Larghezza del foglio dei numeri: il minore fra i rem e i vw. */
  arrival: { rem: 18, vw: 70 },
  /** Rem di cui l'onda sale e scende fra due punti. */
  amplitude: 3.5,
  /** Gobbe fra il centro di un foglio e il successivo. */
  waves: 1,
  /**
   * Frazione della larghezza dello schermo che il filo pieno lascia tratteggiata
   * prima del foglio dei numeri durante il viaggio: e' il tratto che la coda
   * riempie, e senza il foglio si accenderebbe senza che il filo ci arrivi.
   */
  gap: 0.18,
  /** Una tappa e' arrivata quando il suo centro e' entro questa frazione di schermo dal centro. */
  arrivalThreshold: 0.25,
  /** I tempi della coda, in frazione della coda: filo pieno, foglio acceso, inizio della caduta. */
  timings: { filled: 0.4, lit: 0.65, falls: 0.75 },
} as const;

/**
 * Le pose delle tappe, nell'ordine in cui passano. Rotazioni tutte diverse:
 * quattro fogli con la stessa inclinazione si leggono come una griglia storta,
 * non come fogli appoggiati uno per uno.
 */
export const POSES: readonly Pose[] = [
  { rotation: -1.1, offset: -1.5 },
  { rotation: 0.7, offset: 1.75 },
  { rotation: -0.4, offset: -0.5 },
  { rotation: 1.3, offset: 1.25 },
];

/**
 * L'altezza minima del palco, in px, sotto la quale la scena resta in colonna.
 * Un foglio tagliato in altezza non si legge, e in orizzontale non c'e' modo di
 * scorrerlo: meglio la colonna, che si legge sempre.
 *
 * Misurata, non scelta, in Chrome con le regole del telefono di sezioni/percorso.css
 * (tappe in attesa ferme, corpo piccolo nascosto) e quelle compatte dei
 * telefoni bassi. Per ogni foglio si prende il rettangolo vero, tesserino,
 * scostamento e inclinazione compresi, e la sua distanza dal centro della
 * fila: la fila e' centrata, quindi le chiede il doppio della piu' grande.
 * Il caso peggiore e' 360px di larghezza (foglio 82vw = 295px), in italiano:
 *   68  sopra: la barra alta del sito (60) e il respiro
 *   91  la testata: accanto all'anno grande il titolo, alla misura di tutti
 *       i titoli di sezione (30,4px), va su due righe
 *  338  la fila: 2 x 169, il 2023 che col tesserino sale piu' di tutti
 *   96  sotto: la barra bassa del sito (52) e il posto del suggerimento
 * = 593. A 390px ne servono 586 in italiano e 574 in inglese, dove adesso
 * anche «Where I learned» va su due righe. Arrotondato a 600 per un
 * carattere di ripiego piu' largo.
 *
 * Si confronta con l'altezza vera del palco, 100svh, e non con una media
 * query: `min-height` sul telefono segue il viewport grande, quello a barre
 * nascoste. Un iPhone SE ha un palco di circa 548px e resta in colonna.
 */
export const MIN_HEIGHT = 600;

/** Il foglio dei numeri sta sulla riga: e' li' che l'onda finisce. */
export const ARRIVAL_POSE: Pose = { rotation: -0.8, offset: 0 };

/** La posa della tappa `i`, in ciclo: una quinta tappa riprende dalla prima. */
export function poseAt(i: number): Pose {
  return POSES[i % POSES.length];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Il tracciato SVG dell'onda che passa per `punti`. Fra due punti `onde` gobbe
 * (una sola nel tratto d'ingresso, dal bordo al primo foglio: e' mezzo tratto,
 * e piu' gobbe li' si schiaccerebbero), con il verso che si alterna di gobba in
 * gobba lungo tutta la riga.
 *
 * La prima maniglia di ogni gobba continua la pendenza con cui e' uscita la
 * precedente. Con le maniglie a un terzo e due terzi basterebbe se i tratti
 * fossero tutti lunghi uguali; non lo sono (l'ingresso, l'arrivo piu' stretto),
 * e senza questa continuita' l'onda fa uno spigolo proprio li'.
 */
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
      // Un tratto largo zero (fogli ancora in colonna, tutti allo stesso x) non
      // ha una pendenza: dividere darebbe Infinity o NaN, che il browser
      // rifiuta. Si tiene quella di prima, e il tratto degenere resta un punto.
      if (w !== 0) slope = (yb - c2y) / (w / 3);
      sign = -sign;
    }
  }
  return d;
}

/**
 * Lo scroll del viaggio, cioe' la parte della corsa in cui la fila si muove.
 * Si ricava dall'altezza del track (che il CSS ha gia' calcolato con la
 * velocita') togliendo il palco e la coda: la velocita' vive in un posto solo,
 * e track e palco si misurano sullo stesso elemento, mai su window.innerHeight,
 * che sul telefono cambia con la barra del browser.
 */
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

/**
 * A che punto e' la scena, dato lo scroll `fatta` dentro il track. Due tempi:
 * `p` il viaggio (la fila scorre), `q` la coda (fila ferma, `altezza` e' il
 * palco). Il resto si ricava da `q`: `pieno01` il varco che si riempie, `luce`
 * il foglio che si accende, `caduta` il foglio che si scolla, `sussulto` il
 * piccolo salto mentre si accende. Si chiama a ogni fotogramma: solo conti.
 */
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

/**
 * Fin dove arriva il filo pieno, in pixel del binario. Durante il viaggio segue
 * il centro dello schermo (dove si ferma ogni tappa quando e' la sua volta), ma
 * si ferma un varco prima del bordo del foglio dei numeri; nella coda il varco
 * si riempie, e a varco pieno la linea entra nel foglio fino a `fineArrivo`.
 * Il salto dal bordo a `fineArrivo` non si vede: l'onda passa dietro il foglio.
 */
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

/** Una tappa e' arrivata quando il suo centro e' entro la soglia dal centro dello schermo. */
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

/**
 * La strada orizzontale, in pixel: quanto il binario deve traslare perche'
 * l'arrivo finisca al centro. E' la larghezza del binario meno lo schermo, e lo
 * schermo sparisce: i due margini sono mezzo schermo meno mezzo oggetto, e
 * sommati fanno uno schermo meno mezzo foglio e mezzo arrivo. Per questo la
 * stessa formula si puo' scrivere in CSS per l'altezza del track.
 */
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
