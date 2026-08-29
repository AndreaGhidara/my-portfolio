"use client";

import type { RefObject } from "react";
import { registerGsap, useGSAP } from "./gsap";
import { useMotionLevel, type MotionLevel } from "./motionPolicy";

/**
 * Ogni sezione costruisce le proprie animazioni qui dentro.
 * `useGSAP` con `scope` distrugge tween e ScrollTrigger creati al suo
 * interno quando il componente si smonta: in React 19 con StrictMode è
 * l'unico modo per non ritrovarsi animazioni doppie.
 * `build` viene rieseguito se cambia il livello di movimento, per esempio
 * quando l'utente attiva la riduzione del movimento mentre naviga.
 */
export function useSectionAnimation(
  build: (level: MotionLevel) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  /** Dipendenze aggiuntive oltre al livello di movimento. */
  deps: unknown[] = [],
): void {
  const level = useMotionLevel();

  useGSAP(
    () => {
      registerGsap();
      if (level === "none") return;
      // Il `return` e' essenziale: gsap.context (usato da useGSAP) chiama
      // la funzione restituita al revert. Senza, ogni listener registrato
      // dentro `build` resterebbe appeso per sempre.
      return build(level);
    },
    { scope, dependencies: [level, ...deps] },
  );
}
