import { palette } from "@/styles/palette";
import { contrastRatio } from "@/styles/contrast";

/**
 * La scala dei materiali del tavolo: quale pieno e quale tratto tocca a ogni
 * superficie, in ognuno dei due temi.
 *
 * Perche' esista un modulo e non solo il foglio di stile: la prima stesura
 * dichiarava UNA tavola sola per tutti e due i temi, e in tema scuro il
 * cartoncino (`--fg` 15% su `--bg`) e la scocca (`--ink` 78% con `--fg-muted`)
 * finivano sullo stesso identico colore — 1.00:1. Non era un valore sbagliato,
 * era strutturale: la carta segue il tema e in scuro SALE, l'apparecchio e'
 * fisso ma schiarito per non fare nero-su-nero e in scuro sale anche lui. Le
 * due famiglie si incrociano, e nessuna tavolozza unica puo' impedirlo.
 *
 * Il difetto era numerico, non testuale: una suite da 210 prove non lo ha visto,
 * e una prova che leggesse il CSS come stringa non lo avrebbe visto lo stesso.
 * Qui le ricette sono NUMERI, la miscelazione in oklab e' calcolabile, e le
 * distanze fra le superfici diventano soglie che una prova puo' guardare.
 * Il foglio di stile resta l'unico che dipinge: una seconda prova verifica che
 * dichiari esattamente queste ricette, cosi' i due file non possono divergere.
 */

export type Theme = "light" | "dark";

/** I soli token che i materiali hanno il permesso di spendere. */
export type Token = "bg" | "fg" | "fg-muted" | "ink" | "bulb";

/**
 * I token risolti, tema per tema: e' la stessa inversione che `tokens.css`
 * dichiara su `:root` e su `[data-theme="dark"]` (una prova verifica che i due
 * file dicano la stessa cosa). E' questa tabella a rendere calcolabile il
 * difetto: senza di lei "la carta sale in scuro" resta una frase.
 */
export const THEME_TOKENS: Record<Theme, Record<Token, string>> = {
  light: {
    bg: palette.paper,
    fg: palette.ink,
    "fg-muted": palette.muted,
    ink: palette.ink,
    bulb: palette.bulb,
  },
  dark: {
    bg: palette.ink,
    fg: palette.paper,
    "fg-muted": palette.mutedDark,
    ink: palette.ink,
    bulb: palette.bulb,
  },
};

/** Un token nudo, oppure una miscela in oklab fra due token. Mai un hex. */
export type Recipe = { token: Token } | { a: Token; pct: number; b: Token };

export type Family = "carta" | "apparecchio" | "fisso";

export type Coat = {
  /** `--desk-pieno`: la superficie. */
  fill: Recipe;
  /** `--desk-tratto`: il contorno. `null` = non lo dichiara, lo eredita. */
  line: Recipe | null;
};

export type Surface = {
  /**
   * La PRIMA RIGA, esatta, della regola che porta la ricetta in `tokens.css`.
   * La regola del tema scuro e' la stessa preceduta da `[data-theme="dark"] `.
   * E' un ancoraggio per la prova del contratto, non un selettore da usare
   * altrove: si cerca a capo riga perche' `[data-desk-shape] {` e' contenuto
   * per intero dentro `[data-theme="dark"] [data-desk-shape] {`.
   */
  anchor: string;
  family: Family;
  light: Coat;
  dark: Coat;
};

export type SurfaceName = "sheet" | "card" | "plate" | "shell" | "postit" | "blank";

const mix = (a: Token, pct: number, b: Token): Recipe => ({ a, pct, b });

/**
 * La carta piu' chiara della famiglia. Sta in una costante perche' due
 * superfici la spendono — il foglio e il post-it bianco — e due copie a mano
 * dello stesso numero sono due copie che un giorno divergono.
 */
const PALEST_PAPER: Record<Theme, Recipe> = {
  light: mix("fg", 9, "bg"),
  dark: mix("fg", 68, "bg"),
};

