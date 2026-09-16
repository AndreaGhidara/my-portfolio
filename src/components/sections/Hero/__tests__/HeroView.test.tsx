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
    // Il nome e' disegnato, cioe' sei immagini con alt vuoto piu' un
    // aria-label. Un motore di ricerca legge i nodi di testo e gli alt, non
    // aria-label: l'h1 di questo sito era una stringa VUOTA, e il cognome non
    // compariva in nessun titolo della pagina. Chi usa uno screen reader
    // sentiva "Andrea" e basta. Adesso il testo c'e', e serve a tutti e due.
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
    // Sono l'elemento LCP della pagina, e uscivano con loading="lazy": il
    // browser le metteva in coda proprio mentre le sta aspettando. Wordmark
    // documentava gia' che `priority` e' "da attivare solo nell'hero", e
    // nell'hero non era attivato.
    const { container } = render(<HeroView {...props} />);
    const lettere = container.querySelectorAll("img.wordmark-letter");
    expect(lettere.length).toBeGreaterThan(0);
    for (const lettera of lettere) {
      expect(lettera, "una lettera del nome e' ancora in coda").not.toHaveAttribute(
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

/**
 * La carta del nome. Qui si prova quello che si puo' provare senza un browser:
 * che a riposo l'hero sia ESATTAMENTE quello di prima. Il gesto (la piega, la
 * pallina, il volo) vive solo a livello "full", e nei test il livello e'
 * sempre "none": una prova che fingesse di esercitarlo certificherebbe il
 * nulla. Quello che si puo' provare sta in carta/__tests__, dove la geometria
 * e la fisica sono pure.
 */
describe("la carta del nome", () => {
  it("lo strato c'e', ed e' muto", () => {
    const { container } = render(<HeroView {...props} />);
    const strato = container.querySelector("[data-carta]");
    expect(strato).not.toBeNull();
    expect(strato).toHaveAttribute("aria-hidden", "true");
  });

  it("senza movimento non tocca una sola lettera", () => {
    // Il patto: a "none" (cioe' in SSR, al primo render, senza JavaScript e
    // con la riduzione del movimento accesa) l'hero e' quello di sempre.
    // Nessuna tela, nessuno stile appiccicato alle immagini.
    const { container } = render(<HeroView {...props} />);
    expect(container.querySelectorAll("[data-carta-lettera], [data-carta-pezzo]")).toHaveLength(0);
    for (const img of container.querySelectorAll(".wordmark-letter")) {
      expect((img as HTMLElement).style.opacity).toBe("");
    }
    expect(document.body).not.toHaveAttribute("data-carta-presa");
  });

  it("il nome resta leggibile a chi non vede lo schermo", () => {
    // Le lettere sono immagini, e la carta che si appallottola gioca con
    // quelle: il nome deve sopravvivere a qualunque cosa faccia. Adesso lo
    // porta il testo dell'h1 e non piu' l'aria-label del wordmark, che dentro
    // un titolo che ha gia' il suo testo sarebbe una ripetizione.
    render(<HeroView {...props} />);
    expect(
      screen.getByRole("heading", { level: 1, name: props.heading }),
    ).toBeInTheDocument();
  });
});
