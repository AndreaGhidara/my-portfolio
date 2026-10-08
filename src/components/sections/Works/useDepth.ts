"use client";

import { useCallback, useRef, type RefObject } from "react";
import { MEDIA } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { withoutShift } from "@/animations/withoutShift";
import { activeLenis } from "@/components/shell/SmoothScroll";
import { depths, returnTop, tabTone } from "./archive";
import type { Folder } from "./slide";
import { isDossierOpen } from "./useDossier";

/** Ms: quanto dura lo scroll che porta davanti la cartella prima che cada. */
const QUICK_MS = 350;

/**
 * Porta la pagina a `y`. "subito" salta; "svelto" scorre in SVELTO ms, prima
 * che la cartella cada; "morbido" e' il ritorno della linguetta. Con Lenis
 * acceso lo chiede a lui (vedi vaiA). La promessa si risolve a scroll finito:
 * con Lenis da onComplete, senza da scrollend, e comunque entro una scadenza,
 * perche' scrollend non arriva se la pagina e' gia' li' e onComplete non
 * arriva se lo scroll viene interrotto.
 */
function scrollPageTo(y: number, mode: "instant" | "quick" | "smooth"): Promise<void> {
  const lenis = activeLenis();
  if (mode === "instant") {
    if (lenis) lenis.scrollTo(y, { immediate: true });
    else window.scrollTo({ top: y, behavior: "instant" });
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      window.removeEventListener("scrollend", finish);
      resolve();
    };
    const timeout = window.setTimeout(finish, (mode === "quick" ? QUICK_MS : 1100) + 400);
    if (lenis) {
      // lock: la rotellina non si mette in mezzo mentre la cartella arriva.
      lenis.scrollTo(y, mode === "quick" ? { duration: QUICK_MS / 1000, lock: true, onComplete: finish } : { onComplete: finish });
      return;
    }
    if (Math.abs(window.scrollY - y) < 1) {
      finish();
      return;
    }
    window.addEventListener("scrollend", finish);
    window.scrollTo({ top: y, behavior: "smooth" });
  });
}

/**
 * In colonna: la cartella puo' essere cliccata dal fondo della faccia, col
 * foglio sopra lo schermo. Il foglio e' da dove parte la pratica, e deve
 * vedersi sotto la testata del sito: si scorre quel tanto, svelti. Null se
 * c'e' gia' (o se non c'e' layout da misurare).
 */
function bringIntoView(folder: Folder): Promise<void> | null {
  const sheet = folder.sheet.getBoundingClientRect();
  if (sheet.height === 0) return null;
  const header = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
  // 40px: i 22 di cui il foglio sale sfilando, e un respiro.
  const margin = header + 40;
  if (sheet.top >= margin) return null;
  return scrollPageTo(Math.max(0, window.scrollY + sheet.top - margin), "quick");
}

