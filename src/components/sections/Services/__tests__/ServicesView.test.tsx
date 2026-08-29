import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ServicesView } from "../ServicesView";

const props = {
  eyebrow: "Il metodo",
  title: "Come lo costruisco",
  intro: "Quattro modi di lavorare, uno per ogni frase qui sopra.",
  items: [
    { id: "sites", title: "Siti e landing su misura", description: "Il sito è la prima cosa." },
    { id: "ecommerce", title: "E-commerce", description: "Vendere online." },
    { id: "webapp", title: "Web app e piattaforme", description: "Gestionali su misura." },
    { id: "ai", title: "AI e automazioni", description: "Assistenti che rispondono." },
  ],
};

describe("ServicesView", () => {
  it("mostra i quattro servizi nell'ordine ricevuto", () => {
    render(<ServicesView {...props} />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(props.items.map((i) => i.title));
  });

  it("numera i servizi: l'ordine è deliberato e va reso visibile", () => {
    render(<ServicesView {...props} />);
    expect(screen.getByText("01")).toBeVisible();
    expect(screen.getByText("04")).toBeVisible();
  });

  it("le quattro risposte stanno in una lista ordinata: rispondono in ordine alle quattro voci", () => {
    const { container } = render(<ServicesView {...props} />);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
  });

  it("mostra il metodo di ogni voce, non solo il nome del servizio", () => {
    render(<ServicesView {...props} />);
    for (const item of props.items) {
      expect(screen.getByText(item.description)).toBeVisible();
    }
  });

  it("è ancorabile dalla navbar", () => {
    const { container } = render(<ServicesView {...props} />);
    expect(container.querySelector("section#services")).not.toBeNull();
  });
});
