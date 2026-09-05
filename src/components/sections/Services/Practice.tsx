"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { practiceScenes } from "@/content/practice";
import { weave } from "@/animations/presets";
import { useMotionLevel, type MotionLevel } from "@/animations/motionPolicy";
import { useSectionAnimation } from "@/animations/useSectionAnimation";
import { curva, filo, type Coda, type Misura, type Mondo } from "./pratica/strada";
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
  const filoRef = useRef<SVGSVGElement | null>(null);
  // Il tracciato della freccia e la freccia stessa. Vivono solo a "full", ma i
  // ref si dichiarano sempre: un ref e' un contenitore vuoto, non un'animazione.
  const stradaRef = useRef<SVGSVGElement | null>(null);
  const frecciaRef = useRef<HTMLDivElement | null>(null);
  // Il manico del gesto, per chi arriva dopo che e' nato. Lo scrive e lo
  // cancella l'effetto qui sotto; in produzione nessuno lo legge.
  const guidaRef = useRef<Guida | null>(null);
  // La tessitura viva, se c'e'. Vive fuori dal gsap.context di useSectionAnimation
  // — la costruisce anche disegna(), che gsap.context non vede — quindi il
  // revert automatico non la raccoglie: deve passare da questo ref e da
  // spegni(), come cavo.current in DeskCables.
  const tessitura = useRef<gsap.core.Timeline | null>(null);

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

  /**
   * Il filo misura la SCENA INTERA, titolo e occhiello compresi, e non il
   * percorso. Non e' una svista rimasta: il filo e' il tratto della pagina, non
   * il gesto. Entra al bordo alto della sezione, dove lo consegnano i cavi del
   * tavolo, ed esce al bordo basso, dove lo prendono i Lavori — `filo()` mette
   * il primo punto a y=0 e l'ultimo a y=mondo.h, quindi la scatola che gli si
   * da' E' la sua corsa. Misurato sul percorso, il filo comincerebbe sotto il
   * titolo e finirebbe sopra il fondo della sezione: due buchi in un tratto che
   * attraversa tutta la pagina. Il suo SVG copre infatti la scena intera
   * (`inset: 0` su [data-pratica]), e il viewBox che l'effetto gli scrive e'
   * questo stesso mondo: le due scatole devono restare la stessa.
   */
  const misuraScena = useCallback(() => misuraIn(scope.current), [misuraIn]);

  /** La freccia misura il PERCORSO, che e' la scatola in cui i suoi numeri sono
   *  stati trovati — e dentro la quale sta lei stessa. */
  const misuraPercorso = useCallback(() => misuraIn(percorso.current), [misuraIn]);

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
      // La finestra e' dichiarata, e non e' un dettaglio. Il default di `weave`
      // sotto scrub e' `top bottom` -> `bottom top`: il tratto finirebbe di
      // disegnarsi quando la sezione e' USCITA del tutto dallo schermo, cioe'
      // con la sezione dopo gia' cominciata e la freccia da un pezzo in fondo.
      // Il filo e' la cosa che consegna la pagina ai Lavori: deve chiudere
      // QUI, e il 46% e' lo stesso estremo su cui finisce la corsa della
      // freccia — cosi' arrivano insieme. E' la stessa ragione per cui i cavi
      // del tavolo si danno `top top` / `bottom bottom` invece del default.
      // L'inizio resta quello di serie: il filo comincia a colorarsi appena la
      // scena entra, ben prima che la freccia si muova, ed e' voluto.
      tessitura.current = weave([tratto], {
        level: livello,
        trigger: scope.current,
        scrub: true,
        end: "bottom 46%",
      });
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
    // La bandiera che spegne quello che il cleanup non puo' staccare. Una
    // promessa non si disiscrive: `document.fonts.ready` risolve quando decide
    // lei, e la sua closure porta dentro il `level` di QUESTO giro. Se nel
    // frattempo il livello e' cambiato — basta accendere la riduzione del
    // movimento mentre i caratteri arrivano — quel `then` girerebbe DOPO
    // spegni() e richiamerebbe tessi() col livello vecchio, cioe' ricostruirebbe
    // un `weave` col tratteggio a lunghezza piena e uno ScrollTrigger vivo. Su
    // un passaggio "full" → "none" il risultato e' un filo invisibile che si
    // disegna solo scorrendo: esattamente quello che spegni() esiste per
    // impedire. Il ResizeObserver e il listener si staccano; questa no, e
    // allora si annulla.
    let annullato = false;
    const disegna = () => {
      if (annullato) return;
      const m = misuraScena();
      const tratto = filoRef.current?.querySelector("path");
      if (!m || !tratto || !filoRef.current) return;
      // Il viewBox e' largo quanto la PAGINA, non quanto la scena: l'SVG del
      // filo e' un riquadro a tutta larghezza (vedi [data-pratica-filo] in
      // tokens.css), e le due scatole devono restare la stessa o il tratto si
      // stira. L'altezza resta quella della scena — in verticale il filo la
      // attraversa da bordo a bordo, e quello non cambia.
      const pagina = { w: window.innerWidth, left: m.viewLeft };
      filoRef.current.setAttribute("viewBox", `0 0 ${pagina.w} ${m.mondo.h}`);
      tratto.setAttribute("d", curva(filo(m.misure, m.coda, m.mondo, pagina)));
      tessi(level);
    };
    disegna();
    void document.fonts?.ready?.then(disegna);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(disegna) : null;
    if (ro && scope.current) ro.observe(scope.current);
    window.addEventListener("resize", disegna);
    return () => {
      annullato = true;
      ro?.disconnect();
      window.removeEventListener("resize", disegna);
    };
  }, [misuraScena, level, tessi]);

  // A ogni cambio di livello, non solo all'uscita da "full": useGSAP con delle
  // dipendenze rimanda il revert allo smontaggio, non al cambio di livello.
  // spegni() qui e spegni() come cleanup di useSectionAnimation qui sotto
  // finiscono per girare due volte sullo stesso cambio di livello: e'
  // innocuo, removeProperty e uccidere una timeline gia' morta sono entrambi
  // idempotenti, e non va "semplificato" a una sola chiamata.
  useLayoutEffect(() => spegni, [level, spegni]);

  useSectionAnimation((livello) => {
    // Il filo si tesse a OGNI livello sopra "none": e' il tratto della pagina,
    // non il gesto. La freccia invece esiste solo a "full", ed e' per questo
    // che tessi() sta prima dell'uscita anticipata qui sotto e spegni() e' il
    // cleanup anche quando la freccia non nasce.
    tessi(livello);

    const stradaEl = stradaRef.current;
    const gpath = stradaEl?.querySelector("path");
    const fre = frecciaRef.current;
    if (livello !== "full" || !stradaEl || !gpath || !fre) return spegni;

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
      spegni();
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
