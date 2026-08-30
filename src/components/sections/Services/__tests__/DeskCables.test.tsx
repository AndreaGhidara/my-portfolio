import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DeskCables } from "../DeskCables";
import { THREAD_ANCHORS } from "@/components/thread/anchors";

/**
 * Niente stub di matchMedia: quello di vitest.setup.ts risponde "movimento
 * ridotto", il livello risolto e' "none" e `weave` non parte. E' quello che
 * serve — jsdom non sa dire quanto e' lungo un path, e un cavo che si tesse
 * davvero qui dentro esploderebbe su getTotalLength senza provare niente.
 * E' anche la scelta di ThreadSegment.test.tsx, che prova la stessa cosa.
 */
describe("i cavi", () => {
  it("sono decorativi: il filo non si legge, si vede", () => {
    const { container } = render(<DeskCables />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("entrano dove il filo entra nella sezione e escono dove esce", () => {
    const { container } = render(<DeskCables />);
    const ds = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "");
    const entrata = THREAD_ANCHORS.services.in;
    const uscita = THREAD_ANCHORS.services.out;
    expect(ds.some((d) => d.startsWith(`M${entrata} `))).toBe(true);
    expect(ds.some((d) => d.trimEnd().endsWith(` ${uscita} 100`))).toBe(true);
  });

  it("passano dal centro: e' dal laptop che escono", () => {
    const { container } = render(<DeskCables />);
    const ds = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "");
    expect(ds.some((d) => d.includes("50 50"))).toBe(true);
  });

  it("i capi stanno nella scatola della finestra, la derivazione in quella del piano", () => {
    // Non e' un vezzo che siano due SVG: il 14% e l'88% sono percentuali della
    // pagina — e' li' che escono e entrano le sezioni vicine — mentre il rack in
    // cui finisce la derivazione e' una percentuale del piano. Rimettere i tre
    // tratti in una scatola sola riapre il gradino da 170px alla giunzione,
    // oppure fa scivolare la derivazione fuori dal tavolo.
    const { container } = render(<DeskCables />);
    const di = (sel: string) =>
      [...container.querySelectorAll(`${sel} path`)].map((p) => p.getAttribute("d") ?? "");

    const capi = di("[data-desk-cables-ends]");
    const derivazione = di("[data-desk-cables-branch]");

    expect(capi).toHaveLength(2);
    expect(capi.some((d) => d.startsWith(`M${THREAD_ANCHORS.services.in} `))).toBe(true);
    expect(capi.some((d) => d.trimEnd().endsWith(` ${THREAD_ANCHORS.services.out} 100`))).toBe(true);

    expect(derivazione).toHaveLength(1);
    // Tutti e tre partono dallo stesso punto: le due scatole sono concentriche
    // e il loro (50 / 50) e' il laptop.
    expect(derivazione[0].startsWith("M50 50")).toBe(true);
  });

  it("usano il colore della linea, non l'arancio: sono un filo, non un accento", () => {
    const { container } = render(<DeskCables />);
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("stroke")).toBe("var(--line)");
    }
  });
});
