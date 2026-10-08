import { useEffect, useState, type RefObject } from "react";

/**
 * Il blocco e' sullo schermo o no. Serve ai timer dei livelli (la salute del
 * pannello, la notte che corre, il passaggio da solo al livello 2): fuori
 * dallo schermo si fermano, al rientro riprendono.
 *
 * Parte da `true` e ci resta se IntersectionObserver non c'e': nel dubbio il
 * gioco gira. Diventa `false` solo quando l'osservatore dice che il blocco e'
 * uscito, mai per difetto. Al contrario, un gioco fermo finche' qualcuno non
 * lo conferma in vista resterebbe fermo per sempre dove l'osservatore non
 * arriva.
 *
 * Il file si chiama come nel piano, l'hook comincia per `use`: e' da quel
 * prefisso che il linter riconosce un hook e ne controlla le regole.
 */
export function useVisible(ref: RefObject<Element | null>): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      // Con piu' voci in coda conta l'ultima: e' lo stato di adesso.
      const last = entries[entries.length - 1];
      if (last) setVisible(last.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return visible;
}
