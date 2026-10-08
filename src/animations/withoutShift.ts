// Una sezione che cambia forma cambia altezza di migliaia di pixel: se la finestra
// sta tutta sotto, si tiene fermo il suo bordo basso. Safari non ha lo scroll
// anchoring; dove c'e' il browser ha gia' corretto, e sommare anche la
// differenza d'altezza portava la pagina 1463px oltre (390x844, Chrome).
export function withoutShift(section: HTMLElement, change: () => void) {
  const before = section.getBoundingClientRect().bottom;
  // Solo se la sezione e' tutta sopra la finestra: da dentro non c'e' un punto
  // che resti fermo fra le due forme, e spostare di migliaia di pixel chi legge
  // lo porterebbe a meta' corsa.
  const below = before <= 1;
  change();
  if (!below) return;
  const delta = section.getBoundingClientRect().bottom - before;
  // "instant" e non "auto": auto obbedisce a scroll-behavior, e da smooth diventerebbe un'animazione.
  if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: "instant" });
}
