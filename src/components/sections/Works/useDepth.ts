"use client";

import { useCallback, useRef, type RefObject } from "react";
import { MEDIA } from "@/animations/motionPolicy";
import { senzaSpostare } from "@/animations/withoutShift";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { lenisAttiva } from "@/components/shell/SmoothScroll";
import { profondita, ritorno, tonoLinguetta } from "./archive";
import type { Cartella } from "./slide";
import { praticaAperta } from "./useDossier";

/** Ms: quanto dura lo scroll che porta davanti la cartella prima che cada. */
const SVELTO = 350;

/**
 * Porta la pagina a `y`. "subito" salta; "svelto" scorre in SVELTO ms, prima
 * che la cartella cada; "morbido" e' il ritorno della linguetta. Con Lenis
 * acceso lo chiede a lui (vedi vaiA). La promessa si risolve a scroll finito:
 * con Lenis da onComplete, senza da scrollend, e comunque entro una scadenza,
 * perche' scrollend non arriva se la pagina e' gia' li' e onComplete non
 * arriva se lo scroll viene interrotto.
 */
function scorri(y: number, modo: "subito" | "svelto" | "morbido"): Promise<void> {
  const lenis = lenisAttiva();
  if (modo === "subito") {
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y, behavior: "instant" });
    return Promise.resolve();
  }
  return new Promise((risolvi) => {
    let fatto = false;
    const fine = () => {
      if (fatto) return;
      fatto = true;
      window.clearTimeout(scadenza);
      window.removeEventListener("scrollend", fine);
      risolvi();
    };
    const scadenza = window.setTimeout(fine, (modo === "svelto" ? SVELTO : 1100) + 400);
    if (lenis) {
      // lock: la rotellina non si mette in mezzo mentre la cartella arriva.
      lenis.scrollTo(y, modo === "svelto" ? { duration: SVELTO / 1000, lock: true, onComplete: fine } : { onComplete: fine });
      return;
    }
    if (Math.abs(window.scrollY - y) < 1) {
      fine();
      return;
    }
    window.addEventListener("scrollend", fine);
    window.scrollTo({ top: y, behavior: "smooth" });
  });
}

/**
 * In colonna: la cartella puo' essere cliccata dal fondo della faccia, col
 * foglio sopra lo schermo. Il foglio e' da dove parte la pratica, e deve
 * vedersi sotto la testata del sito: si scorre quel tanto, svelti. Null se
 * c'e' gia' (o se non c'e' layout da misurare).
 */
function portaInVista(cartella: Cartella): Promise<void> | null {
  const foglio = cartella.foglio.getBoundingClientRect();
  if (foglio.height === 0) return null;
  const testata = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
  // 40px: i 22 di cui il foglio sale sfilando, e un respiro.
  const margine = testata + 40;
  if (foglio.top >= margine) return null;
  return scorri(Math.max(0, window.scrollY + foglio.top - margine), "svelto");
}

/** Quello che sa fare l'archivio solo da acceso: vive dentro la sua build. */
type Acceso = {
  /** Riporta davanti la cartella `i`. */
  riportaDavanti: (i: number) => void;
  /** La cartella `i` davanti del tutto, prima che cada. Una promessa se deve
   *  scorrere, null se e' gia' pronta. */
  preparaCaduta: (i: number) => Promise<void> | null;
};

/**
 * Lo scaffale che si muove con lo scroll. In colonna ogni cartella entra
 * quando tocca a lei; ad archivio acceso (`ciStanno`) la successiva sale sopra
 * la precedente, e quelle sotto si scuriscono e si stringono in proporzione a
 * `--profondita`, che si scrive da qui.
 *
 * L'archivio lo accende questo hook, non il livello: il CSS sta tutto sotto
 * `data-archivio-acceso`, che si scrive dentro la build di useSectionAnimation
 * e si toglie nella pulizia.
 *
 * Restituisce le due cose che altri chiedono allo scaffale, nella colonna come
 * nell'archivio: `riporta`, il clic sulla linguetta, e `prepara`, la cartella
 * in vista prima che cada.
 */
