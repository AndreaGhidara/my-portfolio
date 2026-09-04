/**
 * TUTTI i numeri che decidono il gesto, in un posto solo. Nel prototipo erano
 * sparsi in otto punti del file, e ogni taratura voleva una pubblicazione.
 *
 * Sono stati trovati col calibratore il 5 settembre 2026 — guardando, non a
 * tavolino — e andranno ritrovati sul vero impaginato: e' per quello che il
 * calibratore entra nell'app (Task 7). Vedi §4.6 della spec.
 */
export type Param = {
  /** Il giro della penna a meta' discesa. Provato e scartato: resta spento. */
  cappio: { acceso: boolean; dove: number; raggio: number; tratti: boolean[] };
  /** Quanto la freccia insegue lo scorrimento, per fotogramma. */
  inerziaPos: number;
  /** Quanto insegue la direzione. Piu' lenta della posizione: un oggetto vero
   *  gira DOPO che la strada ha girato. */
  inerziaDir: number;
  /** Tetto alla rotazione per fotogramma. Impedisce le frustate. */
  gradiMax: number;
  /** Entro quale distanza da un disegno lo INDICA invece di seguire la strada. */
  raggioMira: number;
  /** Quanto e' larga la virata attorno a un disegno, in frazione del tratto. */
  virata: number;
  /** Lunghezza dell'asta a riposo, e quanto si allunga arrivando. */
  lungBase: number;
  lungPunta: number;
  /** Quanto aspetta prima di partire: il filo comincia a colorarsi da solo. */
  ritardo: number;
  /** Le correzioni a mano ai punti della strada, per nome del punto.
   *  Frazioni della larghezza, non pixel; scostamenti, non posizioni. */
  scostamenti: Record<string, readonly [number, number]>;
};

export const PARAM: Param = {
  cappio: { acceso: false, dove: 0.31, raggio: 0.07, tratti: [true, true, true] },
  inerziaPos: 0.14,
  inerziaDir: 0.055,
  gradiMax: 6.5,
  raggioMira: 0.38,
  virata: 0.54,
  lungBase: 0.85,
  lungPunta: 1.3,
  ritardo: 0.07,
  scostamenti: {
    disegno1: [-0.2872, -0.1367],
    mezzo1: [-0.5859, -0.049],
    disegno2: [0.0484, -0.1904],
    mezzo2: [-0.0787, -0.0563],
    disegno3: [-0.1104, 0.0186],
    "coda.giu": [-0.3072, 0.2857],
    "coda.apre": [0.7202, 0.1631],
    "coda.colmo": [0.0823, -0.2197],
    "coda.rientra": [0.0359, -0.2516],
  },
};

/** Sotto questa larghezza i blocchi si impilano e gli scostamenti — trovati con
 *  testo e disegno affiancati — non correggono niente: spostano soltanto. */
export const LARGO = "(min-width: 900px)";
