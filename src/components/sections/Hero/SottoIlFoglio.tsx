"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MEDIA, useMotionLevel } from "@/animations/motionPolicy";
import { attacco, copertura } from "./foglio";

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
export function SottoIlFoglio({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement | null>(null);
  const sonda = useRef<HTMLDivElement | null>(null);
  const level = useMotionLevel();

  useEffect(() => {
    const root = scope.current;
    const sondaEl = sonda.current;
    const hero = root?.querySelector<HTMLElement>("#hero");
    const sopra = root?.querySelector<HTMLElement>("#scontrino");
    if (level === "none" || !root || !sondaEl || !hero || !sopra) return;

    let testata = 0;
    let fermo = 0;
    let fotogramma = 0;
    let scritta = -1;

    const quanto = () => copertura(hero.getBoundingClientRect(), sopra.getBoundingClientRect());

    const muovi = () => {
      // Tre decimali bastano all'occhio, e risparmiano le scritture (e il
      // ricalcolo degli stili di tutto Hero) quando lo scroll non cambia niente.
      const c = Math.round(quanto() * 1000) / 1000;
      if (c === scritta) return;
      scritta = c;
      hero.style.setProperty("--copertura", String(c));
    };
    // `fotogramma` si azzera solo dentro il suo callback: azzerato altrove
    // (una chiamata diretta a muovi con un fotogramma in coda) la pulizia non
    // saprebbe piu' cosa cancellare, e un callback orfano riscriverebbe
    // --copertura dopo che e' stata tolta.
    const alloScroll = () => {
      if (fotogramma) return;
      fotogramma = requestAnimationFrame(() => {
        fotogramma = 0;
        muovi();
      });
    };

    const misura = () => {
      const altezza = hero.offsetHeight;
      testata = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      // offsetHeight e' zero dove la barra in basso non c'e' (sopra i 768px):
      // la media query la dice gia' il CSS, qui non si ripete. E' zero anche
      // mentre un dossier aperto la nasconde: per questo si rimisura alla
      // chiusura (vedi il MutationObserver sotto).
      const barraBassa = document.querySelector<HTMLElement>("[data-nav-basso]")?.offsetHeight ?? 0;
      fermo = attacco({ testata, palco: sondaEl.offsetHeight, barraBassa, altezza });
      hero.style.setProperty("--attacco", `${fermo}px`);
    };

    /* Con il puntatore fine si rimisura a ogni resize. Su touch solo quando
       cambia la larghezza: la barra del browser che compare e sparisce non deve
       spostare il punto in cui Hero si ferma sotto il pollice (e' per quello
       che il palco si legge in svh dalla sonda). La copertura invece si
       ricalcola sempre, perche' e' solo una lettura. */
    const fine = window.matchMedia(MEDIA.finePointer);
    let larghezza = window.innerWidth;
    const alResize = () => {
      const cambiata = window.innerWidth !== larghezza;
      larghezza = window.innerWidth;
      if (cambiata || fine.matches) misura();
      muovi();
    };

    /* Hero cresce anche da solo (un carattere che arriva tardi, il claim che va
       a capo): l'attacco lo deve sapere. */
    const osservatore = new ResizeObserver(() => {
      misura();
      muovi();
    });

    /* Mentre un dossier e' aperto la barra in basso e' nascosta
       (html[data-dialog-open]) e misura zero: un resize in quel momento, una
       rotazione del telefono, lascerebbe un attacco senza la barra. Si
       rimisura quando il dossier si chiude, come fa SmoothScroll con Lenis.
       Scelto al posto di leggere l'altezza «teorica» della barra: quella e'
       3,25rem piu' la tacca, cioe' un conto che vive nel CSS e andrebbe
       ripetuto qui. */
    const dossier = new MutationObserver(() => {
      if (document.documentElement.hasAttribute("data-dialog-open")) return;
      misura();
      muovi();
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
    const alFuoco = (event: FocusEvent) => {
      const preso = event.target as HTMLElement | null;
      if (!preso?.matches(":focus-visible") || quanto() <= 0) return;
      const appenaFermo = root.getBoundingClientRect().top + window.scrollY - fermo;
      window.scrollTo({ top: Math.max(0, appenaFermo), behavior: "instant" });
      const nascosto = testata - preso.getBoundingClientRect().top;
      if (nascosto > 0) window.scrollBy({ top: -nascosto, behavior: "instant" });
    };

    misura();
    root.setAttribute("data-acceso", "");
    // Dopo l'accensione: il rettangolo di Hero e' quello sticky solo da qui.
    muovi();

    window.addEventListener("scroll", alloScroll, { passive: true });
    window.addEventListener("resize", alResize);
    osservatore.observe(hero);
    dossier.observe(document.documentElement, { attributeFilter: ["data-dialog-open"] });
    hero.addEventListener("focusin", alFuoco);

    // All'uscita dal livello (anche solo verso "none") non basta smettere di
    // scrivere: le proprieta' resterebbero appiccicate all'ultimo valore.
    return () => {
      cancelAnimationFrame(fotogramma);
      window.removeEventListener("scroll", alloScroll);
      window.removeEventListener("resize", alResize);
      osservatore.disconnect();
      dossier.disconnect();
      hero.removeEventListener("focusin", alFuoco);
      root.removeAttribute("data-acceso");
      hero.style.removeProperty("--copertura");
      hero.style.removeProperty("--attacco");
    };
  }, [level]);

  return (
    <div ref={scope} data-sotto-il-foglio>
      {/* Alta 100svh, larga zero: il palco visibile che non cambia con la
          barra del browser, come la sonda del percorso. */}
      <div ref={sonda} data-foglio-sonda aria-hidden="true" />
      {children}
    </div>
  );
}
