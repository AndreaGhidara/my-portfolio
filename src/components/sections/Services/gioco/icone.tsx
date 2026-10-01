import type { CSSProperties, ReactNode } from "react";

/**
 * Le icone a tratto dei quattro livelli, tutte nello stesso disegno: viewBox
 * 100x100, tratto d'inchiostro da 3, angoli tondi. Vengono dai prototipi
 * approvati, una per una.
 *
 * I colori passano da `style` e non dagli attributi `fill`/`stroke`: un var()
 * dentro un attributo di presentazione non lo leggono tutti i browser, dentro
 * style si'. Sono i token fissi della palette, non quelli del tema: il gioco
 * ha lo stesso aspetto di giorno e di notte. --green lo mette il guscio del
 * gioco sulla sua radice (vedi Gioco.tsx), perche' fra le variabili globali
 * c'e' solo --verde, che col tema cambia.
 *
 * Decorative per intero: il nome della cosa lo dice sempre il testo accanto.
 */

const INK = "var(--ink)";
const PAPER = "var(--paper)";
const ORANGE = "var(--orange)";
const BULB = "var(--bulb)";
const GRAPH = "var(--graph)";
const MUTED = "var(--muted)";
const GREEN = "var(--green)";

const TRATTO: CSSProperties = {
  stroke: INK,
  strokeWidth: 3,
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const pieno = (fill: string): CSSProperties => ({ fill });
const linea = (stroke: string): CSSProperties => ({ stroke });

/** Gli attrezzi del livello 1. */
const ATTREZZI = {
  colori: (
    <g style={TRATTO}>
      <rect x="30" y="18" width="18" height="60" rx="3" style={pieno(PAPER)} transform="rotate(-22 39 78)" />
      <rect x="40" y="16" width="18" height="62" rx="3" style={pieno(ORANGE)} transform="rotate(-6 49 78)" />
      <rect x="50" y="16" width="18" height="62" rx="3" style={pieno(BULB)} transform="rotate(12 59 78)" />
      <circle cx="50" cy="76" r="4" style={pieno(INK)} />
    </g>
  ),
  caratteri: (
    <>
      <g style={TRATTO}>
        <rect x="24" y="30" width="52" height="42" rx="4" style={pieno(GRAPH)} />
        <rect x="30" y="72" width="40" height="10" style={pieno(MUTED)} />
      </g>
      <text x="50" y="62" textAnchor="middle" fontSize="26" style={{ fill: INK, fontFamily: "var(--font-display)" }}>
        Aa
      </text>
    </>
  ),
  sezioni: (
    <g style={TRATTO}>
      <rect x="28" y="22" width="44" height="58" rx="2" style={pieno(PAPER)} transform="rotate(-8 50 50)" />
      <rect x="28" y="22" width="44" height="58" rx="2" style={pieno(PAPER)} />
      <rect x="34" y="28" width="32" height="10" style={pieno(GRAPH)} />
      <rect x="34" y="42" width="15" height="16" style={pieno(GRAPH)} />
      <rect x="52" y="42" width="14" height="16" style={pieno(GRAPH)} />
      <line x1="34" y1="64" x2="66" y2="64" />
      <line x1="34" y1="71" x2="58" y2="71" />
    </g>
  ),
  testi: (
    <g style={TRATTO}>
      <path d="M30 24h36l6 6v48H30z" style={pieno(PAPER)} />
      <line x1="36" y1="38" x2="64" y2="38" />
      <line x1="36" y1="47" x2="64" y2="47" />
      <line x1="36" y1="56" x2="60" y2="56" />
      <line x1="36" y1="65" x2="52" y2="65" />
      <path d="M66 24v6h6" />
    </g>
  ),
  immagini: (
    <g style={TRATTO}>
      <rect x="24" y="26" width="46" height="50" rx="2" style={pieno(PAPER)} transform="rotate(-6 47 51)" />
      <rect x="30" y="30" width="46" height="50" rx="2" style={pieno(PAPER)} />
      <rect x="35" y="35" width="36" height="30" style={pieno(GRAPH)} />
      <path d="M36 64l10-12 8 8 6-6 10 10" />
      <circle cx="62" cy="43" r="3.5" style={pieno(BULB)} />
    </g>
  ),
  telefono: (
    <g style={TRATTO}>
      <rect x="34" y="16" width="32" height="68" rx="6" style={pieno(INK)} />
      <rect x="38" y="24" width="24" height="46" strokeWidth="2" style={pieno(PAPER)} />
      <rect x="41" y="28" width="18" height="6" style={{ fill: GRAPH, stroke: "none" }} />
      <rect x="41" y="56" width="10" height="5" style={{ fill: ORANGE, stroke: "none" }} />
      <circle cx="50" cy="77" r="2.5" style={pieno(PAPER)} />
    </g>
  ),
} satisfies Record<string, ReactNode>;

/** I sei nodi dietro lo schermo, livello 2 (e l'anteprima alla fine del livello 1). */
const NODI = {
  area: (
    <g style={TRATTO}>
      <circle cx="36" cy="50" r="14" style={pieno(BULB)} />
      <circle cx="36" cy="50" r="5" />
      <path d="M50 50h30M68 50v9M76 50v7" />
    </g>
  ),
  catalogo: (
    <g style={TRATTO}>
      <path d="M28 20h40v62H28z" style={pieno(PAPER)} />
      <path d="M28 20h8v62h-8z" style={pieno(ORANGE)} />
      <rect x="42" y="30" width="20" height="14" style={pieno(GRAPH)} />
      <line x1="42" y1="52" x2="62" y2="52" />
      <line x1="42" y1="60" x2="58" y2="60" />
    </g>
  ),
  prenotazioni: (
    <g style={TRATTO}>
      <rect x="22" y="24" width="56" height="54" rx="4" style={pieno(PAPER)} />
      <rect x="22" y="24" width="56" height="12" style={pieno(ORANGE)} />
      <line x1="34" y1="18" x2="34" y2="30" />
      <line x1="66" y1="18" x2="66" y2="30" />
      {[0, 1, 2].flatMap((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={29 + c * 12}
            y={42 + r * 11}
            width="7"
            height="7"
            strokeWidth="2"
            // Il giorno scelto: uno solo, pieno.
            style={pieno(r === 1 && c === 2 ? BULB : "none")}
          />
        )),
      )}
    </g>
  ),
  pagamenti: (
    <g style={TRATTO}>
      <rect x="18" y="30" width="58" height="38" rx="5" style={pieno(PAPER)} />
      <rect x="18" y="38" width="58" height="8" style={pieno(INK)} />
      <rect x="26" y="54" width="12" height="8" rx="1" style={pieno(BULB)} />
      <line x1="46" y1="58" x2="66" y2="58" />
    </g>
  ),
  contatti: (
    <g style={TRATTO}>
      <rect x="20" y="30" width="60" height="40" rx="3" style={pieno(PAPER)} />
      <path d="M20 32l30 22 30-22" />
      <rect x="62" y="36" width="12" height="10" strokeWidth="2" style={pieno(ORANGE)} />
    </g>
  ),
  gestionale: (
    <g style={TRATTO}>
      <rect x="26" y="20" width="48" height="62" rx="3" style={pieno(GRAPH)} />
      <rect x="26" y="20" width="10" height="62" style={pieno(MUTED)} />
      <rect x="44" y="30" width="22" height="12" style={pieno(PAPER)} />
      <circle cx="31" cy="36" r="2" style={pieno(PAPER)} />
      <circle cx="31" cy="66" r="2" style={pieno(PAPER)} />
    </g>
  ),
} satisfies Record<string, ReactNode>;

