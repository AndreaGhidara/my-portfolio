import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { SottoIlFoglio } from "../SottoIlFoglio";
import { HeroView } from "../HeroView";

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
        <section id="seeking" />
      </SottoIlFoglio>,
    );
    const palco = container.querySelector("[data-sotto-il-foglio]");
    expect(palco).not.toBeNull();
    expect(palco, "acceso gia' nel markup: senza JavaScript Hero resterebbe incollato").not.toHaveAttribute(
      "data-acceso",
    );
    expect(container.querySelector("#hero")).not.toHaveAttribute("style");
  });

  it("la sentinella e la sonda non si leggono", () => {
    const { container } = render(
      <SottoIlFoglio>
        <section id="hero" />
      </SottoIlFoglio>,
    );
    expect(container.querySelector("[data-foglio-sentinella]")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-foglio-sonda]")).toHaveAttribute("aria-hidden", "true");
  });

  it("nella pagina Hero e Seeking stanno nello stesso contenitore, e solo loro", () => {
    // Lo sticky di Hero vale fino alla fine del suo contenitore: dentro <main>
    // resterebbe incollato dietro tutte le sezioni fino in fondo alla pagina.
    const pagina = leggi("src/app/[locale]/page.tsx");
    expect(pagina).toMatch(/<SottoIlFoglio>\s*<Hero \/>\s*<Seeking \/>\s*<\/SottoIlFoglio>/);
  });

  it("il gioco delle lettere sta fuori da quello che si rimpicciolisce", () => {
    // Una trasformazione sul contenitore diventa il riferimento dello strato
    // fisso della carta, che smetterebbe di coprire lo schermo.
    const { container } = render(<HeroView {...props} />);
    const strato = container.querySelector("[data-hero-strato]");
    expect(strato, "il contenuto di Hero non ha piu' il suo strato").not.toBeNull();
    expect(strato?.querySelector("h1")).not.toBeNull();
    expect(strato?.querySelector("[data-carta]")).toBeNull();
    expect(strato?.querySelector("[data-thread]")).toBeNull();
  });

  it("il filo di Hero si misura sulla sentinella, che non e' sticky", () => {
    const vista = leggi("src/components/sections/Hero/HeroView.tsx");
    expect(vista).toMatch(/<ThreadSegment[^>]*section="hero"[^>]*trigger="\[data-foglio-sentinella\]"/);
  });
});

describe("le regole dell'effetto in tokens.css", () => {
  const css = leggi("src/styles/tokens.css");
  const inizio = css.indexOf("LA SECONDA SEZIONE PASSA SOPRA LA PRIMA");
  // Senza commenti: parlano di #hero e #seeking, e non sono regole.
  const blocco = inizio >= 0 ? css.slice(inizio).replace(/\/\*[\s\S]*?\*\//g, "") : "";

  it("hanno un blocco loro", () => {
    expect(blocco, "il blocco dell'effetto non c'e'").not.toBe("");
  });

  it("non danno a #hero ne' z-index ne' isolation", () => {
    // Sticky, Hero apre gia' un contesto suo, e lo strato fisso della carta a
    // "full" sta per questo in <body> (CartaStropicciata). Un livello dato a
    // mano alla sezione non serve a niente e confonderebbe chi legge.
    const regole = [...blocco.matchAll(/#hero\s*\{([^}]*)\}/g)];
    expect(regole.length, "nessuna regola su #hero: lo sticky dov'e'?").toBeGreaterThan(0);
    for (const [, corpo] of regole) {
      expect(corpo).not.toMatch(/z-index/);
      expect(corpo).not.toMatch(/isolation/);
    }
  });

  it("muovono Hero e Seeking solo sotto l'attributo di accensione", () => {
    for (const [, selettore] of blocco.matchAll(/([^{}]*(?:#hero|#seeking|\[data-hero-strato\])[^{}]*)\{/g)) {
      expect(selettore, `${selettore.trim()} vale anche a effetto spento`).toContain("[data-acceso]");
    }
  });

  it("il contenuto di Hero apre un contesto suo, o il ritratto buca il velo", () => {
    expect(blocco).toMatch(/\[data-hero-strato\]\s*\{[^}]*isolation:\s*isolate/);
  });

  it("velo e ombra sono inchiostro, non nero scritto a mano", () => {
    expect(blocco).not.toMatch(/#000\b|rgba?\(/);
    expect(blocco).toMatch(/#hero::after\s*\{[^}]*var\(--ink\)/);
    expect(blocco).toMatch(/#seeking\s*\{[^}]*box-shadow:[^;]*var\(--ink\)/);
  });
});
