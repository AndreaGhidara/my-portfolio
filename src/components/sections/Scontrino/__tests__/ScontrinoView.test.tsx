import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ScontrinoView, type ScontrinoViewProps } from "../ScontrinoView";
import { services } from "@/content/services";
import { regole, type Regola } from "@/test/css";

/**
 * In jsdom il livello di movimento e' sempre "none" (vitest.setup.ts): e' il
 * livello del server e di chi chiede meno movimento, quello in cui la sezione
 * deve leggersi da sola. La stampa a colpi, l'autostampa e la caduta si provano
 * nel modulo puro (scontrino.test.ts) e si guardano in un browser.
 */
const props: ScontrinoViewProps = {
  eyebrow: "Servizi",
  title: "Scegli, e te lo stampo",
  lead: "Premi un tasto.",
  locale: "it",
  servizi: services.map((s, i) => ({
    id: s.id,
    titolo: `Titolo ${i}`,
    testo: `Testo ${i}`,
    pezzi: s.pezzi.map((p) => `pezzo ${p}`),
    disegno: `Schema ${i}`,
  })),
  testi: {
    hint: "La stampante è pronta",
    tasti: "Scegli il servizio da stampare",
    marca: "ANDREA GHIDARA · SERVIZI",
    nome: "ANDREA GHIDARA",
    mestiere: "sviluppo web · full stack",
    numero: "N.",
    totale: "TOTALE",
    daParlarne: "DA PARLARNE",
    parliamone: "Parliamone",
    strappa: "strappa ✂",
    tavola: "TAV.",
    scala: "SCALA 1:1",
    firma: "A. GHIDARA",
  },
};

const vero = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-scontrino-carta]:not([data-fantasma])");

