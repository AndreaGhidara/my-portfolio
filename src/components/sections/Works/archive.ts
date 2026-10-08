/**
 * L'aritmetica dell'archivio dei Lavori, senza DOM. Il componente misura (i
 * `top` sticky una volta, i rettangoli a ogni fotogramma) e passa i numeri qui:
 * la parte che si sbaglia si prova in un test, e il componente resta un filo
 * che porta misure dentro e custom property fuori.
 *
 * I numeri sono quelli tarati nel prototipo
 * (docs/prototipi/2026-09-27-cartelle-archivio.html): cambiarli qui senza
 * ripassare da li' e' ritarare a occhio chiuso.
 */
export const ARCHIVE_PARAMS = {
  /** Px: quanto piu' in basso si ferma ogni cartella rispetto alla precedente. */
  step: 14,
  /** Vh d'aria fra una cartella e la successiva: lo scroll lo da' gia' l'altezza della cartella. */
  distance: 10,
  /** Luminosita' persa per ogni cartella che ne copre un'altra. */
  darkens: 0.22,
  /** Scala persa per ogni cartella che ne copre un'altra. */
  narrows: 0.03,
  /** Percento della larghezza: di quanto e' sfalsata ogni linguetta, ed e' anche la sua larghezza. */
  tabWidth: 23,
} as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Quanto una cartella che arriva copre quella sotto: 0 finche' la sua cima sta
 * sotto lo schermo, 1 quando e' ferma al suo `top` sticky.
 */
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

/**
 * Quanto ogni cartella e' «sotto»: la somma di quanto la coprono quelle che le
 * arrivano sopra. `cime` sono i rettangoli di adesso, `fermi` i `top` sticky
 * (misurati una volta, non a ogni fotogramma). L'ultima non e' mai sotto.
 */
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

/**
 * Lo scroll a cui la cartella `i` e' davanti: quello in cui si e' appena
 * fermata, o poco prima se li' la successiva spunta gia' dal fondo. Succede
 * sul telefono, dove la cartella si toglie la barra in basso ed e' piu' corta
 * della sua corsa: allora si risale fin dove la successiva tocca il fondo, e
 * la copertura e' zero.
 *
 * Si ricava dalla pagina ferma e non dai rettangoli: una cartella gia' ferma
 * ha il rettangolo del punto in cui si e' fermata, non di dove sta. `inizio` e'
 * la cima della prima nel documento, `passo` altezza di una cartella piu' la
 * distanza fra due: sono tutte alte uguali, apposta.
 */
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

/**
 * La soglia: l'archivio si accende solo se ogni faccia ci sta nel posto che il
 * palco le lascia. `contenuto` e' quanto le serve, `posto` quanto e' alta. Una
 * sola che deborda basta a tenerlo spento: la faccia e' alta quanto lo
 * schermo, e quello che eccede finisce sotto la successiva o sotto la barra.
 * Un pixel di tolleranza per gli arrotondamenti. Una faccia alta zero non ci
 * sta: vuol dire che non c'e' stato layout da misurare.
 */
export function fits(faces: readonly { content: number; room: number }[]): boolean {
  return (
    faces.length > 0 &&
    faces.every(({ content, room }) => room > 0 && content <= room + 1)
  );
}

/**
 * Se un resize deve far ridecidere fra archivio e colonna, e quando.
 *
 * Una larghezza nuova si decide subito: la riga va a capo in un altro modo, e
 * una faccia che non ci sta piu' finirebbe tagliata. Una sola altezza su touch
 * non conta mai: e' la barra del browser che compare e sparisce, ed e' per
 * questo che le facce sono in svh. Col puntatore fine si, ma non mentre
 * l'archivio e' sullo schermo: passare da una forma all'altra sotto gli occhi
 * di chi legge fa saltare la pagina. Si aspetta che esca.
 */
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

/**
 * La linguetta si scurisce con la sua cartella, ma col fondo e non col
 * filtro: il filtro scurisce anche il testo, e in fondo al cassetto l'anno
 * finiva a 1,74:1. Il fondo si mischia con l'inchiostro quanto il resto, e il
 * testo cambia tono a due soglie di profondita'. Le soglie sono calcolate sui
 * colori veri del tema chiaro (dorso inchiostro al 10% nella carta), e
 * contrast.test.ts le verifica a ogni centesimo di profondita' fra 0 e 3.
 * Sullo scuro il testo e' gia' chiaro e il fondo scurendosi lo aiuta: li' il
 * tono non cambia niente.
 *
 * - sotto `pieno` (anno tenue a 4,69:1 a 0,25, a 4,18 a 0,5): come sempre;
 * - da `pieno` l'anno diventa pieno come il nome: l'inchiostro regge fino a
 *   2,07 circa (4,75:1 a 2);
 * - da `chiaro` tutto carta. La carta regge da sola solo da 2,3 circa: fra le
 *   due c'e' un tratto in cui non regge nessuno dei due, e per coprirlo nel
 *   tono chiaro il fondo non scende sotto `buioMinimo` di inchiostro (4,8:1
 *   gia' alla soglia). E' un gradino di tono piccolo, e capita solo mentre la
 *   cartella scende da due a tre.
 */
export const TAB = {
  full: 0.3,
  light: 2.05,
  minDark: 0.55,
} as const;

/** Il tono del testo della linguetta a profondita' `p`: 0 di sempre, 1 pieno, 2 carta. */
export function tabTone(p: number): 0 | 1 | 2 {
  if (p >= TAB.light) return 2;
  if (p >= TAB.full) return 1;
  return 0;
}
