import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { UnderSheet } from "../UnderSheet";
import { HeroView } from "../HeroView";
import { rules } from "@/test/css";

const root = path.resolve(__dirname, "../../../../..");
const read = (file: string) => readFileSync(path.resolve(root, file), "utf8");

const props = {
  eyebrow: "Sviluppatore web",
  wordmarkAlt: "Andrea",
  avatarAlt: "Ritratto di Andrea",
  heading: "Andrea Ghidara",
  claim: "Il tuo sito.",
  subclaim: "Prima le misure.",
  ctaPrimary: "Parliamone",
  ctaSecondary: "Guarda i lavori",
  scrollHint: "Scorri",
};

// In jsdom il livello e' sempre "none", e a "none" la pagina deve essere quella di prima.
describe("la seconda sezione che passa sopra la prima", () => {
  it("parte spenta: l'effetto lo accende il componente, non il markup", () => {
    const { container } = render(
      <UnderSheet>
        <section id="hero" />
        <section id="scontrino" />
      </UnderSheet>,
    );
    const stage = container.querySelector("[data-under-sheet]");
    expect(stage).not.toBeNull();
    expect(stage, "acceso gia' nel markup: senza JavaScript Hero resterebbe incollato").not.toHaveAttribute(
      "data-lit",
    );
    expect(container.querySelector("#hero")).not.toHaveAttribute("style");
  });

  it("la sonda non si legge", () => {
    const { container } = render(
      <UnderSheet>
        <section id="hero" />
      </UnderSheet>,
    );
    expect(container.querySelector("[data-sheet-probe]")).toHaveAttribute("aria-hidden", "true");
  });

  it("nella pagina Hero e la stampante stanno nello stesso contenitore, e solo loro", () => {
    // Dentro <main> lo sticky di Hero resterebbe incollato fino in fondo alla pagina.
    const page = read("src/app/[locale]/page.tsx");
    expect(page).toMatch(/<UnderSheet>\s*<Hero \/>\s*<Receipt \/>\s*<\/UnderSheet>/);
  });

  it("il gioco delle lettere sta fuori da quello che si rimpicciolisce", () => {
    // Una trasformazione sul contenitore farebbe da riferimento allo strato fisso della carta.
    const { container } = render(<HeroView {...props} />);
    const layer = container.querySelector("[data-hero-layer]");
    expect(layer, "il contenuto di Hero non ha piu' il suo strato").not.toBeNull();
    expect(layer?.querySelector("h1")).not.toBeNull();
    expect(layer?.querySelector("[data-paper]")).toBeNull();
  });
});

describe("le regole dell'effetto in sections/under-sheet.css", () => {
  const block = rules().filter((r) => r.file.endsWith(path.join("sections", "under-sheet.css")));
  const matching = (selector: RegExp) => block.filter((r) => selector.test(r.selector));

  it("hanno un blocco loro", () => {
    expect(block.length, "il blocco dell'effetto non c'e'").toBeGreaterThan(0);
  });

  it("non danno a #hero ne' z-index ne' isolation", () => {
    // Sticky, Hero apre gia' un contesto suo: lo strato della carta sta in <body> (CrumpledPaper).
    const section = matching(/#hero$/);
    expect(section.length, "nessuna regola su #hero: lo sticky dov'e'?").toBeGreaterThan(0);
    for (const { body } of section) {
      expect(body).not.toMatch(/z-index/);
      expect(body).not.toMatch(/isolation/);
    }
  });

  it("muovono Hero e la stampante solo sotto l'attributo di accensione", () => {
    for (const { selector } of matching(/#hero|#scontrino|\[data-hero-layer\]/)) {
      expect(selector, `${selector} vale anche a effetto spento`).toContain("[data-lit]");
    }
  });

  it("il contenuto di Hero apre un contesto suo, o il ritratto buca il velo", () => {
    expect(matching(/\[data-hero-layer\]$/).map((r) => r.body).join("\n")).toMatch(/isolation:\s*isolate/);
  });

  it("velo e ombra sono inchiostro, non nero scritto a mano", () => {
    expect(block.map((r) => r.body).join("\n")).not.toMatch(/#000\b|rgba?\(/);
    expect(matching(/#hero::after$/).map((r) => r.body).join("\n")).toMatch(/var\(--ink\)/);
    expect(matching(/#scontrino$/).map((r) => r.body).join("\n")).toMatch(/box-shadow:[^;]*var\(--ink\)/);
  });
});