describe("la stampante dei servizi", () => {

  it("la sezione si chiama come il suo titolo, e il titolo ha la scala di tutte le sezioni", () => {
    render(<ScontrinoView {...props} />);
    const sezione = screen.getByRole("region", { name: props.title });
    const titolo = within(sezione).getByRole("heading", { level: 2, name: props.title });
    expect(sezione).toHaveAttribute("aria-labelledby", titolo.id);
    expect(titolo).toHaveClass("titolo-sezione");
  });
  it("e' la seconda sezione: arancione, con il suo id per l'effetto sopra l'apertura", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const sezione = container.querySelector("section");
    expect(sezione).toHaveAttribute("id", "scontrino");
    expect(sezione?.className).toContain("bg-[var(--accent)]");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.title);
  });

  it("senza movimento il primo servizio e' gia' stampato e disegnato", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const carta = vero(container);
    expect(carta).not.toBeNull();
    expect(carta).toHaveAttribute("data-finito");
    expect(carta).toHaveTextContent("TITOLO 0");
    expect(carta).toHaveTextContent(/TOTALE \.+ DA PARLARNE/);
    expect(container.querySelector("[data-scontrino-tavola] svg")).toHaveAttribute("data-traccia");
    expect(screen.getByRole("img", { name: "Schema 0" })).toBeInTheDocument();
  });

  it("scontrino e tavola hanno gli stessi pezzi, nello stesso ordine", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const voci = [...vero(container)!.querySelectorAll('[data-riga="voce"]')].map((v) => v.textContent);
    const note = [...container.querySelectorAll("[data-nota]")].map((n) => n.textContent);
    const pezzi = props.servizi[0].pezzi;
    expect(voci).toEqual(pezzi.map((p, k) => `${k + 1} ${p}`));
    expect(note).toEqual(pezzi.map((p, k) => `${k + 1} · ${p.toUpperCase()}`));
  });

  it("la data non e' nel markup del server: la riga c'e', vuota a sinistra", () => {
    // La pagina e' statica: una data scritta dal server sarebbe quella della
    // build, e diversa da quella del browser (errore di idratazione). Qui il
    // markup del server vero, senza effetti: la riga e' lunga come le altre,
    // con gli spazi al posto della data e il numero in fondo a destra.
    const scatola = document.createElement("div");
    scatola.innerHTML = renderToStaticMarkup(<ScontrinoView {...props} />);
    const righe = [...vero(scatola)!.querySelectorAll("[data-riga]")];
    expect(righe[2].textContent).toBe(`${" ".repeat(24)}N. 01/04`);
  });

  it("nel browser la data arriva a sinistra, e il numero resta in fondo a destra", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const righe = [...vero(container)!.querySelectorAll("[data-riga]")];
    expect(righe[2].textContent).toMatch(/^\S.*\s+N\. 01\/04$/);
    expect(righe[2].textContent).toHaveLength(32);
  });

  it("i tasti sono bottoni in un gruppo col suo nome, e dicono quale e' premuto", () => {
    render(<ScontrinoView {...props} />);
    const gruppo = screen.getByRole("group", { name: props.testi.tasti });
    const tasti = within(gruppo).getAllByRole("button");
    expect(tasti).toHaveLength(services.length);
    expect(tasti.map((t) => t.getAttribute("aria-pressed"))).toEqual(["true", "false", "false", "false"]);
  });

  it("un tasto stampa il suo servizio e ridisegna la tavola", () => {
    const { container } = render(<ScontrinoView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 2/ }));
    expect(vero(container)).toHaveTextContent("TITOLO 2");
    expect(container.querySelectorAll("[data-scontrino-carta]:not([data-fantasma])")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Schema 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Titolo 2/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("«Parliamone» porta ai contatti", () => {
    render(<ScontrinoView {...props} />);
    expect(screen.getByRole("link", { name: props.testi.parliamone })).toHaveAttribute("href", "#contact");
  });

  it("«strappa» stacca lo scontrino e riporta il fuoco sul tasto", () => {
    const { container } = render(<ScontrinoView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 1/ }));
    fireEvent.click(screen.getByRole("button", { name: props.testi.strappa }));
    expect(vero(container)).toBeNull();
    expect(screen.getByRole("button", { name: /Titolo 1/ })).toHaveFocus();
    expect(container.querySelector("[data-scontrino-invito]")).toHaveTextContent(props.testi.hint);
  });

  it("lo scontrino si annuncia intero, una volta: la stampa visiva non si legge", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const annuncio = container.querySelector('[aria-live="polite"]');
    expect(annuncio).toHaveTextContent("Titolo 0. Testo 0");
    for (const corpo of container.querySelectorAll("[data-scontrino-corpo]")) {
      expect(corpo).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("i fantasmi tengono l'altezza: quattro, interi, e non si leggono", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const fantasmi = container.querySelectorAll("[data-fantasma]");
    expect(fantasmi).toHaveLength(services.length);
    fantasmi.forEach((f, i) => {
      expect(f).toHaveAttribute("aria-hidden", "true");
      expect(f).toHaveTextContent(`TITOLO ${i}`);
      expect(f.querySelector("a, button")).toBeNull();
    });
  });

  it("il disegno e' stampato anche sulla carta, subito prima della lista che spiega", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const figura = vero(container)!.querySelector('[data-riga="figura"]');
    expect(figura?.querySelector("svg path")).not.toBeNull();
    expect(figura?.nextElementSibling).toHaveTextContent(`1 ${props.servizi[0].pezzi[0]}`);
    // Solo i numeri: le parole sono quelle della lista, e il corpo non si legge.
    const numeri = [...figura!.querySelectorAll("text")].map((t) => t.textContent);
    expect(numeri).toEqual(props.servizi[0].pezzi.map((_, k) => String(k + 1)));
    expect(figura?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("un tasto stampa sulla carta il disegno del suo servizio", () => {
    const { container } = render(<ScontrinoView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 3/ }));
    const numeri = vero(container)!.querySelectorAll('[data-riga="figura"] text');
    expect(numeri).toHaveLength(props.servizi[3].pezzi.length);
  });

  it("anche i fantasmi hanno la figura: sul telefono l'altezza la conta", () => {
    const { container } = render(<ScontrinoView {...props} />);
    container.querySelectorAll("[data-fantasma]").forEach((f, i) => {
      expect(f.querySelectorAll('[data-riga="figura"] text'), `fantasma ${i}`).toHaveLength(
        props.servizi[i].pezzi.length,
      );
    });
  });
});

