import { useEffect, useState, type RefObject } from "react";

// Parte da `true` e diventa `false` solo quando l'osservatore lo dice: un gioco
// fermo finche' qualcuno non lo conferma in vista resterebbe fermo per sempre
// dove IntersectionObserver non arriva.
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
