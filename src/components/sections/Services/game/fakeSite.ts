/**
 * Il sito del Forno Aurora: quello che si costruisce al livello 1 e da cui
 * parte il livello 2.
 *
 * QUESTI NON SONO I COLORI DEL PORTFOLIO. Sono i colori del sito di un
 * cliente immaginario, cioe' contenuto, come lo sarebbe la foto di un lavoro:
 * il gioco fa scegliere fra sei palette proprio per far vedere che cambiano.
 * Per questo e' l'unico posto del sito con esadecimali fuori dalla tavolozza
 * (src/styles/palette.ts), e non deve diventarne una seconda: niente di
 * quello che c'e' qui va usato fuori dal sito finto.
 *
 * Nei componenti il sito finto legge cinque variabili, scritte sul suo
 * contenitore con `variabiliSito`: --sf fondo, --ss superficie, --st testo,
 * --sa accento, --sm grigio. Le illustrazioni le seguono, cosi' cambiando
 * palette cambiano anche loro.
 */

export type FakeColors = {
  background: string;
  surface: string;
  text: string;
  accent: string;
  grey: string;
};

export type PaletteId = "bottega" | "notte" | "salvia" | "cipria" | "oceano" | "terracotta";

export type FakePalette = { id: PaletteId; colors: FakeColors };

const paletta = (id: PaletteId, [fondo, superficie, testo, accento, grigio]: string[]): FakePalette => ({
  id,
  colors: { background: fondo, surface: superficie, text: testo, accent: accento, grey: grigio },
});

/** Le sei palette, nell'ordine dell'attrezzo «colori». La prima e' quella di partenza. */
export const FAKE_PALETTES: readonly FakePalette[] = [
  paletta("bottega", ["#F5F1E8", "#E9E1D2", "#14120F", "#E4572E", "#6E6759"]),
  paletta("notte", ["#16140F", "#26221B", "#F3EDE0", "#F2C94C", "#A79E8C"]),
  paletta("salvia", ["#EEF0E8", "#DCE4D5", "#1D2A20", "#3E7D57", "#5F6F63"]),
  paletta("cipria", ["#F8EDE8", "#F0DCD3", "#2B1D1A", "#C4553F", "#7D625B"]),
  paletta("oceano", ["#EEF3F6", "#D9E5EC", "#0F2233", "#1F6FB2", "#587083"]),
  paletta("terracotta", ["#F4E7D9", "#E7D0B8", "#3A1F12", "#B8532A", "#7A5A45"]),
];

/** La palette con cui il Forno Aurora nasce, e con cui il livello 2 lo mostra. */
export const SHOP_PALETTE = FAKE_PALETTES[0];

export type SiteVariables = Record<"--sf" | "--ss" | "--st" | "--sa" | "--sm", string>;

/** Le cinque variabili da scrivere sul contenitore del sito finto (style). */
export function siteVariables(c: FakeColors): SiteVariables {
  return { "--sf": c.background, "--ss": c.surface, "--st": c.text, "--sa": c.accent, "--sm": c.grey };
}

export type FontPairId = "archivo" | "fraunces" | "grotesk" | "playfair";

/**
 * Le coppie di caratteri: uno per i titoli, uno per leggere. I valori sono
 * font-family pronti, con le variabili che next/font mette su <body>
 * (layout.tsx). Il paragrafo e' sempre Archivo: nel prototipo era Inter, che
 * il sito non carica, e un quinto carattere solo per tre righe finte non vale
 * il suo peso.
 *
 * `peso` e' il peso del titolo, ed e' quello caricato: chiederne un altro
 * vorrebbe dire un grassetto finto disegnato dal browser.
 */
export type FakeFontPair = { id: FontPairId; name: string; heading: string; weight: number; body: string };

const PARAGRAFO = "var(--font-body), system-ui, sans-serif";

export const FAKE_FONTS: readonly FakeFontPair[] = [
  { id: "archivo", name: "Archivo", heading: "var(--font-display), sans-serif", weight: 400, body: PARAGRAFO },
  { id: "fraunces", name: "Fraunces", heading: "var(--font-finto-fraunces), Georgia, serif", weight: 600, body: PARAGRAFO },
  { id: "grotesk", name: "Grotesk", heading: "var(--font-finto-grotesk), sans-serif", weight: 700, body: PARAGRAFO },
  { id: "playfair", name: "Playfair", heading: "var(--font-finto-playfair), Georgia, serif", weight: 800, body: PARAGRAFO },
];

export type ScaleId = "compatta" | "equilibrata" | "generosa";

