// L'aritmetica di UnderSheet, senza DOM perche' si possa provare. Nessuna
// direttiva in cima: un modulo client non restituisce valori a chi lo importa dal
// server (vedi animations/timing.ts).

type Rect = { top: number; bottom: number; height: number };

// 0 quando la cima della seconda tocca il fondo della prima, 1 quando ne raggiunge
// la cima. Si misura la sezione e non lo strato che si rimpicciolisce, che
// cambierebbe misura mentre si misura.
export function sheetCoverage(first: Rect, second: { top: number }): number {
  if (first.height <= 0) return 0;
  return Math.min(1, Math.max(0, (first.bottom - second.top) / first.height));
}

// Sotto la testata se la prima sezione ci sta; se e' piu' alta, quando il suo fondo
// tocca il fondo visibile (sopra la barra in basso). `stage` e' 100svh, che non
// cambia quando la barra di Safari compare e sparisce a meta' scroll.
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
