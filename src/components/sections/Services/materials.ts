import { palette } from "@/styles/palette";
import { contrastRatio } from "@/styles/contrast";

// Le ricette sono numeri perche' il difetto era numerico: in tema scuro
// cartoncino e scocca cadevano sullo stesso colore (1.00:1), e nessuna prova
// testuale lo vedeva. Il CSS resta l'unico che dipinge, e una prova verifica
// che dichiari esattamente queste ricette.

export type Theme = "light" | "dark";

export type Token = "bg" | "fg" | "fg-muted" | "ink" | "bulb";

// La stessa inversione di tokens.css su :root e [data-theme="dark"], e una
// prova verifica che i due file coincidano.
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

export type Recipe = { token: Token } | { a: Token; pct: number; b: Token };

export type Family = "paper" | "device" | "fixed";

export type Coat = {
  fill: Recipe;
  /** `null`: non lo dichiara, lo eredita. */
  line: Recipe | null;
};

export type Surface = {
  // Il selettore come apre la regola in styles/sections/desk.css: la prova
  // del contratto toglie graffa o virgola e lo cerca intero. In tema scuro e'
  // lo stesso preceduto da `[data-theme="dark"] `.
  anchor: string;
  family: Family;
  light: Coat;
  dark: Coat;
};

export type SurfaceName = "sheet" | "card" | "plate" | "shell" | "postit" | "blank";

const mix = (a: Token, pct: number, b: Token): Recipe => ({ a, pct, b });

// Due superfici la spendono, il foglio e il post-it bianco: una copia sola.
const PALEST_PAPER: Record<Theme, Recipe> = {
  light: mix("fg", 9, "bg"),
  dark: mix("fg", 68, "bg"),
};

// In chiaro la carta sta appena sotto il fondo e l'apparecchio va a nero; in
// scuro la carta brilla e l'apparecchio resta basso, tenuto su da tratto e led.
// I segni sulla carta restano scuri in tutti e due i temi.
export const SURFACES: Record<SurfaceName, Surface> = {
  sheet: {
    anchor: '[data-desk-piece][data-shape="sheet"] {',
    family: "paper",
    light: { fill: PALEST_PAPER.light, line: { token: "fg-muted" } },
    dark: { fill: PALEST_PAPER.dark, line: mix("ink", 60, "fg-muted") },
  },
  card: {
    anchor: '[data-desk-piece][data-shape="card"] {',
    family: "paper",
    light: { fill: mix("fg", 20, "bg"), line: mix("fg", 80, "bg") },
    dark: { fill: mix("fg", 58, "bg"), line: mix("ink", 85, "fg-muted") },
  },
  plate: {
    anchor: '[data-desk-piece][data-shape="plate"] {',
    family: "paper",
    light: { fill: mix("fg-muted", 55, "bg"), line: mix("fg-muted", 80, "fg") },
    dark: { fill: mix("fg-muted", 75, "bg"), line: mix("ink", 62, "fg-muted") },
  },
  // Rack, telefono e laptop: la stessa scatola scura.
  shell: {
    anchor: '[data-desk-piece][data-shape="rack"],',
    family: "device",
    light: { fill: mix("ink", 78, "fg-muted"), line: mix("ink", 42, "fg-muted") },
    dark: { fill: mix("ink", 82, "fg-muted"), line: mix("ink", 30, "fg-muted") },
  },
  // Fisso: un post-it giallo e' giallo anche di notte.
  postit: {
    anchor: '[data-desk-piece][data-shape="postit"] {',
    family: "fixed",
    light: { fill: { token: "bulb" }, line: mix("bulb", 55, "ink") },
    dark: { fill: { token: "bulb" }, line: mix("bulb", 55, "ink") },
  },
  // Il pieno e' quello del foglio, letto e non ricopiato. Il tratto non lo
  // dichiara: eredita il giallo spento degli altri post-it.
  blank: {
    anchor: '[data-desk-piece][data-shape="postit"] [data-desk-blank] {',
    family: "paper",
    light: { fill: PALEST_PAPER.light, line: null },
    dark: { fill: PALEST_PAPER.dark, line: null },
  },
};

// Colore e non forma, quindi nessuna maschera li porta. Fissi nei due temi.
export const LEDS = {
  shapes: ["rack"] as const,
  on: { token: "bulb" } as Recipe,
  off: mix("bulb", 20, "ink"),
};

export const hasLeds = (drawing: string): boolean =>
  (LEDS.shapes as readonly string[]).includes(drawing);

// Dichiarata per tema: in scuro --bg e' --ink, e un'ombra d'inchiostro avrebbe
// la luminanza esatta del fondo.
export const SHADOW: Record<Theme, { token: Token; pct: number }> = {
  light: { token: "ink", pct: 26 },
  // Niente e' piu' scuro del piano: l'ombra diventa un contatto che schiarisce,
  // sotto il pieno della scocca (1.27 sul fondo) per non confondersi col bordo.
  dark: { token: "fg-muted", pct: 14 },
};

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

// La trasformazione di Björn Ottosson.
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

// `color-mix(in oklab, a pct%, b)` calcolato: dal browser le custom property
// escono come oklab() non risolto. Verificata contro i pixel di un canvas 1x1
// su tutte le miscele del tavolo.
export function mixOklab(a: string, pct: number, b: string): string {
  const A = toOklab(hexToRgb(a));
  const B = toOklab(hexToRgb(b));
  const t = pct / 100;
  const mixed = [0, 1, 2].map((i) => A[i] * t + B[i] * (1 - t)) as [number, number, number];
  return rgbToHex(fromOklab(mixed));
}

export function tint(theme: Theme, recipe: Recipe): string {
  const token = THEME_TOKENS[theme];
  if ("token" in recipe) return token[recipe.token];
  return mixOklab(token[recipe.a], recipe.pct, token[recipe.b]);
}

export function shadowOverBg(theme: Theme): string {
  const { token, pct } = SHADOW[theme];
  const shade = hexToRgb(THEME_TOKENS[theme][token]);
  const bg = hexToRgb(THEME_TOKENS[theme].bg);
  const alpha = pct / 100;
  return rgbToHex([0, 1, 2].map((i) => alpha * shade[i] + (1 - alpha) * bg[i]));
}

export function separation(theme: Theme, one: Recipe, other: Recipe): number {
  return contrastRatio(tint(theme, one), tint(theme, other));
}

export function recipeCss(recipe: Recipe): string {
  return "token" in recipe
    ? `var(--${recipe.token})`
    : `color-mix(in oklab, var(--${recipe.a}) ${recipe.pct}%, var(--${recipe.b}))`;
}

export function shadowCss(theme: Theme): string {
  return `color-mix(in oklab, var(--${SHADOW[theme].token}) ${SHADOW[theme].pct}%, transparent)`;
}

// Il minimo perche' il tavolo resti quattro tipi di cosa e non quattro
// contorni della stessa famiglia.
export const THRESHOLD = {
  families: 3.0,
  steps: 1.25,
  // Ogni pieno contro il fondo. Il post-it giallo e' l'eccezione dichiarata.
  ground: 1.2,
  outline: 1.5,
  shadow: 1.15,
} as const;
