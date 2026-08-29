import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SeekingView } from "../SeekingView";

const props = {
  eyebrow: "Partiamo da qui",
  title: "Cosa stai cercando?",
  intro: "Se sei arrivato fin qui, una di queste frasi te la sei già detta.",
  outro: "Ti ci sei riconosciuto?",
  items: [
    { id: "sites", voice: "Il mio sito non dice quello che faccio davvero." },
    { id: "ecommerce", voice: "Voglio vendere online senza combattere col gestionale." },
    { id: "webapp", voice: "Ho un'idea in testa e nessuno che la costruisca." },
    { id: "ai", voice: "Voglio smettere di fare a mano quello che potrebbe farsi da solo." },
  ],
};

describe("SeekingView", () => {
  it("mostra le quattro voci nell'ordine ricevuto", () => {
    const { container } = render(<SeekingView {...props} />);
    const rows = container.querySelectorAll("ol > li");
    expect(Array.from(rows).map((r) => r.textContent)).toEqual(
      props.items.map((item, i) => `${String(i + 1).padStart(2, "0")}${item.voice}`),
    );
  });

  it("le voci sono una lista ordinata: sono quattro persone diverse, non un paragrafo", () => {
    const { container } = render(<SeekingView {...props} />);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
  });

  it("il titolo di sezione è un h2: sotto l'h1 dell'hero", () => {
    render(<SeekingView {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: props.title })).toBeInTheDocument();
  });

  it("il testo corrente sull'arancio è inchiostro, non carta: la carta su arancio non arriva ad AA", () => {
    const { container } = render(<SeekingView {...props} />);
    const intro = container.querySelector("[data-seeking-intro]");
    expect(intro?.className).toContain("--on-accent");
  });

  it("le frasi sono senza animazione anche se il JavaScript non parte", () => {
    render(<SeekingView {...props} />);
    for (const item of props.items) {
      expect(screen.getByText(item.voice)).toBeVisible();
    }
  });
});
