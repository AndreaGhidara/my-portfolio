import { deskLayers, type DeskShape } from "@/content/desk";

export type Placement = { x: number; y: number; rotate: number };
export type Beat = { from: number; span: number };

// Solo le proporzioni: le coordinate sono percentuali, la misura la da' il CSS.
export const WORLD = { width: 1440, height: 920 };

export type DeskDrawing = DeskShape | "laptop";

// Identico ai viewBox di scripts/build-desk.mjs, e un test lo verifica. Con una
// larghezza unica per tutti il telefono (74x148) uscirebbe dal tavolo.
export const SHAPE_BOX: Record<DeskDrawing, { w: number; h: number }> = {
  sheet: { w: 150, h: 96 },
  card: { w: 152, h: 78 },
  postit: { w: 126, h: 126 },
  plate: { w: 118, h: 54 },
  rack: { w: 132, h: 104 },
  phone: { w: 74, h: 148 },
  laptop: { w: 360, h: 240 },
};

// Il 5% in meno e' l'aria fra gli anelli: a misura piena restano 1,40 punti di
// minimo globale e 1,53 fra anelli, con 0,95 diventano 2,00 e 4,29.
export const DRAW_SCALE = 0.95;

// Server e client serializzano lo stesso numero in due stringhe diverse, e
// React segnala l'attributo che non combacia. Arrotondare alla sorgente le
// rende uguali; quattro decimali a 1440 sono un millesimo di pixel.
const DIGITS = 4;
const round = (n: number) => +n.toFixed(DIGITS);

// L'unica misura che il CSS riceve: l'altezza la da' l'aspect-ratio.
export function drawWidth(shape: DeskDrawing): number {
  return round((DRAW_SCALE * SHAPE_BOX[shape].w * 100) / WORLD.width);
}

// In percentuale dell'ALTEZZA del mondo, che non e' quadrato. Parte dalla
// larghezza arrotondata, come fa il browser, e non dal viewBox.
export function drawHeight(shape: DeskDrawing): number {
  const { w, h } = SHAPE_BOX[shape];
  return (drawWidth(shape) * h * WORLD.width) / (w * WORLD.height);
}

// Il solo disegno, senza etichetta: l'ingombro dell'oggetto e' objectFootprint.
export function objectExtent(shape: DeskDrawing, rotate: number): { x: number; y: number } {
  const f = objectFootprint(shape, rotate, false);
  return { x: f.x1, y: f.y1 };
}

// Lo spazio riservato all'etichetta, non il testo vero: la geometria non puo'
// dipendere da una traduzione. Ogni numero traduce una dichiarazione di
// styles/sections/desk.css, e layers.test.ts li rilegge: un ingombro piu'
// piccolo del vero sfuggirebbe alle prove di sovrapposizione.
export const LABEL = {
  width: 7.7,
  height: 2.6,
  // In frazione dell'altezza del disegno (in CSS: top 104%).
  gap: 0.04,
  em: 1.197,
};

