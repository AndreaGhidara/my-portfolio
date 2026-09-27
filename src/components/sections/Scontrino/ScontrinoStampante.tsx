"use client";

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { ScontrinoSchema } from "./ScontrinoSchema";
import {
  CADUTA,
  INTERVALLO,
  aScatti,
  righeScontrino,
  scattiTotali,
  stampante,
  statoIniziale,
  type Evento,
  type Riga,
  type Stampante,
} from "./scontrino";

export type ServizioStampabile = {
  id: string;
  titolo: string;
  testo: string;
  pezzi: string[];
  /** Il nome accessibile della tavola di questo servizio. */
  disegno: string;
};

export type TestiStampante = {
  /** Sotto la stampante quando non c'e' uno scontrino. */
  hint: string;
  /** Il nome del gruppo dei tasti. */
  tasti: string;
  marca: string;
  nome: string;
  mestiere: string;
  numero: string;
  totale: string;
  daParlarne: string;
  parliamone: string;
  strappa: string;
  tavola: string;
  scala: string;
  firma: string;
};

const due = (n: number) => String(n).padStart(2, "0");

/** Le righe dello scontrino, una per elemento. Il titolo grande ha la sua classe. */
function Corpo({ righe }: { righe: Riga[] }) {
  return (
    <div data-scontrino-corpo aria-hidden="true">
      {righe.map((r, k) => (
        <div key={k} data-riga={r.tipo}>
          {r.testo}
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
export function ScontrinoStampante({
  servizi,
  testi,
  locale,
}: {
  servizi: ServizioStampabile[];
  testi: TestiStampante;
  locale: string;
}) {
  const level = useMotionLevel();
  const fermo = level === "none";
  const macchina = useRef<HTMLDivElement | null>(null);
  const carta = useRef<HTMLDivElement | null>(null);
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
        righeScontrino({
          nome: testi.nome,
          mestiere: testi.mestiere,
          data,
          numero: testi.numero,
          indice,
          quanti: servizi.length,
          titolo: s.titolo,
          testo: s.testo,
          pezzi: s.pezzi,
          totale: testi.totale,
          daParlarne: testi.daParlarne,
        }),
      ),
    [servizi, testi, data],
  );
  const totali = useMemo(() => righe.map(scattiTotali), [righe]);

  const [stato, manda] = useReducer(
    (s: Stampante, e: Evento) => stampante(s, e, totali),
    totali,
    statoIniziale,
  );

  // Il livello cambia dopo il montaggio (e puo' cambiare ancora): spento,
  // quello che c'e' resta intero.
  useEffect(() => {
    if (fermo) manda({ tipo: "completa" });
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
          manda({ tipo: "svuota" });
          return;
        }
        if (!dentro) return;
        osservatore.disconnect();
        manda({ tipo: "autostampa" });
      },
      { threshold: 0.5 },
    );
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, [fermo]);

  // I due tempi della stampante. Ognuno porta la generazione in cui e' nato:
  // se nel frattempo e' cambiata, il riduttore lo ignora.
  useEffect(() => {
    if (stato.fase !== "stampa") return;
    const gen = stato.gen;
    const colpo = window.setInterval(() => manda({ tipo: "scatto", gen }), INTERVALLO);
    return () => window.clearInterval(colpo);
  }, [stato.fase, stato.gen]);

  useEffect(() => {
    if (stato.fase !== "strappo") return;
    const gen = stato.gen;
    const caduta = window.setTimeout(() => manda({ tipo: "caduto", gen }), CADUTA);
    return () => window.clearTimeout(caduta);
  }, [stato.fase, stato.gen]);

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
    if (stato.fase === "stampa") {
      el.style.maxHeight = stato.scatti === 0 ? "0px" : `${el.scrollHeight + 4}px`;
      return;
    }
    if (stato.fase !== "ferma") return;
    if (!el.style.maxHeight) return;
    el.style.maxHeight = `${el.scrollHeight + 4}px`;
    const libera = () => el.style.removeProperty("max-height");
    const dopo = window.setTimeout(libera, 200);
    return () => window.clearTimeout(dopo);
  }, [stato.fase, stato.scatti, stato.tracciato]);

  const premi = (servizio: number) => manda({ tipo: "premi", servizio, subito: fermo });

  const strappa = () => {
    const premuto = stato.servizio;
    manda({ tipo: "strappa", subito: fermo });
    // Il bottone se ne va con lo scontrino: il fuoco torna al tasto che l'ha stampato.
    if (premuto !== null) tasti.current[premuto]?.focus({ preventScroll: true });
  };

  const sulTasto = stato.fase === "strappo" ? stato.poi : stato.servizio;
  const inCarta = stato.servizio === null ? null : servizi[stato.servizio];
  const finito = stato.servizio !== null && stato.scatti >= (totali[stato.servizio] ?? 0);
  const disegnato = servizi[stato.disegno] ?? servizi[0];
  const annuncio =
    inCarta && stato.fase !== "strappo"
      ? `${inCarta.titolo}. ${inCarta.testo} ${inCarta.pezzi.join(", ")}.`
      : "";

  return (
    <>
      <div data-scontrino-oggetto>
        {disegnato && (
          <ScontrinoSchema
            key={stato.tracciato}
            forma={disegnato.id}
            titolo={disegnato.titolo}
            pezzi={disegnato.pezzi}
            etichetta={disegnato.disegno}
            numero={due(stato.disegno + 1)}
            anima={!fermo}
            aspetta={stato.tavolaVuota}
            tavola={testi.tavola}
            scala={testi.scala}
            firma={testi.firma}
          />
        )}
      </div>

      <div data-scontrino-banco>
        <div role="group" aria-label={testi.tasti} data-scontrino-tasti>
          {servizi.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                tasti.current[i] = el;
              }}
              type="button"
              data-scontrino-tasto
              aria-pressed={sulTasto === i}
              onClick={() => premi(i)}
            >
              <span aria-hidden="true">{due(i + 1)}</span>
              {s.titolo}
            </button>
          ))}
        </div>

        <div
          ref={macchina}
          data-scontrino-macchina
          data-lavora={stato.fase === "stampa" ? "" : undefined}
          aria-hidden="true"
        >
          <span data-marca>{testi.marca}</span>
          <span data-spia />
          <span data-fessura />
        </div>

        <div data-scontrino-uscita>
          {/* I fantasmi: i quattro scontrini interi, invisibili, uno sopra
              l'altro nella stessa cella. Tengono l'uscita alta quanto il piu'
              lungo, qualunque sia la lingua e la larghezza. */}
          {righe.map((r, i) => (
            <div key={servizi[i].id} data-scontrino-carta data-fantasma aria-hidden="true">
              <Corpo righe={r} />
              <div data-scontrino-azioni>
                <span>{testi.parliamone}</span>
                <span>{testi.strappa}</span>
              </div>
            </div>
          ))}

          {stato.servizio !== null && (
            <div
              key={stato.tracciato}
              ref={carta}
              data-scontrino-carta
              data-fase={stato.fase}
              data-finito={finito ? "" : undefined}
            >
              <Corpo righe={aScatti(righe[stato.servizio], stato.scatti)} />
              {/* Fuori portata finche' la stampa non e' finita: fino ad allora
                  sono fuori dal flusso (tokens.css), e un fuoco su un bottone
                  che non si vede non serve a nessuno. */}
              <div data-scontrino-azioni inert={stato.fase !== "ferma"}>
                <a href="#contact">{testi.parliamone}</a>
                <button type="button" onClick={strappa}>
                  {testi.strappa}
                </button>
              </div>
            </div>
          )}

          {stato.servizio === null && <p data-scontrino-invito>{testi.hint}</p>}

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
