"use client";

import { gsap } from "./gsap";
import type { MotionLevel } from "./motionPolicy";
// Sta in ./timing, modulo senza "use client": lo leggono anche i Server Component.
import { ENTRANCE_START } from "./timing";
export { ENTRANCE_START } from "./timing";

// `translate`, `rotate` e `scale` perche' Tailwind v4 scrive le trasformazioni
// nelle proprieta' indipendenti e GSAP le azzera in linea: togliendo solo
// `transform` il ritratto dell'apertura perdeva il suo translate del CSS.
const MOTION_PROPS = "transform,opacity,translate,rotate,scale,transform-origin";

// A mano e non con `clearProps` di GSAP: acceso, il plugin lanciava «Cannot read
// properties of undefined (reading 'split')» a ogni fotogramma di ogni entrata
// (verificato bisezionando). Senza niente da pulire restituisce un oggetto
// vuoto: anche una chiave a undefined basta a registrare il plugin.
export function cleanup(
  targets: gsap.TweenTarget,
  clearProps?: boolean | string,
): gsap.TweenVars {
  if (!clearProps) return {};

  const props = (typeof clearProps === "string" ? clearProps : MOTION_PROPS)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    onComplete: () => {
      for (const el of gsap.utils.toArray<Element>(targets)) {
        if (!(el instanceof HTMLElement)) continue;
        for (const prop of props) el.style.removeProperty(prop);
      }
    },
  };
}

function entranceStart(level: MotionLevel): string {
  return level === "full" ? ENTRANCE_START.full : ENTRANCE_START.reduced;
}

type Common = {
  level: MotionLevel;
  trigger?: Element | null;
};

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

// Per tratti senza `vector-effect: non-scaling-stroke`: il tratteggio e' in
// unita' di viewBox, e `getTotalLength()` e' gia' la lunghezza giusta.
export function weave(
  paths: SVGPathElement[],
  { level, trigger, stagger = 0.12 }: Common & { stagger?: number },
): gsap.core.Timeline | null {
  if (level === "none" || paths.length === 0) return null;

  paths.forEach((path) => {
    const length = path.getTotalLength?.() ?? 0;
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
  });

  const timeline = gsap.timeline({
    scrollTrigger: trigger ? { trigger, start: "top 85%", once: true } : undefined,
  });

  timeline.to(paths, {
    strokeDashoffset: 0,
    duration: level === "full" ? 1.1 : 0.6,
    ease: "power2.inOut",
    stagger: level === "full" ? stagger : 0,
  });

  return timeline;
}

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

// `origin` serve al ritratto dell'apertura: cresce dal centro del cerchio, che
// sta piu' in basso del centro dell'immagine perche' il ritratto e' alzato.
// Dal proprio centro la testa si aprirebbe a cavallo del bordo.
export function grow(
  target: Element | null,
  {
    level,
    trigger,
    origin = "50% 50%",
    delay = 0,
  }: Common & { origin?: string; delay?: number },
): gsap.core.Tween | null {
  if (level === "none" || !target) return null;

  return gsap.from(target, {
    // A 0.3 non si legge come "cresce" ma come "era gia' li' e si e' assestato".
    scale: level === "full" ? 0.05 : 0.08,
    opacity: 0,
    transformOrigin: origin,
    duration: level === "full" ? 0.8 : 0.6,
    ease: "back.out(1.4)",
    delay,
    // Il `from` lascerebbe in linea la matrice d'arrivo con il translate del CSS
    // congelato in pixel: cambiando larghezza la testa resterebbe fuori posto.
    ...cleanup(target, true),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

export function reveal(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    stagger = 0.07,
    delay = 0,
    clearProps = false,
  }: Common & { stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  return gsap.from(targets, {
    opacity: 0,
    y: level === "full" ? 28 : 16,
    // A 0,45s il movimento finiva mentre l'occhio ci arrivava, e si leggeva come uno scatto.
    duration: level === "full" ? 0.75 : 0.58,
    ease: "power3.out",
    delay,
    stagger,
    // Lo stile in linea lasciato dal `from` batte il CSS per sempre: dove il CSS
    // usa `transform` per altro (l'hover delle cartelle dei Lavori) va tolto.
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

// Distanze corte apposta: un blocco che attraversa mezzo schermo su un telefono
// fa ballare la pagina.
export function fromSide(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    direction,
    stagger = 0,
    delay = 0,
    clearProps = false,
  }: Common & { direction: "left" | "right"; stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  const distance = (level === "full" ? 90 : 56) * (direction === "left" ? -1 : 1);

  return gsap.from(targets, {
    opacity: 0,
    x: distance,
    duration: level === "full" ? 0.85 : 0.68,
    ease: "power3.out",
    delay,
    stagger,
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

// La scala parte vicina a 1: sopra il 10% si legge come uno zoom.
export function fromBehind(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    stagger = 0.06,
    delay = 0,
    clearProps = false,
  }: Common & { stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  return gsap.from(targets, {
    opacity: 0,
    scale: level === "full" ? 0.9 : 0.94,
    y: level === "full" ? 18 : 12,
    duration: level === "full" ? 0.8 : 0.64,
    ease: "power3.out",
    delay,
    stagger,
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}

export function fromAbove(
  targets: gsap.TweenTarget,
  {
    level,
    trigger,
    stagger = 0.08,
    delay = 0,
    clearProps = false,
  }: Common & { stagger?: number; delay?: number; clearProps?: boolean | string },
): gsap.core.Tween | null {
  if (level === "none") return null;

  return gsap.from(targets, {
    opacity: 0,
    y: level === "full" ? -56 : -40,
    duration: level === "full" ? 0.72 : 0.6,
    // Con 1.6 e una durata piu' lunga il tesserino ballava.
    ease: "back.out(1.4)",
    delay,
    stagger,
    ...cleanup(targets, clearProps),
    scrollTrigger: trigger ? { trigger, start: entranceStart(level), once: true } : undefined,
  });
}
