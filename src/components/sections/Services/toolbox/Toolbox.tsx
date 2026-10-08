"use client";

import { useEffect, useReducer, useState } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { GARMENTS, ROOT, ZONES } from "@/content/toolbox";
import { Editor } from "./Editor";
import { toolsIn, garmentById as capoPerId } from "./graph";
import { ToolboxMap } from "./ToolboxMap";
import type { ToolboxStep, ToolboxCopy } from "./types";

/**
 * Dove si vede la mappa: con il mouse, e da 1280px in su. Sotto, o con il
 * dito, l'editor. La stessa condizione sta in sezioni/cassetta.css, che e' chi sceglie
 * davvero quale delle due scatole si vede: qui serve solo a sapere quale
 * animare.
 */
export const MAP_QUERY = "(pointer: fine) and (min-width: 1280px)";

type Stato = {
  history: ToolboxStep[];
  garment: string | null;
  /** Da quale passo della storia e' partito il foglio del telefono, se e' aperto. */
  sheet: number | null;
};

type Azione =
  | { type: "nodo"; id: string }
  | { type: "capo"; id: string | null }
  | { type: "indietro" }
  | { type: "apri"; id: string }
  | { type: "chiudi" };

const INIZIO: ToolboxStep = { kind: "nodo", id: ROOT.id };

function uguale(a: ToolboxStep | undefined, b: ToolboxStep) {
  return !!a && a.kind === b.kind && a.id === b.id;
}

function avanti(storia: ToolboxStep[], p: ToolboxStep): ToolboxStep[] {
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
export function toolboxReducer(s: Stato, a: Azione): Stato {
  switch (a.type) {
    case "nodo":
      return { ...s, history: avanti(s.history, { kind: "nodo", id: a.id }) };
    case "capo":
      return {
        ...s,
        garment: a.id,
        history: avanti(s.history, a.id ? { kind: "capo", id: a.id } : INIZIO),
      };
    case "apri": {
      const storia = avanti(s.history, { kind: "nodo", id: a.id });
      return { ...s, history: storia, sheet: storia.length - 1 };
    }
    case "chiudi":
      return { ...s, sheet: null };
    case "indietro": {
      const fondo = s.sheet ?? 0;
      if (s.history.length - 1 <= fondo) return s;
      const storia = s.history.slice(0, -1);
      const cima = storia[storia.length - 1];
      let capo = s.garment;
      if (cima.kind === "capo") capo = cima.id;
      else if (cima.id === ROOT.id) capo = null;
      return { ...s, history: storia, garment: capo };
    }
  }
}

function useVistaMappa(): boolean | null {
  const [mappa, setMappa] = useState<boolean | null>(null);
  useEffect(() => {
    const lista = window.matchMedia(MAP_QUERY);
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
export function Toolbox({ copy: testi }: { copy: ToolboxCopy }) {
  const level = useMotionLevel();
  const vistaMappa = useVistaMappa();
  const [stato, manda] = useReducer(toolboxReducer, {
    history: [INIZIO],
    garment: null,
    sheet: null,
  });
  const capo = stato.garment ? (capoPerId(stato.garment) ?? null) : null;
  const passo = stato.history[stato.history.length - 1];

  // Il foglio e' del telefono: se la finestra si allarga fino alla mappa, si chiude.
  useEffect(() => {
    if (vistaMappa && stato.sheet !== null) manda({ type: "chiudi" });
  }, [vistaMappa, stato.sheet]);

  const e = testi.label;
  const indietroMappa =
    stato.history.length > 1 ? (
      <button
        type="button"
        onClick={() => manda({ type: "indietro" })}
      >
        <span aria-hidden="true">‹ </span>
        {e.back}
      </button>
    ) : null;

  return (
    <div data-cassetta data-motion={level}>
      <div data-cassetta-cuci role="group" aria-label={testi.sewFor}>
        <span aria-hidden="true">{testi.sewFor}</span>
        {GARMENTS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={stato.garment === c.id}
            onClick={() => manda({ type: "capo", id: c.id })}
          >
            {testi.garments[c.id].name}
          </button>
        ))}
        <button
          type="button"
          data-tutta
          aria-pressed={stato.garment === null}
          onClick={() => manda({ type: "capo", id: null })}
        >
          {testi.whole}
        </button>
      </div>
      <p data-cassetta-partenza>{testi.start}</p>

      <div data-cassetta-scena>
        <ToolboxMap
          copy={testi}
          garment={capo}
          step={passo}
          onNode={(id) => manda({ type: "nodo", id })}
          onGarment={(id) => manda({ type: "capo", id })}
          actions={indietroMappa}
          level={level}
          active={vistaMappa === true}
        />
        <Editor
          copy={testi}
          garment={capo}
          step={passo}
          sheetOpen={stato.sheet !== null && vistaMappa === false}
          canGoBack={
            stato.sheet !== null && stato.history.length - 1 > stato.sheet
          }
          onOpen={(id) => manda({ type: "apri", id })}
          onNode={(id) => manda({ type: "nodo", id })}
          onGarment={(id) => manda({ type: "capo", id })}
          onBack={() => manda({ type: "indietro" })}
          onClose={() => manda({ type: "chiudi" })}
          level={level}
          active={vistaMappa === false}
        />
      </div>

      <div data-cassetta-elenco>
        <h3>{testi.list}</h3>
        {ZONES.map((z) => (
          // Un div e non una section: nove scomparti sarebbero nove landmark,
          // e la mappa della pagina ne resterebbe sommersa. Basta l'h4.
          <div key={z.id}>
            <h4>{testi.zones[z.id].name}</h4>
            <p>{testi.zones[z.id].what}</p>
            <ul>
              {toolsIn(z.id).map((a) => (
                <li key={a.id}>
                  <b>{a.name}</b>: {testi.tools[a.id].what}{" "}
                  <span>
                    ({a.experience === "lavoro" ? e.atWork : e.known})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