/**
 * Le tre scale dei testi. `k` moltiplica le misure del sito finto; h1, h2 e p
 * sono i pixel che il campione dell'attrezzo dichiara.
 */
export type FakeScale = { id: ScaleId; k: number; h1: number; h2: number; p: number };

export const FAKE_SCALES: readonly FakeScale[] = [
  { id: "compatta", k: 0.82, h1: 38, h2: 22, p: 14 },
  { id: "equilibrata", k: 1, h1: 48, h2: 28, p: 16 },
  { id: "generosa", k: 1.2, h1: 60, h2: 34, p: 18 },
];

/** La scala di partenza. */
export const INITIAL_SCALE = FAKE_SCALES[1];

export type LayoutId = "classica" | "manifesto" | "copertina" | "bento";

/**
 * Il disegnino di un'impaginazione, sul pulsante dell'attrezzo «sezioni».
 * Non e' il sito finto: e' interfaccia del gioco, quindi i suoi toni sono i
 * token del portfolio (una cella senza tono e' --graph).
 */
export type MiniTone = "ink" | "muted" | "mutedDark" | "orange";
export type MiniCell = {
  tone?: MiniTone;
  column?: string;
  row?: string;
  width?: string;
  height?: string;
};
export type MiniLayout = {
  columns?: string;
  rows?: string;
  background?: MiniTone;
  /** Le celle in fondo al riquadro invece che a riempirlo. */
  atBottom?: boolean;
  cells: MiniCell[];
};

export type FakeLayout = { id: LayoutId; mini: MiniLayout };

export const FAKE_LAYOUTS: readonly FakeLayout[] = [
  {
    id: "classica",
    mini: { columns: "1fr 1fr", rows: "1fr .5fr", cells: [{ tone: "orange" }, {}, {}, {}] },
  },
  {
    id: "manifesto",
    mini: { rows: "1fr .35fr", cells: [{ tone: "ink" }, { tone: "orange" }] },
  },
  {
    id: "copertina",
    mini: { background: "muted", atBottom: true, cells: [{ tone: "orange", height: "5px", width: "55%" }] },
  },
  {
    id: "bento",
    mini: {
      columns: "1.3fr 1fr .9fr",
      rows: "1fr 1fr 1fr",
      cells: [
        { row: "span 2" },
        { tone: "mutedDark", column: "2 / 4", row: "span 2" },
        {},
        { tone: "ink" },
        { tone: "orange" },
      ],
    },
  },
];

export type IllustrationId = "pane" | "vetrina" | "torta" | "cornetto";

/** Le illustrazioni si disegnano in un svg con questo viewBox. */
export const ILLUSTRATION_VIEWBOX = "0 0 120 90";

// Il riempimento segue la palette; il tratto d'inchiostro passa da
// currentColor, perche' un elemento non puo' avere due attributi style. Chi
// disegna l'illustrazione mette quindi `color: var(--st)` sull'svg.
const f = (v: string) => `style="fill:var(--${v})"`;
const t = (v = "st") => (v === "st" ? `stroke="currentColor"` : `style="stroke:var(--${v})"`);
const MOLLICA = "color-mix(in oklab, var(--sa) 22%, #FFF8EC)";

/**
 * Le quattro illustrazioni del sito finto, come markup SVG da mettere dentro
 * un <svg viewBox={VIEWBOX_ILLUSTRAZIONI}>. Sono stringhe fisse scritte qui,
 * nessun dato da fuori: dangerouslySetInnerHTML su di loro e' sicuro.
 *
 * `pane` e' anche la foto della schermata di partenza del livello 2.
 */