export function useProfondita(schedario: RefObject<HTMLOListElement | null>, ciStanno: boolean) {
  const acceso = useRef<Acceso | null>(null);

  useSectionAnimation(
    ({ level, ScrollTrigger, presets }) => {
      const lista = schedario.current;
      if (!lista) return;
      const cartelle = Array.from(lista.children) as HTMLElement[];
      if (cartelle.length === 0) return;

      if (!ciStanno) {
        /* La colonna: ogni cartella scatta quando tocca a lei. Un innesco
           solo per tutte farebbe partire la quarta quando e' ancora fuori
           dallo schermo, e la sua entrata non la vedrebbe nessuno. */
        const { daDietro } = presets;
        for (const cartella of cartelle) {
          daDietro(cartella, { level, trigger: cartella, clearProps: true });
        }
        return;
      }

      // Le misure: rifatte all'accensione e al resize. Mai per fotogramma: a
      // ogni fotogramma si leggono solo i quattro rettangoli.
      let schermo = 0;
      let fermi: number[] = [];
      let inizio = 0;
      let passo = 0;
      const scritte = cartelle.map(() => -1);
      const toni = cartelle.map(() => -1);
      let fotogramma = 0;

      const misura = () => {
        schermo = window.innerHeight;
        fermi = cartelle.map((c) => Number.parseFloat(getComputedStyle(c).top) || 0);
        // La cima della lista dalla catena di offsetTop e non dal rettangolo:
        // le cartelle sono sticky, la lista no, e i suoi antenati nemmeno.
        let cima = 0;
        for (let el: HTMLElement | null = lista; el; el = el.offsetParent as HTMLElement | null) {
          cima += el.offsetTop;
        }
        inizio = cima + (Number.parseFloat(getComputedStyle(lista).paddingTop) || 0);
        const distanza = cartelle[1] ? Number.parseFloat(getComputedStyle(cartelle[1]).marginTop) || 0 : 0;
        passo = cartelle[0].offsetHeight + distanza;
      };

      const quanto = () =>
        profondita(
          cartelle.map((c) => c.getBoundingClientRect().top),
          fermi,
          schermo,
        );

      const muovi = () => {
        // A pratica aperta la cartella e' caduta, e Lenis e' fermo: niente da
        // riscrivere. Si rifa' alla chiusura (vedi `dossier` sotto).
        if (praticaAperta()) return;
        // Tre decimali bastano all'occhio, e risparmiano le scritture (e il
        // ricalcolo degli stili della cartella) quando lo scroll non cambia
        // niente.
        for (const [i, p] of quanto().entries()) {
          const v = Math.round(p * 1000) / 1000;
          if (v === scritte[i]) continue;
          scritte[i] = v;
          cartelle[i].style.setProperty("--profondita", String(v));
          // Il tono del testo della linguetta: un attributo e non un conto in
          // CSS, perche' e' una soglia, e il CSS le soglie non le sa fare.
          const tono = tonoLinguetta(v);
          if (tono === toni[i]) continue;
          toni[i] = tono;
          cartelle[i].setAttribute("data-tono-linguetta", String(tono));
        }
      };
      // `fotogramma` si azzera solo dentro il suo callback, come in
      // SottoIlFoglio: la pulizia deve sapere cosa cancellare.
      const alloScroll = () => {
        if (fotogramma) return;
        fotogramma = requestAnimationFrame(() => {
          fotogramma = 0;
          muovi();
        });
      };
      const alResize = () => {
        if (praticaAperta()) return;
        misura();
        muovi();
      };
      // Come in SottoIlFoglio: chiusa la pratica, si rimisura quello che un
      // resize nel frattempo ha cambiato.
      const dossier = new MutationObserver(() => {
        if (!praticaAperta()) alResize();
      });

      /* Il ritorno: la pagina risale fin dove la cartella si e' appena fermata.
         Morbido per la linguetta a "full", istantaneo altrove e per il fuoco.
         Con Lenis acceso lo chiede a lui: uno scroll nativo mentre Lenis e'
         in corsa (un click subito dopo un giro di rotellina) lo riscrive il
         fotogramma dopo. Senza, "instant" e non "auto", che obbedisce a
         scroll-behavior. Le misure si rifanno qui: costano poco, e un
         carattere arrivato tardi puo' averle spostate. */
      const vaiA = (i: number, modo: "subito" | "svelto" | "morbido") => {
        misura();
        const y = Math.max(0, ritorno({ inizio, passo, fermi, i, schermo }));
        return scorri(y, modo === "morbido" && !lenisAttiva() && level !== "full" ? "subito" : modo);
      };
      /** Il ritorno morbido della linguetta in corsa, se ce n'e' uno. */
      let ritornoInCorsa: object | null = null;

      /* Il fuoco svela, come in SottoIlFoglio e nel tavolo. Le cartelle
         coperte restano raggiungibili da tastiera, e un fuoco su una cartella
         che un'altra copre e' un fuoco che non si vede: si riporta davanti.
         Solo da tastiera: :focus-visible e' falso per un click, e un click
         sulla linguetta fa gia' la stessa cosa, ma morbida. */
      const alFuoco = (event: FocusEvent) => {
        const preso = event.target as HTMLElement | null;
        if (!preso?.matches(":focus-visible")) return;
        const cartella = preso.closest<HTMLElement>("[data-cartella]");
        const i = cartella ? cartelle.indexOf(cartella) : -1;
        if (i < 0 || quanto()[i] <= 0) return;
        void vaiA(i, "subito");
      };

      const sezione = lista.closest("section") ?? lista;
      senzaSpostare(sezione, () => {
        lista.setAttribute("data-archivio-acceso", "");
        // La sezione e' appena cresciuta di qualche schermo: tutto quello che
        // sta sotto (le entrate, il percorso) va rimisurato.
        ScrollTrigger.refresh();
      });
      // Dopo l'accensione: i `top` sticky e i rettangoli valgono solo da qui.
      misura();
      muovi();
      acceso.current = {
        riportaDavanti: (i) => {
          const questo = {};
          ritornoInCorsa = questo;
          void vaiA(i, "morbido").then(() => {
            if (ritornoInCorsa === questo) ritornoInCorsa = null;
          });
        },
        /* La cartella che si apre e' sempre davanti, o la pratica ferma Lenis
           a meta' e la cartella cade mezza coperta. Riportata con la linguetta
           e cliccata a ritorno in corsa: il ritorno si completa subito, e' gia'
           quasi finito. Solo in parte coperta: si torna indietro svelti e
           morbidi, e cade quando e' ferma. La profondita' si riscrive prima
           che data-dialog-open fermi muovi(). */
        preparaCaduta: (i) => {
          if (ritornoInCorsa) {
            ritornoInCorsa = null;
            void vaiA(i, "subito");
          } else if (quanto()[i] > 0.001) {
            return vaiA(i, "svelto").then(muovi);
          }
          muovi();
          return null;
        },
      };

      window.addEventListener("scroll", alloScroll, { passive: true });
      window.addEventListener("resize", alResize);
      lista.addEventListener("focusin", alFuoco);
      dossier.observe(document.documentElement, { attributeFilter: ["data-dialog-open"] });

      return () => {
        cancelAnimationFrame(fotogramma);
        window.removeEventListener("scroll", alloScroll);
        window.removeEventListener("resize", alResize);
        lista.removeEventListener("focusin", alFuoco);
        dossier.disconnect();
        acceso.current = null;
        for (const c of cartelle) {
          c.style.removeProperty("--profondita");
          c.removeAttribute("data-tono-linguetta");
        }
        // La stessa crescita al contrario: chi sta sotto deve saperlo, e chi
        // stava guardando sotto resta li'.
        senzaSpostare(sezione, () => {
          lista.removeAttribute("data-archivio-acceso");
          ScrollTrigger.refresh();
        });
      };
    },
    schedario,
    [ciStanno],
  );

  /** In colonna la linguetta porta la sua cartella in cima, sotto la testata. */
  const riporta = useCallback(
    (i: number) => {
      if (acceso.current) {
        acceso.current.riportaDavanti(i);
        return;
      }
      const cartella = schedario.current?.children[i];
      if (!cartella) return;
      const testata = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      window.scrollTo({
        top: cartella.getBoundingClientRect().top + window.scrollY - testata,
        behavior: window.matchMedia(MEDIA.reduced).matches ? "instant" : "smooth",
      });
    },
    [schedario],
  );

  const prepara = useCallback(
    (i: number, cartella: Cartella) => (acceso.current ? acceso.current.preparaCaduta(i) : portaInVista(cartella)),
    [],
  );

  return { riporta, prepara };
}
