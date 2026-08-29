import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProcessView } from "../ProcessView";

const props = {
  eyebrow: "Come lavoro",
  title: "Quattro passi, sempre gli stessi",
  steps: [
    { id: "understand", title: "Capiamo", body: "Prima della tecnologia." },
    { id: "design", title: "Progetto", body: "Struttura e schermate." },
    { id: "build", title: "Costruisco", body: "A pezzi consegnabili." },
    { id: "stay", title: "Resto", body: "Dopo il lancio non sparisco." },
  ],
};

describe("ProcessView", () => {
  it("i passi sono una sequenza ordinata", () => {
    const { container } = render(<ProcessView {...props} />);
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
  });

  it("l'ultimo passo è 'Resto': è quello che vale i primi tre", () => {
    render(<ProcessView {...props} />);
    const items = screen.getAllByRole("listitem");
    expect(items[items.length - 1]).toHaveTextContent("Resto");
  });

  it("il filo attraversa la sezione", () => {
    const { container } = render(<ProcessView {...props} />);
    expect(container.querySelector('[data-thread="process"]')).not.toBeNull();
  });
});
