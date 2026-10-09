"use client";

import { useRef, type ReactNode } from "react";
import { useSectionAnimation } from "@/animations/useSectionAnimation";

export function HeroMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement | null>(null);

  useSectionAnimation(({ level, gsap, presets }) => {
    const { grow, paint, reveal, stamp } = presets;
    const root = scope.current;
    if (!root) return;

    const letters = root.querySelectorAll(".wordmark-letter");
    const circle = root.querySelector("[data-ink-circle-fill]");
    const portrait = root.querySelector("[data-hero-avatar] img");

    const intro = gsap.timeline();
    intro.add(stamp(letters, { level, stagger: 0.09 }) ?? gsap.timeline());
    intro.add(paint(circle, { level }) ?? gsap.timeline(), "-=0.35");
    // La testa cresce dal centro del cerchio, non dell'immagine: il ritratto e'
    // l'88% del cerchio e alzato del 16%, cioe' del 14,08% del cerchio, quindi quel
    // centro cade al 66% dell'immagine. Dal 50% si aprirebbe a cavallo del bordo.
    intro.add(
      grow(portrait, { level, origin: "50% 66%" }) ?? gsap.timeline(),
      "-=0.55",
    );
    // Il claim e' l'elemento LCP: portato a opacita' zero (come fa `reveal`) l'LCP
    // conterebbe da quando ricompare (3,0s misurati con Lighthouse mobile). Quindi
    // sale senza dissolvenza; il resto della copia puo' comparire.
    const claim = root.querySelector<HTMLElement>("[data-hero-claim]");
    const rest = [...root.querySelectorAll<HTMLElement>("[data-hero-copy] > *")].filter(
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
    if (rest.length) {
      intro.add(reveal(rest, { level, stagger: 0.08 }) ?? gsap.timeline(), "-=0.5");
    }
    // Le frecce per ultime, e senza sovrapposizione: invitano a scorrere, e
    // ha senso invitare solo quando c'e' gia' qualcosa da guardare.
    intro.add(reveal(root.querySelectorAll("[data-hero-outro]"), { level }) ?? gsap.timeline());

    if (level !== "full") return;

    // Sopra i 6px la parallasse passa da "profondita'" a "roba che balla".
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

  // Si stringe e sale sotto il foglio (UnderSheet, sections/under-sheet.css). Solo
  // il contenuto: una trasformazione sulla sezione diventerebbe il riferimento dello
  // strato fisso della carta, che smetterebbe di coprire lo schermo.
  return (
    <div ref={scope} data-hero-layer>
      {children}
    </div>
  );
}
