"use client";

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { pad2 } from "@/lib/format";
import { ReceiptFigure, ReceiptSchema } from "./ReceiptSchema";
import {
  DROP_MS,
  FIGURE_MS,
  TICK_MS,
  initialPrinter,
  linesAtTicks,
  printerReducer,
  receiptLines,
  ticksToFigure,
  totalTicks,
  type PrinterEvent,
  type PrinterState,
  type ReceiptLine,
} from "./receipt";

export type PrintableService = {
  id: string;
  title: string;
  text: string;
  pieces: string[];
  /** Il nome accessibile della tavola di questo servizio. */
  drawing: string;
};

export type PrinterCopy = {
  /** Sotto la stampante quando non c'e' uno scontrino. */
  hint: string;
  /** Il nome del gruppo dei tasti. */
  keys: string;
  brand: string;
  name: string;
  trade: string;
  number: string;
  total: string;
  toDiscuss: string;
  letsTalk: string;
  tear: string;
  plate: string;
  scale: string;
  signature: string;
};

/**
 * Le righe dello scontrino, una per elemento. Il titolo grande ha la sua
 * classe; la figura e' il disegno del servizio, che il CSS mostra solo sul
 * telefono.
 */
function Body({ lines, service }: { lines: ReceiptLine[]; service: PrintableService }) {
  return (
    <div data-receipt-body aria-hidden="true">
      {lines.map((r, k) => (
        <div key={k} data-line={r.kind}>
          {r.kind === "figure" ? (
            <ReceiptFigure shape={service.id} count={service.pieces.length} />
          ) : (
            r.text
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * La stampante e la tavola: condividono lo stato, quindi stanno nello stesso
 * componente, che rende due figli della griglia della sezione.
 *
 * Il server e il livello "none" hanno il primo servizio gia' stampato e
 * disegnato: la sezione si legge senza JavaScript e senza movimento. Negli
 * altri livelli lo scontrino del server si toglie e la stampante aspetta di
 * essere a meta' in vista per stampare da sola il primo, una volta.
 *
 * Lo scontrino non entra mai nel flusso: e' assoluto dentro un'uscita alta
 * quanto il piu' lungo dei quattro, misurato dai quattro fantasmi invisibili
 * che ci stanno sotto (stessa lingua, stessa larghezza, dal CSS e non da uno
 * script). Stampare, strappare e cambiare servizio non cambiano mai l'altezza
 * della pagina, e le scene agganciate piu' sotto non si sfasano.
 */
export function ReceiptPrinter({
  services,
  copy,
  locale,
}: {
  services: PrintableService[];
  copy: PrinterCopy;
  locale: string;
}) {
  const level = useMotionLevel();
  const stopped = level === "none";
  const machine = useRef<HTMLDivElement | null>(null);
  const paper = useRef<HTMLDivElement | null>(null);
  const outlet = useRef<HTMLDivElement | null>(null);
  const keys = useRef<(HTMLButtonElement | null)[]>([]);

  // Vuota sul server e al primo render: la pagina e' statica, e la data del
  // server sarebbe quella della build (e un errore di idratazione).
  const [date, setDate] = useState("");
  useEffect(() => {
    setDate(
      new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(),
      ),
    );
  }, [locale]);

  const lines = useMemo(
    () =>
      services.map((s, index) =>
        receiptLines({
          name: copy.name,
          trade: copy.trade,
          date,
          number: copy.number,
          index,
          count: services.length,
          title: s.title,
          text: s.text,
          pieces: s.pieces,
          total: copy.total,
          toDiscuss: copy.toDiscuss,
        }),
      ),
    [services, copy, date],
  );
  const totals = useMemo(() => lines.map(totalTicks), [lines]);
  const figureTicks = useMemo(() => lines.map(ticksToFigure), [lines]);

  const [state, dispatch] = useReducer(
    (s: PrinterState, e: PrinterEvent) => printerReducer(s, e, totals),
    totals,
    initialPrinter,
  );

  // Il livello cambia dopo il montaggio (e puo' cambiare ancora): spento,
  // quello che c'e' resta intero.
  useEffect(() => {
    if (stopped) dispatch({ type: "complete" });
  }, [stopped]);

  /* Acceso, decide la prima osservazione della stampante. Gia' a meta' in
     vista (una ricarica con lo scroll ripristinato, un link a #scontrino) lo
     scontrino del server resta: toglierlo e ristamparlo sotto gli occhi di chi
     guarda sarebbe un salto. Ancora sotto lo schermo, si toglie e la stampante
     aspetta chi arriva da sopra: l'autostampa e' per lui. */
  useEffect(() => {
    const el = machine.current;
    if (stopped || !el || typeof IntersectionObserver === "undefined") return;
    let first = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries.some((v) => v.isIntersecting);
        if (first) {
          first = false;
          if (inView) {
            observer.disconnect();
            return;
          }
          dispatch({ type: "clear" });
          return;
        }
        if (!inView) return;
        observer.disconnect();
        dispatch({ type: "autoprint" });
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stopped]);

  // Il colpo che ha appena stampato la figura: la carta deve uscire sopra il disegno.
  const atFigure =
    state.phase === "printing" && state.service !== null && state.ticks === figureTicks[state.service];

  // I colpi gia' stampati, per il timer che riparte: letti al suo avvio, non
  // un motivo per rilanciarlo a ogni colpo.
  const ticksRef = useRef(state.ticks);
  useLayoutEffect(() => {
    ticksRef.current = state.ticks;
  }, [state.ticks]);

  // I due tempi della stampante. Ognuno porta la generazione in cui e' nato:
  // se nel frattempo e' cambiata, il riduttore lo ignora.
  useEffect(() => {
    if (state.phase !== "printing" || state.service === null) return;
    const gen = state.gen;
    /* Sulla figura la stampa aspetta che la carta sia uscita. Solo se la
       figura si vede (il telefono): e' il CSS a deciderlo, e chiederlo al
       DOM evita di ripetere qui il suo breakpoint. Si guarda quella di un
       fantasma, che c'e' sempre: sulla carta vera arriva solo con il suo colpo. */
    const figure = outlet.current?.querySelector<HTMLElement>('[data-ghost] [data-line="figure"]');
    const visible = !!figure?.offsetHeight;
    const figureTick = figureTicks[state.service];
    let done = ticksRef.current;
    let interval = 0;
    /* I colpi si contano qui, e il timer si ferma da solo nel colpo che
       stampa la figura: su un telefono lento piu' colpi possono arrivare
       prima che React ridisegni e pulisca l'effetto, e il colpo dopo
       farebbe saltare l'attesa. */
    const startTicking = () => {
      interval = window.setInterval(() => {
        done += 1;
        dispatch({ type: "tick", gen });
        if (visible && done === figureTick) window.clearInterval(interval);
      }, TICK_MS);
    };
    const shouldWait = atFigure && visible;
    const waitTimer = shouldWait ? window.setTimeout(startTicking, FIGURE_MS) : 0;
    if (!shouldWait) startTicking();
    return () => {
      window.clearTimeout(waitTimer);
      window.clearInterval(interval);
    };
  }, [state.phase, state.gen, state.service, figureTicks, atFigure]);

  useEffect(() => {
    if (state.phase !== "tearing") return;
    const gen = state.gen;
    const dropTimer = window.setTimeout(() => dispatch({ type: "dropped", gen }), DROP_MS);
    return () => window.clearTimeout(dropTimer);
  }, [state.phase, state.gen]);

  /* La carta esce dalla fessura quanto e' stato stampato, prima del paint: la
     riga nuova non deve comparire per un fotogramma sotto il bordo. Parte da
     zero, come nel prototipo: con l'altezza del foglio vuoto (i margini)
     usciva di colpo una striscia bianca prima della prima lettera. A stampa
     finita escono anche i bottoni, e la carta li accompagna con la stessa
     transizione; poi il tetto si toglie, perche' un carattere che arriva
     tardi non tagli l'ultima riga. */
  useLayoutEffect(() => {
    const el = paper.current;
    if (!el) return;
    if (state.phase === "printing") {
      el.style.maxHeight = state.ticks === 0 ? "0px" : `${el.scrollHeight + 4}px`;
      return;
    }
    if (state.phase !== "idle") return;
    if (!el.style.maxHeight) return;
    el.style.maxHeight = `${el.scrollHeight + 4}px`;
    const release = () => el.style.removeProperty("max-height");
    const releaseTimer = window.setTimeout(release, 200);
    return () => window.clearTimeout(releaseTimer);
  }, [state.phase, state.ticks, state.traced]);

  const press = (service: number) => dispatch({ type: "press", service, immediate: stopped });

  const tear = () => {
    const pressed = state.service;
    dispatch({ type: "tear", immediate: stopped });
    // Il bottone se ne va con lo scontrino: il fuoco torna al tasto che l'ha stampato.
    if (pressed !== null) keys.current[pressed]?.focus({ preventScroll: true });
  };

  const activeKey = state.phase === "tearing" ? state.next : state.service;
  const onPaper = state.service === null ? null : services[state.service];
  const finished = state.service !== null && state.ticks >= (totals[state.service] ?? 0);
  const drawn = services[state.drawing] ?? services[0];
  const announcement =
    onPaper && state.phase !== "tearing"
      ? `${onPaper.title}. ${onPaper.text} ${onPaper.pieces.join(", ")}.`
      : "";

  return (
    <>
      <div data-receipt-object>
        {drawn && (
          <ReceiptSchema
            key={state.traced}
            shape={drawn.id}
            title={drawn.title}
            pieces={drawn.pieces}
            label={drawn.drawing}
            number={pad2(state.drawing + 1)}
            animate={!stopped}
            wait={state.emptyPlate}
            plate={copy.plate}
            scale={copy.scale}
            signature={copy.signature}
          />
        )}
      </div>

      <div data-receipt-bench>
        <div role="group" aria-label={copy.keys} data-receipt-keys>
          {services.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                keys.current[i] = el;
              }}
              type="button"
              data-receipt-key
              aria-pressed={activeKey === i}
              onClick={() => press(i)}
            >
              <span aria-hidden="true">{pad2(i + 1)}</span>
              {s.title}
            </button>
          ))}
        </div>

        <div
          ref={machine}
          data-receipt-machine
          data-busy={state.phase === "printing" ? "" : undefined}
          aria-hidden="true"
        >
          <span data-brand>{copy.brand}</span>
          <span data-indicator />
          <span data-slot />
        </div>

        <div ref={outlet} data-receipt-outlet>
          {/* I fantasmi: i quattro scontrini interi, invisibili, uno sopra
              l'altro nella stessa cella. Tengono l'uscita alta quanto il piu'
              lungo, qualunque sia la lingua e la larghezza. */}
          {lines.map((r, i) => (
            <div key={services[i].id} data-receipt-paper data-ghost aria-hidden="true">
              <Body lines={r} service={services[i]} />
              <div data-receipt-actions>
                <span>{copy.letsTalk}</span>
                <span>{copy.tear}</span>
              </div>
            </div>
          ))}

          {state.service !== null && (
            <div
              key={state.traced}
              ref={paper}
              data-receipt-paper
              data-phase={state.phase}
              data-finished={finished ? "" : undefined}
              // Sopra la figura la carta esce in tutto il tempo dell'attesa, a
              // velocita' costante: e' cosi' che il disegno sembra stampato.
              // Scritto qui e non nel CSS perche' resti uguale a FIGURA.
              style={atFigure ? { transitionDuration: `${FIGURE_MS}ms` } : undefined}
            >
              <Body
                lines={linesAtTicks(lines[state.service], state.ticks)}
                service={services[state.service]}
              />
              {/* Fuori portata finche' la stampa non e' finita: fino ad allora
                  sono fuori dal flusso (sezioni/scontrino.css), e un fuoco su un bottone
                  che non si vede non serve a nessuno. */}
              <div data-receipt-actions inert={state.phase !== "idle"}>
                <a href="#contact">{copy.letsTalk}</a>
                <button type="button" onClick={tear}>
                  {copy.tear}
                </button>
              </div>
            </div>
          )}

          {state.service === null && <p data-receipt-invite>{copy.hint}</p>}

          {/* Il servizio stampato si annuncia una volta, intero: la stampa a
              colpi e' per gli occhi, e letta cosi' sarebbe un balbettio. */}
          <p className="sr-only" aria-live="polite">
            {announcement}
          </p>
        </div>
      </div>
    </>
  );
}
