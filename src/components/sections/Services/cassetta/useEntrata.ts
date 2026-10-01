import { useEffect, useState, type RefObject } from "react";
import { RADICE, RAMI } from "@/content/cassetta";
import { NODI } from "./grafo";

/**
 * L'ordine dell'entrata: dal cartellino in giu', per rami, come un albero che
 * si apre. Ogni nodo parte dal punto in cui sta suo padre.
 */
export const ENTRATA = (() => {
  const ordine: string[] = [RADICE.id];
  for (let i = 0; i < ordine.length; i++) {
    for (const [a, b] of RAMI)
      if (a === ordine[i] && !ordine.includes(b)) ordine.push(b);
  }
  for (const n of NODI) if (!ordine.includes(n.id)) ordine.push(n.id);
  return new Map(ordine.map((id, i) => [id, i]));
})();

type Entrata = "attesa" | "entra" | null;

/**
 * L'entrata, una volta sola e solo se la mappa non e' gia' in vista: chi
 * ricarica a meta' pagina la trova ferma e completa. Restituisce il valore di
 * data-entrata: "attesa" finche' la mappa e' sotto, "entra" quando arriva.
 *
 * Senza movimento pieno l'entrata non c'e', e lo stato si azzera: se il
 * movimento torna, si riparte da capo come al primo montaggio.
 */
export function useEntrata(
  banco: RefObject<HTMLElement | null>,
  pieno: boolean,
): Entrata {
  const [entrata, setEntrata] = useState<Entrata>(null);

  useEffect(() => {
    if (!pieno) {
      setEntrata(null);
      return;
    }
    const el = banco.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setEntrata("attesa");
    const osservatore = new IntersectionObserver(
      ([voce]) => {
        if (!voce.isIntersecting) return;
        setEntrata("entra");
        osservatore.disconnect();
      },
      { threshold: 0.2 },
    );
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, [pieno, banco]);

  // Il valore di prima non vale piu' nel render in cui il movimento si spegne.
  return pieno ? entrata : null;
}
