"use client";

import { useRef, type ReactNode } from "react";
import { useSectionAnimation } from "@/animations/useSectionAnimation";

/**
 * L'unica animazione davvero su misura del sito: le lettere del nome
 * battono una a una come timbri, il cerchio arancione si dipinge, e su
 * desktop lettere e avatar rispondono al mouse su due piani diversi.
 */
export function HeroMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement | null>(null);

  useSectionAnimation(({ level, gsap, presets }) => {
    const { paint, reveal, stamp } = presets;
    const root = scope.current;
    if (!root) return;

    const letters = root.querySelectorAll(".wordmark-letter");
    const circle = root.querySelector("[data-ink-circle-fill]");

    const intro = gsap.timeline();
    intro.add(stamp(letters, { level, stagger: 0.09 }) ?? gsap.timeline());
    intro.add(paint(circle, { level }) ?? gsap.timeline(), "-=0.35");
    /* Il claim e il resto della copia entrano insieme, ma in due modi diversi,
       e la ragione e' una metrica.
       Il claim e' l'elemento piu' grande della prima schermata: e' lui che il
       browser cronometra come Largest Contentful Paint. Portandolo a opacita'
       zero — come fa `reveal` — se l'animazione parte PRIMA che il browser
       l'abbia dipinto, quel cronometro non parte al primo disegno ma quando la
       frase ricompare. Misurato con Lighthouse mobile: LCP a 3,0s con 2,5s di
       sola attesa, su una frase che nel documento c'e' dall'inizio.
       Quindi il claim si muove e basta, senza dissolvenza: sale di qualche
       pixel, resta sempre visibile, e l'LCP e' il primo disegno. Il resto della
       copia — sottotitolo e bottoni — non e' l'elemento piu' grande e puo'
       continuare a comparire. */
    const claim = root.querySelector<HTMLElement>("[data-hero-claim]");
    const resto = [...root.querySelectorAll<HTMLElement>("[data-hero-copy] > *")].filter(
      (el) => el !== claim,
    );

    if (claim) {
      intro.add(
        gsap.from(claim, {
          y: level === "full" ? 20 : 14,
          duration: level === "full" ? 0.7 : 0.55,
          ease: "power3.out",
          onComplete: () => claim.style.removeProperty("transform"),
        }),
        "-=0.4",
      );
    }
    if (resto.length) {
      intro.add(reveal(resto, { level, stagger: 0.08 }) ?? gsap.timeline(), "-=0.5");
    }
    // Le frecce per ultime, e senza sovrapposizione: invitano a scorrere, e
    // ha senso invitare solo quando c'e' gia' qualcosa da guardare.
    intro.add(reveal(root.querySelectorAll("[data-hero-outro]"), { level }) ?? gsap.timeline());

    if (level !== "full") return;

    // Parallasse del puntatore: due piani, quantità piccole.
    // Sopra i 6px si passa da "profondità" a "roba che balla".
    const move = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      gsap.to(letters, { x: x * 6, y: y * 3, duration: 0.8, overwrite: "auto" });
      gsap.to(root.querySelectorAll("[data-hero-avatar]"), {
        x: x * -10, y: y * -5, duration: 0.8, overwrite: "auto",
      });
    };

    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, scope);

  return <div ref={scope}>{children}</div>;
}