/**
 * La tavola. Il disegno, in una riga: in tema chiaro la carta sta appena sotto
 * il fondo e l'apparecchio precipita a nero; in tema scuro si scambiano i
 * mestieri — la carta e' la cosa che brilla, l'apparecchio resta basso vicino
 * al fondo e a tenerlo su sono il tratto e i led. In una stanza buia una
 * scatola nera su una scrivania scura non si legge per il suo pieno: si legge
 * per i suoi riflessi.
 *
 * L'ordine dentro la famiglia carta non cambia mai — il foglio e' la carta piu'
 * chiara, la piastra la piu' scura: cambia il piano su cui appoggiano. E i
 * segni sulla carta sono scuri in tutti e due i temi, perche' una matita e' una
 * matita: in chiaro sono grafite tirata verso l'inchiostro, in scuro sono
 * inchiostro vero schiarito quel tanto che basta a non essere un buco.
 */
export const SURFACES: Record<SurfaceName, Surface> = {
  /* Il foglio: la carta piu' chiara della famiglia, bordo grafite. */
  sheet: {
    anchor: '[data-desk-piece][data-shape="sheet"] {',
    family: "carta",
    light: { fill: PALEST_PAPER.light, line: { token: "fg-muted" } },
    dark: { fill: PALEST_PAPER.dark, line: mix("ink", 60, "fg-muted") },
  },
  /* La scheda: cartoncino, e il bordo di inchiostro — e' stampata. */
  card: {
    anchor: '[data-desk-piece][data-shape="card"] {',
    family: "carta",
    light: { fill: mix("fg", 20, "bg"), line: mix("fg", 80, "bg") },
    dark: { fill: mix("fg", 58, "bg"), line: mix("ink", 85, "fg-muted") },
  },
  /* La piastra: l'unica cosa di metallo sul tavolo. */
  plate: {
    anchor: '[data-desk-piece][data-shape="plate"] {',
    family: "carta",
    light: { fill: mix("fg-muted", 55, "bg"), line: mix("fg-muted", 80, "fg") },
    dark: { fill: mix("fg-muted", 75, "bg"), line: mix("ink", 62, "fg-muted") },
  },
  /* La scocca: rack, telefono e laptop sono la stessa cosa, scatole scure. */
  shell: {
    anchor: '[data-desk-piece][data-shape="rack"],',
    family: "apparecchio",
    light: { fill: mix("ink", 78, "fg-muted"), line: mix("ink", 42, "fg-muted") },
    dark: { fill: mix("ink", 82, "fg-muted"), line: mix("ink", 30, "fg-muted") },
  },
  /* Il post-it: fisso in tutti e due i temi. Un post-it giallo e' giallo di
     notte, ed e' l'unico calore del tavolo che non sia arancio. */
  postit: {
    anchor: '[data-desk-piece][data-shape="postit"] {',
    family: "fisso",
    light: { fill: { token: "bulb" }, line: mix("bulb", 55, "ink") },
    dark: { fill: { token: "bulb" }, line: mix("bulb", 55, "ink") },
  },
  /* Il post-it BIANCO: la spec lo chiama cosi' (§3.2), ed e' il solo oggetto
     del tavolo che si preme. Prende il pieno della carta piu' chiara — LO
     STESSO del foglio, letto da li' e non ricopiato — e il tratto non lo
     dichiara: eredita il giallo spento degli altri post-it. Resta un post-it,
     ma vuoto, che e' quello che la spec chiede e che i pieni hanno smesso di
     dire il giorno in cui sono arrivati. */
  blank: {
    anchor: '[data-desk-piece][data-shape="postit"] [data-desk-blank] {',
    family: "carta",
    light: { fill: PALEST_PAPER.light, line: null },
    dark: { fill: PALEST_PAPER.dark, line: null },
  },
};

/**
 * I led del rack: l'unico strato che una maschera non sa portare, perche' una
 * maschera e' una forma e un led e' un colore. Tre accesi e uno spento, come un
 * rack vero, e fissi in tutti e due i temi: una spia accesa e' accesa di notte.
 */
export const LEDS = {
  /** Le sagome che li portano. Il componente lo chiede qui invece di sapere a
   *  memoria che il rack e' il rack. */
  shapes: ["rack"] as const,
  on: { token: "bulb" } as Recipe,
  off: mix("bulb", 20, "ink"),
};

export const hasLeds = (drawing: string): boolean =>
  (LEDS.shapes as readonly string[]).includes(drawing);

/**
 * L'ombra portata. Era `--ink` al 26% in tutti e due i temi, e in tema scuro
 * `--bg` E' `--ink`: aveva esattamente la luminanza del fondo su cui cadeva,
 * cioe' matematicamente non c'era. Anche lei si dichiara due volte.
 */
