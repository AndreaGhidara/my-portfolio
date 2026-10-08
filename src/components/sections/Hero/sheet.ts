/**
 * L'aritmetica della seconda sezione che passa sopra la prima, senza DOM.
 * SottoIlFoglio misura (i due rettangoli, la testata, il palco) e passa i
 * numeri qui: la parte che si sbaglia si prova in un test.
 *
 * Nessuna direttiva in cima: sono dati e conti, e un modulo client non
 * restituisce valori a chi lo importa dal server (vedi finestre.ts).
 */

type Rect = { top: number; bottom: number; height: number };

/**
 * Quanto la seconda sezione ha coperto la prima, da 0 a 1: 0 quando la cima
 * della seconda tocca il fondo della prima, 1 quando ne raggiunge la cima.
 * Si misura sul rettangolo della sezione e non su quello che si rimpicciolisce:
 * la sezione sta ferma, il contenuto scalato cambierebbe misura mentre si misura.
 */
export function sheetCoverage(first: Rect, second: { top: number }): number {
  if (first.height <= 0) return 0;
  return Math.min(1, Math.max(0, (first.bottom - second.top) / first.height));
}

/**
 * Dove si ferma la prima sezione, in px dalla cima dello schermo. Se sta nello
 * spazio visibile si ferma sotto la testata; se e' piu' alta si ferma quando il
 * suo fondo tocca il fondo visibile (sopra la barra in basso, dove c'e'), cosi'
 * non se ne perde un pezzo prima che la seconda la copra.
 *
 * `palco` e' l'altezza del viewport piccolo (100svh): quella che non cambia
 * quando la barra di Safari compare e sparisce a meta' scroll.
 */
export function stickyTop({
  header,
  stage,
  bottomBar,
  height,
}: {
  header: number;
  stage: number;
  bottomBar: number;
  height: number;
}): number {
  const space = stage - header - bottomBar;
  return header + Math.min(0, space - height);
}
