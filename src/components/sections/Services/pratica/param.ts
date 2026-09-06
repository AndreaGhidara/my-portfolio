/**
 * I numeri che il calibratore gira, in un posto solo. Nel prototipo erano
 * sparsi in otto punti del file, e ogni taratura voleva una pubblicazione.
 *
 * NON sono tutti i numeri del gesto, e il commento che lo diceva era falso:
 * una decina stanno inline in `freccia.ts` — i 70px sotto i quali smette di
 * mirare un disegno, il 190/120 e lo 0.24 dei fondi delle gaussiane, lo 0.42
 * che accende una voce, le finestre 0.3/0.72/0.28 della coda, il +3 con cui
 * legge la tangente. Restano li' apposta: nel prototipo erano inline anche
 * loro e la taratura e' riuscita con queste manopole sole, e dieci cursori in
 * piu' renderebbero il pannello piu' difficile da usare, non piu' utile. Il
 * confine e' questo: qui i numeri che si trovano guardando, li' quelli che
 * descrivono COME il gesto e' fatto.
 *
 * Questi sono stati trovati col calibratore il 5 settembre 2026 — guardando,
 * non a tavolino — ma su un impaginato che non e' quello del sito, e vanno
 * ancora ritrovati su quello vero. Il calibratore adesso e' in pagina:
 * `Calibratore.tsx`, in sviluppo, aprendo l'indirizzo con `?calibra`. Vedi
 * §4.6 della spec.
 *
 * QUI NON C'E' PIU' IL CAPPIO, ed e' una cancellazione e non una svista. Il
 * giro di penna a meta' discesa e' stato provato, guardato e scartato in
 * brainstorming (spec §7.4): non aveva senso nel flusso. Il campo c'era ancora,
 * spento — `cappio: { acceso: false, ... }` — ma il codice che lo onorava non
 * e' stato portato dal prototipo: ne' `strada()` ne' `freccia.ts` lo leggevano.
 * Non era un interruttore su off, era un interruttore staccato: quattro manopole
 * del calibratore non facevano niente e il riquadro da incollare le riportava
 * nell'oggetto. Il giorno in cui il cappio dovesse tornare, torna con la
 * geometria che lo disegna — che e' la cosa che manca — e il parametro dopo.
 */
export type Param = {
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
  inerziaPos: 0.14,
  inerziaDir: 0.055,
  gradiMax: 6.5,
  raggioMira: 0.38,
  virata: 0.54,
  lungBase: 0.85,
  lungPunta: 1.3,
  ritardo: 0.07,
  scostamenti: {
    disegno0: [0.0172, -0.03],
    mezzo0: [0.0115, 0.0264],
    disegno1: [-0.2872, -0.1367],
    mezzo1: [-0.5859, -0.049],
    disegno2: [0.0877, -0.2679],
    mezzo2: [0.4637, -0.1236],
    disegno3: [-0.2309, -0.2523],
    "coda.giu": [-0.3198, -0.2641],
    "coda.apre": [0.1343, -0.2378],
    "coda.colmo": [-0.2198, -0.1641],
    "coda.rientra": [0.3309, -0.4227],
    "coda.scende": [0.2841, -0.292],
    "coda.punta": [-0.2483, -0.0241],
    /**
     * Solo in verticale, e non e' una svista che manchi la x.
     *
     * La x dell'uscita e' l'ANCORA con cui la scena consegna il filo ai
     * Lavori: si conta sulla pagina e deve combaciare, quindi non si corregge
     * a mano — la calibrazione infatti l'ha riportata a 0,0002, cioe' due
     * decimi di pixel, che e' il tremolio del trascinamento. Tolta.
     *
     * In verticale invece non c'e' nessuna ancora: sopra e sotto la scena
     * finisce dove finisce la sua scatola, e far uscire la freccia una
     * cinquantina di pixel piu' in basso e' una scelta di gusto come tutte le
     * altre di questa tabella.
     */
    "coda.fine": [0, 0.0494],
  },
};

/** Sotto questa larghezza i blocchi si impilano e gli scostamenti — trovati con
 *  testo e disegno affiancati — non correggono niente: spostano soltanto. */
export const LARGO = "(min-width: 900px)";
