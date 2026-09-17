"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useMotionLevel, type MotionLevel } from "./motionPolicy";
import type * as Presets from "./presets";

/** Quello che una sezione riceve per costruire le sue animazioni. */
export type Scena = {
  level: MotionLevel;
  gsap: typeof import("./gsap").gsap;
  ScrollTrigger: typeof import("./gsap").ScrollTrigger;
  presets: typeof Presets;
};

/**
 * Ogni sezione costruisce le proprie animazioni qui dentro.
 *
 * GSAP NON si importa in cima a questo file, e nemmeno nei componenti che lo
 * usano: arriva dentro `scena`, caricato al volo dopo la prima pittura. Non è
 * un vezzo, è la voce di costo più grossa che la pagina aveva. Misurato su
 * Lighthouse mobile con la CPU rallentata quattro volte: bloccando i pezzi di
 * GSAP e Lenis il tempo di blocco passava da 267ms a zero e i quattro task
 * lunghi sparivano. Importarli in cima vuol dire pagarli mentre il browser
 * dovrebbe disegnare; caricarli dopo vuol dire non pagarli affatto, perché a
 * quel punto lo schermo è già a posto.
 *
 * L'attesa è `requestIdleCallback` con un tetto: se il browser non trova mai un
 * momento libero, dopo 800ms si parte lo stesso. Nessuna animazione qui è
 * immediata — la più presta è quella dell'apertura, e mezzo secondo di ritardo
 * su una cosa che dura mezzo secondo non la nota nessuno.
 *
 * La pulizia la fa `gsap.context`: revert allo smontaggio e a ogni cambio di
 * livello, che è quello che prima faceva `useGSAP`.
 */
/**
 * In fase di layout e non dopo, e non e' un dettaglio: React stacca i `ref`
 * DOPO le pulizie di layout e PRIMA di quelle passive. Chi smonta leggendo
 * `scope.current` — il palco del tavolo toglie due custom property da li' —
 * con un `useEffect` trovava null e non puliva niente. Sul server il layout
 * effect non esiste, quindi si ripiega su useEffect: tanto li' non gira.
 * Qui dentro non si fa lavoro pesante: si prenota soltanto il momento libero
 * in cui caricare GSAP.
 */
const useEffettoDiLayout = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useSectionAnimation(
  build: (scena: Scena) => void | (() => void),
  scope: RefObject<HTMLElement | null>,
  /** Dipendenze aggiuntive oltre al livello di movimento. */
  deps: unknown[] = [],
): void {
  const level = useMotionLevel();

  // La funzione cambia a ogni render (è una closure sulle props): tenerla in un
  // ref evita di rifare tutto l'effetto quando l'unica cosa cambiata è la sua
  // identità.
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffettoDiLayout(() => {
    if (level === "none") return;

    let vivo = true;
    let contesto: { revert: () => void } | undefined;
    let pulizia: (() => void) | void;

    const avvia = async () => {
      const [{ gsap, ScrollTrigger, registerGsap }, presets] = await Promise.all([
        import("./gsap"),
        import("./presets"),
      ]);
      if (!vivo) return;

      registerGsap();
      contesto = gsap.context(() => {
        pulizia = buildRef.current({ level, gsap, ScrollTrigger, presets });
      }, scope.current ?? undefined);
    };

    const suIdle = typeof window !== "undefined" && "requestIdleCallback" in window;
    const id = suIdle
      ? window.requestIdleCallback(() => void avvia(), { timeout: 800 })
      : window.setTimeout(() => void avvia(), 200);

    return () => {
      vivo = false;
      if (suIdle) window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
      // Prima quello che ha registrato `build` (ascoltatori, guide), poi il
      // contesto: al contrario, il revert toglierebbe di mezzo gli elementi su
      // cui la pulizia deve ancora lavorare.
      if (typeof pulizia === "function") pulizia();
      contesto?.revert();
    };
  }, [level, scope, ...deps]);
}
