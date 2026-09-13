import type { Param } from "./param";

export type Punto = readonly [number, number];

/** Dove sta un disegno, adesso, misurato dalla scena. */
export type Misura = { cx: number; cy: number; h: number; lato: "dx" | "sx" };

/** Il blocco vuoto in fondo, dove la freccia fa il suo 180. */
export type Coda = { top: number; h: number };

export type Mondo = { w: number; h: number };

export type Strada = {
  punti: Punto[];
  /** I punti sono indicizzati per NOME e non per indice: cosi' gli scostamenti
   *  restano attaccati al punto giusto anche se domani il tracciato ne guadagna
   *  uno. */
  nomi: string[];
  indiciDisegno: number[];
  /** Da quale punto comincia la coda: prima di li' la discesa e' monotona. */
  indiceCoda: number;
};

export type Segmento = readonly [Punto, Punto, Punto, Punto];


/**
 * Dove finisce la corsa della freccia, in frazione della larghezza della
 * PAGINA.
 *
 * Era `THREAD_ANCHORS.practice.out`, perche' il filo di pagina attraversava
 * anche questa scena e la freccia doveva arrivare dove arrivava lui. Il filo
 * qui non c'e' piu' (vedi la nota in anchors.ts: il tavolo e' una camera, e
 * una linea non puo' attraversarla), ma la freccia finisce ancora dove
 * finiva: quel punto e' il bordo destro dei disegni, non un residuo.
 *
 * Il numero resta qui e non fra gli ancoraggi proprio per questo: adesso
 * descrive un gesto, non piu' un tratto che deve combaciare con la sezione
 * vicina.
 */
export const USCITA = 0.88;

/**
 * La pagina, e dove la scena ci sta dentro. Le due x non sono la stessa cosa e
 * confonderle e' il difetto che questo tipo esiste per rendere impossibile:
 * `misure` e `coda` sono misurate nella scatola della SCENA, che e' larga
 * 74rem e centrata, mentre l'88% degli ancoraggi e' una percentuale della
 * PAGINA — e' li' che escono e entrano le sezioni vicine. A 1440 il gradino
 * era di quasi cento pixel, e cresce con lo schermo. E' lo stesso conto, e lo
 * stesso rimedio, dei due riquadri di DeskCables.
 */
export type Pagina = {
  /** Larghezza della pagina, cioe' della scatola in cui il filo si disegna. */
  w: number;
  /** Dove comincia la scena dentro quella scatola. Le x delle misure vanno
   *  sommate a questo per diventare x di pagina. */
  left: number;
};

/**
 * Catmull-Rom CENTRIPETA (alfa 0,5), non uniforme.
 *
 * Con la versione uniforme la tangente in un punto e' (p2-p0)/6 senza tener
 * conto di QUANTO distano: fra un disegno e l'altro ci sono settecento pixel e
 * fra due punti ravvicinati un centinaio, e accanto ai segmenti corti la stima
 * diventa enorme — la curva spara fuori, torna indietro, sale. Erano quelli gli
 * scostamenti a destra e sinistra, su e giu' che si vedevano scorrendo.
 *
 * La centripeta pesa ogni tangente con la radice della distanza, ed e' l'unica
 * delle tre varianti che NON produce cuspidi ne' cappi involontari su punti
 * distribuiti male. E' il motivo per cui esiste.
 */
export function segmenti(punti: readonly Punto[]): Segmento[] {
  if (punti.length < 2) return [];
  const A = 0.5;
  const d = (a: Punto, b: Punto) =>
    Math.max(1e-4, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), A));

  const out: Segmento[] = [];
  for (let i = 0; i < punti.length - 1; i++) {
    const p0 = punti[i - 1] ?? punti[i];
    const p1 = punti[i];
    const p2 = punti[i + 1];
    const p3 = punti[i + 2] ?? punti[i + 1];
    const d1 = d(p0, p1);
    const d2 = d(p1, p2);
    const d3 = d(p2, p3);
    const d1q = d1 * d1;
    const d2q = d2 * d2;
    const d3q = d3 * d3;
    const b1: number[] = [];
    const b2: number[] = [];
    for (let k = 0; k < 2; k++) {
      b1[k] =
        (d1q * p2[k] - d2q * p0[k] + (2 * d1q + 3 * d1 * d2 + d2q) * p1[k]) / (3 * d1 * (d1 + d2));
      b2[k] =
        (d3q * p1[k] - d2q * p3[k] + (2 * d3q + 3 * d3 * d2 + d2q) * p2[k]) / (3 * d3 * (d3 + d2));
    }
    const c1: Punto = [b1[0], b1[1]];
    const c2: Punto = [b2[0], b2[1]];
    out.push([p1, c1, c2, p2]);
  }
  return out;
}