/** Quello che sa fare l'archivio solo da acceso: vive dentro la sua build. */
type LitArchive = {
  /** Riporta davanti la cartella `i`. */
  bringToFront: (i: number) => void;
  /** La cartella `i` davanti del tutto, prima che cada. Una promessa se deve
   *  scorrere, null se e' gia' pronta. */
  prepareFall: (i: number) => Promise<void> | null;
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
export function useDepth(shelf: RefObject<HTMLOListElement | null>, allFit: boolean) {
  const lit = useRef<LitArchive | null>(null);

  useSectionAnimation(
    ({ level, ScrollTrigger, presets }) => {
      const list = shelf.current;
      if (!list) return;
      const folders = Array.from(list.children) as HTMLElement[];
      if (folders.length === 0) return;

      if (!allFit) {
        /* La colonna: ogni cartella scatta quando tocca a lei. Un innesco
           solo per tutte farebbe partire la quarta quando e' ancora fuori
           dallo schermo, e la sua entrata non la vedrebbe nessuno. */
        const { fromBehind } = presets;
        for (const folder of folders) {
          fromBehind(folder, { level, trigger: folder, clearProps: true });
        }
        return;
      }

      // Le misure: rifatte all'accensione e al resize. Mai per fotogramma: a
      // ogni fotogramma si leggono solo i quattro rettangoli.
      let screen = 0;
      let stops: number[] = [];
      let start = 0;
      let step = 0;
      const written = folders.map(() => -1);
      const tones = folders.map(() => -1);
      let frame = 0;

      const measure = () => {
        screen = window.innerHeight;
        stops = folders.map((c) => Number.parseFloat(getComputedStyle(c).top) || 0);
        // La cima della lista dalla catena di offsetTop e non dal rettangolo:
        // le cartelle sono sticky, la lista no, e i suoi antenati nemmeno.
        let listTop = 0;
        for (let el: HTMLElement | null = list; el; el = el.offsetParent as HTMLElement | null) {
          listTop += el.offsetTop;
        }
        start = listTop + (Number.parseFloat(getComputedStyle(list).paddingTop) || 0);
        const gap = folders[1] ? Number.parseFloat(getComputedStyle(folders[1]).marginTop) || 0 : 0;
        step = folders[0].offsetHeight + gap;
      };

      const currentDepths = () =>
        depths(
          folders.map((c) => c.getBoundingClientRect().top),
          stops,
          screen,
        );

      const update = () => {
        // A pratica aperta la cartella e' caduta, e Lenis e' fermo: niente da
        // riscrivere. Si rifa' alla chiusura (vedi `dossier` sotto).
        if (isDossierOpen()) return;
        // Tre decimali bastano all'occhio, e risparmiano le scritture (e il
        // ricalcolo degli stili della cartella) quando lo scroll non cambia
        // niente.
        for (const [i, p] of currentDepths().entries()) {
          const v = Math.round(p * 1000) / 1000;
          if (v === written[i]) continue;
          written[i] = v;
          folders[i].style.setProperty("--depth", String(v));
          // Il tono del testo della linguetta: un attributo e non un conto in
          // CSS, perche' e' una soglia, e il CSS le soglie non le sa fare.
          const tone = tabTone(v);
          if (tone === tones[i]) continue;
          tones[i] = tone;
          folders[i].setAttribute("data-tab-tone", String(tone));
        }
      };
      // `fotogramma` si azzera solo dentro il suo callback, come in
      // SottoIlFoglio: la pulizia deve sapere cosa cancellare.
      const onScroll = () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          update();
        });
      };
      const onResize = () => {
        if (isDossierOpen()) return;
        measure();
        update();
      };
      // Come in SottoIlFoglio: chiusa la pratica, si rimisura quello che un
      // resize nel frattempo ha cambiato.
      const dialogWatcher = new MutationObserver(() => {
        if (!isDossierOpen()) onResize();
      });

      /* Il ritorno: la pagina risale fin dove la cartella si e' appena fermata.
         Morbido per la linguetta a "full", istantaneo altrove e per il fuoco.
         Con Lenis acceso lo chiede a lui: uno scroll nativo mentre Lenis e'
         in corsa (un click subito dopo un giro di rotellina) lo riscrive il
         fotogramma dopo. Senza, "instant" e non "auto", che obbedisce a
         scroll-behavior. Le misure si rifanno qui: costano poco, e un
         carattere arrivato tardi puo' averle spostate. */
      const goTo = (i: number, mode: "instant" | "quick" | "smooth") => {
        measure();
        const y = Math.max(0, returnTop({ start, step, stops, i, screen }));
        return scrollPageTo(y, mode === "smooth" && !activeLenis() && level !== "full" ? "instant" : mode);
      };
      /** Il ritorno morbido della linguetta in corsa, se ce n'e' uno. */
      let returnInFlight: object | null = null;

      /* Il fuoco svela, come in SottoIlFoglio e nel tavolo. Le cartelle
         coperte restano raggiungibili da tastiera, e un fuoco su una cartella
         che un'altra copre e' un fuoco che non si vede: si riporta davanti.
         Solo da tastiera: :focus-visible e' falso per un click, e un click
         sulla linguetta fa gia' la stessa cosa, ma morbida. */
      const onFocus = (event: FocusEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target?.matches(":focus-visible")) return;
        const folder = target.closest<HTMLElement>("[data-folder]");
        const i = folder ? folders.indexOf(folder) : -1;
        if (i < 0 || currentDepths()[i] <= 0) return;
        void goTo(i, "instant");
      };

      const section = list.closest("section") ?? list;
      withoutShift(section, () => {
        list.setAttribute("data-archive-lit", "");
        // La sezione e' appena cresciuta di qualche schermo: tutto quello che
        // sta sotto (le entrate, il percorso) va rimisurato.
        ScrollTrigger.refresh();
      });
      // Dopo l'accensione: i `top` sticky e i rettangoli valgono solo da qui.
      measure();
      update();
      lit.current = {
        bringToFront: (i) => {
          const token = {};
          returnInFlight = token;
          void goTo(i, "smooth").then(() => {
            if (returnInFlight === token) returnInFlight = null;
          });
        },
        /* La cartella che si apre e' sempre davanti, o la pratica ferma Lenis
           a meta' e la cartella cade mezza coperta. Riportata con la linguetta
           e cliccata a ritorno in corsa: il ritorno si completa subito, e' gia'
           quasi finito. Solo in parte coperta: si torna indietro svelti e
           morbidi, e cade quando e' ferma. La profondita' si riscrive prima
           che data-dialog-open fermi muovi(). */
        prepareFall: (i) => {
          if (returnInFlight) {
            returnInFlight = null;
            void goTo(i, "instant");
          } else if (currentDepths()[i] > 0.001) {
            return goTo(i, "quick").then(update);
          }
          update();
          return null;
        },
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      list.addEventListener("focusin", onFocus);
      dialogWatcher.observe(document.documentElement, { attributeFilter: ["data-dialog-open"] });

      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        list.removeEventListener("focusin", onFocus);
        dialogWatcher.disconnect();
        lit.current = null;
        for (const c of folders) {
          c.style.removeProperty("--depth");
          c.removeAttribute("data-tab-tone");
        }
        // La stessa crescita al contrario: chi sta sotto deve saperlo, e chi
        // stava guardando sotto resta li'.
        withoutShift(section, () => {
          list.removeAttribute("data-archive-lit");
          ScrollTrigger.refresh();
        });
      };
    },
    shelf,
    [allFit],
  );

  /** In colonna la linguetta porta la sua cartella in cima, sotto la testata. */
  const putBack = useCallback(
    (i: number) => {
      if (lit.current) {
        lit.current.bringToFront(i);
        return;
      }
      const folder = shelf.current?.children[i];
      if (!folder) return;
      const header = document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;
      window.scrollTo({
        top: folder.getBoundingClientRect().top + window.scrollY - header,
        behavior: window.matchMedia(MEDIA.reduced).matches ? "instant" : "smooth",
      });
    },
    [shelf],
  );

  const prepare = useCallback(
    (i: number, folder: Folder) => (lit.current ? lit.current.prepareFall(i) : bringIntoView(folder)),
    [],
  );

  return { putBack, prepare };
}
