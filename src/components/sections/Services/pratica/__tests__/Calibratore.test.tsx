import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { Calibratore } from "../Calibratore";
import { PARAM, type Param } from "../param";
import type { Guida } from "../freccia";

/**
 * Il calibratore non va in produzione, ma le due cose che il pannello deve fare
 * bene si sentono solo trascinando — e trascinando non le prova nessuno.
 *
 * Sono queste: i pallini si AGGIORNANO e non si ricreano (ricrearli
 * staccherebbe il pointer capture a meta' trascinamento), e lo scostamento si
 * scrive come conto ASSOLUTO e non incrementale (fra due fotogrammi arrivano
 * due `pointermove`, e il secondo leggerebbe una strada che la correzione del
 * primo non ce l'ha ancora dentro: il punto scapperebbe al doppio della
 * velocita' del dito). La seconda, scritta incrementale come nel prototipo,
 * questa prova l'ha vista sbagliare.
 */

const LETTURA = {
  punti: [
    [100, 10],
    [200, 300],
    [300, 600],
  ] as const,
  nomi: ["partenza", "disegno0", "coda.fine"],
  indiciDisegno: [1],
  mondo: { w: 1000, h: 900 },
};

function monta() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-pratica-strada", "");
  document.body.appendChild(svg);
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 900 }) as DOMRect;
  const ricostruisci = vi.fn();
  const guida: { current: Guida | null } = {
    current: { molla: vi.fn(), ricostruisci, leggi: () => LETTURA },
  };
  render(<Calibratore guida={guida} strada={{ current: svg }} />);
  return { svg, ricostruisci };
}

// Il ciclo di rAF si fa girare a mano: cosi' «un fotogramma» e' un punto
// preciso della prova invece che un'attesa.
const fotogrammi: FrameRequestCallback[] = [];
const scorri = () => act(() => fotogrammi.splice(0).forEach((cb) => cb(0)));

let copia: Param;

beforeEach(() => {
  copia = structuredClone(PARAM);
  fotogrammi.length = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => fotogrammi.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("matchMedia", () => ({ matches: true }) as MediaQueryList);
});

afterEach(() => {
  cleanup();
  document.querySelectorAll("svg").forEach((s) => s.remove());
  // `PARAM` e' un oggetto solo, mutato sul posto: va rimesso com'era, o la
  // prova successiva partirebbe dalle manopole di questa.
  Object.assign(PARAM, copia);
  vi.unstubAllGlobals();
});

describe("il calibratore", () => {
  it("accende la strada e disegna un pallino per punto, grosso sui disegni", () => {
    const { svg } = monta();
    expect(svg.hasAttribute("data-vedi")).toBe(false);

    fireEvent.click(screen.getByLabelText(/mostra la strada/i));
    scorri();

    expect(svg.getAttribute("data-vedi")).toBe("");
    const pallini = [...svg.querySelectorAll("circle")];
    expect(pallini.map((c) => c.getAttribute("data-nome"))).toEqual(LETTURA.nomi);
    expect(pallini[1].getAttribute("r")).toBe("9");
    expect(pallini[0].getAttribute("r")).toBe("6");

    fireEvent.click(screen.getByLabelText(/mostra la strada/i));
    expect(svg.querySelectorAll("circle")).toHaveLength(0);
  });

  it("aggiorna i pallini invece di ricrearli", () => {
    const { svg } = monta();
    fireEvent.click(screen.getByLabelText(/mostra la strada/i));
    scorri();
    const primo = svg.querySelector("circle");
    scorri();
    scorri();
    expect(svg.querySelector("circle")).toBe(primo);
  });

  it("salva lo scostamento in frazione della larghezza, e non lo accumula", () => {
    const { svg, ricostruisci } = monta();
    fireEvent.click(screen.getByLabelText(/mostra la strada/i));
    scorri();
    const pallino = svg.querySelector("circle") as SVGCircleElement;
    pallino.setPointerCapture = () => {};

    fireEvent.pointerDown(pallino, { clientX: 100, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(svg, { clientX: 150, clientY: 10, pointerId: 1 });
    // 50px su un mondo largo 1000, e la strada si rifa' al fotogramma dopo.
    expect(PARAM.scostamenti.partenza).toEqual([0.05, 0]);
    scorri();
    expect(ricostruisci).toHaveBeenCalled();

    // Due movimenti allo stesso posto danno lo stesso numero: se il conto fosse
    // incrementale qui ci sarebbe 0.1, cioe' il punto al doppio del dito.
    fireEvent.pointerMove(svg, { clientX: 150, clientY: 10, pointerId: 1 });
    expect(PARAM.scostamenti.partenza).toEqual([0.05, 0]);
  });

  it("gira una manopola mutando PARAM e riporta l'oggetto intero da incollare", () => {
    monta();
    fireEvent.change(screen.getByRole("slider", { name: /gradi per fotogramma/i }), {
      target: { value: "9" },
    });
    expect(PARAM.gradiMax).toBe(9);
    // Il riquadro si rilegge al fotogramma dopo, insieme alla strada.
    scorri();

    const riquadro = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(riquadro.value).toContain("export const PARAM: Param = {");
    expect(riquadro.value).toContain("gradiMax: 9,");
    // Le chiavi che non sono identificatori tengono le virgolette, o il
    // riquadro non sarebbe incollabile.
    expect(riquadro.value).toContain('"coda.giu"');
  });
});
