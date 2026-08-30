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

  it("usano il colore della linea, non l'arancio: sono un filo, non un accento", () => {
    const { container } = render(<DeskCables />);
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("stroke")).toBe("var(--line)");
    }
  });
});
