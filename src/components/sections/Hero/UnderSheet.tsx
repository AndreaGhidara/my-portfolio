"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MEDIA, useMotionLevel } from "@/animations/motionPolicy";
import { sheetCoverage, stickyTop } from "./sheet";

/**
 * La seconda sezione passa sopra la prima. Hero si ferma sotto la testata,
 * la stampante dei servizi gli sale sopra come un foglio, e intanto Hero «va
 * sotto»: si scurisce, si stringe e sale. Poi la pagina scorre come sempre,
 * perche' lo sticky di Hero vale solo dentro questo contenitore: finita la
 * stampante, Hero se ne va con lei. Nessuna corsa in piu'.
 *
 * Il movimento lo fa il CSS (sezioni/sopra.css), tutto sotto `data-acceso`, che si
 * scrive qui dopo aver misurato e si toglie nella pulizia: senza JavaScript e
 * a "none" la pagina e' quella di prima. Qui si scrivono solo due numeri:
 * dove Hero si ferma (`--attacco`) e quanto e' coperto (`--copertura`).
 *
 * La copertura la calcola un ascoltatore di scroll nativo, come
 * HeaderScrollState, e non uno ScrollTrigger: e' una proporzione fra due
 * rettangoli, e Lenis muove comunque lo scroll della finestra.
 */
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
    // `fotogramma` si azzera solo dentro il suo callback: azzerato altrove
    // (una chiamata diretta a muovi con un fotogramma in coda) la pulizia non
    // saprebbe piu' cosa cancellare, e un callback orfano riscriverebbe
    // --copertura dopo che e' stata tolta.
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

    /* Con il puntatore fine si rimisura a ogni resize. Su touch solo quando
       cambia la larghezza: la barra del browser che compare e sparisce non deve
       spostare il punto in cui Hero si ferma sotto il pollice (e' per quello
       che il palco si legge in svh dalla sonda). La copertura invece si
       ricalcola sempre, perche' e' solo una lettura. */
    const fine = window.matchMedia(MEDIA.finePointer);
    let width = window.innerWidth;
    const onResize = () => {
      const changed = window.innerWidth !== width;
      width = window.innerWidth;
      if (changed || fine.matches) measure();
      update();
    };

    /* Hero cresce anche da solo (un carattere che arriva tardi, il claim che va
       a capo): l'attacco lo deve sapere. */
    const resizeObserver = new ResizeObserver(() => {
      measure();
      update();
    });

    /* Mentre un dossier e' aperto la barra in basso e' nascosta
       (html[data-dialog-open]) e misura zero: un resize in quel momento, una
       rotazione del telefono, lascerebbe un attacco senza la barra. Si
       rimisura quando il dossier si chiude, come fa SmoothScroll con Lenis.
       Scelto al posto di leggere l'altezza «teorica» della barra: quella e'
       3,25rem piu' la tacca, cioe' un conto che vive nel CSS e andrebbe
       ripetuto qui. */
    const dialogObserver = new MutationObserver(() => {
      if (document.documentElement.hasAttribute("data-dialog-open")) return;
      measure();
      update();
    });

    /* Il fuoco svela. Da tastiera si arriva ai bottoni di Hero anche quando il
       foglio li copre (sono la prima cosa che copre), e un bottone col fuoco
       sotto un foglio arancione e' un fuoco che non si vede. Si torna al punto
       in cui Hero si e' appena fermato: la copertura li' e' zero, e se Hero e'
       piu' alto dello schermo se ne vede il fondo, dove stanno i bottoni. In
       cima al contenitore, su un telefono basso, i bottoni sarebbero finiti
       sotto la barra in basso. Se quello che ha preso il fuoco resta sotto la
       testata si sale ancora, e salendo la copertura resta zero.
       Niente `inert`: toglierebbe l'h1 agli screen reader per tutto il tempo
       in cui Hero e' sotto. Solo da tastiera, come nel tavolo: :focus-visible
       e' falso per un click. "instant" e non "auto": auto obbedisce a
       scroll-behavior. */
    const onFocus = (event: FocusEvent) => {
      const focused = event.target as HTMLElement | null;
      if (!focused?.matches(":focus-visible") || coverage() <= 0) return;
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
