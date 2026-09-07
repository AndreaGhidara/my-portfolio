import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { JourneyView, type JourneyViewProps } from "../JourneyView";
import { journey } from "@/content/journey";

const props: JourneyViewProps = {
  eyebrow: "Percorso",
  title: "Dove ho imparato",
  present: "a oggi",
  senzaTesserino: "Nessun tesserino",
  etichettaLezione: "Cosa mi ha insegnato",
  nota: "Da freelance il tesserino non te lo dà nessuno.",
  entries: journey.map((e) => ({
    id: e.id,
    company: e.company,
    year: e.year,
    tesserino: e.tesserino,
    role: `Ruolo ${e.id}`,
    body: `Corpo ${e.id}`,
    lezione: `Lezione ${e.id}`,
  })),
  stats: [
    { id: "years", value: "6", label: "anni di sviluppo web" },
    { id: "responseTime", value: "24h", label: "tempo di risposta" },
  ],
};

describe("JourneyView", () => {
  it("presenta il percorso come lista ordinata dal più recente", () => {
    render(<JourneyView {...props} />);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("IDT spa");
  });

  it("ogni tappa è un tesserino appuntato sul suo foglio", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelectorAll("[data-journey-badge]")).toHaveLength(journey.length);
    expect(container.querySelectorAll("[data-journey-sheet]")).toHaveLength(journey.length);
  });

  it("il tesserino che non esiste è dichiarato, e ce n'è uno solo", () => {
    // Da freelance il tesserino non te lo dà nessuno: al posto del nome
    // dell'azienda c'è quella riga, e il cartellino si disegna tratteggiato.
    // Il gancio sta sul <li> perché è di lì che pende la regola dello stile.
    const { container } = render(<JourneyView {...props} />);
    const senza = container.querySelectorAll('[data-journey-item][data-tesserino="no"]');
    expect(senza).toHaveLength(1);
    expect(senza[0]).toHaveTextContent(props.senzaTesserino);
    expect(screen.queryByText("Freelance")).toBeNull();
  });

  it("ogni tappa dice cosa quel posto ha insegnato", () => {
    // È la cosa nuova della sezione: senza, tornano tre voci di curriculum.
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelectorAll("[data-journey-lesson]")).toHaveLength(journey.length);
  });

  it("usa <time> per gli anni, così sono dati e non decorazione", () => {
    const { container } = render(<JourneyView {...props} />);
    const times = container.querySelectorAll("time");
    expect(times).toHaveLength(journey.length);
    expect(times[0]).toHaveAttribute("dateTime", "2025");
  });

  it("i numeri restano leggibili anche senza JavaScript: il valore è già nel markup", () => {
    render(<JourneyView {...props} />);
    expect(screen.getByText("6")).toBeVisible();
    expect(screen.getByText("24h")).toBeVisible();
  });

  it("associa ogni numero alla sua etichetta con dt/dd", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelectorAll("dl dd")).toHaveLength(2);
  });

  it("il filo attraversa la sezione", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelector('[data-thread="journey"]')).not.toBeNull();
  });
});

const css = readFileSync("src/styles/tokens.css", "utf8");

/** Le regole del foglio di stile che riguardano il percorso, corpo compreso. */
const regoleDelPercorso = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map(([, selettore, corpo]) => ({ selettore: selettore.trim(), corpo }))
  .filter((r) => /\[data-journey-/.test(r.selettore));

describe("i colori del percorso", () => {
  it("non chiedono niente ai token che cambiano col tema", () => {
    // Il percorso e' carta e inchiostro SEMPRE: sta dentro una sezione arancio
    // che di notte resta arancio. Con --fg, --line, --bg o --fg-muted il tema
    // scuro si ribalterebbe addosso ai tesserini e ai fogli, e diventerebbero
    // carta su carta: sparirebbero. E' la stessa guardia della casella di
    // posta, e vale per la stessa ragione. Nel DOM non si vede.
    expect(regoleDelPercorso.length).toBeGreaterThan(10);
    const colpevoli = regoleDelPercorso.filter((r) =>
      /var\(\s*--(fg|line|bg)\b/.test(r.corpo),
    );
    expect(colpevoli.map((r) => r.selettore)).toEqual([]);
  });

  it("nemmeno le classi scritte nel componente li chiedono", () => {
    // La prova qui sopra legge il foglio di stile e non vede le classi di
    // utilita' col valore fra parentesi quadre: i due numeri portavano
    // `text-[var(--fg)]` e `text-[var(--fg-muted)]` nel JSX, e sull'arancio
    // sarebbero spariti di notte senza che nessuna regola di tokens.css lo
    // dicesse. Qui si guarda l'altra meta' del problema.
    const { container } = render(<JourneyView {...props} />);
    const classi = [...container.querySelectorAll<HTMLElement>("[class]")].map(
      (el) => el.className,
    );
    const colpevoli = classi.filter((c) => /var\(\s*--(fg|line|bg)\b/.test(c));
    expect(colpevoli).toEqual([]);
  });

  it("l'occhiello dentro il tesserino non resta quello globale", () => {
    // `.eyebrow` porta --fg-muted, e la prova qui sopra non lo vede: quella
    // regola non nomina il percorso. Dentro un tesserino di carta va
    // ridichiarato, o di notte l'anno sparisce.
    expect(regoleDelPercorso.some((r) => /\.eyebrow/.test(r.selettore))).toBe(true);
  });
});

describe("i tre fogli non combaciano", () => {

  it("ogni foglio ha la sua inclinazione, e non sono la stessa", () => {
    // Tre fogli con lo stesso angolo sono un errore di stampa, e tre fogli
    // dritti sono una tabella. Quello che li fa leggere come cose appoggiate
    // su un piano è che non combaciano: la regola sta qui perché è una
    // decisione di disegno, e una modifica distratta la annullerebbe senza
    // rompere niente.
    const regole = [...css.matchAll(/\[data-journey-item\][^{]*\{([^}]*)\}/g)].map((m) => m[1]);
    const angoli = regole
      .map((corpo) => corpo.match(/rotate\((-?[\d.]+)deg\)/)?.[1])
      .filter(Boolean);
    expect(angoli.length).toBe(journey.length);
    expect(new Set(angoli).size).toBe(journey.length);
  });
});
