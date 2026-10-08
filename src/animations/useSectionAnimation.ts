"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useMotionLevel, type MotionLevel } from "./motionPolicy";
import { whenIdle } from "./whenIdle";
import type * as Presets from "./presets";

export type SectionScene = {
  level: MotionLevel;
  gsap: typeof import("./gsap").gsap;
  ScrollTrigger: typeof import("./gsap").ScrollTrigger;
  presets: typeof Presets;
};

// Layout effect perche' React stacca i `ref` dopo le pulizie di layout e prima di
// quelle passive: con useEffect chi pulisce leggendo `scope.current` trova null.
// Sul server si ripiega su useEffect, che li' non gira.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// GSAP non si importa in cima: arriva in `scene`, caricato nel primo momento
// libero. Su Lighthouse mobile con CPU 4x il tempo di blocco passava da 267ms a
// zero. Il revert di `gsap.context` pulisce allo smontaggio e a ogni cambio di livello.
export function useSectionAnimation(
  build: (scene: SectionScene) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
): void {
  const level = useMotionLevel();

  // Nel ref, cosi' l'effetto non riparte quando cambia solo l'identita' della closure.
  const buildRef = useRef(build);
  buildRef.current = build;

  useIsomorphicLayoutEffect(() => {
    if (level === "none") return;

    let alive = true;
    let context: { revert: () => void } | undefined;
    let teardown: (() => void) | void;

    const start = async () => {
      const [{ gsap, ScrollTrigger, registerGsap }, presets] = await Promise.all([
        import("./gsap"),
        import("./presets"),
      ]);
      if (!alive) return;

      registerGsap();
      context = gsap.context(() => {
        teardown = buildRef.current({ level, gsap, ScrollTrigger, presets });
      }, scope.current ?? undefined);
    };

    const cancel = whenIdle(() => void start());

    return () => {
      alive = false;
      cancel();
      // Prima la pulizia di `build`, poi il revert: al contrario toglierebbe gli
      // elementi su cui la pulizia deve ancora lavorare.
      if (typeof teardown === "function") teardown();
      context?.revert();
    };
  }, [level, scope, ...deps]);
}
