import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroView } from "../HeroView";

const props = {
  eyebrow: "Sviluppatore web · Full stack · Italia",
  wordmarkAlt: "Andrea",
  claim: "Costruisco siti, e-commerce e piattaforme su misura.",
  subclaim: "Per aziende che hanno un'idea chiara e nessuno che la sappia costruire.",
  ctaPrimary: "Parliamone",
  ctaSecondary: "Guarda i lavori",
  scrollHint: "Scorri",
};

describe("HeroView", () => {
  it("ha un solo h1, ed è il nome", () => {
    render(<HeroView {...props} />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveAccessibleName("Andrea");
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
 * che a riposo l'hero sia ESATTAMENTE quello di prima. Il gesto — la piega, la
 * pallina, il volo — vive solo a livello "full", e nei test il livello e'
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
    // Il patto: a "none" — cioe' in SSR, al primo render, senza JavaScript e
    // con la riduzione del movimento accesa — l'hero e' quello di sempre.
    // Nessuna tela, nessuno stile appiccicato alle immagini.
    const { container } = render(<HeroView {...props} />);
    expect(container.querySelectorAll("[data-carta-lettera], [data-carta-pezzo]")).toHaveLength(0);
    for (const img of container.querySelectorAll(".wordmark-letter")) {
      expect((img as HTMLElement).style.opacity).toBe("");
    }
    expect(document.body).not.toHaveAttribute("data-carta-presa");
  });

  it("il nome resta leggibile a chi non vede lo schermo", () => {
    // Le lettere sono immagini: il nome accessibile lo porta il wordmark, e
    // deve sopravvivere a qualunque cosa faccia la carta.
    render(<HeroView {...props} />);
    expect(screen.getByRole("img", { name: props.wordmarkAlt })).toBeInTheDocument();
  });
});
