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
export type Punto = readonly [number, number];

/** Inclinazione in gradi e scostamento verticale in rem di un foglio. */
export type Posa = { rotazione: number; scostamento: number };

export const PARAMETRI = {
  /**
   * Px di scroll per ogni px di strada orizzontale. Sul puntatore grossolano
   * serve piu' corsa: la spinta del pollice porta via molto di piu' di una
   * rotella, e la fila correrebbe via. Il componente non la legge: vive nel
   * CSS, che calcola l'altezza del track; qui sta perche' il numero sia uno.
   */
  velocita: { fine: 1.2, grossolana: 1.8 },
  /** Altezze di palco a fila ferma: il filo si completa, l'arrivo si accende e cade. */
  coda: 1.4,
  /** Larghezza di una tappa: il minore fra i rem e i vw. */
  foglio: { rem: 26, vw: 82 },
  /** Rem di aria fra una tappa e l'altra (e fra l'ultima e l'arrivo). */
  aria: 12,
  /** Larghezza del foglio dei numeri: il minore fra i rem e i vw. */
  arrivo: { rem: 18, vw: 70 },
  /** Rem di cui l'onda sale e scende fra due punti. */
  ampiezza: 3.5,
  /** Gobbe fra il centro di un foglio e il successivo. */
  onde: 1,
  /**
   * Frazione della larghezza dello schermo che il filo pieno lascia tratteggiata
   * prima del foglio dei numeri durante il viaggio: e' il tratto che la coda
   * riempie, e senza il foglio si accenderebbe senza che il filo ci arrivi.
   */
  varco: 0.18,
  /** Una tappa e' arrivata quando il suo centro e' entro questa frazione di schermo dal centro. */
  sogliaArrivo: 0.25,
  /** I tempi della coda, in frazione della coda: filo pieno, foglio acceso, inizio della caduta. */
  tempi: { riempito: 0.4, acceso: 0.65, cade: 0.75 },
} as const;

/**
 * Le pose delle tappe, nell'ordine in cui passano. Rotazioni tutte diverse:
 * quattro fogli con la stessa inclinazione si leggono come una griglia storta,
 * non come fogli appoggiati uno per uno.
 */
export const POSE: readonly Posa[] = [
  { rotazione: -1.1, scostamento: -1.5 },
  { rotazione: 0.7, scostamento: 1.75 },
  { rotazione: -0.4, scostamento: -0.5 },
  { rotazione: 1.3, scostamento: 1.25 },
];

/**
 * L'altezza minima del palco, in px, sotto la quale la scena resta in colonna.
 * Un foglio tagliato in altezza non si legge, e in orizzontale non c'e' modo di
 * scorrerlo: meglio la colonna, che si legge sempre.
 *
 * Misurata, non scelta, in Chrome con le regole del telefono di tokens.css
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
export const ALTEZZA_MINIMA = 600;

/** Il foglio dei numeri sta sulla riga: e' li' che l'onda finisce. */
export const POSA_ARRIVO: Posa = { rotazione: -0.8, scostamento: 0 };

/** La posa della tappa `i`, in ciclo: una quinta tappa riprende dalla prima. */
export function posa(i: number): Posa {
  return POSE[i % POSE.length];
}

