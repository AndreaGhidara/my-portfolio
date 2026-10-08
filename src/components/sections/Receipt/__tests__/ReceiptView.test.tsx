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

const realPaper = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-receipt-paper]:not([data-ghost])");

describe("la stampante dei servizi", () => {

  it("la sezione si chiama come il suo titolo, e il titolo ha la scala di tutte le sezioni", () => {
    render(<ReceiptView {...props} />);
    const section = screen.getByRole("region", { name: props.title });
    const title = within(section).getByRole("heading", { level: 2, name: props.title });
    expect(section).toHaveAttribute("aria-labelledby", title.id);
    expect(title).toHaveClass("section-title");
  });
  it("e' la seconda sezione: arancione, con il suo id per l'effetto sopra l'apertura", () => {
    const { container } = render(<ReceiptView {...props} />);
    const section = container.querySelector("section");
    expect(section).toHaveAttribute("id", "scontrino");
    expect(section?.className).toContain("bg-[var(--accent)]");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(props.title);
  });

  it("senza movimento il primo servizio e' gia' stampato e disegnato", () => {
    const { container } = render(<ReceiptView {...props} />);
    const paper = realPaper(container);
    expect(paper).not.toBeNull();
    expect(paper).toHaveAttribute("data-finished");
    expect(paper).toHaveTextContent("TITOLO 0");
    expect(paper).toHaveTextContent(/TOTALE \.+ DA PARLARNE/);
    expect(container.querySelector("[data-receipt-plate] svg")).toHaveAttribute("data-trace");
    expect(screen.getByRole("img", { name: "Schema 0" })).toBeInTheDocument();
  });

  it("scontrino e tavola hanno gli stessi pezzi, nello stesso ordine", () => {
    const { container } = render(<ReceiptView {...props} />);
    const items = [...realPaper(container)!.querySelectorAll('[data-line="item"]')].map((v) => v.textContent);
    const notes = [...container.querySelectorAll("[data-note]")].map((n) => n.textContent);
    const pieces = props.services[0].pieces;
    expect(items).toEqual(pieces.map((p, k) => `${k + 1} ${p}`));
    expect(notes).toEqual(pieces.map((p, k) => `${k + 1} · ${p.toUpperCase()}`));
  });

  it("la data non e' nel markup del server: la riga c'e', vuota a sinistra", () => {
    // La pagina e' statica: una data scritta dal server sarebbe quella della
    // build, e diversa da quella del browser (errore di idratazione). Qui il
    // markup del server vero, senza effetti: la riga e' lunga come le altre,
    // con gli spazi al posto della data e il numero in fondo a destra.
    const box = document.createElement("div");
    box.innerHTML = renderToStaticMarkup(<ReceiptView {...props} />);
    const lines = [...realPaper(box)!.querySelectorAll("[data-line]")];
    expect(lines[2].textContent).toBe(`${" ".repeat(24)}N. 01/04`);
  });

  it("nel browser la data arriva a sinistra, e il numero resta in fondo a destra", () => {
    const { container } = render(<ReceiptView {...props} />);
    const lines = [...realPaper(container)!.querySelectorAll("[data-line]")];
    expect(lines[2].textContent).toMatch(/^\S.*\s+N\. 01\/04$/);
    expect(lines[2].textContent).toHaveLength(32);
  });

  it("i tasti sono bottoni in un gruppo col suo nome, e dicono quale e' premuto", () => {
    render(<ReceiptView {...props} />);
    const group = screen.getByRole("group", { name: props.copy.keys });
    const keys = within(group).getAllByRole("button");
    expect(keys).toHaveLength(services.length);
    expect(keys.map((t) => t.getAttribute("aria-pressed"))).toEqual(["true", "false", "false", "false"]);
  });

  it("un tasto stampa il suo servizio e ridisegna la tavola", () => {
    const { container } = render(<ReceiptView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 2/ }));
    expect(realPaper(container)).toHaveTextContent("TITOLO 2");
    expect(container.querySelectorAll("[data-receipt-paper]:not([data-ghost])")).toHaveLength(1);
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
    expect(realPaper(container)).toBeNull();
    expect(screen.getByRole("button", { name: /Titolo 1/ })).toHaveFocus();
    expect(container.querySelector("[data-receipt-invite]")).toHaveTextContent(props.copy.hint);
  });

  it("lo scontrino si annuncia intero, una volta: la stampa visiva non si legge", () => {
    const { container } = render(<ReceiptView {...props} />);
    const announcement = container.querySelector('[aria-live="polite"]');
    expect(announcement).toHaveTextContent("Titolo 0. Testo 0");
    for (const body of container.querySelectorAll("[data-receipt-body]")) {
      expect(body).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("i fantasmi tengono l'altezza: quattro, interi, e non si leggono", () => {
    const { container } = render(<ReceiptView {...props} />);
    const ghosts = container.querySelectorAll("[data-ghost]");
    expect(ghosts).toHaveLength(services.length);
    ghosts.forEach((f, i) => {
      expect(f).toHaveAttribute("aria-hidden", "true");
      expect(f).toHaveTextContent(`TITOLO ${i}`);
      expect(f.querySelector("a, button")).toBeNull();
    });
  });

  it("il disegno e' stampato anche sulla carta, subito prima della lista che spiega", () => {
    const { container } = render(<ReceiptView {...props} />);
    const figure = realPaper(container)!.querySelector('[data-line="figure"]');
    expect(figure?.querySelector("svg path")).not.toBeNull();
    expect(figure?.nextElementSibling).toHaveTextContent(`1 ${props.services[0].pieces[0]}`);
    // Solo i numeri: le parole sono quelle della lista, e il corpo non si legge.
    const numbers = [...figure!.querySelectorAll("text")].map((t) => t.textContent);
    expect(numbers).toEqual(props.services[0].pieces.map((_, k) => String(k + 1)));
    expect(figure?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("un tasto stampa sulla carta il disegno del suo servizio", () => {
    const { container } = render(<ReceiptView {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 3/ }));
    const numbers = realPaper(container)!.querySelectorAll('[data-line="figure"] text');
    expect(numbers).toHaveLength(props.services[3].pieces.length);
  });

  it("anche i fantasmi hanno la figura: sul telefono l'altezza la conta", () => {
    const { container } = render(<ReceiptView {...props} />);
    container.querySelectorAll("[data-ghost]").forEach((f, i) => {
      expect(f.querySelectorAll('[data-line="figure"] text'), `fantasma ${i}`).toHaveLength(
        props.services[i].pieces.length,
      );
    });
  });
});

/** Le regole del foglio di stile che riguardano la stampante, corpo compreso. */
const printerRules = rules(/\[data-(receipt|brand|indicator|slot|line)/);

describe("i colori della stampante", () => {
  it("non chiedono niente ai token che cambiano col tema", () => {
    // Stessa guardia del percorso, e in piu' --accento-testo: la sezione e'
    // arancione e di notte resta arancione, mentre --fg, --line, --bg e
    // --fg-muted si ribaltano, e --accento-testo diventa l'arancio pieno.
    // Tasti e scontrino diventerebbero carta su carta, il numero arancio su
    // arancio. Nel DOM non si vede.
    expect(printerRules.length).toBeGreaterThan(10);
    const offenders = printerRules.filter((r) =>
      /var\(\s*--(fg|line|bg|accent-text)\b/.test(r.body),
    );
    expect(offenders.map((r) => r.selector)).toEqual([]);
  });

  it("nemmeno le classi scritte nel componente li chiedono", () => {
    const { container } = render(<ReceiptView {...props} />);
    const classes = [...container.querySelectorAll<HTMLElement>("[class]")].map((el) =>
      String(el.getAttribute("class")),
    );
    expect(classes.filter((c) => /var\(\s*--(fg|line|bg|accent-text)\b/.test(c))).toEqual([]);
  });

  it("l'occhiello non resta quello globale", () => {
    expect(printerRules.some((r) => /\.eyebrow/.test(r.selector))).toBe(true);
  });

  it("niente colori scritti a mano: solo miscele di carta e inchiostro", () => {
    for (const r of printerRules) {
      expect(r.body, r.selector).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
    }
  });

  it("il fuoco sta dentro il bordo, del colore del testo: l'anello arancio qui non si vede", () => {
    expect(rules("[data-receipt] :is(button, a):focus-visible")[0]?.body).toMatch(
      /outline:\s*2px solid currentColor;[^]*outline-offset:\s*-/,
    );
  });

  it("lo scontrino vero non entra nel flusso: la pagina non cambia altezza a ogni stampa", () => {
    expect(rules("[data-receipt-paper]:not([data-ghost])")[0]?.body).toMatch(/position:\s*absolute/);
    expect(rules("[data-receipt-paper][data-ghost]")[0]?.body).toMatch(/visibility:\s*hidden/);
  });

  it("sul telefono la tavola va via e il disegno si stampa sulla carta; sul desktop il contrario", () => {
    const phone = { media: "(max-width: 860px)" };
    const hidden = (r: Rule) => /display:\s*none/.test(r.body);
    expect(rules(/\[data-receipt-object\]/, phone).some(hidden)).toBe(true);
    expect(rules('[data-line="figure"]', phone).some((r) => /display:\s*block/.test(r.body))).toBe(true);
    const desktop = rules('[data-line="figure"]').filter((r) => !rules('[data-line="figure"]', phone).includes(r));
    expect(desktop.some(hidden)).toBe(true);
  });

  it("lo scontrino non sta sotto zero: li' uscita e banco gli rubano i clic", () => {
    // Nel prototipo stava a -1 per uscire da sotto la stampante, e in pagina
    // «Parliamone» e «strappa» non si potevano premere: il browser da' il clic
    // all'uscita trasparente che gli sta sopra. Sotto la stampante ci va
    // perche' e' la stampante a salire.
    const rule = rules("[data-receipt-paper]:not([data-ghost])")[0]?.body;
    expect(rule).not.toMatch(/z-index:\s*-/);
    expect(rules("[data-receipt-machine]").some((r) => /z-index:\s*1/.test(r.body))).toBe(true);
  });
});
