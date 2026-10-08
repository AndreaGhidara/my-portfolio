"use client";

import { useEffect, useReducer, useState } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { GARMENTS, ROOT, ZONES } from "@/content/toolbox";
import { Editor } from "./Editor";
import { toolsIn, garmentById } from "./graph";
import { ToolboxMap } from "./ToolboxMap";
import type { ToolboxStep, ToolboxCopy } from "./types";

/**
 * Dove si vede la mappa: con il mouse, e da 1280px in su. Sotto, o con il
 * dito, l'editor. La stessa condizione sta in sezioni/cassetta.css, che e' chi sceglie
 * davvero quale delle due scatole si vede: qui serve solo a sapere quale
 * animare.
 */
export const MAP_QUERY = "(pointer: fine) and (min-width: 1280px)";

type State = {
  history: ToolboxStep[];
  garment: string | null;
  /** Da quale passo della storia e' partito il foglio del telefono, se e' aperto. */
  sheet: number | null;
};

type Action =
  | { type: "node"; id: string }
  | { type: "garment"; id: string | null }
  | { type: "back" }
  | { type: "open"; id: string }
  | { type: "close" };

const START: ToolboxStep = { kind: "node", id: ROOT.id };

function sameStep(a: ToolboxStep | undefined, b: ToolboxStep) {
  return !!a && a.kind === b.kind && a.id === b.id;
}

function push(history: ToolboxStep[], p: ToolboxStep): ToolboxStep[] {
  return sameStep(history[history.length - 1], p) ? history : [...history, p];
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
export function toolboxReducer(s: State, action: Action): State {
  switch (action.type) {
    case "node":
      return { ...s, history: push(s.history, { kind: "node", id: action.id }) };
    case "garment":
      return {
        ...s,
        garment: action.id,
        history: push(s.history, action.id ? { kind: "garment", id: action.id } : START),
      };
    case "open": {
      const history = push(s.history, { kind: "node", id: action.id });
      return { ...s, history, sheet: history.length - 1 };
    }
    case "close":
      return { ...s, sheet: null };
    case "back": {
      const floor = s.sheet ?? 0;
      if (s.history.length - 1 <= floor) return s;
      const history = s.history.slice(0, -1);
      const top = history[history.length - 1];
      let garment = s.garment;
      if (top.kind === "garment") garment = top.id;
      else if (top.id === ROOT.id) garment = null;
      return { ...s, history, garment };
    }
  }
}

function useMapView(): boolean | null {
  const [isMap, setIsMap] = useState<boolean | null>(null);
  useEffect(() => {
    const query = window.matchMedia(MAP_QUERY);
    const update = () => setIsMap(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return isMap;
}

/**
 * La cassetta: «cuci per», e sotto la mappa o l'editor. Tutte e due le scatole
 * sono nel markup del server, e il CSS ne mostra una: nessuno scambio dopo il
 * montaggio, quindi la sezione ha la stessa altezza prima e dopo il JavaScript.
 * L'elenco per scomparti e' quello che legge uno screen reader, e quello che si
 * vede senza JavaScript.
 */
export function Toolbox({ copy }: { copy: ToolboxCopy }) {
  const level = useMotionLevel();
  const mapView = useMapView();
  const [state, dispatch] = useReducer(toolboxReducer, {
    history: [START],
    garment: null,
    sheet: null,
  });
  const garment = state.garment ? (garmentById(state.garment) ?? null) : null;
  const step = state.history[state.history.length - 1];

  // Il foglio e' del telefono: se la finestra si allarga fino alla mappa, si chiude.
  useEffect(() => {
    if (mapView && state.sheet !== null) dispatch({ type: "close" });
  }, [mapView, state.sheet]);

  const e = copy.label;
  const mapBack =
    state.history.length > 1 ? (
      <button
        type="button"
        onClick={() => dispatch({ type: "back" })}
      >
        <span aria-hidden="true">‹ </span>
        {e.back}
      </button>
    ) : null;

  return (
    <div data-toolbox data-motion={level}>
      <div data-toolbox-sew role="group" aria-label={copy.sewFor}>
        <span aria-hidden="true">{copy.sewFor}</span>
        {GARMENTS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={state.garment === c.id}
            onClick={() => dispatch({ type: "garment", id: c.id })}
          >
            {copy.garments[c.id].name}
          </button>
        ))}
        <button
          type="button"
          data-whole
          aria-pressed={state.garment === null}
          onClick={() => dispatch({ type: "garment", id: null })}
        >
          {copy.whole}
        </button>
      </div>
      <p data-toolbox-start>{copy.start}</p>

      <div data-toolbox-scene>
        <ToolboxMap
          copy={copy}
          garment={garment}
          step={step}
          onNode={(id) => dispatch({ type: "node", id })}
          onGarment={(id) => dispatch({ type: "garment", id })}
          actions={mapBack}
          level={level}
          active={mapView === true}
        />
        <Editor
          copy={copy}
          garment={garment}
          step={step}
          sheetOpen={state.sheet !== null && mapView === false}
          canGoBack={
            state.sheet !== null && state.history.length - 1 > state.sheet
          }
          onOpen={(id) => dispatch({ type: "open", id })}
          onNode={(id) => dispatch({ type: "node", id })}
          onGarment={(id) => dispatch({ type: "garment", id })}
          onBack={() => dispatch({ type: "back" })}
          onClose={() => dispatch({ type: "close" })}
          level={level}
          active={mapView === false}
        />
      </div>

      <div data-toolbox-list>
        <h3>{copy.list}</h3>
        {ZONES.map((z) => (
          // Un div e non una section: nove scomparti sarebbero nove landmark,
          // e la mappa della pagina ne resterebbe sommersa. Basta l'h4.
          <div key={z.id}>
            <h4>{copy.zones[z.id].name}</h4>
            <p>{copy.zones[z.id].what}</p>
            <ul>
              {toolsIn(z.id).map((a) => (
                <li key={a.id}>
                  <b>{a.name}</b>: {copy.tools[a.id].what}{" "}
                  <span>
                    ({a.experience === "work" ? e.atWork : e.known})
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
