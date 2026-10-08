"use client";

import { useEffect, useReducer, useState } from "react";
import { useMotionLevel } from "@/animations/motionPolicy";
import { GARMENTS, ROOT, ZONES } from "@/content/toolbox";
import { Editor } from "./Editor";
import { toolsIn, garmentById } from "./graph";
import { ToolboxMap } from "./ToolboxMap";
import type { ToolboxStep, ToolboxCopy } from "./types";

// La stessa condizione sta in styles/sections/toolbox.css, che sceglie davvero
// quale vista si vede: qui serve solo a sapere quale animare.
export const MAP_QUERY = "(pointer: fine) and (min-width: 1280px)";

type State = {
  history: ToolboxStep[];
  garment: string | null;
  /** Il passo da cui e' partito il foglio del telefono: indietro non scende sotto. */
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

// Nel genitore delle due viste: girando il tablet si passa dall'una all'altra
// e si ritrova lo stesso lavoro. Tornando su un capo lo si ricuce; tornando al
// cartellino torna la cassetta intera.
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

// Mappa ed editor sono tutti e due nel markup del server e il CSS ne mostra
// uno: nessuno scambio dopo il montaggio, stessa altezza prima e dopo il
// JavaScript. L'elenco per scomparti e' per gli screen reader e per chi non ha
// JavaScript.
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