/** I cinque servizi del pannello, livello 3. */
const SERVIZI = {
  assistenza: (
    <g style={TRATTO}>
      <path d="M24 58 V50 a26 26 0 0 1 52 0 V58" />
      <rect x="18" y="50" width="15" height="24" rx="6" style={pieno(ORANGE)} />
      <rect x="67" y="50" width="15" height="24" rx="6" style={pieno(ORANGE)} />
      <path d="M75 74 q0 12 -17 12" />
      <rect x="46" y="81" width="12" height="9" rx="4" style={pieno(BULB)} />
    </g>
  ),
  automazioni: (
    <g style={TRATTO}>
      <circle cx="44" cy="54" r="21" strokeWidth="11" strokeDasharray="8.2 8.2" />
      <circle cx="44" cy="54" r="16" style={pieno(BULB)} />
      <circle cx="44" cy="54" r="6" style={pieno(PAPER)} />
      <circle cx="74" cy="30" r="10" strokeWidth="7" strokeDasharray="5 4.4" />
      <circle cx="74" cy="30" r="7" style={pieno(ORANGE)} />
    </g>
  ),
  numeri: (
    <g style={TRATTO}>
      <path d="M18 82 H84" />
      <rect x="24" y="56" width="13" height="26" style={pieno(GRAPH)} />
      <rect x="44" y="42" width="13" height="40" style={pieno(BULB)} />
      <rect x="64" y="24" width="13" height="58" style={pieno(ORANGE)} />
      <path d="M22 44 L40 32 L56 36 L78 14" strokeDasharray="4 5" />
    </g>
  ),
  trovare: (
    <g style={TRATTO}>
      <ellipse cx="50" cy="84" rx="22" ry="6" style={pieno(GRAPH)} />
      <path d="M50 82 C 36 62, 28 52, 28 40 a22 22 0 0 1 44 0 c0 12 -8 22 -22 42z" style={pieno(ORANGE)} />
      <circle cx="50" cy="40" r="9" style={pieno(PAPER)} />
    </g>
  ),
  manutenzione: (
    <g style={TRATTO}>
      <circle cx="50" cy="52" r="20" strokeWidth="0" style={pieno(BULB)} />
      <path d="M76 44 a27 27 0 0 0 -49 -8" />
      <path d="M25 22 v14 h14" />
      <path d="M24 60 a27 27 0 0 0 49 8" />
      <path d="M75 82 v-14 h-14" />
      <path d="M40 52 l7 7 l13 -14" strokeWidth="5" style={linea(GREEN)} />
    </g>
  ),
} satisfies Record<string, ReactNode>;

