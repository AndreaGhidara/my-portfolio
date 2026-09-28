"use client";

import { useEffect, useReducer, useState } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { CAPI, RADICE, ZONE } from "@/content/cassetta";
import { Editor } from "./Editor";
import { attrezziDi, capo as capoPerId } from "./grafo";
import { Mappa } from "./Mappa";
import type { Passo, TestiCassetta } from "./tipi";

/**
 * Dove si vede la mappa: con il mouse, e da 1280px in su. Sotto, o con il
 * dito, l'editor. La stessa condizione sta in tokens.css, che e' chi sceglie
 * davvero quale delle due scatole si vede: qui serve solo a sapere quale
 * animare.
 */
export const VISTA_MAPPA = "(pointer: fine) and (min-width: 1280px)";

type Stato = {
  storia: Passo[];
  capo: string | null;
  /** Da quale passo della storia e' partito il foglio del telefono, se e' aperto. */
  foglio: number | null;
};

type Azione =
  | { tipo: "nodo"; id: string }
  | { tipo: "capo"; id: string | null }
  | { tipo: "indietro" }
  | { tipo: "apri"; id: string }
  | { tipo: "chiudi" };

const INIZIO: Passo = { tipo: "nodo", id: RADICE.id };

function uguale(a: Passo | undefined, b: Passo) {
  return !!a && a.tipo === b.tipo && a.id === b.id;
}

function avanti(storia: Passo[], p: Passo): Passo[] {
  return uguale(storia[storia.length - 1], p) ? storia : [...storia, p];
}

/**
 * Il capo scelto e la cronologia stanno qui, nel genitore delle due viste:
 * girando il tablet o allargando la finestra si passa dall'una all'altra e si
 * ritrova lo stesso lavoro e la stessa etichetta.
 *
 * La cronologia parte sempre dal cartellino, che e' il punto a cui
 * «indietro» riporta per ultimo. Tornando su un capo la mappa lo ricuce; tornando
 * al cartellino con un capo scelto, torna la cassetta intera.
 */
export function riduci(s: Stato, a: Azione): Stato {
  switch (a.tipo) {
    case "nodo":
      return { ...s, storia: avanti(s.storia, { tipo: "nodo", id: a.id }) };
    case "capo":
      return {
        ...s,
        capo: a.id,
        storia: avanti(s.storia, a.id ? { tipo: "capo", id: a.id } : INIZIO),
      };
    case "apri": {
      const storia = avanti(s.storia, { tipo: "nodo", id: a.id });
      return { ...s, storia, foglio: storia.length - 1 };
    }
    case "chiudi":
      return { ...s, foglio: null };
    case "indietro": {
      const fondo = s.foglio ?? 0;
      if (s.storia.length - 1 <= fondo) return s;
      const storia = s.storia.slice(0, -1);
      const cima = storia[storia.length - 1];
      let capo = s.capo;
      if (cima.tipo === "capo") capo = cima.id;
      else if (cima.id === RADICE.id) capo = null;
      return { ...s, storia, capo };
    }
  }
}

function useVistaMappa(): boolean | null {
  const [mappa, setMappa] = useState<boolean | null>(null);
  useEffect(() => {
    const lista = window.matchMedia(VISTA_MAPPA);
    const aggiorna = () => setMappa(lista.matches);
    aggiorna();
    lista.addEventListener("change", aggiorna);
    return () => lista.removeEventListener("change", aggiorna);
  }, []);
  return mappa;
}

/**
 * La cassetta: «cuci per», e sotto la mappa o l'editor. Tutte e due le scatole
 * sono nel markup del server, e il CSS ne mostra una: nessuno scambio dopo il
 * montaggio, quindi la sezione ha la stessa altezza prima e dopo il JavaScript.
 * L'elenco per scomparti e' quello che legge uno screen reader, e quello che si
 * vede senza JavaScript.
 */
export function Cassetta({ testi }: { testi: TestiCassetta }) {
  const level = useMotionLevel();
  const vistaMappa = useVistaMappa();
  const [stato, manda] = useReducer(riduci, {
    storia: [INIZIO],
    capo: null,
    foglio: null,
  });
  const capo = stato.capo ? (capoPerId(stato.capo) ?? null) : null;
  const passo = stato.storia[stato.storia.length - 1];

  // Il foglio e' del telefono: se la finestra si allarga fino alla mappa, si chiude.
  useEffect(() => {
    if (vistaMappa && stato.foglio !== null) manda({ tipo: "chiudi" });
  }, [vistaMappa, stato.foglio]);

  const e = testi.etichetta;
  const indietroMappa =
    stato.storia.length > 1 ? (
      <button
        type="button"
        onClick={() => manda({ tipo: "indietro" })}
      >
        <span aria-hidden="true">‹ </span>
        {e.indietro}
      </button>
    ) : null;

  return (
    <div data-cassetta data-motion={level}>
      <div data-cassetta-cuci role="group" aria-label={testi.cuciPer}>
        <span aria-hidden="true">{testi.cuciPer}</span>
        {CAPI.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={stato.capo === c.id}
            onClick={() => manda({ tipo: "capo", id: c.id })}
          >
            {testi.capi[c.id].nome}
          </button>
        ))}
        <button
          type="button"
          data-tutta
          aria-pressed={stato.capo === null}
          onClick={() => manda({ tipo: "capo", id: null })}
        >
          {testi.tutta}
        </button>
      </div>
      <p data-cassetta-partenza>{testi.partenza}</p>

      <div data-cassetta-scena>
        <Mappa
          testi={testi}
          capo={capo}
          passo={passo}
          onNodo={(id) => manda({ tipo: "nodo", id })}
          onCapo={(id) => manda({ tipo: "capo", id })}
          azioni={indietroMappa}
          level={level}
          attiva={vistaMappa === true}
        />
        <Editor
          testi={testi}
          capo={capo}
          passo={passo}
          foglioAperto={stato.foglio !== null && vistaMappa === false}
          puoIndietro={
            stato.foglio !== null && stato.storia.length - 1 > stato.foglio
          }
          onApri={(id) => manda({ tipo: "apri", id })}
          onNodo={(id) => manda({ tipo: "nodo", id })}
          onCapo={(id) => manda({ tipo: "capo", id })}
          onIndietro={() => manda({ tipo: "indietro" })}
          onChiudi={() => manda({ tipo: "chiudi" })}
          level={level}
          attiva={vistaMappa === false}
        />
      </div>

      <div data-cassetta-elenco>
        <h3>{testi.elenco}</h3>
        {ZONE.map((z) => (
          <section key={z.id} aria-labelledby={`cassetta-zona-${z.id}`}>
            <h4 id={`cassetta-zona-${z.id}`}>{testi.zone[z.id].nome}</h4>
            <p>{testi.zone[z.id].cosa}</p>
            <ul>
              {attrezziDi(z.id).map((a) => (
                <li key={a.id}>
                  <b>{a.nome}</b>: {testi.attrezzi[a.id].cosa}{" "}
                  <span>
                    ({a.provato === "lavoro" ? e.lavoro : e.conosciuto})
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
