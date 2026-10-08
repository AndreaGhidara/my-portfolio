/**
 * Cambiare forma a una sezione senza spostare quello che si sta guardando. Fra
 * colonna e scena una sezione cambia altezza di migliaia di pixel (il percorso,
 * l'archivio dei Lavori), e se la finestra sta gia' tutta sotto (arrivo con
 * /it#contact, scroll ripristinato al ricaricamento, telefono ruotato sul
 * modulo dei contatti, cambio di lingua) quella differenza trascinerebbe la
 * pagina altrove. Safari non ha lo scroll anchoring che in Chrome lo coprirebbe.
 *
 * Si tiene fermo il bordo basso della sezione, cioe' l'inizio di quello che
 * sta sotto, e non si somma la differenza d'altezza: dove lo scroll anchoring
 * c'e', il browser ha gia' corretto per conto suo, e sommarla di nuovo portava
 * la pagina 1463px oltre «Il tuo turno» (misurato a 390x844 in Chrome).
 *
 * Solo se la sezione e' tutta sopra la finestra, e non appena ne e' iniziata:
 * da dentro la sezione non c'e' un punto che resti lo stesso fra le due forme,
 * e spostare di migliaia di pixel chi sta leggendo lo porterebbe a meta' corsa
 * invece che al suo posto.
 *
 * Sta qui e non nelle sezioni perche' le sezioni che cambiano forma sono due, e
 * ognuna deve compensare da se': l'altra non sa quando succede.
 */
export function withoutShift(section: HTMLElement, change: () => void) {
  const before = section.getBoundingClientRect().bottom;
  const below = before <= 1;
  change();
  if (!below) return;
  const delta = section.getBoundingClientRect().bottom - before;
  // "instant" e non "auto", come nel tavolo: auto obbedisce a scroll-behavior,
  // e il giorno che diventa smooth questa correzione sarebbe un'animazione.
  if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, behavior: "instant" });
}
