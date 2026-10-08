import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroView } from "../HeroView";

const props = {
  eyebrow: "Sviluppatore web · Full stack · Italia",
  wordmarkAlt: "Andrea",
  avatarAlt: "Ritratto di Andrea",
  heading: "Andrea Ghidara, sviluppatore e programmatore web full stack",
  claim: "Il tuo sito, cucito addosso alla tua azienda.",
  subclaim:
    "Prima le misure: cosa vendi e a chi. Poi un sito che spiega, un e-commerce che vende, una piattaforma che fa lavorare.",
  ctaPrimary: "Parliamone",
  ctaSecondary: "Guarda i lavori",
  scrollHint: "Scorri",
};

describe("HeroView", () => {
  it("ha un solo h1, ed è testo vero: il nome col cognome e il mestiere", () => {
    // Il nome e' fatto di immagini: l'h1 era vuoto per i motori di ricerca.
    const { container } = render(<HeroView {...props} />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName(props.heading);
    expect(headings[0].textContent, "l'h1 non ha testo: per un crawler e' vuoto").toContain(
      "Ghidara",
    );

    // E le lettere disegnate non si fanno leggere una seconda volta.
    expect(container.querySelector("h1 [aria-hidden='true']")).not.toBeNull();
  });

  it("le lettere del nome non aspettano il loro turno", () => {
    // Sono l'elemento LCP, e uscivano con loading="lazy".
    const { container } = render(<HeroView {...props} />);
    const letters = container.querySelectorAll("img.wordmark-letter");
    expect(letters.length).toBeGreaterThan(0);
    for (const letter of letters) {
      expect(letter, "una lettera del nome e' ancora in coda").not.toHaveAttribute(
        "loading",
        "lazy",
      );
    }
  });

  it("dice cosa fa e per chi: è ciò che nel prototipo mancava", () => {
    render(<HeroView {...props} />);
    expect(screen.getByText(props.claim)).toBeVisible();
    expect(screen.getByText(props.subclaim)).toBeVisible();
  });

  it("offre le due uscite, una per pubblico", () => {
    render(<HeroView {...props} />);
    expect(screen.getByRole("link", { name: props.ctaPrimary })).toHaveAttribute("href", "#contact");
    expect(screen.getByRole("link", { name: props.ctaSecondary })).toHaveAttribute("href", "#works");
  });

  it("è una region identificabile", () => {
    const { container } = render(<HeroView {...props} />);
    expect(container.querySelector("section#hero")).not.toBeNull();
  });
});

// Il gesto vive solo a "full" e qui il livello e' "none": geometria e fisica si provano in paper/__tests__.
describe("la carta del nome", () => {
  it("lo strato c'e', ed e' muto", () => {
    const { container } = render(<HeroView {...props} />);
    const layer = container.querySelector("[data-paper]");
    expect(layer).not.toBeNull();
    expect(layer).toHaveAttribute("aria-hidden", "true");
  });

  it("senza movimento non tocca una sola lettera", () => {
    // A "none" (SSR, primo render, movimento ridotto) nessuna tela e nessuno stile sulle immagini.
    const { container } = render(<HeroView {...props} />);
    expect(container.querySelectorAll("[data-paper-letter], [data-paper-piece]")).toHaveLength(0);
    for (const img of container.querySelectorAll(".wordmark-letter")) {
      expect((img as HTMLElement).style.opacity).toBe("");
    }
    expect(document.body).not.toHaveAttribute("data-paper-grabbed");
  });

  it("il nome resta leggibile a chi non vede lo schermo", () => {
    // La carta gioca con le immagini: il nome lo porta il testo dell'h1.
    render(<HeroView {...props} />);
    expect(
      screen.getByRole("heading", { level: 1, name: props.heading }),
    ).toBeInTheDocument();
  });
});