/** Le sei voci dell'infrastruttura, livello 4. */
const CLOUD = {
  dove: (
    <g style={TRATTO}>
      <circle cx="44" cy="58" r="26" style={pieno(GRAPH)} />
      <ellipse cx="44" cy="58" rx="11" ry="26" />
      <path d="M18 58 H70 M22 44 H66 M22 72 H66" />
      <path d="M72 42 C 64 30, 62 26, 62 20 a10 10 0 0 1 20 0 c0 6 -2 10 -10 22z" style={pieno(ORANGE)} />
      <circle cx="72" cy="20" r="3.5" style={pieno(PAPER)} />
    </g>
  ),
  dati: (
    <g style={TRATTO}>
      <path d="M26 28 V72 a24 9 0 0 0 48 0 V28" style={pieno(BULB)} />
      <ellipse cx="50" cy="28" rx="24" ry="9" style={pieno(PAPER)} />
      <path d="M26 43 a24 9 0 0 0 48 0 M26 58 a24 9 0 0 0 48 0" />
    </g>
  ),
  copie: (
    <g style={TRATTO}>
      <rect x="32" y="16" width="40" height="50" rx="3" style={pieno(GRAPH)} />
      <rect x="22" y="26" width="40" height="52" rx="3" style={pieno(PAPER)} />
      <path d="M30 40 H54 M30 50 H50 M30 60 H44" />
      <circle cx="68" cy="72" r="14" style={pieno(BULB)} />
      <path d="M68 64 V72 L74 76" />
    </g>
  ),
  dominio: (
    <>
      <g style={TRATTO}>
        <path d="M50 26 L24 44 M50 26 L76 44" />
        <circle cx="50" cy="20" r="5" style={pieno(INK)} />
        <rect x="12" y="44" width="76" height="32" rx="6" style={pieno(ORANGE)} />
      </g>
      <text
        x="50"
        y="66"
        textAnchor="middle"
        fontSize="15"
        fontWeight="500"
        style={{ fill: PAPER, fontFamily: "var(--font-mono), monospace" }}
      >
        www
      </text>
    </>
  ),
  sicurezza: (
    <g style={TRATTO}>
      <path d="M34 46 V34 a16 16 0 0 1 32 0 V46" />
      <rect x="22" y="46" width="56" height="38" rx="7" style={pieno(BULB)} />
      <circle cx="50" cy="61" r="5" style={pieno(INK)} />
      <path d="M50 65 V74" />
    </g>
  ),
  velocita: (
    <g style={TRATTO}>
      <path d="M16 68 a34 34 0 0 1 68 0 Z" style={pieno(GRAPH)} />
      <path d="M22 60 a30 30 0 0 1 16 -22" strokeWidth="7" style={linea(GREEN)} />
      <path d="M50 68 L70 42" strokeWidth="4" />
      <circle cx="50" cy="68" r="6" style={pieno(ORANGE)} />
    </g>
  ),
} satisfies Record<string, ReactNode>;

export type IconaAttrezzo = keyof typeof ATTREZZI;
export type IconaNodo = keyof typeof NODI;
export type IconaServizio = keyof typeof SERVIZI;
export type IconaCloud = keyof typeof CLOUD;
export type NomeIcona = IconaAttrezzo | IconaNodo | IconaServizio | IconaCloud;

const DISEGNI: Record<NomeIcona, ReactNode> = { ...ATTREZZI, ...NODI, ...SERVIZI, ...CLOUD };

/**
 * Un'icona, misurata da chi la contiene: l'svg riempie il suo genitore (la
 * classe `.ic` di base.css, o la scatola del livello).
 */
export function Icona({ nome, className }: { nome: NomeIcona; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={className}>
      {DISEGNI[nome]}
    </svg>
  );
}
