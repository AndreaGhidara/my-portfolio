import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { ReceiptView, type ReceiptViewProps } from "../ReceiptView";
import { services } from "@/content/services";
import { rules, type Rule } from "@/test/css";

/**
 * In jsdom il livello di movimento e' sempre "none" (vitest.setup.ts): e' il
 * livello del server e di chi chiede meno movimento, quello in cui la sezione
 * deve leggersi da sola. La stampa a colpi, l'autostampa e la caduta si provano
 * nel modulo puro (scontrino.test.ts) e si guardano in un browser.
 */
const props: ReceiptViewProps = {
  eyebrow: "Servizi",
  title: "Scegli, e te lo stampo",
  lead: "Premi un tasto.",
  locale: "it",
  services: services.map((s, i) => ({
    id: s.id,
    title: `Titolo ${i}`,
    text: `Testo ${i}`,
    pieces: s.pieces.map((p) => `pezzo ${p}`),
    drawing: `Schema ${i}`,
  })),
  copy: {
    hint: "La stampante è pronta",
    keys: "Scegli il servizio da stampare",
    brand: "ANDREA GHIDARA · SERVIZI",
    name: "ANDREA GHIDARA",
    trade: "sviluppo web · full stack",
    number: "N.",
    total: "TOTALE",
    toDiscuss: "DA PARLARNE",
    letsTalk: "Parliamone",
    tear: "strappa ✂",
    plate: "TAV.",
    scale: "SCALA 1:1",
    signature: "A. GHIDARA",
  },
};

const vero = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-scontrino-carta]:not([data-fantasma])");

