"use client";

import { useEffect } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";

/**
 * Lenis SOLO al livello "full". Su touch lo smooth-scroll dà sempre la
 * sensazione di telefono lento, e con prefers-reduced-motion sarebbe una
 * violazione diretta della preferenza dell'utente.
 * Senza il ponte verso ScrollTrigger, i trigger si calcolerebbero su una
 * posizione di scroll che Lenis ha già cambiato.
 *
 * Lenis e GSAP si caricano al volo, non in cima al file: sono 36KB e 120KB che
 * altrimenti il browser scarica, analizza ed esegue mentre dovrebbe disegnare
 * la prima schermata. Misurato: bloccandoli, il tempo di blocco passava da
 * 267ms a zero. Uno scorrimento fluido che comincia mezzo secondo dopo non lo
 * nota nessuno; una pagina che si pianta mezzo secondo sì.
 */
export function SmoothScroll() {
  const level = useMotionLevel();

  useEffect(() => {
    if (level !== "full") return;

    let vivo = true;
    let smonta: (() => void) | undefined;

    const avvia = async () => {
      const [{ default: Lenis }, { gsap, registerGsap, ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("@/animations/gsap"),
      ]);
      if (!vivo) return;

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

      smonta = () => {
        observer.disconnect();
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      };
    };

    // Dopo la prima pittura, come le animazioni: qui non c'e' niente da
    // mostrare, c'e' solo da rendere piu' morbido un gesto che l'utente non ha
    // ancora fatto.
    const suIdle = "requestIdleCallback" in window;
    const id = suIdle
      ? window.requestIdleCallback(() => void avvia(), { timeout: 800 })
      : window.setTimeout(() => void avvia(), 200);

    return () => {
      vivo = false;
      if (suIdle) window.cancelIdleCallback(id as number);
      else window.clearTimeout(id as number);
      smonta?.();
    };
  }, [level]);

  return null;
}
