import { deskLayers, type DeskShape } from "@/content/desk";

export type DeskLayout = "wide" | "tall";
export type Placement = { x: number; y: number; rotate: number };
export type Beat = { from: number; span: number };

/**
 * Le proporzioni del mondo, e nient'altro. Le coordinate degli oggetti sono
 * in percentuale: il mondo prende la misura che vuole dal CSS (aspect-ratio
 * piu' width) e qui dentro non si sa quanto e' grande lo schermo. E' lo stesso
 * trucco del filo, che usa un viewBox in percentuali per non ricalcolare nulla.
 */
export const WORLD: Record<DeskLayout, { width: number; height: number }> = {
  wide: { width: 1440, height: 920 },
  tall: { width: 720, height: 1280 },
};

/** Il laptop non e' uno degli oggetti dello schedario: e' il centro, ed e' una
 *  sagoma anche lui. */
export type DeskDrawing = DeskShape | "laptop";

/**
 * Il viewBox di ogni sagoma, identico a quello che scrive scripts/build-desk.mjs
 * (un test lo verifica: i due file non possono divergere). La misura di un
 * disegno e' un dato del disegno, non una percentuale scelta nel CSS: a una
 * larghezza unica per tutti il telefono, che e' 74x148, verrebbe alto il doppio
 * di un foglio e uscirebbe dal tavolo.
 *
 * Stanno qui e non nel componente perche' servono anche ai test: e' con questi
 * che si sa dove finisce il bordo di un oggetto, e non solo dov'e' il suo centro.
 */
export const SHAPE_BOX: Record<DeskDrawing, { w: number; h: number }> = {
  sheet: { w: 150, h: 96 },
  card: { w: 152, h: 78 },
  postit: { w: 126, h: 126 },
  plate: { w: 118, h: 54 },
  rack: { w: 132, h: 104 },
  phone: { w: 74, h: 148 },
  laptop: { w: 360, h: 240 },
};

/**
 * Quanto si disegna piu' piccolo nel mondo verticale. A misura naturale un
 * foglio occuperebbe un quinto della larghezza del telefono (150 su 720) e i
 * quattro strati non ci starebbero: il mondo verticale e' largo la meta' di
 * quello orizzontale, e i disegni lo seguono.
 */
export const DRAW_SCALE: Record<DeskLayout, number> = { wide: 1, tall: 0.5 };

/** Larghezza del disegno, in percentuale della larghezza del mondo. E' l'unica
 *  misura che il CSS riceve: l'altezza la porta l'aspect-ratio della sagoma. */
export function drawWidth(layout: DeskLayout, shape: DeskDrawing): number {
  return (DRAW_SCALE[layout] * SHAPE_BOX[shape].w * 100) / WORLD[layout].width;
}

/**
 * Mezza larghezza e mezza altezza del disegno, inclinazione compresa, in
 * percentuale del mondo. Le due percentuali non si calcolano allo stesso modo
 * perche' il mondo non e' quadrato: la larghezza si misura sulla larghezza del
 * mondo, l'altezza sulla sua altezza — ed e' esattamente la trappola in cui si
 * cade scrivendo una percentuale sola per tutti e due i lati.
 */
export function objectExtent(
  layout: DeskLayout,
  shape: DeskDrawing,
  rotate: number,
): { x: number; y: number } {
  const { w, h } = SHAPE_BOX[shape];
  const halfX = (DRAW_SCALE[layout] * w * 100) / WORLD[layout].width / 2;
  const halfY = (DRAW_SCALE[layout] * h * 100) / WORLD[layout].height / 2;
  const radians = (Math.abs(rotate) * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: halfX * cos + halfY * sin, y: halfX * sin + halfY * cos };
}

/**
 * Il centro. La sua misura non viene dal viewBox come per gli altri: e' il
 * centro della composizione, e la decide la composizione. `caption` e' la
 * striscia sotto il laptop dove sta la parola: fa parte dell'ingombro, perche'
 * e' li' che il primo strato non deve arrivare.
 */
export const CENTRE = { width: 21, caption: 3.0 };

/** Il rettangolo occupato dal centro, in percentuale del mondo. */
export function centreBox(layout: DeskLayout): {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
} {
  const halfX = CENTRE.width / 2;
  const halfY =
    ((CENTRE.width * SHAPE_BOX.laptop.h) / SHAPE_BOX.laptop.w / 2) *
    (WORLD[layout].width / WORLD[layout].height);
  return { x0: 50 - halfX, x1: 50 + halfX, y0: 50 - halfY, y1: 50 + halfY + CENTRE.caption };
}

/**
 * Sul telefono si mostrano quattro oggetti per strato invece di sei. I due che
 * restano fuori spariscono dal DISEGNO, non dalla lista: il DOM e' lo stesso.
 */
