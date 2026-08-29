"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, registerGsap, ScrollTrigger } from "@/animations/gsap";
import { useMotionLevel } from "@/animations/motionPolicy";

/**
 * Lenis SOLO al livello "full". Su touch lo smooth-scroll dà sempre la
 * sensazione di telefono lento, e con prefers-reduced-motion sarebbe una
 * violazione diretta della preferenza dell'utente.
 * Senza il ponte verso ScrollTrigger, i trigger si calcolerebbero su una
 * posizione di scroll che Lenis ha già cambiato.
 */
export function SmoothScroll() {
  const level = useMotionLevel();

  useEffect(() => {
    if (level !== "full") return;

    registerGsap();
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Il lag smoothing di GSAP e Lenis si contendono il controllo del
    // tempo: disattivarlo qui evita scatti dopo un cambio di scheda.
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    // Quando si apre un dossier, Lenis va fermato davvero: `overflow: hidden`
    // impedisce all'utente di scorrere, non al codice, e Lenis scorre proprio
    // via codice in risposta alla rotellina. Senza questo, la pagina continua
    // a scorrere dietro al modale nonostante il blocco.
    // L'osservatore sta qui e non nel dialog: chi apre un modale non deve
    // sapere che esiste uno scroll fluido, gli basta dichiarare il suo stato.
    const root = document.documentElement;
    const syncDialogState = () => {
      if (root.hasAttribute("data-dialog-open")) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(syncDialogState);
    observer.observe(root, { attributeFilter: ["data-dialog-open"] });
    syncDialogState();

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, [level]);

  return null;
}
