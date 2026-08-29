"use client";

import { gsap, ScrollTrigger } from "./gsap";
import type { MotionLevel } from "./motionPolicy";

type Common = {
  level: MotionLevel;
  /** Elemento che fa scattare l'animazione entrando nel viewport. */
  trigger?: Element | null;
};

/**
 * SI TIMBRA — arriva sovradimensionato e storto, e si assesta con un
 * rimbalzo. Su "reduced" battono tutti insieme, senza rotazione.
 */
export function stamp(
  targets: gsap.TweenTarget,
  { level, trigger, stagger = 0.08 }: Common & { stagger?: number },
): gsap.core.Timeline | null {
  if (level === "none") return null;

  const timeline = gsap.timeline({
    scrollTrigger: trigger ? { trigger, start: "top 80%", once: true } : undefined,
  });

  timeline.from(targets, {
    opacity: 0,
    scale: level === "full" ? 1.6 : 1.15,
    rotate: () => (level === "full" ? gsap.utils.random(-3, 3) : 0),
    duration: level === "full" ? 0.55 : 0.4,
    ease: "back.out(1.7)",
    stagger: level === "full" ? stagger : 0,
  });

  return timeline;
}

/**
 * SI TESSE — i tratti si disegnano da capo a coda.
 * Lo scrub è consentito solo al livello "full": su touch è la prima
 * causa di scatti.
 */
export function weave(
  paths: SVGPathElement[],
  { level, trigger, scrub = false, stagger = 0.12 }: Common & { scrub?: boolean; stagger?: number },
): gsap.core.Timeline | null {
  if (level === "none" || paths.length === 0) return null;

  const useScrub = scrub && level === "full";

  paths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  });

  const timeline = gsap.timeline({
    scrollTrigger: trigger
      ? {
          trigger,
          start: useScrub ? "top bottom" : "top 85%",
          end: useScrub ? "bottom top" : undefined,
          scrub: useScrub ? 0.6 : false,
          once: !useScrub,
        }
      : undefined,
  });

  timeline.to(paths, {
    strokeDashoffset: 0,
    duration: level === "full" ? 1.1 : 0.6,
    ease: useScrub ? "none" : "power2.inOut",
    stagger: level === "full" ? stagger : 0,
  });

  return timeline;
}

/**
 * SI DIPINGE — il colore avanza sotto una maschera invece di comparire.
 * Anima la custom property --paint, non la geometria.
 */
export function paint(
  target: Element | null,
  { level, trigger }: Common,
): gsap.core.Tween | null {
  if (level === "none" || !target) return null;

  gsap.set(target, { "--paint": "0%" });
  return gsap.to(target, {
    "--paint": "100%",
    duration: level === "full" ? 0.9 : 0.5,
    ease: "power2.inOut",
    scrollTrigger: trigger ? { trigger, start: "top 80%", once: true } : undefined,
  });
}

/** Ingresso sobrio per tutto il resto: sale e compare. Mai una dissolvenza sola. */
export function reveal(
  targets: gsap.TweenTarget,
  { level, trigger, stagger = 0.07, delay = 0 }: Common & { stagger?: number; delay?: number },
): gsap.core.Tween | null {
  if (level === "none") return null;

  return gsap.from(targets, {
    opacity: 0,
    y: level === "full" ? 28 : 16,
    duration: level === "full" ? 0.7 : 0.45,
    delay,
    stagger,
    scrollTrigger: trigger ? { trigger, start: "top 85%", once: true } : undefined,
  });
}

/** Da chiamare quando cambia il layout in un modo che ScrollTrigger non può dedurre. */
export function refreshTriggers(): void {
  ScrollTrigger.refresh();
}