export const OBJECTS_PER_LAYER: Record<DeskLayout, number> = { wide: 6, tall: 4 };

/**
 * I raggi di ogni strato, in percentuale del mondo, contati dal centro. Gli
 * oggetti stanno sul perimetro di un rettangolo e non di un'ellisse: un tavolo
 * e' rettangolare, e agli angoli di un cerchio resta spazio sprecato.
 *
 * Il primo strato e' l'unico tarato a mano: e' quello che sfiora il laptop, e i
 * suoi due raggi sono i piu' piccoli che tengono il disegno di un foglio fuori
 * dall'ingombro del centro (wide.ry e tall.rx). Un test lo verifica coi bordi
 * veri delle sagome, non coi centri.
 */
const RADII: Record<DeskLayout, { rx: number; ry: number }[]> = {
  wide: [
    { rx: 14.9, ry: 18.0 },
    { rx: 23.8, ry: 23.9 },
    { rx: 31.8, ry: 31.0 },
    { rx: 39.4, ry: 37.0 },
  ],
  tall: [
    { rx: 17.5, ry: 15.6 },
    { rx: 21.1, ry: 25.8 },
    { rx: 28.9, ry: 34.4 },
    { rx: 36.1, ry: 42.2 },
  ],
};

/** Da dove parte a distribuire gli oggetti ogni strato. Sfalsati apposta:
 *  allineati, i quattro strati formavano dei raggi e sembrava un sole.
 *  Nel mondo verticale il terzo strato e' fuori asse (-70 e non -90): sull'asse
 *  finiva sulla stessa riga del primo, e le due etichette si scrivevano addosso
 *  ai lati del laptop. */
const START_ANGLE: Record<DeskLayout, number[]> = {
  wide: [-95, -118, -88, -108],
  tall: [-90, -45, -70, -45],
};

/** Distanza fra il perimetro dello strato e il centro dell'oggetto, in % di mezzo mondo. */
const PAD = 2.4;

/**
 * Intersezione fra un raggio e il perimetro di un rettangolo. Restituisce lo
 * scostamento dal centro, in percentuale di mezza larghezza / mezza altezza.
 */
function onRect(angle: number, rx: number, ry: number): [number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = Math.min(rx / Math.max(Math.abs(c), 1e-6), ry / Math.max(Math.abs(s), 1e-6));
  return [t * c, t * s];
}

export function placeObject(layout: DeskLayout, layer: number, index: number): Placement {
  const count = OBJECTS_PER_LAYER[layout];
  const { rx, ry } = RADII[layout][layer];
  const angle = ((START_ANGLE[layout][layer] + index * (360 / count)) * Math.PI) / 180;
  const [dx, dy] = onRect(angle, rx + PAD, ry + PAD);
  // Deterministico: nessun Math.random. Il tavolo deve uscire identico a ogni
  // render, o server e client disegnano due tavoli diversi e React protesta.
  const rotate = (((layer * 7 + index * 13) % 11) - 5) * 1.4;
  return { x: 50 + dx, y: 50 + dy, rotate };
}

/**
 * Le quattro finestre si sovrappongono: prima che uno strato abbia finito di
 * entrare, il successivo e' gia' cominciato. E' questo che fa stare in 380vh
 * l'arco che nel prototipo occupava 560vh.
 */
const BEAT_SPAN = 0.26;
const BEAT_STEP = 0.18;
const FIRST_LAYER_AT = 0.1;

export const LAYER_BEATS: Beat[] = deskLayers.map((_, i) => ({
  from: +(FIRST_LAYER_AT + i * BEAT_STEP).toFixed(4),
  span: BEAT_SPAN,
}));

/** Il titolo se ne va prima che entri il primo foglio: non si leggono insieme. */
export const TITLE_BEAT: Beat = { from: 0.02, span: 0.08 };

/** La tesi arriva a tavolo completo, e non un attimo prima. */
export const PUNCH_BEAT: Beat = { from: 0.9, span: 0.07 };

/**
 * Dentro uno strato gli oggetti non compaiono tutti insieme: si sfalsano sul
 * primo terzo della finestra, e finiscono comunque insieme allo strato.
 */
export function objectBeat(layer: number, index: number, count: number): Beat {
  const { from, span } = LAYER_BEATS[layer];
  const stagger = span * 0.35;
  return {
    from: +(from + (stagger * index) / count).toFixed(4),
    span: +(span - stagger).toFixed(4),
  };
}

/**
 * Interpolazione esponenziale, non lineare: una telecamera che arretra a
 * velocita' costante copre in percentuale sempre la stessa distanza, non in
 * pixel. Lineare, il movimento sembra frenare alla fine.
 */
export function cameraScale(p: number, from: number, to: number): number {
  const t = Math.min(Math.max(p, 0), 1);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return from * Math.pow(to / from, eased);
}
