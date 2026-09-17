"use client";

import { useRef, type ReactNode } from "react";
import { INIZIO_ENTRATA } from "@/animations/finestre";
import { useSectionAnimation } from "@/animations/useSectionAnimation";

/**
 * L'entrata delle quattro tappe.
 *
 * Non è un ingresso solo: ogni tappa è fatta di due cose che nella realtà
 * arrivano in ordine. Prima si posa il foglio, poi qualcuno ci appunta sopra
 * il tesserino — che infatti scende dall'alto e si ferma con un rimbalzo
 * corto. Farli entrare insieme li avrebbe fatti leggere come un'immagine sola,
 * ed è esattamente la lettura che il disegno di questa sezione evita: il
 * cartellino sborda dal foglio proprio per dire che sono due oggetti.
 *
 * Un trigger per tappa e non uno per la lista: le quattro sono su due colonne
 * e a due altezze diverse, e una entrata di gruppo le farebbe partire tutte
 * quando si affaccia la prima.
 *
 * Il contenuto non è mai nascosto nel markup: se JavaScript non parte, le
 * quattro tappe sono lì, ferme e leggibili.
 */
export function JourneyList({
  children,
  ...rest
}: {
  children: ReactNode;
} & React.ComponentPropsWithoutRef<"ol">) {
  const scope = useRef<HTMLOListElement | null>(null);

  useSectionAnimation(({ level, gsap, presets }) => {
    const { daDietro, dallAlto } = presets;
    const root = scope.current;
    if (!root) return;

    for (const tappa of Array.from(root.children)) {
      const foglio = tappa.querySelector("[data-journey-sheet]");
      const tesserino = tappa.querySelector("[data-journey-badge]");
      if (!foglio || !tesserino) continue;

      const linea = gsap.timeline({
        scrollTrigger: {
          trigger: tappa,
          start: level === "full" ? INIZIO_ENTRATA.pieno : INIZIO_ENTRATA.ridotto,
          once: true,
        },
      });
      // clearProps su tutti e due: il <li> che li contiene è ruotato dal foglio
      // di stile, e i due figli ereditano quel piano. Quello che l'entrata
      // scrive in linea deve sparire appena ha finito, o il prossimo che tocca
      // quelle rotazioni si ritrova a combattere con un translate fantasma.
      linea.add(daDietro(foglio, { level, clearProps: true }) ?? gsap.timeline());
      linea.add(
        dallAlto(tesserino, { level, clearProps: true }) ?? gsap.timeline(),
        // Sovrapposte in coda: il tesserino parte a scendere mentre il foglio
        // sta finendo di posarsi. In fila sarebbero due gesti, sovrapposte
        // sono un gesto solo.
        "-=0.28",
      );
    }
  }, scope);

  return (
    <ol ref={scope} {...rest}>
      {children}
    </ol>
  );
}
