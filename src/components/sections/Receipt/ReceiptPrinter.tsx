"use client";

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { pad2 } from "@/lib/format";
import { ReceiptFigure, ReceiptSchema } from "./ReceiptSchema";
import {
  DROP_MS,
  FIGURE_MS,
  TICK_MS,
  linesAtTicks,
  receiptLines,
  ticksToFigure,
  totalTicks,
  printerReducer,
  initialPrinter,
  type PrinterEvent,
  type ReceiptLine,
  type PrinterState,
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
function Corpo({ righe, servizio }: { righe: ReceiptLine[]; servizio: PrintableService }) {
  return (
    <div data-receipt-body aria-hidden="true">
      {righe.map((r, k) => (
        <div key={k} data-line={r.kind}>
          {r.kind === "figure" ? (
            <ReceiptFigure shape={servizio.id} count={servizio.pieces.length} />
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
  services: servizi,
  copy: testi,
  locale,
}: {
  services: PrintableService[];
  copy: PrinterCopy;
  locale: string;
}) {
  const level = useMotionLevel();
  const fermo = level === "none";
  const macchina = useRef<HTMLDivElement | null>(null);
  const carta = useRef<HTMLDivElement | null>(null);
  const uscita = useRef<HTMLDivElement | null>(null);
  const tasti = useRef<(HTMLButtonElement | null)[]>([]);

  // Vuota sul server e al primo render: la pagina e' statica, e la data del
  // server sarebbe quella della build (e un errore di idratazione).
  const [data, setData] = useState("");
  useEffect(() => {
    setData(
      new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(),
      ),
    );
  }, [locale]);

  const righe = useMemo(
    () =>
      servizi.map((s, indice) =>
        receiptLines({
          name: testi.name,
          trade: testi.trade,
          date: data,
          number: testi.number,
          index: indice,
          count: servizi.length,
          title: s.title,
          text: s.text,
          pieces: s.pieces,
          total: testi.total,
          toDiscuss: testi.toDiscuss,
        }),
      ),
    [servizi, testi, data],
  );
  const totali = useMemo(() => righe.map(totalTicks), [righe]);
  const soglie = useMemo(() => righe.map(ticksToFigure), [righe]);

  const [stato, manda] = useReducer(
    (s: PrinterState, e: PrinterEvent) => printerReducer(s, e, totali),
    totali,
    initialPrinter,
  );

  // Il livello cambia dopo il montaggio (e puo' cambiare ancora): spento,
  // quello che c'e' resta intero.
  useEffect(() => {
    if (fermo) manda({ type: "completa" });
  }, [fermo]);

  /* Acceso, decide la prima osservazione della stampante. Gia' a meta' in
     vista (una ricarica con lo scroll ripristinato, un link a #scontrino) lo
     scontrino del server resta: toglierlo e ristamparlo sotto gli occhi di chi
     guarda sarebbe un salto. Ancora sotto lo schermo, si toglie e la stampante
     aspetta chi arriva da sopra: l'autostampa e' per lui. */
  useEffect(() => {
    const el = macchina.current;
    if (fermo || !el || typeof IntersectionObserver === "undefined") return;
    let prima = true;
    const osservatore = new IntersectionObserver(
      (voci) => {
        const dentro = voci.some((v) => v.isIntersecting);
        if (prima) {
          prima = false;
          if (dentro) {
            osservatore.disconnect();
            return;
          }
          manda({ type: "svuota" });
          return;
        }
        if (!dentro) return;
        osservatore.disconnect();
        manda({ type: "autostampa" });
      },
      { threshold: 0.5 },
    );
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, [fermo]);

  // Il colpo che ha appena stampato la figura: la carta deve uscire sopra il disegno.
  const allaFigura =
    stato.phase === "printing" && stato.service !== null && stato.ticks === soglie[stato.service];

  // I colpi gia' stampati, per il timer che riparte: letti al suo avvio, non
  // un motivo per rilanciarlo a ogni colpo.
  const scattiOra = useRef(stato.ticks);
  useLayoutEffect(() => {
    scattiOra.current = stato.ticks;
  }, [stato.ticks]);

  // I due tempi della stampante. Ognuno porta la generazione in cui e' nato:
  // se nel frattempo e' cambiata, il riduttore lo ignora.
  useEffect(() => {
    if (stato.phase !== "printing" || stato.service === null) return;
    const gen = stato.gen;
    /* Sulla figura la stampa aspetta che la carta sia uscita. Solo se la
       figura si vede (il telefono): e' il CSS a deciderlo, e chiederlo al
       DOM evita di ripetere qui il suo breakpoint. Si guarda quella di un
       fantasma, che c'e' sempre: sulla carta vera arriva solo con il suo colpo. */
    const figura = uscita.current?.querySelector<HTMLElement>('[data-ghost] [data-line="figure"]');
    const siVede = !!figura?.offsetHeight;
    const soglia = soglie[stato.service];
    let fatti = scattiOra.current;
    let colpo = 0;
    /* I colpi si contano qui, e il timer si ferma da solo nel colpo che
       stampa la figura: su un telefono lento piu' colpi possono arrivare
       prima che React ridisegni e pulisca l'effetto, e il colpo dopo
       farebbe saltare l'attesa. */
    const batti = () => {
      colpo = window.setInterval(() => {
        fatti += 1;
        manda({ type: "scatto", gen });
        if (siVede && fatti === soglia) window.clearInterval(colpo);
      }, TICK_MS);
    };
    const aspetta = allaFigura && siVede;
    const attesa = aspetta ? window.setTimeout(batti, FIGURE_MS) : 0;
    if (!aspetta) batti();
    return () => {
      window.clearTimeout(attesa);
      window.clearInterval(colpo);
    };
  }, [stato.phase, stato.gen, stato.service, soglie, allaFigura]);

  useEffect(() => {
    if (stato.phase !== "tearing") return;
    const gen = stato.gen;
    const caduta = window.setTimeout(() => manda({ type: "caduto", gen }), DROP_MS);
    return () => window.clearTimeout(caduta);
  }, [stato.phase, stato.gen]);

  /* La carta esce dalla fessura quanto e' stato stampato, prima del paint: la
     riga nuova non deve comparire per un fotogramma sotto il bordo. Parte da
     zero, come nel prototipo: con l'altezza del foglio vuoto (i margini)
     usciva di colpo una striscia bianca prima della prima lettera. A stampa
     finita escono anche i bottoni, e la carta li accompagna con la stessa
     transizione; poi il tetto si toglie, perche' un carattere che arriva
     tardi non tagli l'ultima riga. */
  useLayoutEffect(() => {
    const el = carta.current;
    if (!el) return;
    if (stato.phase === "printing") {
      el.style.maxHeight = stato.ticks === 0 ? "0px" : `${el.scrollHeight + 4}px`;
      return;
    }
    if (stato.phase !== "idle") return;
    if (!el.style.maxHeight) return;
    el.style.maxHeight = `${el.scrollHeight + 4}px`;
    const libera = () => el.style.removeProperty("max-height");
    const dopo = window.setTimeout(libera, 200);
    return () => window.clearTimeout(dopo);
  }, [stato.phase, stato.ticks, stato.traced]);

  const premi = (servizio: number) => manda({ type: "premi", service: servizio, immediate: fermo });

  const strappa = () => {
    const premuto = stato.service;
    manda({ type: "strappa", immediate: fermo });
    // Il bottone se ne va con lo scontrino: il fuoco torna al tasto che l'ha stampato.
    if (premuto !== null) tasti.current[premuto]?.focus({ preventScroll: true });
  };

  const sulTasto = stato.phase === "tearing" ? stato.next : stato.service;
  const inCarta = stato.service === null ? null : servizi[stato.service];
  const finito = stato.service !== null && stato.ticks >= (totali[stato.service] ?? 0);
  const disegnato = servizi[stato.drawing] ?? servizi[0];
  const annuncio =
    inCarta && stato.phase !== "tearing"
      ? `${inCarta.title}. ${inCarta.text} ${inCarta.pieces.join(", ")}.`
      : "";

  return (
    <>
      <div data-receipt-object>
        {disegnato && (
          <ReceiptSchema
            key={stato.traced}
            shape={disegnato.id}
            title={disegnato.title}
            pieces={disegnato.pieces}
            label={disegnato.drawing}
            number={pad2(stato.drawing + 1)}
            animate={!fermo}
            wait={stato.emptyPlate}
            plate={testi.plate}
            scale={testi.scale}
            signature={testi.signature}
          />
        )}
      </div>

      <div data-receipt-bench>
        <div role="group" aria-label={testi.keys} data-receipt-keys>
          {servizi.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                tasti.current[i] = el;
              }}
              type="button"
              data-receipt-key
              aria-pressed={sulTasto === i}
              onClick={() => premi(i)}
            >
              <span aria-hidden="true">{pad2(i + 1)}</span>
              {s.title}
            </button>
          ))}
        </div>

        <div
          ref={macchina}
          data-receipt-machine
          data-busy={stato.phase === "printing" ? "" : undefined}
          aria-hidden="true"
        >
          <span data-brand>{testi.brand}</span>
          <span data-indicator />
          <span data-slot />
        </div>

        <div ref={uscita} data-receipt-outlet>
          {/* I fantasmi: i quattro scontrini interi, invisibili, uno sopra
              l'altro nella stessa cella. Tengono l'uscita alta quanto il piu'
              lungo, qualunque sia la lingua e la larghezza. */}
          {righe.map((r, i) => (
            <div key={servizi[i].id} data-receipt-paper data-ghost aria-hidden="true">
              <Corpo righe={r} servizio={servizi[i]} />
              <div data-receipt-actions>
                <span>{testi.letsTalk}</span>
                <span>{testi.tear}</span>
              </div>
            </div>
          ))}

          {stato.service !== null && (
            <div
              key={stato.traced}
              ref={carta}
              data-receipt-paper
              data-phase={stato.phase}
              data-finished={finito ? "" : undefined}
              // Sopra la figura la carta esce in tutto il tempo dell'attesa, a
              // velocita' costante: e' cosi' che il disegno sembra stampato.
              // Scritto qui e non nel CSS perche' resti uguale a FIGURA.
              style={allaFigura ? { transitionDuration: `${FIGURE_MS}ms` } : undefined}
            >
              <Corpo
                righe={linesAtTicks(righe[stato.service], stato.ticks)}
                servizio={servizi[stato.service]}
              />
              {/* Fuori portata finche' la stampa non e' finita: fino ad allora
                  sono fuori dal flusso (sezioni/scontrino.css), e un fuoco su un bottone
                  che non si vede non serve a nessuno. */}
              <div data-receipt-actions inert={stato.phase !== "idle"}>
                <a href="#contact">{testi.letsTalk}</a>
                <button type="button" onClick={strappa}>
                  {testi.tear}
                </button>
              </div>
            </div>
          )}

          {stato.service === null && <p data-receipt-invite>{testi.hint}</p>}

          {/* Il servizio stampato si annuncia una volta, intero: la stampa a
              colpi e' per gli occhi, e letta cosi' sarebbe un balbettio. */}
          <p className="sr-only" aria-live="polite">
            {annuncio}
          </p>
        </div>
      </div>
    </>
  );
}