// Scostamenti dal centro, non simmetrici: l'etichetta sta solo sotto.
export function objectFootprint(
  shape: DeskDrawing,
  rotate: number,
  labelled: boolean,
): { x0: number; x1: number; y0: number; y1: number } {
  const halfX = drawWidth(shape) / 2;
  const halfY = drawHeight(shape) / 2;
  let x0 = -halfX;
  let x1 = halfX;
  const y0 = -halfY;
  let y1 = halfY;
  if (labelled) {
    const em = LABEL.em;
    const labelX = (LABEL.width * em) / 2;
    // L'em e' una frazione della LARGHEZZA del mondo: va riportato sull'altezza.
    const labelY = LABEL.height * em * (WORLD.width / WORLD.height);
    x0 = Math.min(x0, -labelX);
    x1 = Math.max(x1, labelX);
    y1 = halfY + LABEL.gap * halfY * 2 + labelY;
  }
  const radians = (rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  // Il CSS ruota in pixel, e qui x e y sono quote di lati diversi: si passa in
  // pixel, si ruota, si torna (k = altezza/larghezza del mondo).
  const k = WORLD.height / WORLD.width;
  const corners = [
    [x0, y0],
    [x1, y0],
    [x0, y1],
    [x1, y1],
  ].map(([x, y]) => [x * cos - y * k * sin, (x * sin) / k + y * cos]);
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
}

// `caption` e' la striscia sotto il laptop: il primo strato non ci deve arrivare.
export const CENTRE = { width: 21, caption: 3.0 };

export function centreBox(): {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
} {
  const halfX = CENTRE.width / 2;
  const halfY =
    ((CENTRE.width * SHAPE_BOX.laptop.h) / SHAPE_BOX.laptop.w / 2) *
    (WORLD.width / WORLD.height);
  return { x0: 50 - halfX, x1: 50 + halfX, y0: 50 - halfY, y1: 50 + halfY + CENTRE.caption };
}

export const OBJECTS_PER_LAYER = 6;

// Raggi, angoli di partenza e scostamenti sono tarati insieme contro
// objectFootprint: piu' di 2,0 punti fra due cose qualsiasi, piu' di 4,2 fra
// anelli diversi (le due prove di layers.test.ts). Gli anelli restano annidati,
// e si ritoccano tutti insieme o nessuno.
const RADII: { rx: number; ry: number }[] = [
  { rx: 14.97, ry: 26.28 },
  { rx: 28.17, ry: 30.16 },
  { rx: 41.13, ry: 31.21 },
  { rx: 42.43, ry: 32.74 },
];

// Sfalsati: allineati, i quattro strati formavano dei raggi.
const START_ANGLE: number[] = [81.09, 166.32, 115.17, 147.81];

// Ventiquattro scostamenti e non sei condivisi: con lo stesso schema i quattro
// anelli allineavano i loro grappoli e fra anelli restavano 1,53 punti. Media
// zero per strato: la rotazione dell'anello sta in START_ANGLE.
const ANGLE_OFFSET: number[][] = [
  [-12.71, 3.32, 1.05, 11.32, -1.78, -1.19],
  [-1.17, -25.2, 27.49, -2.06, -24.23, 25.19],
  [-0.49, 14.55, -7.05, -0.94, -4.15, -1.9],
  [-7.06, 11.24, -17.12, -6.61, 14.34, 5.23],
];

// In percentuale di mezzo mondo.
const PAD = 2.4;

// Il raggio su cui DeskStage tara l'apertura: sta qui perche' una copia a mano
// non seguirebbe una ritaratura dei raggi.
export const FIRST_RING_REACH = RADII[0].ry + PAD;

// Scostamento dal centro in percentuale di mezza larghezza e mezza altezza.
function onRect(angle: number, rx: number, ry: number): [number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = Math.min(rx / Math.max(Math.abs(c), 1e-6), ry / Math.max(Math.abs(s), 1e-6));
  return [t * c, t * s];
}

// Qui e non nei test: disegno e prova devono partire dalla stessa misura.
export function objectBox(
  layer: number,
  index: number,
): { x0: number; x1: number; y0: number; y1: number } {
  const object = deskLayers[layer].objects[index];
  const placement = placeObject(layer, index);
  const f = objectFootprint(object.shape, placement.rotate, !object.mute);
  return {
    x0: placement.x + f.x0,
    x1: placement.x + f.x1,
    y0: placement.y + f.y0,
    y1: placement.y + f.y1,
  };
}

export function placeObject(layer: number, index: number): Placement {
  const count = OBJECTS_PER_LAYER;
  const { rx, ry } = RADII[layer];
  const angle =
    ((START_ANGLE[layer] + index * (360 / count) + ANGLE_OFFSET[layer][index]) * Math.PI) / 180;
  const [dx, dy] = onRect(angle, rx + PAD, ry + PAD);
  // Niente Math.random: server e client devono disegnare lo stesso tavolo.
  const rotate = (((layer * 7 + index * 13) % 11) - 5) * 1.4;
  // Arrotondati qui perche' le prove misurino i numeri che il browser disegna.
  return { x: round(50 + dx), y: round(50 + dy), rotate: round(rotate) };
}

// Le finestre si sovrappongono: e' cosi' che l'arco sta in 380vh.
const BEAT_SPAN = 0.26;
const BEAT_STEP = 0.18;
const FIRST_LAYER_AT = 0.1;

export const LAYER_BEATS: Beat[] = deskLayers.map((_, i) => ({
  from: +(FIRST_LAYER_AT + i * BEAT_STEP).toFixed(4),
  span: BEAT_SPAN,
}));

export const TITLE_BEAT: Beat = { from: 0.02, span: 0.08 };

export const PUNCH_BEAT: Beat = { from: 0.9, span: 0.07 };

// Sotto la camera le didascalie stanno nello stesso posto e si danno il
// cambio: per questo `until` e non `span`. L'ultima lascia il posto alla tesi.
export type CaptionBeat = { from: number; until: number };

export const CAPTION_BEATS: CaptionBeat[] = LAYER_BEATS.map((beat, i) => ({
  from: beat.from,
  until: LAYER_BEATS[i + 1]?.from ?? PUNCH_BEAT.from,
}));

export function objectBeat(layer: number, index: number, count: number): Beat {
  const { from, span } = LAYER_BEATS[layer];
  const stagger = span * 0.35;
  return {
    from: +(from + (stagger * index) / count).toFixed(4),
    span: +(span - stagger).toFixed(4),
  };
}

// Esponenziale: una camera che arretra copre la stessa distanza in percentuale,
// non in pixel. Lineare sembrerebbe frenare alla fine.
export function cameraScale(p: number, from: number, to: number): number {
  const t = Math.min(Math.max(p, 0), 1);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return from * Math.pow(to / from, eased);
}