const limita = (v: number) => Math.min(1, Math.max(0, v));

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
export function tracciaOnda(punti: readonly Punto[], ampiezza: number, onde: number): string {
  let d = `M${punti[0][0]},${punti[0][1]}`;
  let verso = -1;
  let pendenza: number | null = null;
  for (let i = 0; i < punti.length - 1; i++) {
    const [ax, ay] = punti[i];
    const [bx, by] = punti[i + 1];
    const n = i === 0 ? 1 : onde;
    for (let k = 0; k < n; k++) {
      const xa = ax + ((bx - ax) * k) / n;
      const ya = ay + ((by - ay) * k) / n;
      const xb = ax + ((bx - ax) * (k + 1)) / n;
      const yb = ay + ((by - ay) * (k + 1)) / n;
      const w = xb - xa;
      const c1y =
        pendenza === null ? ya + (yb - ya) / 3 + verso * ampiezza : ya + (pendenza * w) / 3;
      const c2y = ya + (2 * (yb - ya)) / 3 + verso * ampiezza;
      d += ` C${xa + w / 3},${c1y} ${xa + (2 * w) / 3},${c2y} ${xb},${yb}`;
      // Un tratto largo zero (fogli ancora in colonna, tutti allo stesso x) non
      // ha una pendenza: dividere darebbe Infinity o NaN, che il browser
      // rifiuta. Si tiene quella di prima, e il tratto degenere resta un punto.
      if (w !== 0) pendenza = (yb - c2y) / (w / 3);
      verso = -verso;
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
export function viaggio({
  track,
  palco,
  coda,
}: {
  track: number;
  palco: number;
  coda: number;
}): number {
  return Math.max(0, track - palco * (1 + coda));
}

/**
 * A che punto e' la scena, dato lo scroll `fatta` dentro il track. Due tempi:
 * `p` il viaggio (la fila scorre), `q` la coda (fila ferma, `altezza` e' il
 * palco). Il resto si ricava da `q`: `pieno01` il varco che si riempie, `luce`
 * il foglio che si accende, `caduta` il foglio che si scolla, `sussulto` il
 * piccolo salto mentre si accende. Si chiama a ogni fotogramma: solo conti.
 */
export function fasi({
  fatta,
  viaggio,
  coda,
  altezza,
}: {
  fatta: number;
  viaggio: number;
  coda: number;
  altezza: number;
}) {
  const { riempito, acceso, cade } = PARAMETRI.tempi;
  const lunghezzaCoda = coda * altezza;
  // Un viaggio o una coda nulli sono gia' compiuti: senza, 0/0 da' NaN e il
  // NaN finisce dritto in una custom property.
  const p = viaggio > 0 ? limita(fatta / viaggio) : 1;
  const q = lunghezzaCoda > 0 ? limita((fatta - viaggio) / lunghezzaCoda) : 1;
  const luce = limita((q - riempito) / (acceso - riempito));
  return {
    p,
    q,
    pieno01: limita(q / riempito),
    luce,
    caduta: limita((q - cade) / (1 - cade)),
    sussulto: Math.sin(Math.PI * luce),
  };
}

/**
 * Fin dove arriva il filo pieno, in pixel del binario. Durante il viaggio segue
 * il centro dello schermo (dove si ferma ogni tappa quando e' la sua volta), ma
 * si ferma un varco prima del bordo del foglio dei numeri; nella coda il varco
 * si riempie, e a varco pieno la linea entra nel foglio fino a `fineArrivo`.
 * Il salto dal bordo a `fineArrivo` non si vede: l'onda passa dietro il foglio.
 */
export function lineaPiena({
  x,
  larghezza,
  bordoArrivo,
  fineArrivo,
  q,
}: {
  x: number;
  larghezza: number;
  bordoArrivo: number;
  fineArrivo: number;
  q: number;
}): number {
  const pieno01 = limita(q / PARAMETRI.tempi.riempito);
  if (pieno01 >= 1) return Math.max(0, fineArrivo);
  const centro = x + larghezza / 2;
  const varco = larghezza * PARAMETRI.varco;
  return Math.max(0, Math.min(centro, bordoArrivo - varco) + pieno01 * varco);
}

/** Una tappa e' arrivata quando il suo centro e' entro la soglia dal centro dello schermo. */
export function arrivata({
  centroTappa,
  x,
  larghezza,
}: {
  centroTappa: number;
  x: number;
  larghezza: number;
}): boolean {
  return centroTappa < x + larghezza / 2 + larghezza * PARAMETRI.sogliaArrivo;
}

/**
 * La strada orizzontale, in pixel: quanto il binario deve traslare perche'
 * l'arrivo finisca al centro. E' la larghezza del binario meno lo schermo, e lo
 * schermo sparisce: i due margini sono mezzo schermo meno mezzo oggetto, e
 * sommati fanno uno schermo meno mezzo foglio e mezzo arrivo. Per questo la
 * stessa formula si puo' scrivere in CSS per l'altezza del track.
 */
export function strada({
  n,
  foglio,
  aria,
  arrivo,
}: {
  n: number;
  foglio: number;
  aria: number;
  arrivo: number;
}): number {
  return (n - 0.5) * foglio + n * aria + arrivo / 2;
}