/** Le regole del foglio di stile che riguardano la stampante, corpo compreso. */
const regoleDellaStampante = regole(/\[data-(scontrino|marca|spia|fessura|riga)/);

describe("i colori della stampante", () => {
  it("non chiedono niente ai token che cambiano col tema", () => {
    // Stessa guardia del percorso, e in piu' --accento-testo: la sezione e'
    // arancione e di notte resta arancione, mentre --fg, --line, --bg e
    // --fg-muted si ribaltano, e --accento-testo diventa l'arancio pieno.
    // Tasti e scontrino diventerebbero carta su carta, il numero arancio su
    // arancio. Nel DOM non si vede.
    expect(regoleDellaStampante.length).toBeGreaterThan(10);
    const colpevoli = regoleDellaStampante.filter((r) =>
      /var\(\s*--(fg|line|bg|accento-testo)\b/.test(r.corpo),
    );
    expect(colpevoli.map((r) => r.selettore)).toEqual([]);
  });

  it("nemmeno le classi scritte nel componente li chiedono", () => {
    const { container } = render(<ScontrinoView {...props} />);
    const classi = [...container.querySelectorAll<HTMLElement>("[class]")].map((el) =>
      String(el.getAttribute("class")),
    );
    expect(classi.filter((c) => /var\(\s*--(fg|line|bg|accento-testo)\b/.test(c))).toEqual([]);
  });

  it("l'occhiello non resta quello globale", () => {
    expect(regoleDellaStampante.some((r) => /\.eyebrow/.test(r.selettore))).toBe(true);
  });

  it("niente colori scritti a mano: solo miscele di carta e inchiostro", () => {
    for (const r of regoleDellaStampante) {
      expect(r.corpo, r.selettore).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    }
  });

  it("il fuoco sta dentro il bordo, del colore del testo: l'anello arancio qui non si vede", () => {
    expect(regole("[data-scontrino] :is(button, a):focus-visible")[0]?.corpo).toMatch(
      /outline:\s*2px solid currentColor;[^]*outline-offset:\s*-/,
    );
  });

  it("lo scontrino vero non entra nel flusso: la pagina non cambia altezza a ogni stampa", () => {
    expect(regole("[data-scontrino-carta]:not([data-fantasma])")[0]?.corpo).toMatch(/position:\s*absolute/);
    expect(regole("[data-scontrino-carta][data-fantasma]")[0]?.corpo).toMatch(/visibility:\s*hidden/);
  });

  it("sul telefono la tavola va via e il disegno si stampa sulla carta; sul desktop il contrario", () => {
    const telefono = { media: "(max-width: 860px)" };
    const nascosto = (r: Regola) => /display:\s*none/.test(r.corpo);
    expect(regole(/\[data-scontrino-oggetto\]/, telefono).some(nascosto)).toBe(true);
    expect(regole('[data-riga="figura"]', telefono).some((r) => /display:\s*block/.test(r.corpo))).toBe(true);
    const fuori = regole('[data-riga="figura"]').filter((r) => !regole('[data-riga="figura"]', telefono).includes(r));
    expect(fuori.some(nascosto)).toBe(true);
  });

  it("lo scontrino non sta sotto zero: li' uscita e banco gli rubano i clic", () => {
    // Nel prototipo stava a -1 per uscire da sotto la stampante, e in pagina
    // «Parliamone» e «strappa» non si potevano premere: il browser da' il clic
    // all'uscita trasparente che gli sta sopra. Sotto la stampante ci va
    // perche' e' la stampante a salire.
    const regola = regole("[data-scontrino-carta]:not([data-fantasma])")[0]?.corpo;
    expect(regola).not.toMatch(/z-index:\s*-/);
    expect(regole("[data-scontrino-macchina]").some((r) => /z-index:\s*1/.test(r.corpo))).toBe(true);
  });
});
