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
