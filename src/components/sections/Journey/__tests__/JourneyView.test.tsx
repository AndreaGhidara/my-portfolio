import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { JourneyView, type JourneyViewProps } from "../JourneyView";
import { journey } from "@/content/journey";
import { rules } from "@/test/css";

const props: JourneyViewProps = {
  eyebrow: "Percorso",
  title: "Dove ho imparato",
  present: "a oggi",
  noBadge: "Nessun tesserino",
  lessonLabel: "Cosa mi ha insegnato",
  note: "Da freelance il tesserino non te lo dà nessuno.",
  hint: "continua a scorrere",
  // Come le prepara index.tsx: «a oggi» calcolato sul dato, poi la lista girata.
  entries: journey
    .map((e, index) => ({
      id: e.id,
      company: e.company,
      year: e.year,
      badge: e.badge,
      present: index === 0,
      role: `Ruolo ${e.id}`,
      body: `Corpo ${e.id}`,
      lesson: `Lezione ${e.id}`,
    }))
    .reverse(),
  stats: [
    { id: "years", value: "3", label: "anni di sviluppo web" },
    { id: "responseTime", value: "24h", label: "tempo di risposta" },
  ],
};

describe("JourneyView", () => {

  it("la sezione si chiama come il suo titolo, e il titolo ha la scala di tutte le sezioni", () => {
    render(<JourneyView {...props} />);
    const section = screen.getByRole("region", { name: props.title });
    const heading = within(section).getByRole("heading", { level: 2, name: props.title });
    expect(section).toHaveAttribute("aria-labelledby", heading.id);
    expect(heading).toHaveClass("section-title");
  });
  it("presenta il percorso come lista ordinata dal 2023 a oggi", () => {
    render(<JourneyView {...props} />);
    // L'onda e' un <li> aria-hidden; l'ordine si prova sull'anno, prima e ultima sono da freelance.
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("2023");
    expect(items[journey.length - 1]).toHaveTextContent("2026");
  });

  it("«a oggi» sta sul 2026, non sulla prima tappa della lista", () => {
    const { container } = render(<JourneyView {...props} />);
    const eyebrows = [...container.querySelectorAll("[data-journey-item] .eyebrow")];
    const withPresent = eyebrows.filter((p) => p.textContent?.includes(props.present));
    expect(withPresent).toHaveLength(1);
    expect(withPresent[0]).toHaveTextContent("2026");
  });

  it("ogni tappa è un tesserino appuntato sul suo foglio", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelectorAll("[data-journey-badge]")).toHaveLength(journey.length);
    expect(container.querySelectorAll("[data-journey-sheet]")).toHaveLength(journey.length);
  });

  it("il tesserino che non esiste è dichiarato, e sono i due periodi da freelance", () => {
    // Il gancio sta sul <li> perche' e' di li' che pende la regola dello stile.
    const { container } = render(<JourneyView {...props} />);
    const withoutBadge = container.querySelectorAll('[data-journey-item][data-badge="no"]');
    expect(withoutBadge).toHaveLength(journey.filter((e) => !e.badge).length);
    expect(withoutBadge[0]).toHaveTextContent(props.noBadge);
    expect(screen.queryByText("Freelance")).toBeNull();
  });

  it("ogni tappa dice cosa quel posto ha insegnato", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelectorAll("[data-journey-lesson]")).toHaveLength(journey.length);
  });

  it("usa <time> per gli anni, così sono dati e non decorazione", () => {
    const { container } = render(<JourneyView {...props} />);
    const times = container.querySelectorAll("time");
    expect(times).toHaveLength(journey.length);
    expect(times[0]).toHaveAttribute("dateTime", "2023");
  });

  it("i numeri restano leggibili anche senza JavaScript: il valore è già nel markup", () => {
    render(<JourneyView {...props} />);
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByText("24h")).toBeVisible();
  });

  it("associa ogni numero alla sua etichetta con dt/dd", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelectorAll("dl dd")).toHaveLength(2);
  });

  it("i numeri sono l'ultima fermata: la <dl> sta nell'ultimo <li>, con la nota", () => {
    render(<JourneyView {...props} />);
    const items = screen.getAllByRole("listitem");
    const last = items[items.length - 1];
    expect(last).toHaveAttribute("data-journey-arrival");
    expect(last.querySelectorAll("dl dd")).toHaveLength(2);
    expect(last).toHaveTextContent(props.note);
  });

  it("onda, anno grande e barra non si leggono: sono disegno", () => {
    const { container } = render(<JourneyView {...props} />);
    for (const sel of ["[data-journey-wave]", "[data-journey-year]", "[data-journey-progress]"]) {
      expect(container.querySelector(sel)).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("parte in colonna: la scena orizzontale la accende il componente, non il markup", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelector("[data-scene]")).toBeNull();
  });
});

const journeyRules = rules(/\[data-journey-/);

describe("i colori del percorso", () => {
  it("non chiedono niente ai token che cambiano col tema", () => {
    // La sezione resta arancio di notte: col tema scuro tesserini e fogli diventerebbero carta su carta.
    expect(journeyRules.length).toBeGreaterThan(10);
    const offenders = journeyRules.filter((r) =>
      /var\(\s*--(fg|line|bg)\b/.test(r.body),
    );
    expect(offenders.map((r) => r.selector)).toEqual([]);
  });

  it("nemmeno le classi scritte nel componente li chiedono", () => {
    // La prova sopra non vede le classi di utilita' col valore fra parentesi quadre.
    const { container } = render(<JourneyView {...props} />);
    const classes = [...container.querySelectorAll<HTMLElement>("[class]")].map(
      (el) => el.className,
    );
    const offenders = classes.filter((c) => /var\(\s*--(fg|line|bg)\b/.test(c));
    expect(offenders).toEqual([]);
  });

  it("l'occhiello dentro il tesserino non resta quello globale", () => {
    // `.eyebrow` porta --fg-muted: dentro un tesserino va ridichiarato, o di notte l'anno sparisce.
    expect(journeyRules.some((r) => /\.eyebrow/.test(r.selector))).toBe(true);
  });
});
