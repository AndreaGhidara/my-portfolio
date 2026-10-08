"use client";

import { useEffect } from "react";
import { SOGLIA_IN_CIMA } from "./inCima";

/**
 * Tiene aggiornato data-at-top su <html>, che TopStateScript ha già
 * impostato prima del paint. In cima l'header resta trasparente e lascia
 * vedere la ragnatela nell'angolo; appena si scorre prende fondo e blur,
 * perché da lì in poi ha del contenuto che gli passa sotto.
 *
 * Ascolta lo scroll nativo e non Lenis di proposito: Lenis è attivo solo al
 * livello di movimento "full", mentre l'header serve identico ovunque;
 * Lenis muove comunque lo scroll della finestra, quindi l'evento arriva.
 */
export function HeaderScrollState() {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      if (window.scrollY < SOGLIA_IN_CIMA) root.setAttribute("data-at-top", "");
      else root.removeAttribute("data-at-top");
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return null;
}
