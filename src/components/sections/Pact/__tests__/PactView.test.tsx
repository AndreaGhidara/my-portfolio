import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PactView } from "../PactView";

const props = {
  eyebrow: "Come funziona",
  title: "Cosa succede se mi scrivi",
  intro: "Sono Andrea…",
  steps: [
    { id: "reply", title: "Rispondo entro 24 ore", body: "Sempre." },
    { id: "call", title: "Call gratuita di 30 minuti", body: "Mi racconti." },
    { id: "proposal", title: "Proposta scritta", body: "Nero su bianco." },
    { id: "decide", title: "Decidi con calma", body: "Nessun impegno." },
  ],
};

describe("PactView", () => {
  it("presenta i passi come lista ordinata: è una sequenza, non un elenco", () => {
    const { container } = render(<PactView {...props} />);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
  });

  it("mostra ogni passo con titolo e spiegazione", () => {
    render(<PactView {...props} />);
    for (const step of props.steps) {
      expect(screen.getByText(step.title)).toBeVisible();
      expect(screen.getByText(step.body)).toBeVisible();
    }
  });

  it("il titolo di sezione è un h2: sotto l'h1 dell'hero", () => {
    render(<PactView {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: props.title })).toBeInTheDocument();
  });
});
