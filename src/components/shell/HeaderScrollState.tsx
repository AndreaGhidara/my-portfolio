"use client";

import { useEffect } from "react";
import { AT_TOP_THRESHOLD } from "./atTop";

// Lo scroll nativo e non Lenis: Lenis c'e' solo al livello "full", e muove
// comunque lo scroll della finestra, quindi l'evento arriva lo stesso.
export function HeaderScrollState() {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      if (window.scrollY < AT_TOP_THRESHOLD) root.setAttribute("data-at-top", "");
      else root.removeAttribute("data-at-top");
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return null;
}
