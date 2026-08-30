"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "@/animations/gsap";
import { useMotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { DeskTable, type DeskLayerData } from "./DeskTable";
import { CENTRE, SHAPE_BOX, cameraScale } from "./layers";

/** Quanta parte dell'altezza del palco occupa il laptop al fotogramma zero. */
const OPENING_FILL = 0.7;

/**
 * Quanto e' alto il laptop, in frazione della LARGHEZZA del piano. Non e' un
 * numero scelto qui: e' la larghezza dichiarata da CENTRE per il rapporto della
 * sua scatola. Scriverlo a mano — 240/920, o qualunque altra coppia che
 * somiglia — vorrebbe dire tenerne una seconda copia che il giorno in cui il
 * centro cambia misura nessuno aggiorna, e la camera aprirebbe sull'inquadratura
 * sbagliata senza che niente lo dica.
 */
const LAPTOP_ON_SURFACE = (CENTRE.width / 100) * (SHAPE_BOX.laptop.h / SHAPE_BOX.laptop.w);

/**
 * Gli estremi dell'inquadratura d'apertura. Il minimo perche' sotto non si
 * legge come una camera che arretra ma come un tavolo che sussulta; il massimo
 * perche' piu' in la' il primo anello comincia ad accendersi fuori dallo
 * schermo: a 4,2 l'oggetto piu' esterno del primo strato arriva giusto al bordo
 * mentre compare, e da li' in poi e' la camera che lo porta dentro.
 */
const OPENING = { min: 1.6, max: 4.2 };

/** La scala d'apertura quando non c'e' niente da misurare (jsdom, o un piano
 *  che non ha ancora una larghezza). */
const OPENING_FALLBACK = 3.3;

/**
 * Il palco. Un solo ScrollTrigger, e non tocca un elemento: scrive due custom
 * property sul palco — --p (la progressione) e --s (la scala della camera) — e
 * le ventiquattro opacita' le calcola il CSS. E' lo stesso principio del filo,
 * che usa un viewBox in percentuali per non ricalcolare niente.
 *
 * Niente `pin`: il palco e' sticky dentro un track alto 380vh, cosi' non c'e'
 * un pin-spacer da far litigare con Lenis.
 *
 * La scala d'apertura si rimisura solo su onRefresh, mai per fotogramma:
 * leggere clientWidth a ogni update vorrebbe dire un layout per fotogramma.
 *
 * `data-motion` porta il livello risolto fino al CSS, che e' l'unico posto dove
 * il movimento esiste: a "full" il track diventa alto 380vh e i tre blocchi si
 * sovrappongono, a "reduced" e a "none" non si applica una riga e resta il
 * tavolo fermo di prima. useMotionLevel dice "none" in SSR e al primo render,
 * quindi fermo e completo e' anche quello che si vede senza JavaScript.
 */
export function DeskStage({
  eyebrow,
  title,
  lead,
  centre,
  punch,
  layers,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  centre: string;
  punch: string;
  layers: DeskLayerData[];
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLDivElement | null>(null);
  const camera = useRef<ScrollTrigger | null>(null);
  const level = useMotionLevel();

  /**
   * Smontare la camera e cancellare le due property. Serve una funzione sola
   * perche' i modi di uscire da "full" sono tre — la finestra si stringe sotto
   * i 1024, arriva un puntatore grosso, l'utente accende la riduzione del
   * movimento — e in nessuno dei tre basta smettere di scrivere: --p resterebbe
   * appiccicata all'ultimo valore, e siccome l'opacita' degli oggetti la legge
   * SEMPRE (e' il patto del fallback, `var(--p, 1)`), il tavolo fermo si
   * ritroverebbe mezzo trasparente. E il vecchio ScrollTrigger continuerebbe a
   * riscriverla a ogni giro di rotellina.
   */
  const spegni = useCallback(() => {
    camera.current?.kill();
    camera.current = null;
    stage.current?.style.removeProperty("--p");
    stage.current?.style.removeProperty("--s");
  }, []);

  // useGSAP con delle dipendenze rimanda il revert allo smontaggio, non al
  // cambio di livello — e a livello "none" useSectionAnimation non chiama
  // nemmeno la build. Chi esce da "full" non avrebbe quindi nessuno a spegnergli
  // la camera: questo effetto e' quel qualcuno.
  //
  // useLayoutEffect e non useEffect: il commit che porta via il CSS della camera
  // e questa pulizia devono stare nello stesso giro. Passivo, si spegne DOPO che
  // il browser ha gia' dipinto un fotogramma senza le regole di "full" ma con
  // --p ancora appiccicata all'ultimo valore, e quel fotogramma e' un tavolo
  // mezzo trasparente. In SSR non gira, e non e' un problema: un cambio di
  // livello sul server non esiste.
  useLayoutEffect(() => {
    if (level !== "full") spegni();
  }, [level, spegni]);

  useSectionAnimation((resolved) => {
    const stageEl = stage.current;
    const trackEl = track.current;
    if (resolved !== "full" || !stageEl || !trackEl) return;

    // Il piano, non il mondo: le percentuali di layers.ts misurano il piano, e
    // il mondo e' il piano PIU' le didascalie. Misurando il mondo, l'apertura
    // sbaglierebbe di quanto e' alto un blocco di testo.
    const surface = stageEl.querySelector<HTMLElement>(
      '[data-desk-world][data-layout="wide"] [data-desk-surface]',
    );
    let from = OPENING_FALLBACK;

    const measure = () => {
      const laptop = (surface?.clientWidth ?? 0) * LAPTOP_ON_SURFACE;
      const voluta = (stageEl.clientHeight * OPENING_FILL) / laptop;
      from = laptop > 0 ? Math.min(Math.max(voluta, OPENING.min), OPENING.max) : OPENING_FALLBACK;
    };

    const write = (p: number) => {
      stageEl.style.setProperty("--p", p.toFixed(4));
      stageEl.style.setProperty("--s", cameraScale(p, from, 1).toFixed(4));
    };

    measure();
    write(0);

    camera.current = ScrollTrigger.create({
      trigger: trackEl,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onRefresh: (self) => {
        measure();
        write(self.progress);
      },
      onUpdate: (self) => write(self.progress),
    });

    // Anche lo smontaggio passa di qui: gsap.context di useGSAP chiama questa
    // al revert. Le due property nessun altro le toglierebbe, e restassero
    // appiccicate a --p = 0 il tavolo resterebbe vuoto per sempre.
    return spegni;
  }, scope);

  return (
    <div ref={scope} data-desk data-motion={level}>
      <div ref={track} data-desk-track>
        <div ref={stage} data-desk-stage>
          <header data-desk-title>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
            <p>{lead}</p>
          </header>

          <DeskTable layers={layers} centre={centre} layout="wide" />
          <DeskTable layers={layers} centre={centre} layout="tall" ghost />

          <p data-desk-punch>{punch}</p>
        </div>
      </div>
    </div>
  );
}
