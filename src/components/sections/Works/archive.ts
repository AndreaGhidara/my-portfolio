/** L'aritmetica dell'archivio, senza DOM, perche' si possa provare in un test.
 *  I numeri sono tarati insieme, guardando le cartelle: cambiarne uno senza
 *  riguardare il risultato e' ritarare a occhio chiuso. */
export const ARCHIVE_PARAMS = {
  /** Px: quanto piu' in basso si ferma ogni cartella rispetto alla precedente. */
  step: 14,
  /** Vh d'aria fra una cartella e la successiva. */
  distance: 10,
  /** Luminosita' persa per ogni cartella che ne copre un'altra. */
  darkens: 0.22,
  /** Scala persa per ogni cartella che ne copre un'altra. */
  narrows: 0.03,
  /** Percento della larghezza: lo sfalsamento di ogni linguetta, ed e' anche la sua larghezza. */
  tabWidth: 23,
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 finche' la cima della cartella sta sotto lo schermo, 1 quando e' ferma al suo `top` sticky. */
export function archiveCoverage({
  top,
  stop,
  screen,
}: {
  top: number;
  stop: number;
  screen: number;
}): number {
  const travel = screen - stop;
  // Una corsa nulla o negativa e' una cartella gia' arrivata o mai partita:
  // dividere darebbe Infinity o NaN, e il NaN finisce in una custom property.
  if (travel <= 0) return top <= stop ? 1 : 0;
  return clamp01(1 - (top - stop) / travel);
}

/** `stops` sono i `top` sticky, misurati una volta e non a ogni fotogramma. */
export function depths(
  tops: readonly number[],
  stops: readonly number[],
  screen: number,
): number[] {
  return tops.map((_, i) => {
    let p = 0;
    for (let j = i + 1; j < tops.length; j++) {
      p += archiveCoverage({ top: tops[j], stop: stops[j], screen });
    }
    return p;
  });
}

/** Lo scroll in cui la cartella `i` si e' appena fermata, o poco prima se li'
 *  la successiva spunta gia' dal fondo (sul telefono, senza la barra in basso,
 *  la cartella e' piu' corta della sua corsa). Dalla pagina ferma e non dai
 *  rettangoli: una cartella ferma ha il rettangolo di dove si e' fermata. */
export function returnTop({
  start,
  step,
  stops,
  i,
  screen,
}: {
  start: number;
  step: number;
  stops: readonly number[];
  i: number;
  screen: number;
}): number {
  const settled = start + i * step - stops[i];
  if (i + 1 >= stops.length) return settled;
  const beforeNextArrives = start + (i + 1) * step - screen;
  return Math.min(settled, beforeNextArrives);
}

/** Una sola faccia che deborda tiene l'archivio spento: quello che eccede
 *  finirebbe sotto la successiva o sotto la barra. Un pixel di tolleranza per
 *  gli arrotondamenti; una faccia alta zero vuol dire nessun layout misurato. */
export function fits(faces: readonly { content: number; room: number }[]): boolean {
  return (
    faces.length > 0 &&
    faces.every(({ content, room }) => room > 0 && content <= room + 1)
  );
}

/** Una sola altezza su touch non conta mai: e' la barra del browser (per questo
 *  le facce sono in svh). Col puntatore fine si', ma non mentre l'archivio e'
 *  sullo schermo: cambiare forma sotto gli occhi fa saltare la pagina. */
export function shouldRedecide({
  widthChanged,
  finePointer,
  inView,
}: {
  widthChanged: boolean;
  finePointer: boolean;
  inView: boolean;
}): "now" | "later" | "never" {
  if (widthChanged) return "now";
  if (!finePointer) return "never";
  return inView ? "later" : "now";
}

/** Le soglie del tono della linguetta, che si scurisce col fondo e non col
 *  filtro (col filtro l'anno finiva a 1,74:1). Calcolate sul tema chiaro e
 *  verificate da contrast.test.ts fra 0 e 3; `minDark` copre il tratto fra 2,07
 *  e 2,3 in cui ne' l'inchiostro ne' la carta reggono da soli. */
export const TAB = {
  full: 0.3,
  light: 2.05,
  minDark: 0.55,
} as const;

/** 0 il tono di sempre, 1 anno pieno, 2 tutto carta. */
export function tabTone(p: number): 0 | 1 | 2 {
  if (p >= TAB.light) return 2;
  if (p >= TAB.full) return 1;
  return 0;
}
