"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { practiceScenes } from "@/content/practice";
import { useMotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import type { Coda, Misura, Mondo } from "./pratica/strada";
import { guidaFreccia, type Guida, type Impaginato } from "./pratica/freccia";
import type { CalibratoreProps } from "./pratica/Calibratore";
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
  /**
   * La scatola del PERCORSO: dalla prima voce alla fine della coda. E' la
   * `.percorso` del prototipo, ed e' l'origine in cui ogni numero di `PARAM` e
   * di `strada()` e' stato trovato — «partenza» a 34px sotto il bordo alto vuol
   * dire 34px sotto la prima voce, non 34px sotto il titolo della scena.
   * Misurando sull'intero blocco quei 34 cadevano duecento e passa pixel piu' su
   * di dove erano stati calibrati, e la finestra dello scorrimento si allungava
   * di tutta l'altezza dell'intestazione: `PARAM.ritardo` non segnava piu' lo
   * stesso momento. E' anche il contenitore di posizionamento della freccia e
   * del tracciato — che stanno dentro di lei — quindi le coordinate che il
   * ciclo scrive sono gia' nel sistema giusto, senza traslazioni a mano.
   */
  const percorso = useRef<HTMLDivElement | null>(null);
  const level = useMotionLevel();
  // Il tracciato della freccia e la freccia stessa. Vivono solo a "full", ma i
  // ref si dichiarano sempre: un ref e' un contenitore vuoto, non un'animazione.
  const stradaRef = useRef<SVGSVGElement | null>(null);
  const frecciaRef = useRef<HTMLDivElement | null>(null);
  // Il manico del gesto, per chi arriva dopo che e' nato. Lo scrive e lo
  // cancella l'effetto qui sotto; in produzione nessuno lo legge.
  const guidaRef = useRef<Guida | null>(null);
  /**
   * Dove stanno DAVVERO i disegni, adesso, misurati dentro la scatola che gli
   * si da'. Nel prototipo si misuravano una volta sola alla costruzione, e il
   * resto girava su quei numeri: ma i caratteri arrivano dopo, il testo si
   * riflow, i blocchi si spostano di centinaia di pixel, e la scena resta
   * quella di un impaginato che non esiste piu'. E' per questo che alla seconda
   * voce la freccia arrivava altrove: non sbagliava mira, aveva il bersaglio
   * alle coordinate sbagliate.
   *
   * La scatola e' un argomento e non `scope` perche' le due cose che si
   * misurano non hanno la stessa origine, e non e' un dettaglio: vedi
   * `misuraScena` e `misuraPercorso` qui sotto.
   *
   * Tutto per rettangoli e niente `offsetTop`: quello si conta dall'antenato
   * posizionato, che per la coda cambia a seconda di chi la contiene, mentre
   * qui l'origine deve essere quella dichiarata e nessun'altra.
   */
  const misuraIn = useCallback((root: HTMLElement | null): Impaginato | null => {
    if (!root) return null;
    const r = root.getBoundingClientRect();
    const arti = [...root.querySelectorAll<HTMLElement>("[data-practice-art]")];
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
    const codaEl = root.querySelector<HTMLElement>("[data-pratica-coda]");
    const c = codaEl?.getBoundingClientRect();
    const coda: Coda = { top: c ? c.top - r.top : r.height, h: c?.height ?? 0 };
    const mondo: Mondo = { w: r.width, h: r.height };
    // `r.top` e' gia' in mano: le misure sono relative a lui, e sommandolo si
    // sa dove ogni disegno sta rispetto alla finestra. E' quello che serve al
    // fuoco, e non costa un rettangolo in piu'.
    return { misure, coda, mondo, viewTop: r.top, viewLeft: r.left };
  }, []);


  /** La freccia misura il PERCORSO, che e' la scatola in cui i suoi numeri sono
   *  stati trovati — e dentro la quale sta lei stessa. */
  const misuraPercorso = useCallback(() => misuraIn(percorso.current), [misuraIn]);



  // A ogni cambio di livello, non solo all'uscita da "full": useGSAP con delle
  // dipendenze rimanda il revert allo smontaggio, non al cambio di livello.
  useSectionAnimation((livello) => {
    // Qui dentro resta solo la freccia, che esiste solo a "full". Il filo di
    // pagina non passa piu' da questa sezione (vedi anchors.ts), quindi la
    // tessitura e il suo spegnimento se ne sono andati con lui.
    const stradaEl = stradaRef.current;
    const gpath = stradaEl?.querySelector("path");
    const fre = frecciaRef.current;
    if (livello !== "full" || !stradaEl || !gpath || !fre) return;

    const voci = [...(scope.current?.querySelectorAll<HTMLElement>("[data-practice-item]") ?? [])];
    // Il trigger e' il percorso e non la scena: la finestra dello scorrimento
    // va da quando la prima voce passa il 46% dello schermo a quando ci passa
    // il fondo della coda. Con la scena intera quella finestra era piu' lunga
    // di tutta l'intestazione, e `PARAM.ritardo` — che e' una frazione della
    // finestra — segnava un altro momento.
    const guida = guidaFreccia(
      { stradaEl, gpath, fre, voci, trigger: percorso.current },
      misuraPercorso,
    );
    guidaRef.current = guida;
    return () => {
      guida.molla();
      guidaRef.current = null;
    };
  }, scope);

  /**
   * Il calibratore si CARICA dietro la guardia su NODE_ENV, non solo si monta:
   * un componente importato in cima al file finisce nel bundle anche se non lo
   * si disegna mai. L'import() sta DENTRO l'if e non dopo un return anticipato
   * apposta: cosi' in produzione e' il ramo di un `if (false)`, che il bundler
   * non attraversa nemmeno — e non gli emette il pezzo. Una verifica sul
   * bundle lo controlla, e sta nel rapporto del Task 7.
   */
  const [Calibratore, setCalibratore] = useState<ComponentType<CalibratoreProps> | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      if (!new URLSearchParams(window.location.search).has("calibra")) return;
      void import("./pratica/Calibratore").then((m) => setCalibratore(() => m.Calibratore));
    }
  }, []);

  return (
    <div ref={scope} data-pratica data-motion={level}>
      <h3>{practice}</h3>
      <p data-pratica-intro>{intro}</p>


      {/* Il percorso: dalla prima voce alla fine della coda, e niente altro. E'
          la `.percorso` del prototipo, ed e' due cose insieme — la scatola che
          la freccia misura e quella in cui la freccia sta. Le due devono
          coincidere: il ciclo scrive `left` e `top` in pixel, e sono pixel
          dell'antenato posizionato. Il filo resta FUORI, perche' la sua corsa
          e' la sezione intera (vedi misuraScena).
          Non porta z-index: senza, i suoi figli restano nel contesto di
          impilamento della scena e l'ordine filo → strada → freccia → voci
          resta quello che era. */}
      <div ref={percorso} data-pratica-percorso>
        {/* La strada che la freccia percorre. Invisibile: e' il tracciato, non
            il disegno. Niente display:none — romperebbe getPointAtLength. */}
        <svg ref={stradaRef} data-pratica-strada aria-hidden="true" preserveAspectRatio="none">
          <path d="" fill="none" stroke="none" />
        </svg>

        {/* La freccia. L'asta si allunga, la punta no: una freccia lunga il
            doppio non ha la testa grande il doppio. */}
        <div ref={frecciaRef} data-pratica-freccia aria-hidden="true">
          <svg viewBox="0 0 40 40" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
            <g data-asta>
              <path d="M0 20 Q18.72 17.96 40 20" />
            </g>
            <g data-punta>
              <path d="M26 10 Q33.07 15.07 40 20" />
              <path d="M26 30 Q33.76 25.29 40 20" />
            </g>
          </svg>
        </div>

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
            filo ai Lavori. E' vuoto apposta: e' respiro, non un blocco
            mancante. Sta DENTRO il percorso perche' la coda e' l'ultimo tratto
            della strada: e' la sua fine a dire dove finisce il gesto. */}
        <div data-pratica-coda aria-hidden="true" />
      </div>

      {Calibratore ? <Calibratore guida={guidaRef} strada={stradaRef} /> : null}
    </div>
  );
}
