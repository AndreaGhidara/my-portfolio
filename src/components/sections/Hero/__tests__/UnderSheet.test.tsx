import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { SottoIlFoglio } from "../UnderSheet";
import { HeroView } from "../HeroView";
import { regole } from "@/test/css";

const radice = path.resolve(__dirname, "../../../../..");
const leggi = (percorso: string) => readFileSync(path.resolve(radice, percorso), "utf8");

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

/**
 * Il movimento vive solo nel browser: in jsdom il livello e' sempre "none", e
 * a "none" la pagina deve essere quella di prima. E' quello che si prova qui,
 * insieme ai confini che il browser non perdona (chi sta dentro cosa).
 */
describe("la seconda sezione che passa sopra la prima", () => {
  it("parte spenta: l'effetto lo accende il componente, non il markup", () => {
    const { container } = render(
      <SottoIlFoglio>
        <section id="hero" />
        <section id="scontrino" />
      </SottoIlFoglio>,
    );
    const palco = container.querySelector("[data-sotto-il-foglio]");
    expect(palco).not.toBeNull();
    expect(palco, "acceso gia' nel markup: senza JavaScript Hero resterebbe incollato").not.toHaveAttribute(
      "data-acceso",
    );
    expect(container.querySelector("#hero")).not.toHaveAttribute("style");
  });

  it("la sonda non si legge", () => {
    const { container } = render(
      <SottoIlFoglio>
        <section id="hero" />
      </SottoIlFoglio>,
    );
    expect(container.querySelector("[data-foglio-sonda]")).toHaveAttribute("aria-hidden", "true");
  });

  it("nella pagina Hero e la stampante stanno nello stesso contenitore, e solo loro", () => {
    // Lo sticky di Hero vale fino alla fine del suo contenitore: dentro <main>
    // resterebbe incollato dietro tutte le sezioni fino in fondo alla pagina.
    const pagina = leggi("src/app/[locale]/page.tsx");
    expect(pagina).toMatch(/<SottoIlFoglio>\s*<Hero \/>\s*<Scontrino \/>\s*<\/SottoIlFoglio>/);
  });

  it("il gioco delle lettere sta fuori da quello che si rimpicciolisce", () => {
    // Una trasformazione sul contenitore diventa il riferimento dello strato
    // fisso della carta, che smetterebbe di coprire lo schermo.
    const { container } = render(<HeroView {...props} />);
    const strato = container.querySelector("[data-hero-strato]");
    expect(strato, "il contenuto di Hero non ha piu' il suo strato").not.toBeNull();
    expect(strato?.querySelector("h1")).not.toBeNull();
    expect(strato?.querySelector("[data-carta]")).toBeNull();
  });
});

describe("le regole dell'effetto in sections/under-sheet.css", () => {
  const blocco = regole().filter((r) => r.file.endsWith(path.join("sections", "under-sheet.css")));
  const dove = (selettore: RegExp) => blocco.filter((r) => selettore.test(r.selettore));

  it("hanno un blocco loro", () => {
    expect(blocco.length, "il blocco dell'effetto non c'e'").toBeGreaterThan(0);
  });

  it("non danno a #hero ne' z-index ne' isolation", () => {
    // Sticky, Hero apre gia' un contesto suo, e lo strato fisso della carta a
    // "full" sta per questo in <body> (CartaStropicciata). Un livello dato a
    // mano alla sezione non serve a niente e confonderebbe chi legge.
    const sezione = dove(/#hero$/);
    expect(sezione.length, "nessuna regola su #hero: lo sticky dov'e'?").toBeGreaterThan(0);
    for (const { corpo } of sezione) {
      expect(corpo).not.toMatch(/z-index/);
      expect(corpo).not.toMatch(/isolation/);
    }
  });

  it("muovono Hero e la stampante solo sotto l'attributo di accensione", () => {
    for (const { selettore } of dove(/#hero|#scontrino|\[data-hero-strato\]/)) {
      expect(selettore, `${selettore} vale anche a effetto spento`).toContain("[data-acceso]");
    }
  });

  it("il contenuto di Hero apre un contesto suo, o il ritratto buca il velo", () => {
    expect(dove(/\[data-hero-strato\]$/).map((r) => r.corpo).join("\n")).toMatch(/isolation:\s*isolate/);
  });

  it("velo e ombra sono inchiostro, non nero scritto a mano", () => {
    expect(blocco.map((r) => r.corpo).join("\n")).not.toMatch(/#000\b|rgba?\(/);
    expect(dove(/#hero::after$/).map((r) => r.corpo).join("\n")).toMatch(/var\(--ink\)/);
    expect(dove(/#scontrino$/).map((r) => r.corpo).join("\n")).toMatch(/box-shadow:[^;]*var\(--ink\)/);
  });
});
