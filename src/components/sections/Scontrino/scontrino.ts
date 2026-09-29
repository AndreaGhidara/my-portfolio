/**
 * La stampante dei servizi senza DOM: le righe dello scontrino, la stampa a
 * colpi, la macchina a stati della stampante, le forme della tavola e dove
 * vanno i richiami. Il componente porta eventi dentro e disegna quello che
 * esce; la parte che si sbaglia (due tocchi di fila, un timer rimasto indietro)
 * si prova qui.
 *
 * Numeri e disegni sono quelli del prototipo approvato
 * (docs/prototipi/2026-09-27-scontrino-tre-proposte.html, proposta G1):
 * cambiarli qui senza ripassare da li' e' ritarare a occhio chiuso.
 */

/** Caratteri di una riga dello scontrino: i separatori e le righe allineate ai due capi. */
export const LARGHEZZA = 32;

/** Caratteri stampati a ogni colpo. Il titolo grande va piano, uno alla volta. */
export const PASSO = { riga: 3, grosso: 1 } as const;

/** Millisecondi fra un colpo e l'altro. */
export const INTERVALLO = 16;

/** Millisecondi che lo scontrino strappato impiega a cadere prima del prossimo. */
export const CADUTA = 420;

/**
 * Millisecondi in cui la carta esce sopra la figura stampata, sul telefono: la
 * stampa del testo aspetta, come in una stampante vera.
 */
export const FIGURA = 650;

/** «figura»: il disegno della tavola stampato sulla carta, solo sul telefono. */
export type TipoRiga = "riga" | "grosso" | "voce" | "figura";
export type Riga = { testo: string; tipo: TipoRiga };

export type DatiScontrino = {
  nome: string;
  mestiere: string;
  /** Vuota sul server: la data della build non e' quella di chi guarda. */
  data: string;
  /** «N.», «No.». */
  numero: string;
  /** Il posto del servizio nell'elenco, da zero. */
  indice: number;
  /** Quanti sono i servizi: il «/04» viene da qui. */
  quanti: number;
  titolo: string;
  testo: string;
  pezzi: string[];
  totale: string;
  daParlarne: string;
};

const due = (n: number) => String(n).padStart(2, "0");

/** Due testi ai capi della riga, con gli spazi in mezzo. */
export function aiLati(sinistra: string, destra: string): string {
  const spazi = Math.max(1, LARGHEZZA - sinistra.length - destra.length);
  return sinistra + " ".repeat(spazi) + destra;
}

/** «TOTALE ........ DA PARLARNE»: i puntini riempiono la riga. */
export function conPuntini(sinistra: string, destra: string): string {
  const puntini = Math.max(3, LARGHEZZA - sinistra.length - destra.length - 2);
  return `${sinistra} ${".".repeat(puntini)} ${destra}`;
}

export function righeScontrino(d: DatiScontrino): Riga[] {
  const riga = (testo: string, tipo: TipoRiga = "riga"): Riga => ({ testo, tipo });
  const taglio = riga("-".repeat(LARGHEZZA));
  return [
    riga(d.nome),
    riga(d.mestiere),
    riga(aiLati(d.data, `${d.numero} ${due(d.indice + 1)}/${due(d.quanti)}`)),
    taglio,
    riga(d.titolo.toUpperCase(), "grosso"),
    riga(d.testo),
    taglio,
    // Senza testo: costa un colpo, e sul desktop non si vede.
    riga("", "figura"),
    // Le stesse voci dei richiami sulla tavola, nello stesso ordine.
    ...d.pezzi.map((p, k) => riga(`${k + 1} ${p}`, "voce")),
    taglio,
    riga(conPuntini(d.totale, d.daParlarne)),
  ];
}

/** Quanti colpi servono a una riga. Anche una riga vuota ne prende uno. */
const colpi = (r: Riga) => Math.max(1, Math.ceil(r.testo.length / PASSO[r.tipo === "grosso" ? "grosso" : "riga"]));

export function scattiTotali(righe: Riga[]): number {
  return righe.reduce((somma, r) => somma + colpi(r), 0);
}

/** Il colpo con cui esce la figura: da li' la stampa aspetta la carta. -1 se non c'e'. */
export function scattiAllaFigura(righe: Riga[]): number {
  const dove = righe.findIndex((r) => r.tipo === "figura");
  return dove < 0 ? -1 : scattiTotali(righe.slice(0, dove + 1));
}

/** Lo scontrino dopo `scatti` colpi: le righe finite e quella a meta'. */
export function aScatti(righe: Riga[], scatti: number): Riga[] {
  const fuori: Riga[] = [];
  let resto = scatti;
  for (const r of righe) {
    if (resto <= 0) break;
    const servono = colpi(r);
    if (resto >= servono) {
      fuori.push(r);
    } else {
      const passo = r.tipo === "grosso" ? PASSO.grosso : PASSO.riga;
      fuori.push({ testo: r.testo.slice(0, resto * passo), tipo: r.tipo });
    }
    resto -= servono;
  }
  return fuori;
}

