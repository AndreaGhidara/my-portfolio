import { useEffect, useState, type RefObject } from "react";
import { ROOT, BRANCHES } from "@/content/toolbox";
import { NODES } from "./graph";

/**
 * L'ordine dell'entrata: dal cartellino in giu', per rami, come un albero che
 * si apre. Ogni nodo parte dal punto in cui sta suo padre.
 */
export const ENTRANCE = (() => {
  const order: string[] = [ROOT.id];
  for (let i = 0; i < order.length; i++) {
    for (const [a, b] of BRANCHES)
      if (a === order[i] && !order.includes(b)) order.push(b);
  }
  for (const n of NODES) if (!order.includes(n.id)) order.push(n.id);
  return new Map(order.map((id, i) => [id, i]));
})();

type Entrance = "waiting" | "entering" | null;

/**
 * L'entrata, una volta sola e solo se la mappa non e' gia' in vista: chi
 * ricarica a meta' pagina la trova ferma e completa. Restituisce il valore di
 * data-entrata: "attesa" finche' la mappa e' sotto, "entra" quando arriva.
 *
 * Senza movimento pieno l'entrata non c'e', e lo stato si azzera: se il
 * movimento torna, si riparte da capo come al primo montaggio.
 */
export function useEntrance(
  bench: RefObject<HTMLElement | null>,
  full: boolean,
): Entrance {
  const [entrance, setEntrance] = useState<Entrance>(null);

  useEffect(() => {
    if (!full) {
      setEntrance(null);
      return;
    }
    const el = bench.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setEntrance("waiting");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setEntrance("entering");
        observer.disconnect();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [full, bench]);

  // Il valore di prima non vale piu' nel render in cui il movimento si spegne.
  return full ? entrance : null;
}