describe("la stampante dei servizi", () => {

  it("la sezione si chiama come il suo titolo, e il titolo ha la scala di tutte le sezioni", () => {
    render(<ReceiptView {...props} />);
    const sezione = screen.getByRole("region", { name: props.title });
    const titolo = within(sezione).getByRole("heading", { level: 2, name: props.title });
    expect(sezione).toHaveAttribute("aria-labelledby", titolo.id);
    expect(titolo).toHaveClass("titolo-sezione");
  });
  it("e' la seconda sezione: arancione, con il suo id per l'effetto sopra l'apertura", () => {
    const { container } = render(<ReceiptView {...props} />);
    const sezione = container.querySelector("section");
    expect(sezione).toHaveAttribute("id", "scontrino");
    expect(sezione?.className).toContain("bg-[var(--accent)]");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.title);
  });

  it("senza movimento il primo servizio e' gia' stampato e disegnato", () => {
    const { container } = render(<ReceiptView {...props} />);
    const carta = vero(container);
    expect(carta).not.toBeNull();
    expect(carta).toHaveAttribute("data-finito");
    expect(carta).toHaveTextContent("TITOLO 0");
    expect(carta).toHaveTextContent(/TOTALE \.+ DA PARLARNE/);
    expect(container.querySelector("[data-scontrino-tavola] svg")).toHaveAttribute("data-traccia");
    expect(screen.getByRole("img", { name: "Schema 0" })).toBeInTheDocument();
  });

  it("scontrino e tavola hanno gli stessi pezzi, nello stesso ordine", () => {
    const { container } = render(<ReceiptView {...props} />);
    const voci = [...vero(container)!.querySelectorAll('[data-riga="voce"]')].map((v) => v.textContent);
    const note = [...container.querySelectorAll("[data-nota]")].map((n) => n.textContent);
    const pezzi = props.services[0].pieces;
    expect(voci).toEqual(pezzi.map((p, k) => `${k + 1} ${p}`));
    expect(note).toEqual(pezzi.map((p, k) => `${k + 1} · ${p.toUpperCase()}`));
  });

  it("la data non e' nel markup del server: la riga c'e', vuota a sinistra", () => {
    // La pagina e' statica: una data scritta dal server sarebbe quella della
    // build, e diversa da quella del browser (errore di idratazione). Qui il
    // markup del server vero, senza effetti: la riga e' lunga come le altre,
    // con gli spazi al posto della data e il numero in fondo a destra.
    const scatola = document.createElement("div");
    scatola.innerHTML = renderToStaticMarkup(<ReceiptView {...props} />);
    const righe = [...vero(scatola)!.querySelectorAll("[data-riga]")];
    expect(righe[2].textContent).toBe(`${" ".repeat(24)}N. 01/04`);
  });

  it("nel browser la data arriva a sinistra, e il numero resta in fondo a destra", () => {
    const { container } = render(<ReceiptView {...props} />);
    const righe = [...vero(container)!.querySelectorAll("[data-riga]")];
    expect(righe[2].textContent).toMatch(/^\S.*\s+N\. 01\/04$/);
    expect(righe[2].textContent).toHaveLength(32);
  });

  it("i tasti sono bottoni in un gruppo col suo nome, e dicono quale e' premuto", () => {
    render(<ReceiptView {...props} />);
    const gruppo = screen.getByRole("group", { name: props.copy.keys });
    const tasti = within(gruppo).getAllByRole("button");
    expect(tasti).toHaveLength(services.length);
    expect(tasti.map((t) => t.getAttribute("aria-pressed"))).toEqual(["true", "false", "false", "false"]);
  });

  it("un tasto stampa il suo servizio e ridisegna la tavola", () => {
    const { container } = render(<ReceiptView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 2/ }));
    expect(vero(container)).toHaveTextContent("TITOLO 2");
    expect(container.querySelectorAll("[data-scontrino-carta]:not([data-fantasma])")).toHaveLength(1);
    expect(screen.getByRole("img", { name: "Schema 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Titolo 2/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("«Parliamone» porta ai contatti", () => {
    render(<ReceiptView {...props} />);
    expect(screen.getByRole("link", { name: props.copy.letsTalk })).toHaveAttribute("href", "#contact");
  });

  it("«strappa» stacca lo scontrino e riporta il fuoco sul tasto", () => {
    const { container } = render(<ReceiptView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 1/ }));
    fireEvent.click(screen.getByRole("button", { name: props.copy.tear }));
    expect(vero(container)).toBeNull();
    expect(screen.getByRole("button", { name: /Titolo 1/ })).toHaveFocus();
    expect(container.querySelector("[data-scontrino-invito]")).toHaveTextContent(props.copy.hint);
  });

  it("lo scontrino si annuncia intero, una volta: la stampa visiva non si legge", () => {
    const { container } = render(<ReceiptView {...props} />);
    const annuncio = container.querySelector('[aria-live="polite"]');
    expect(annuncio).toHaveTextContent("Titolo 0. Testo 0");
    for (const corpo of container.querySelectorAll("[data-scontrino-corpo]")) {
      expect(corpo).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("i fantasmi tengono l'altezza: quattro, interi, e non si leggono", () => {
    const { container } = render(<ReceiptView {...props} />);
    const fantasmi = container.querySelectorAll("[data-fantasma]");
    expect(fantasmi).toHaveLength(services.length);
    fantasmi.forEach((f, i) => {
      expect(f).toHaveAttribute("aria-hidden", "true");
      expect(f).toHaveTextContent(`TITOLO ${i}`);
      expect(f.querySelector("a, button")).toBeNull();
    });
  });

  it("il disegno e' stampato anche sulla carta, subito prima della lista che spiega", () => {
    const { container } = render(<ReceiptView {...props} />);
    const figura = vero(container)!.querySelector('[data-riga="figura"]');
    expect(figura?.querySelector("svg path")).not.toBeNull();
    expect(figura?.nextElementSibling).toHaveTextContent(`1 ${props.services[0].pieces[0]}`);
    // Solo i numeri: le parole sono quelle della lista, e il corpo non si legge.
    const numeri = [...figura!.querySelectorAll("text")].map((t) => t.textContent);
    expect(numeri).toEqual(props.services[0].pieces.map((_, k) => String(k + 1)));
    expect(figura?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("un tasto stampa sulla carta il disegno del suo servizio", () => {
    const { container } = render(<ReceiptView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 3/ }));
    const numeri = vero(container)!.querySelectorAll('[data-riga="figura"] text');
    expect(numeri).toHaveLength(props.services[3].pieces.length);
  });

  it("anche i fantasmi hanno la figura: sul telefono l'altezza la conta", () => {
    const { container } = render(<ReceiptView {...props} />);
    container.querySelectorAll("[data-fantasma]").forEach((f, i) => {
      expect(f.querySelectorAll('[data-riga="figura"] text'), `fantasma ${i}`).toHaveLength(
        props.services[i].pieces.length,
      );
    });
  });
});

/** Le regole del foglio di stile che riguardano la stampante, corpo compreso. */
const regoleDellaStampante = rules(/\[data-(scontrino|marca|spia|fessura|riga)/);

describe("i colori della stampante", () => {
  it("non chiedono niente ai token che cambiano col tema", () => {
    // Stessa guardia del percorso, e in piu' --accento-testo: la sezione e'
    // arancione e di notte resta arancione, mentre --fg, --line, --bg e
    // --fg-muted si ribaltano, e --accento-testo diventa l'arancio pieno.
    // Tasti e scontrino diventerebbero carta su carta, il numero arancio su
    // arancio. Nel DOM non si vede.
    expect(regoleDellaStampante.length).toBeGreaterThan(10);
    const colpevoli = regoleDellaStampante.filter((r) =>
      /var\(\s*--(fg|line|bg|accento-testo)\b/.test(r.body),
    );
    expect(colpevoli.map((r) => r.selector)).toEqual([]);
  });

  it("nemmeno le classi scritte nel componente li chiedono", () => {
    const { container } = render(<ReceiptView {...props} />);
    const classi = [...container.querySelectorAll<HTMLElement>("[class]")].map((el) =>
      String(el.getAttribute("class")),
    );
    expect(classi.filter((c) => /var\(\s*--(fg|line|bg|accento-testo)\b/.test(c))).toEqual([]);
  });

  it("l'occhiello non resta quello globale", () => {
    expect(regoleDellaStampante.some((r) => /\.eyebrow/.test(r.selector))).toBe(true);
  });

  it("niente colori scritti a mano: solo miscele di carta e inchiostro", () => {
    for (const r of regoleDellaStampante) {
      expect(r.body, r.selector).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    }
  });

  it("il fuoco sta dentro il bordo, del colore del testo: l'anello arancio qui non si vede", () => {
    expect(rules("[data-scontrino] :is(button, a):focus-visible")[0]?.body).toMatch(
      /outline:\s*2px solid currentColor;[^]*outline-offset:\s*-/,
    );
  });

  it("lo scontrino vero non entra nel flusso: la pagina non cambia altezza a ogni stampa", () => {
    expect(rules("[data-scontrino-carta]:not([data-fantasma])")[0]?.body).toMatch(/position:\s*absolute/);
    expect(rules("[data-scontrino-carta][data-fantasma]")[0]?.body).toMatch(/visibility:\s*hidden/);
  });

  it("sul telefono la tavola va via e il disegno si stampa sulla carta; sul desktop il contrario", () => {
    const telefono = { media: "(max-width: 860px)" };
    const nascosto = (r: Rule) => /display:\s*none/.test(r.body);
    expect(rules(/\[data-scontrino-oggetto\]/, telefono).some(nascosto)).toBe(true);
    expect(rules('[data-riga="figura"]', telefono).some((r) => /display:\s*block/.test(r.body))).toBe(true);
    const fuori = rules('[data-riga="figura"]').filter((r) => !rules('[data-riga="figura"]', telefono).includes(r));
    expect(fuori.some(nascosto)).toBe(true);
  });

  it("lo scontrino non sta sotto zero: li' uscita e banco gli rubano i clic", () => {
    // Nel prototipo stava a -1 per uscire da sotto la stampante, e in pagina
    // «Parliamone» e «strappa» non si potevano premere: il browser da' il clic
    // all'uscita trasparente che gli sta sopra. Sotto la stampante ci va
    // perche' e' la stampante a salire.
    const regola = rules("[data-scontrino-carta]:not([data-fantasma])")[0]?.body;
    expect(regola).not.toMatch(/z-index:\s*-/);
    expect(rules("[data-scontrino-macchina]").some((r) => /z-index:\s*1/.test(r.body))).toBe(true);
  });
});