/* ── La stampante ───────────────────────────────────────────────────────── */

/**
 * Uno stato solo. `gen` cambia a ogni cosa che rende vecchi i timer in volo
 * (una stampa che parte, uno strappo): il colpo e la caduta portano la
 * generazione in cui sono nati, e se non e' piu' quella non fanno niente. E'
 * cosi' che due tocchi di fila, l'autostampa con un tocco, o lo StrictMode che
 * monta due volte non producono mai due scontrini.
 */
export type Stampante = {
  fase: "ferma" | "stampa" | "strappo";
  /** Il servizio sullo scontrino, anche mentre cade. null: niente scontrino. */
  servizio: number | null;
  /** Colpi gia' stampati. */
  scatti: number;
  /** Solo durante lo strappo: cosa stampare appena lo scontrino e' caduto. */
  poi: number | null;
  /** Il servizio sulla tavola. Resta anche quando lo scontrino se ne va. */
  disegno: number;
  /** Quante volte la tavola ha ricominciato a tracciarsi: la chiave del disegno. */
  tracciato: number;
  /** La tavola e' bianca e aspetta la prossima stampa per tracciarsi. */
  tavolaVuota: boolean;
  gen: number;
  /** Qualcuno ha gia' premuto: l'autostampa non gli passa sopra. */
  toccata: boolean;
};

export type Evento =
  /** `subito`: senza movimento, niente stampa a colpi e niente caduta. */
  | { tipo: "premi"; servizio: number; subito: boolean }
  | { tipo: "strappa"; subito: boolean }
  | { tipo: "autostampa" }
  | { tipo: "scatto"; gen: number }
  | { tipo: "caduto"; gen: number }
  /** La stampante e' ancora sotto lo schermo: si toglie lo scontrino del server e si aspetta l'autostampa. */
  | { tipo: "svuota" }
  /** Il movimento si spegne: quello che c'e' (o stava per arrivare) resta intero. */
  | { tipo: "completa" };

/** Il markup del server: il primo servizio gia' stampato e disegnato. */
export function statoIniziale(totali: readonly number[]): Stampante {
  return {
    fase: "ferma",
    servizio: 0,
    scatti: totali[0] ?? 0,
    poi: null,
    disegno: 0,
    tracciato: 0,
    tavolaVuota: false,
    gen: 0,
    toccata: false,
  };
}

const inizia = (s: Stampante, servizio: number): Stampante => ({
  ...s,
  fase: "stampa",
  servizio,
  scatti: 0,
  poi: null,
  disegno: servizio,
  tracciato: s.tracciato + 1,
  tavolaVuota: false,
  gen: s.gen + 1,
  toccata: true,
});

const intero = (s: Stampante, servizio: number | null, totali: readonly number[]): Stampante => ({
  ...s,
  fase: "ferma",
  servizio,
  scatti: servizio === null ? 0 : (totali[servizio] ?? 0),
  poi: null,
  disegno: servizio ?? s.disegno,
  tavolaVuota: false,
  gen: s.gen + 1,
});

export function stampante(s: Stampante, e: Evento, totali: readonly number[]): Stampante {
  switch (e.tipo) {
    case "premi":
      if (e.subito) {
        return { ...intero(s, e.servizio, totali), tracciato: s.tracciato + 1, toccata: true };
      }
      // Gia' in caduta: cambia solo cosa esce dopo, lo strappo resta uno.
      if (s.fase === "strappo") return { ...s, poi: e.servizio, toccata: true };
      if (s.servizio !== null) {
        return { ...s, fase: "strappo", poi: e.servizio, gen: s.gen + 1, toccata: true };
      }
      return inizia(s, e.servizio);

    case "strappa":
      if (s.servizio === null || s.fase === "strappo") return s;
      if (e.subito) return { ...intero(s, null, totali), toccata: true };
      return { ...s, fase: "strappo", poi: null, gen: s.gen + 1, toccata: true };

    case "autostampa":
      if (s.toccata || s.servizio !== null || s.fase !== "ferma") return s;
      return inizia(s, 0);

    case "scatto": {
      if (e.gen !== s.gen || s.fase !== "stampa" || s.servizio === null) return s;
      const totale = totali[s.servizio] ?? 0;
      const scatti = s.scatti + 1;
      return scatti >= totale ? { ...s, fase: "ferma", scatti: totale } : { ...s, scatti };
    }

    case "caduto":
      if (e.gen !== s.gen || s.fase !== "strappo") return s;
      return s.poi === null ? intero(s, null, totali) : inizia(s, s.poi);

    case "svuota":
      if (s.toccata) return s;
      // Via anche il disegno: la tavola si ritraccia con la stampa, e
      // tracciata dal server per poi cancellarsi all'autostampa sarebbe un
      // salto. Sul telefono la tavola non c'e': il disegno esce sulla carta.
      return {
        ...s,
        fase: "ferma",
        servizio: null,
        scatti: 0,
        poi: null,
        tracciato: s.tracciato + 1,
        tavolaVuota: true,
        gen: s.gen + 1,
        toccata: false,
      };

    case "completa": {
      const dopo = s.fase === "strappo" ? s.poi : s.servizio;
      // Prima di qualunque tocco la sezione si deve leggere: torna il primo.
      return intero(s, dopo ?? (s.toccata ? null : 0), totali);
    }
  }
}

