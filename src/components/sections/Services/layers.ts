import { deskLayers } from "@/content/desk";

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

/**
 * Sul telefono si mostrano quattro oggetti per strato invece di sei. I due che
 * restano fuori spariscono dal DISEGNO, non dalla lista: il DOM e' lo stesso.
 */
export const OBJECTS_PER_LAYER: Record<DeskLayout, number> = { wide: 6, tall: 4 };

/**
 * I raggi di ogni strato, in percentuale di mezza larghezza e mezza altezza.
 * Gli oggetti stanno sul perimetro di un rettangolo e non di un'ellisse: un
 * tavolo e' rettangolare, e agli angoli di un cerchio resta spazio sprecato.
 */
const RADII: Record<DeskLayout, { rx: number; ry: number }[]> = {
  wide: [
    { rx: 14.9, ry: 16.3 },
    { rx: 23.8, ry: 23.9 },
    { rx: 31.8, ry: 31.0 },
    { rx: 39.4, ry: 37.0 },
  ],
  tall: [
    { rx: 13.3, ry: 15.6 },
    { rx: 21.1, ry: 25.8 },
    { rx: 28.9, ry: 34.4 },
    { rx: 36.1, ry: 42.2 },
  ],
};

/** Da dove parte a distribuire gli oggetti ogni strato. Sfalsati apposta:
 *  allineati, i quattro strati formavano dei raggi e sembrava un sole. */
const START_ANGLE: Record<DeskLayout, number[]> = {
  wide: [-95, -118, -88, -108],
  tall: [-90, -45, -90, -45],
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
