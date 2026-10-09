"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MEDIA, useMotionLevel } from "@/animations/motionPolicy";
import { sheetCoverage, stickyTop } from "./sheet";

// Il movimento lo fa il CSS (sections/under-sheet.css) sotto `data-lit`, scritto
// qui dopo aver misurato: senza JavaScript e a "none" la pagina e' quella di prima.
// Qui si scrivono solo `--stick` e `--coverage`, con uno scroll nativo e non
// ScrollTrigger: e' una proporzione fra due rettangoli.
export function UnderSheet({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement | null>(null);
  const probe = useRef<HTMLDivElement | null>(null);
  const level = useMotionLevel();

  useEffect(() => {
    const root = scope.current;
    const probeEl = probe.current;
    const hero = root?.querySelector<HTMLElement>("#hero");
    const sheet = root?.querySelector<HTMLElement>("#scontrino");
    if (level === "none" || !root || !probeEl || !hero || !sheet) return;

    let headerHeight = 0;
    let stick = 0;
    let frame = 0;
    let written = -1;

    const coverage = () => sheetCoverage(hero.getBoundingClientRect(), sheet.getBoundingClientRect());

    const update = () => {
      // Tre decimali bastano all'occhio, e risparmiano le scritture (e il
      // ricalcolo degli stili di tutto Hero) quando lo scroll non cambia niente.
      const c = Math.round(coverage() * 1000) / 1000;
      if (c === written) return;
      written = c;
      hero.style.setProperty("--coverage", String(c));
    };
    // `frame` si azzera solo dentro il suo callback: azzerato altrove la pulizia non
    // saprebbe piu' cosa cancellare, e un callback orfano riscriverebbe --coverage.
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    const measure = () => {
      const height = hero.offsetHeight;
      headerHeight = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      // offsetHeight e' zero dove la barra in basso non c'e' (sopra i 768px):
      // la media query la dice gia' il CSS, qui non si ripete. E' zero anche
      // mentre un dossier aperto la nasconde: per questo si rimisura alla
      // chiusura (vedi il MutationObserver sotto).
      const bottomBar = document.querySelector<HTMLElement>("[data-nav-bottom]")?.offsetHeight ?? 0;
      stick = stickyTop({ header: headerHeight, stage: probeEl.offsetHeight, bottomBar, height });
      hero.style.setProperty("--stick", `${stick}px`);
    };

    // Su touch si rimisura solo quando cambia la larghezza: la barra del browser che
    // compare non deve spostare il punto in cui Hero si ferma sotto il pollice.
    const fine = window.matchMedia(MEDIA.finePointer);
    let width = window.innerWidth;
    const onResize = () => {
      const changed = window.innerWidth !== width;
      width = window.innerWidth;
      if (changed || fine.matches) measure();
      // La copertura invece si ricalcola sempre: e' solo una lettura.
      update();
    };

    // Hero cresce anche da solo (un carattere che arriva tardi, il claim che va a
    // capo): `--stick` lo deve sapere.
    const resizeObserver = new ResizeObserver(() => {
      measure();
      update();
    });

    // Con un dossier aperto la barra in basso e' nascosta e misura zero: si rimisura
    // alla chiusura, come fa SmoothScroll con Lenis, invece di ripetere qui il conto
    // del CSS (3,25rem piu' la tacca).
    const dialogObserver = new MutationObserver(() => {
      if (document.documentElement.hasAttribute("data-dialog-open")) return;
      measure();
      update();
    });

    // Da tastiera si arriva ai bottoni di Hero anche sotto il foglio: si torna dove
    // Hero si e' appena fermato, e la copertura e' zero. Niente `inert`: toglierebbe
    // l'h1 agli screen reader. "instant" perche' "auto" obbedisce a scroll-behavior.
    const onFocus = (event: FocusEvent) => {
      const focused = event.target as HTMLElement | null;
      if (!focused?.matches(":focus-visible") || coverage() <= 0) return;
      // Dove Hero si ferma ne mostra il fondo, coi bottoni: in cima al contenitore,
      // su un telefono basso, finirebbero sotto la barra. Se il fuoco resta sotto
      // la testata si sale ancora.
      const stuckAt = root.getBoundingClientRect().top + window.scrollY - stick;
      window.scrollTo({ top: Math.max(0, stuckAt), behavior: "instant" });
      const hidden = headerHeight - focused.getBoundingClientRect().top;
      if (hidden > 0) window.scrollBy({ top: -hidden, behavior: "instant" });
    };

    measure();
    root.setAttribute("data-lit", "");
    // Dopo l'accensione: il rettangolo di Hero e' quello sticky solo da qui.
    update();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    resizeObserver.observe(hero);
    dialogObserver.observe(document.documentElement, { attributeFilter: ["data-dialog-open"] });
    hero.addEventListener("focusin", onFocus);

    // All'uscita dal livello (anche solo verso "none") non basta smettere di
    // scrivere: le proprieta' resterebbero appiccicate all'ultimo valore.
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      dialogObserver.disconnect();
      hero.removeEventListener("focusin", onFocus);
      root.removeAttribute("data-lit");
      hero.style.removeProperty("--coverage");
      hero.style.removeProperty("--stick");
    };
  }, [level]);

  return (
    <div ref={scope} data-under-sheet>
      {/* Alta 100svh, larga zero: il palco visibile che non cambia con la
          barra del browser, come la sonda del percorso. */}
      <div ref={probe} data-sheet-probe aria-hidden="true" />
      {children}
    </div>
  );
}
