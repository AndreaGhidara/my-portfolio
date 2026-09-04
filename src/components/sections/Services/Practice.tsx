"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { practiceScenes } from "@/content/practice";
import { weave } from "@/animations/presets";
import { useMotionLevel, type MotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { curva, filo, type Coda, type Misura, type Mondo } from "./pratica/strada";
import { PracticeBlock } from "./PracticeBlock";
import type { ServiceItem } from "./ServicesView";

/**
 * La seconda scena della sezione del tavolo. Il tavolo e' lo spettacolo, questa
 * e' la sostanza — e conserva la risposta 1:1 alle quattro frasi di «Cosa stai
 * cercando?», nel loro ordine.
 *
 * `data-motion` porta il livello risolto fino al CSS, che e' l'unico posto in
 * cui il movimento esiste: a "full" le voci non attive sbiadiscono e la scena
 * si accende; a "reduced" e a "none" non si applica una riga e restano quattro
 * voci ferme e leggibili. useMotionLevel dice "none" in SSR e al primo render,
 * quindi ferma e completa e' anche quello che si vede senza JavaScript.
 */
export function Practice({
  practice,
  intro,
  items,
}: {
  practice: string;
  intro: string;
  items: ServiceItem[];
}) {
  const scope = useRef<HTMLDivElement | null>(null);
  const level = useMotionLevel();
  const filoRef = useRef<SVGSVGElement | null>(null);
  // La tessitura viva, se c'e'. Vive fuori dal gsap.context di useSectionAnimation
  // — la costruisce anche disegna(), che gsap.context non vede — quindi il
  // revert automatico non la raccoglie: deve passare da questo ref e da
  // spegni(), come cavo.current in DeskCables.
  const tessitura = useRef<gsap.core.Timeline | null>(null);

  /**
   * Dove stanno DAVVERO i disegni, adesso. Nel prototipo si misuravano una
   * volta sola alla costruzione, e il resto girava su quei numeri: ma i
   * caratteri arrivano dopo, il testo si riflow, i blocchi si spostano di
   * centinaia di pixel, e la scena resta quella di un impaginato che non
   * esiste piu'. E' per questo che alla seconda voce la freccia arrivava
   * altrove: non sbagliava mira, aveva il bersaglio alle coordinate sbagliate.
   */
  const misura = useCallback((): { misure: Misura[]; coda: Coda; mondo: Mondo } | null => {
    const el = scope.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const arti = [...el.querySelectorAll<HTMLElement>("[data-practice-art]")];
    if (arti.length !== practiceScenes.length) return null;
    const misure: Misura[] = arti.map((art, i) => {
      const b = art.getBoundingClientRect();
      return {
        cx: b.left + b.width / 2 - r.left,
        cy: b.top + b.height / 2 - r.top,
        h: b.height,
        lato: practiceScenes[i].lato,
      };
    });
    const codaEl = el.querySelector<HTMLElement>("[data-pratica-coda]");
    return {
      misure,
      coda: { top: codaEl?.offsetTop ?? el.offsetHeight, h: codaEl?.offsetHeight ?? 0 },
      mondo: { w: r.width, h: el.offsetHeight },
    };
  }, []);

  /**
   * Toglie il tratteggio inline e ferma la tessitura viva. Serve, e per la
   * stessa ragione di DeskCables: `weave` scrive dasharray e dashoffset al
   * momento della build, cioe' filo invisibile, ed e' lo scrub che poi lo
   * disegna. Chi arriva a "full" e poi accende la riduzione del movimento va
   * a "none", dove `weave` non riparte piu': il tratto resterebbe invisibile
   * per sempre, e il fotogramma a riposo — quello il cui patto e' che il filo
   * sia continuo — sarebbe un filo tagliato.
   *
   * Il trigger va ucciso PRIMA della timeline, e per la stessa ragione di
   * DeskCables.spegni(): finche' e' vivo il ScrollTrigger riscrive lo
   * stroke-dashoffset a ogni giro di rotellina, quindi ucciderlo dopo la
   * timeline lo lascerebbe libero di riscrivere un valore su una timeline
   * gia' morta.
   */
  const spegni = useCallback(() => {
    tessitura.current?.scrollTrigger?.kill();
    tessitura.current?.kill();
    tessitura.current = null;
    const tratto = filoRef.current?.querySelector("path");
    tratto?.style.removeProperty("stroke-dasharray");
    tratto?.style.removeProperty("stroke-dashoffset");
  }, []);

  /**
   * Ricostruisce la tessitura sul `d` ATTUALE del filo. Serve perche' questo
   * tratto e' diverso dagli altri sei segmenti: quelli vivono in un
   * viewBox 0-100 con preserveAspectRatio="none", quindi le loro coordinate
   * sono percentuali e la lunghezza del tratto in unita' di viewBox non
   * cambia mai. Questo filo scrive un `d` in PIXEL e lo ricalcola a ogni
   * riflow (vedi disegna(), sotto): se dopo un riflow non si richiamasse
   * weave(), il dasharray/dashoffset resterebbero tarati sulla lunghezza
   * vecchia mentre il path e' gia' un altro, e lo scrub finirebbe con uno
   * strappo o un buco invece di disegnare il tratto per intero.
   */
  const tessi = useCallback(
    (livello: MotionLevel) => {
      spegni();
      const tratto = filoRef.current?.querySelector("path");
      if (!tratto) return;
      tessitura.current = weave([tratto], { level: livello, trigger: scope.current, scrub: true });
    },
    [spegni],
  );

  /**
   * Il filo si disegna a OGNI livello di movimento: a "reduced" e a "none" e'
   * intero e fermo, ed e' giusto cosi' — quello che non parte e' lo scrub.
   * useLayoutEffect e non useEffect: passivo, il browser dipingerebbe prima un
   * fotogramma con il path vuoto, cioe' una sezione senza filo.
   *
   * I tre momenti in cui l'impaginato cambia senza che nessuno tocchi la
   * rotellina, e nessuno dei tre e' il primo render: i caratteri che finiscono
   * di caricare, la finestra che cambia misura, e qualunque cosa faccia
   * cambiare altezza alla scena. Ognuno di questi puo' cambiare il `d`, quindi
   * ognuno richiama tessi(): vedi il suo commento per il perche'.
   */
  useLayoutEffect(() => {
    const disegna = () => {
      const m = misura();
      const tratto = filoRef.current?.querySelector("path");
      if (!m || !tratto || !filoRef.current) return;
      filoRef.current.setAttribute("viewBox", `0 0 ${m.mondo.w} ${m.mondo.h}`);
      tratto.setAttribute("d", curva(filo(m.misure, m.coda, m.mondo)));
      tessi(level);
    };
    disegna();
    void document.fonts?.ready?.then(disegna);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(disegna) : null;
    if (ro && scope.current) ro.observe(scope.current);
    window.addEventListener("resize", disegna);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", disegna);
    };
  }, [misura, level, tessi]);

  // A ogni cambio di livello, non solo all'uscita da "full": useGSAP con delle
  // dipendenze rimanda il revert allo smontaggio, non al cambio di livello.
  // spegni() qui e spegni() come cleanup di useSectionAnimation qui sotto
  // finiscono per girare due volte sullo stesso cambio di livello: e'
  // innocuo, removeProperty e uccidere una timeline gia' morta sono entrambi
  // idempotenti, e non va "semplificato" a una sola chiamata.
  useLayoutEffect(() => spegni, [level, spegni]);

  useSectionAnimation((livello) => {
    tessi(livello);
    return spegni;
  }, scope);

  return (
    <div ref={scope} data-pratica data-motion={level}>
      <h3>{practice}</h3>
      <p data-pratica-intro>{intro}</p>

      {/* Il filo di pagina, che qui serpeggia. Non e' un <ThreadSegment>:
          quello disegna una cubica dall'ancoraggio d'entrata a quello d'uscita,
          e qui serve una serpentina misurata sui disegni. Stesso `weave` e
          stesso non-scaling-stroke di tutti gli altri sei tratti: il giorno in
          cui si aggiusta il tratteggio, si aggiusta in un posto solo.
          Il `d` e il viewBox li scrive l'effetto qui sotto, quando ha misurato. */}
      <svg ref={filoRef} data-pratica-filo aria-hidden="true" preserveAspectRatio="none">
        <path
          d=""
          fill="none"
          stroke="var(--line)"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <ol data-practice>
        {items.map((item, index) => (
          <PracticeBlock
            key={item.id}
            item={item}
            index={index}
            // L'ordine e' garantito da una prova sul contenuto: i quattro
            // blocchi corrispondono, in ordine, ai quattro servizi.
            scene={practiceScenes[index]}
          />
        ))}
      </ol>

      {/* Lo spazio in cui la freccia fara' il suo 180 prima di consegnare il
          filo ai Lavori. E' vuoto apposta: e' respiro, non un blocco mancante.
          Serve gia' adesso perche' la strada lo misura (Task 5 e 6). */}
      <div data-pratica-coda aria-hidden="true" />
    </div>
  );
}
