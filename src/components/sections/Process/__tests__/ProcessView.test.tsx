import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProcessView, type ProcessViewProps } from "../ProcessView";
import { processDeliveries } from "@/content/process";

const deliveries = processDeliveries.map((d, i) => ({
  id: d.id,
  when: `Quando ${i}`,
  title: `Titolo ${i}`,
  lead: `Lead ${i}`,
  includes: [`Dentro ${i}a`, `Dentro ${i}b`, `Dentro ${i}c`],
  excludes: `Non è ${i}`,
  why: `Perché ${i}`,
}));

const props: ProcessViewProps = {
  eyebrow: "Come lavoro",
  title: "Quattro cose che ricevi, in quest'ordine",
  intro: "Non è l'elenco di quello che faccio io.",
  deliveries,
};

describe("ProcessView", () => {

  it("la sezione si chiama come il suo titolo, e il titolo ha la scala di tutte le sezioni", () => {
    render(<ProcessView {...props} />);
    const section = screen.getByRole("region", { name: props.title });
    const heading = within(section).getByRole("heading", { level: 2, name: props.title });
    expect(section).toHaveAttribute("aria-labelledby", heading.id);
    expect(heading).toHaveClass("section-title");
  });
  it("le consegne sono una lista ordinata: «in quest'ordine» è metà del titolo", () => {
    const { container } = render(<ProcessView {...props} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(processDeliveries.length);
  });

  it("l'ultima consegna è quella che non ha una data di fine", () => {
    // Per attributo: getAllByRole("listitem") pesca anche la lista dentro ogni consegna.
    const { container } = render(<ProcessView {...props} />);
    const items = container.querySelectorAll("[data-process-item]");
    const last = deliveries[deliveries.length - 1];
    expect(items[items.length - 1]).toHaveTextContent(last.title);
  });

  it("i lati si alternano: due voci di fila dallo stesso lato lasciano mezza colonna vuota", () => {
    const { container } = render(<ProcessView {...props} />);
    const sides = [...container.querySelectorAll("[data-process-item]")].map((el) =>
      el.getAttribute("data-side"),
    );
    expect(sides).toHaveLength(processDeliveries.length);
    for (let i = 1; i < sides.length; i++) {
      expect(sides[i], `la voce ${i + 1} sta dallo stesso lato della precedente`).not.toBe(
        sides[i - 1],
      );
    }
  });

  it("ogni consegna dice anche cosa NON è", () => {
    const { container } = render(<ProcessView {...props} />);
    expect(container.querySelectorAll("[data-process-excludes]")).toHaveLength(deliveries.length);
  });

  it("i disegni sono le sagome del tavolo, e sono decorazione dichiarata", () => {
    // `data-desk-object` conta i ventiquattro oggetti del tavolo: queste consegne non ci stanno.
    const { container } = render(<ProcessView {...props} />);
    const pieces = [...container.querySelectorAll("[data-desk-piece]")];
    expect(pieces.map((p) => p.getAttribute("data-shape"))).toEqual(
      processDeliveries.map((d) => d.shape),
    );
    expect(container.querySelectorAll("[data-desk-object]")).toHaveLength(0);
    for (const art of container.querySelectorAll("[data-process-art]")) {
      expect(art).toHaveAttribute("aria-hidden", "true");
    }
  });
});