/* ── La tavola ─────────────────────────────────────────────────────────── */

/**
 * I disegni dei servizi, in unita' del viewBox 600 x 460, centrati attorno a
 * (300, 215): la finestra del sito, la borsa, il pannello, la nuvoletta della
 * chat. Il primo tratto e' il contorno, gli altri sono i dettagli, piu' fiochi.
 */
export const FORME: Record<string, readonly string[]> = {
  sites: [
    "M190 145 H410 V285 H190 Z",
    "M190 165 H410",
    "M200 155 h0.1 M210 155 h0.1 M220 155 h0.1",
    "M210 185 H330",
    "M210 200 H300",
    "M210 222 H270 V240 H210 Z",
    "M345 180 H390 V240 H345 Z",
    "M345 180 L390 240 M390 180 L345 240",
    "M210 262 H390",
  ],
  ecommerce: [
    "M215 170 H385 L400 290 H200 Z",
    "M255 170 C255 125 345 125 345 170",
    "M270 170 C270 140 330 140 330 170",
    "M240 215 H360",
    "M240 235 H330",
    "M300 255 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0",
  ],
  webapp: [
    "M185 145 H415 V285 H185 Z",
    "M185 170 H415",
    "M235 170 V285",
    "M195 185 H225 M195 200 H225 M195 215 H225",
    "M250 185 H300 V225 H250 Z",
    "M315 185 H400 V225 H315 Z",
    "M250 240 H400 V270 H250 Z",
    "M260 260 L290 248 L320 256 L350 244 L390 250",
  ],
  ai: [
    "M200 150 H380 A20 20 0 0 1 400 170 V235 A20 20 0 0 1 380 255 H270 L240 285 V255 H220 A20 20 0 0 1 200 235 V170 A20 20 0 0 1 220 150 Z",
    "M225 180 H370",
    "M225 198 H340",
    "M225 216 H355",
    "M395 285 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0",
    "M375 318 C375 300 415 300 415 318",
  ],
};

/** La cornice della tavola, il cartiglio e il suo divisorio, tre tratti. */
export const CORNICE = "M20 20 H580 V440 H20 Z";
export const CARTIGLIO = "M290 390 H580 M290 390 V440";
export const DIVISORIO = "M500 390 V440";

/**
 * Dove vanno le annotazioni: `p` il punto sul disegno, `l` il gomito dove
 * finisce la linea di richiamo. Il testo parte da li' verso l'esterno. I gomiti
 * stanno 20 unita' piu' dentro che nel prototipo: le voci inglesi piu' lunghe
 * uscivano dalla cornice.
 */
export const POSTI: readonly { p: readonly [number, number]; l: readonly [number, number] }[] = [
  { p: [205, 150], l: [185, 80] },
  { p: [395, 150], l: [415, 80] },
  { p: [190, 220], l: [170, 215] },
  { p: [410, 225], l: [430, 215] },
  { p: [220, 280], l: [185, 345] },
  { p: [380, 283], l: [415, 345] },
];

/** Secondi di ritardo: le righe del disegno una dopo l'altra, poi i richiami. */
export const RITARDI = {
  riga: (k: number) => 0.15 * k,
  richiamo: (k: number) => 1.1 + k * 0.28,
  testo: 0.3,
} as const;

/** Il richiamo del pezzo `k`: la linea, dove sta il testo e quando compare. */
export function richiamo(k: number) {
  const { p, l } = POSTI[k];
  const [x, y] = l;
  const aSinistra = x < 300;
  const ritardo = RITARDI.richiamo(k);
  return {
    punto: p,
    d: `M${p[0]} ${p[1]} L${x} ${y} L${aSinistra ? x - 12 : x + 12} ${y}`,
    x: aSinistra ? x - 18 : x + 18,
    y: y + 4,
    ancora: aSinistra ? ("end" as const) : ("start" as const),
    ritardo,
    ritardoTesto: ritardo + RITARDI.testo,
  };
}