export const SHADOW: Record<Theme, { token: Token; pct: number }> = {
  light: { token: "ink", pct: 26 },
  /* In tema scuro non esiste niente di piu' scuro del fondo da mettere sotto un
     oggetto: --bg E' --ink, e il piu' nero della palette e' il piano stesso.
     L'ombra diventa allora quello che in una stanza buia si vede davvero — il
     contatto che schiarisce appena attorno alla sagoma, non il buio sotto. Sta
     sotto il pieno della scocca (1.27 sul fondo) apposta: deve staccare
     l'oggetto dal piano senza confondersi col suo bordo. */
  dark: { token: "fg-muted", pct: 14 },
};

/* ── Il colore, calcolato ───────────────────────────────────────────────── */

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toSrgb = (v: number) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) / 255);
  return [r, g, b];
}

function rgbToHex(rgb: number[]): string {
  return `#${rgb
    .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** sRGB → oklab, la trasformazione di Björn Ottosson. */
function toOklab([r, g, b]: [number, number, number]): [number, number, number] {
  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]: [number, number, number]): number[] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/**
 * `color-mix(in oklab, a pct%, b)`, calcolato invece che letto.
 * Leggere il valore risolto dal browser NON funziona: le custom property
 * escono come `oklab(...)` non risolto, e a parsarle come stringa si ottengono
 * numeri falsi. Questa funzione e' stata verificata contro i pixel veri
 * (colore dipinto in un canvas 1x1 e riletto) su tutte le miscele del tavolo.
 */
export function mixOklab(a: string, pct: number, b: string): string {
  const A = toOklab(hexToRgb(a));
  const B = toOklab(hexToRgb(b));
  const t = pct / 100;
  const mixed = [0, 1, 2].map((i) => A[i] * t + B[i] * (1 - t)) as [number, number, number];
  return rgbToHex(fromOklab(mixed));
}

/** Il colore vero di una ricetta in un tema: quello che il browser dipinge. */
export function tint(theme: Theme, recipe: Recipe): string {
  const token = THEME_TOKENS[theme];
  if ("token" in recipe) return token[recipe.token];
  return mixOklab(token[recipe.a], recipe.pct, token[recipe.b]);
}

/** Il colore dell'ombra composto sul fondo: e' li' che si vede o non si vede. */
export function shadowOverBg(theme: Theme): string {
  const { token, pct } = SHADOW[theme];
  const shade = hexToRgb(THEME_TOKENS[theme][token]);
  const bg = hexToRgb(THEME_TOKENS[theme].bg);
  const alpha = pct / 100;
  return rgbToHex([0, 1, 2].map((i) => alpha * shade[i] + (1 - alpha) * bg[i]));
}

/** La distanza fra due ricette dello stesso tema, in rapporto di contrasto. */
export function separation(theme: Theme, one: Recipe, other: Recipe): number {
  return contrastRatio(tint(theme, one), tint(theme, other));
}

/* ── Le ricette, come le scrive il foglio di stile ──────────────────────── */

export function recipeCss(recipe: Recipe): string {
  return "token" in recipe
    ? `var(--${recipe.token})`
    : `color-mix(in oklab, var(--${recipe.a}) ${recipe.pct}%, var(--${recipe.b}))`;
}

export function shadowCss(theme: Theme): string {
  return `color-mix(in oklab, var(--${SHADOW[theme].token}) ${SHADOW[theme].pct}%, transparent)`;
}

/**
 * Le soglie. Non sono gusto: sono il minimo perche' il tavolo resti quattro
 * tipi di cosa invece di quattro contorni della stessa famiglia.
 */
export const THRESHOLD = {
  /** Fra due famiglie diverse: la carta e l'apparecchio non si toccano mai. */
  families: 3.0,
  /** Fra due gradini della stessa famiglia: foglio, scheda e piastra. */
  steps: 1.25,
  /** Ogni pieno contro il fondo: una superficie che non si stacca non e' una
   *  superficie. Il post-it giallo e' l'eccezione dichiarata (vedi la prova). */
  ground: 1.2,
  /** Il tratto contro il suo pieno: e' il disegno, e deve restare visibile. */
  outline: 1.5,
  /** L'ombra composta sul fondo: sotto questo valore non c'e'. */
  shadow: 1.15,
} as const;