export const ILLUSTRATIONS: Record<IllustrationId, string> = {
  pane: `<rect width="120" height="90" ${f("ss")}/><circle cx="60" cy="44" r="36" ${f("sf")} opacity=".55"/>
    <rect y="72" width="120" height="18" ${f("sm")} opacity=".28"/><line x1="0" y1="72" x2="120" y2="72" ${t()} stroke-width="1.4"/>
    <path d="M22 70 C 21 58, 20 44, 24 28" fill="none" ${t()} stroke-width="1.2"/>${[
      [14.9, 58.0, 28],
      [20.0, 51.8, -28],
      [16.7, 45.6, 28],
      [21.8, 39.4, -28],
      [18.5, 33.2, 28],
      [23.6, 27.0, -28],
    ]
      .map(
        ([x, y, r]) =>
          `<ellipse cx="${x}" cy="${y}" rx="2.1" ry="3.6" transform="rotate(${r} ${x} ${y})" ${f("sm")} ${t()} stroke-width=".8"/>`,
      )
      .join("")}
    <path d="M24 64 h66 q6 0 6 4 q0 4 -6 4 h-66 q-6 0 -6 -4 q0 -4 6 -4z" ${f("sm")} ${t()} stroke-width="1.6"/><circle cx="92" cy="68" r="1.4" ${f("ss")} ${t()} stroke-width=".8"/>
    <path d="M26 64 C 20 30, 78 30, 72 64 Z" ${f("sa")} ${t()} stroke-width="2" stroke-linejoin="round"/><path d="M27 61 C 40 64, 58 64, 71 61" fill="none" ${t()} stroke-width="1" opacity=".5"/>
    <path d="M49 43 V59 M49 46 l-6 -3.5 M49 51 l-7 -4 M49 56 l-7 -4 M49 46 l6 -3.5 M49 51 l7 -4 M49 56 l7 -4" fill="none" style="stroke:${MOLLICA}" stroke-width="2.2" stroke-linecap="round"/>
    ${[
      [38, 48, 0.9],
      [44, 45, 0.7],
      [52, 44, 1],
      [58, 46, 0.8],
      [48, 50, 0.6],
      [62, 51, 0.7],
      [34, 54, 0.6],
      [55, 49, 0.5],
    ]
      .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:${MOLLICA}" opacity=".85"/>`)
      .join("")}
    <path d="M74 64 V52 q0 -11 11 -11 q11 0 11 11 V64 Z" ${f("sa")} ${t()} stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M77 64 V53 q0 -8.5 8 -8.5 q8 0 8 8.5 V64 Z" style="fill:${MOLLICA}"/>${[
      [82, 52, 1.2, 0.8],
      [88, 55, 1, 0.7],
      [84, 59, 1.4, 0.9],
      [90, 61, 0.9, 0.6],
      [86, 49, 0.8, 0.6],
      [80, 62, 1, 0.7],
    ]
      .map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" ${f("sm")} opacity=".45"/>`)
      .join("")}
    <path d="M40 28 q-4 -5 0 -10 t0 -10 M49 25 q-4 -5 0 -10 t0 -10 M58 28 q-4 -5 0 -10 t0 -10" fill="none" ${t("sm")} stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`,

  vetrina: `<rect width="120" height="90" ${f("ss")}/>
    <rect x="10" y="14" width="100" height="76" ${f("sf")} ${t()} stroke-width="2"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${10 + i * 10} 14 h10 v10 q-5 6 -10 0z" ${f(i % 2 ? "sf" : "sa")} ${t()} stroke-width="1.4"/>`).join("")}
    <rect x="30" y="4" width="60" height="10" ${f("st")}/><text x="60" y="11.6" text-anchor="middle" font-size="6.5" letter-spacing="1.5" style="fill:var(--sf);font-family:var(--font-display)">FORNO</text>
    <rect x="16" y="32" width="54" height="40" ${f("ss")} ${t()} stroke-width="1.6"/>
    <line x1="16" y1="46" x2="70" y2="46" ${t()} stroke-width="1.2"/><line x1="16" y1="60" x2="70" y2="60" ${t()} stroke-width="1.2"/>
    ${[
      [24, 42],
      [36, 43],
      [50, 42],
      [62, 43],
      [28, 56],
      [44, 56],
      [58, 56],
      [24, 70],
      [40, 70],
      [56, 70],
    ]
      .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.4" ${f(i % 3 ? "sa" : "sm")} ${t()} stroke-width="1"/>`)
      .join("")}
    <path d="M22 34 l14 10 M40 34 l10 8" ${t("sf")} stroke-width="2" opacity=".7"/>
    <rect x="78" y="36" width="24" height="54" ${f("sa")} ${t()} stroke-width="1.8"/><rect x="82" y="40" width="16" height="22" ${f("ss")} ${t()} stroke-width="1.2"/><circle cx="97" cy="68" r="1.6" ${f("st")}/>
    <rect x="86" y="44" width="8" height="5" ${f("sf")} ${t()} stroke-width=".8"/>`,

  torta: `<rect width="120" height="90" ${f("ss")}/>
    ${[
      [14, 16],
      [104, 26],
      [20, 70],
      [98, 76],
      [30, 34],
      [92, 52],
    ]
      .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${2 + (i % 2)}" ${f(i % 2 ? "sa" : "sm")}/>`)
      .join("")}
    <path d="M36 80 h48 l-6 6 h-36z" ${f("sm")} ${t()} stroke-width="1.6"/><rect x="56" y="70" width="8" height="10" ${f("sm")} ${t()} stroke-width="1.4"/>
    <rect x="30" y="50" width="60" height="20" rx="3" ${f("sf")} ${t()} stroke-width="2"/>
    <rect x="38" y="30" width="44" height="20" rx="3" ${f("sa")} ${t()} stroke-width="2"/>
    <path d="M38 34 q4 8 8 0 q4 8 8 0 q4 8 8 0 q4 8 8 0 q4 8 8 0 q2 6 4 0" ${f("sf")} ${t()} stroke-width="1.4"/>
    <path d="M30 56 q5 8 10 0 q5 8 10 0 q5 8 10 0 q5 8 10 0 q5 8 10 0 q5 8 10 0" fill="none" ${t("sa")} stroke-width="2.4"/>
    <circle cx="60" cy="25" r="5" ${f("sa")} ${t()} stroke-width="1.8"/><path d="M60 20 q2 -8 8 -10" fill="none" ${t()} stroke-width="1.6"/>`,

  cornetto: `<rect width="120" height="90" ${f("ss")}/><circle cx="46" cy="44" r="34" ${f("sf")} opacity=".5"/>
    <rect y="74" width="120" height="16" ${f("sm")} opacity=".28"/><line x1="0" y1="74" x2="120" y2="74" ${t()} stroke-width="1.4"/>
    <ellipse cx="46" cy="72" rx="36" ry="6" ${f("sf")} ${t()} stroke-width="1.8"/><ellipse cx="46" cy="71" rx="26" ry="3.4" fill="none" ${t()} stroke-width=".8" opacity=".4"/>
    <path d="M46 36 C 58 36, 66 44, 68 52 C 74 56, 80 62, 79 71 C 73 66, 67 64, 62 64 C 55 66, 37 66, 30 64 C 25 64, 19 66, 13 71 C 12 62, 18 56, 24 52 C 26 44, 34 36, 46 36 Z" style="fill:color-mix(in oklab, var(--sa) 40%, #D99A45)" ${t()} stroke-width="2" stroke-linejoin="round"/>
    <path d="M24 52 C 30 54, 31 60, 30 64 M68 52 C 62 54, 61 60, 62 64" fill="none" ${t()} stroke-width="1.5" stroke-linecap="round"/>
    <path d="M36 39 C 33 46, 33 57, 37 65 M56 39 C 59 46, 59 57, 55 65" fill="none" ${t()} stroke-width="1.5" stroke-linecap="round"/>
    <path d="M13 71 C 16 67, 20 66, 24 66 M79 71 C 76 67, 72 66, 68 66" fill="none" ${t()} stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
    <path d="M40 42 q6 -3.5 12 0 M27 54 q2 -3 5 -3 M60 51 q3 0 5 3" fill="none" style="stroke:color-mix(in oklab, var(--sa) 15%, #FFE9B8)" stroke-width="1.8" stroke-linecap="round"/>
    ${[
      [42, 50],
      [49, 47],
      [45, 56],
      [34, 55],
      [57, 55],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" style="fill:#FFF1D0"/>`)
      .join("")}
    <ellipse cx="96" cy="72" rx="17" ry="4" ${f("sf")} ${t()} stroke-width="1.6"/>
    <path d="M84 70 l14 -3 q2 -.3 2 .7" fill="none" ${t()} stroke-width="1.2" stroke-linecap="round"/><ellipse cx="100.5" cy="67.3" rx="2" ry="1" ${f("sm")} ${t()} stroke-width=".8"/>
    <path d="M107 56 q7 -1 7 5 q0 6 -8 6" fill="none" ${t()} stroke-width="2.2" stroke-linecap="round"/>
    <path d="M83 52 h26 q-1 13 -6 16 q-7 3 -14 0 q-5 -3 -6 -16z" ${f("sf")} ${t()} stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M85 58 h22" fill="none" ${t("sa")} stroke-width="2"/>
    <ellipse cx="96" cy="52" rx="13" ry="3" style="fill:#3b2416" ${t()} stroke-width="1.6"/>
    <ellipse cx="96" cy="52.2" rx="8.5" ry="1.7" style="fill:color-mix(in oklab, var(--sa) 35%, #FFF3DC)"/><path d="M96 53.2 q-2.6 -1.4 -1.3 -2.3 q.9 -.5 1.3 .4 q.4 -.9 1.3 -.4 q1.3 .9 -1.3 2.3z" style="fill:#3b2416"/>
    <path d="M90 44 q-3 -4 0 -8 t0 -8 M96 42 q-3 -4 0 -8 t0 -8 M102 44 q-3 -4 0 -8 t0 -8" fill="none" ${t("sm")} stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`,
};

/** Le illustrazioni nell'ordine dell'attrezzo «immagini». */
export const ILLUSTRATION_ORDER: readonly IllustrationId[] = ["pane", "vetrina", "torta", "cornetto"];
