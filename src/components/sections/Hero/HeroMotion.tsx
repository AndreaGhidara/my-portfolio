"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/animations/gsap";
import { paint, reveal, stamp } from "@/animations/presets";
import { useSectionAnimation } from "@/animations/useSectionAnimation";

/**
 * L'unica animazione davvero su misura del sito: le lettere del nome
 * battono una a una come timbri, il cerchio arancione si dipinge, e su
 * desktop lettere e avatar rispondono al mouse su due piani diversi.
 */
export function HeroMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement | null>(null);

  useSectionAnimation((level) => {
    const root = scope.current;
    if (!root) return;

    const letters = root.querySelectorAll(".wordmark-letter");
    const circle = root.querySelector("[data-ink-circle-fill]");

    const intro = gsap.timeline();
    intro.add(stamp(letters, { level, stagger: 0.09 }) ?? gsap.timeline());
    intro.add(paint(circle, { level }) ?? gsap.timeline(), "-=0.35");
    intro.add(
      reveal(root.querySelectorAll("[data-hero-copy] > *"), { level, stagger: 0.08 }) ?? gsap.timeline(),
      "-=0.4",
    );
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
