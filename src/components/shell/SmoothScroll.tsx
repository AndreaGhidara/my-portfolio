"use client";

import { useEffect } from "react";
import type Lenis from "lenis";
import { useMotionLevel } from "@/animations/motionPolicy";
import { whenIdle } from "@/animations/whenIdle";

// Per chi deve saltare a un punto mentre Lenis e' in corsa: Lenis 1.3 si
// riallinea allo scroll nativo solo da fermo, e riscrive un window.scrollTo.
// Variabile di modulo: la si legge nei gestori di evento, e SmoothScroll e' uno solo.
let active: Lenis | null = null;

export function activeLenis(): Lenis | null {
  return active;
}

// Solo a "full": su touch sembra un telefono lento, e con reduced-motion
// tradirebbe la preferenza. Lenis e GSAP (36KB e 120KB) arrivano al volo dopo la
// prima pittura: caricati in cima il tempo di blocco saliva da zero a 267ms.
export function SmoothScroll() {
  const level = useMotionLevel();

  useEffect(() => {
    if (level !== "full") return;

    let alive = true;
    let teardown: (() => void) | undefined;

    const start = async () => {
      const [{ default: Lenis }, { gsap, registerGsap, ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("@/animations/gsap"),
      ]);
      if (!alive) return;

      registerGsap();
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      active = lenis;

      // Senza questo ponte i trigger leggerebbero una posizione che Lenis ha gia' cambiato.
      lenis.on("scroll", ScrollTrigger.update);

      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      // Il lag smoothing di GSAP litiga col tempo di Lenis: spento, niente scatti dopo un cambio di scheda.
      gsap.ticker.lagSmoothing(0);

      ScrollTrigger.refresh();

      // Con un dialog aperto Lenis va fermato: `overflow: hidden` blocca l'utente,
      // non il codice, e Lenis scorre via codice. Sta qui perche' chi apre un
      // modale non deve sapere che esiste uno scroll fluido.
      const root = document.documentElement;
      const syncDialogState = () => {
        if (root.hasAttribute("data-dialog-open")) lenis.stop();
        else lenis.start();
      };
      const observer = new MutationObserver(syncDialogState);
      observer.observe(root, { attributeFilter: ["data-dialog-open"] });
      syncDialogState();

      teardown = () => {
        active = null;
        observer.disconnect();
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      };
    };

    const cancel = whenIdle(() => void start());

    return () => {
      alive = false;
      cancel();
      teardown?.();
    };
  }, [level]);

  return null;
}