/** Il `d` di un path SVG. */
export function curva(punti: readonly Punto[]): string {
  const segs = segmenti(punti);
  if (segs.length === 0) return "";
  const n = (v: number) => v.toFixed(2);
  let d = `M${n(punti[0][0])} ${n(punti[0][1])}`;
  for (const [, b1, b2, p2] of segs) {
    d += ` C${n(b1[0])} ${n(b1[1])}, ${n(b2[0])} ${n(b2[1])}, ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}

/**
 * Campiona le cubiche. Serve alle PROVE, e non al disegno: in pagina la
 * lunghezza d'arco la da' getPointAtLength su un path vero, che e' preciso e
 * gratis. Qui non c'e' un browser, ed e' esattamente il punto di questo modulo.
 */
export function campiona(segs: readonly Segmento[], passo = 0.01): Punto[] {
  const out: Punto[] = [];
  for (const s of segs) {
    for (let t = 0; t <= 1 + 1e-9; t += passo) {
      const u = 1 - t;
      out.push([
        u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
        u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1],
      ]);
    }
  }
  return out;
}

/**
 * Quale voce e' in fuoco: quella il cui disegno cade dentro la fascia attorno
 * al centro dello schermo, oppure -1 se nessuna ci cade.
 *
 * La FASCIA e' il punto, non la gara fra le distanze. Prendere sempre la piu'
 * vicina fa cadere lo scambio fra due voci a meta' strada fra i loro disegni:
 * la voce si accende quando il suo disegno e' ancora mezzo intervallo SOTTO il
 * centro, e piu' si distanziano le voci piu' il difetto cresce. Con la soglia
 * la regola diventa simmetrica — si accende salendo a `soglia` sotto il
 * centro, si spegne a `soglia` sopra — e fra una voce e l'altra c'e' un tratto
 * in cui non e' accesa nessuna, che e' onesto: li' non si sta guardando
 * niente. La distanza minima resta come spareggio, per il caso in cui due
 * disegni cadano tutti e due dentro la fascia.
 *
 * Perche' non lo decide piu' la freccia. Prima si accendeva la voce piu'
 * vicina alla PUNTA, e la punta insegue lo scorrimento con inerzia dopo un
 * ritardo: arrivava sempre in ritardo, e la voce si accendeva quando era gia'
 * scesa sotto la meta' dello schermo. Il fuoco non e' un fatto della freccia,
 * e' un fatto di dove sta guardando chi legge — quindi si misura li'.
 *
 * Staccarli non li fa litigare: la freccia arriva DENTRO una voce gia' accesa
 * invece di trascinarsela dietro, che e' anche il verso giusto del gesto.
 *
 * Sta qui e non dentro il ciclo perche' e' aritmetica pura, e dentro il ciclo
 * nessun test la vedrebbe piu' — e' la lezione del difetto che la review
 * finale ha trovato.
 */
export function inFuoco(
  /** La y del centro di ogni disegno, in coordinate dello SCHERMO. */
  centri: readonly number[],
  /** La y del centro dello schermo. */
  centroSchermo: number,
  /** Oltre questa distanza dal centro non si accende niente: fuori dai due
   *  estremi della scena non c'e' nessuna voce da guardare. */
  soglia: number,
): number {
  let scelta = -1;
  let minima = Infinity;
  centri.forEach((y, k) => {
    const d = Math.abs(y - centroSchermo);
    if (d < minima) {
      minima = d;
      scelta = k;
    }
  });
  return minima <= soglia ? scelta : -1;
}

/**
 * La strada della freccia. Pochi punti e archi larghi: dietro un disegno, poi
 * un punto a meta' che tira la spline sulla retta, poi dietro il disegno
 * successivo dall'altro lato. Senza quel punto di mezzo due disegni su lati
 * opposti darebbero comunque una S — la curva passa per i punti giusti ma ci
 * arriva girando, e «dritta verso la seconda immagine» vuol dire non farlo.
 *
 * La coda non e' un anello: dopo l'ultimo disegno la freccia punta in basso,
 * apre un 180 LARGO mentre scende, rientra al centro e finisce dove finisce il
 * filo. Un anello e' un giro completo e si legge come un'acrobazia; questo e'
 * un cambio di direzione, e chiude invece di stupire.
 */
export function strada(
  misure: readonly Misura[],
  coda: Coda,
  mondo: Mondo,
  param: Param,
  /** Solo sopra i 900px gli scostamenti a mano hanno senso. */
  largo: boolean,
  /** La pagina, per il solo punto d'uscita. Vedi sotto. */
  pagina: Pagina,
): Strada {
  const punti: Punto[] = [];
  const nomi: string[] = [];
  const indiciDisegno: number[] = [];
  const push = (p: Punto, n: string) => {
    punti.push(p);
    nomi.push(n);
  };
  const N = misure.length;

  // Dentro l'inquadratura, in alto a destra, sopra il primo disegno — che sta a
  // destra anche lui. Da li' lo punta gia': il primo fotogramma della scena e'
  // una freccia ferma che indica.
  push([mondo.w * 0.945, 34], "partenza");

  misure.forEach((g, i) => {
    indiciDisegno.push(punti.length);
    push([g.cx, g.cy], `disegno${i}`);
    if (i < N - 1) {
      const b = misure[i + 1];
      push([g.cx + (b.cx - g.cx) * 0.5, g.cy + (b.cy - g.cy) * 0.5], `mezzo${i}`);
    }
  });

  const indiceCoda = punti.length;
  const ultimo = misure[N - 1];
  const verso = ultimo.lato === "dx" ? 1 : -1;
  push([ultimo.cx, coda.top + coda.h * 0.06], "coda.giu");
  push([ultimo.cx + verso * mondo.w * 0.17, coda.top + coda.h * 0.28], "coda.apre");
  push([mondo.w * 0.5 - verso * mondo.w * 0.13, coda.top + coda.h * 0.54], "coda.colmo");
  push([mondo.w * 0.5, coda.top + coda.h * 0.8], "coda.rientra");

  // Due punti liberi sull'ultima corsa. Fra il rientro al centro e l'uscita
  // c'era un tratto lungo senza un solo punto per piegarlo: la strada ci
  // passava dritta e non c'era niente da prendere col calibratore. Questi due
  // nascono ESATTAMENTE sul segmento fra i due estremi, a un terzo e a due
  // terzi, quindi da fermi non cambiano la forma — cambiano solo cosa si puo'
  // afferrare. Come tutti gli altri hanno un nome, ed e' per nome che gli
  // scostamenti gli restano attaccati.
  const rientroX = mondo.w * 0.5;
  const rientroY = coda.top + coda.h * 0.8;
  /**
   * L'uscita si conta sulla PAGINA e poi si riporta nella scatola del
   * percorso, che e' quella in cui la strada si disegna.
   *
   * Contarla sul percorso — com'era — la faceva finire altrove rispetto al
   * filo, che sulla pagina ci si conta: lo scarto vale 0,38 x (pagina meno
   * percorso), cioe' zero finche' la finestra sta sotto i 74rem e poi cresce
   * senza fermarsi — 97px a 1440, 280 a 1920. In calibrazione era stato
   * corretto a mano trascinando `coda.fine` di 0,14 della larghezza, che
   * azzecca la finestra su cui si stava guardando e sbaglia tutte le altre:
   * la correzione e' una frazione del percorso, che sopra i 74rem non cresce
   * piu'. Contandola qui combaciano a ogni larghezza e la correzione non
   * serve — infatti e' stata tolta da PARAM.
   */
  const fineX = pagina.w * USCITA - pagina.left;
  const fra = (a: number, b: number, t: number) => a + (b - a) * t;
  push([fra(rientroX, fineX, 1 / 3), fra(rientroY, mondo.h, 1 / 3)], "coda.scende");
  push([fra(rientroX, fineX, 2 / 3), fra(rientroY, mondo.h, 2 / 3)], "coda.punta");

  push([fineX, mondo.h], "coda.fine");

  // Le correzioni a mano si applicano DOPO che la geometria ha fatto il suo
  // mestiere: la strada resta calcolata dall'impaginato — che si muove quando
  // arrivano i caratteri — e queste sono le correzioni sopra. Salvando posizioni
  // assolute, il primo riflow le butterebbe.
  if (largo) {
    for (let k = 0; k < punti.length; k++) {
      const s = param.scostamenti[nomi[k]];
      if (s) punti[k] = [punti[k][0] + s[0] * mondo.w, punti[k][1] + s[1] * mondo.w];
    }
  }

  return { punti, nomi, indiciDisegno, indiceCoda };
}

