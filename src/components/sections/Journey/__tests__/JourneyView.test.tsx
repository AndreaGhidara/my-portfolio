import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { JourneyView, type JourneyViewProps } from "../JourneyView";
import { journey } from "@/content/journey";
import { regole } from "@/test/css";

const props: JourneyViewProps = {
  eyebrow: "Percorso",
  title: "Dove ho imparato",
  present: "a oggi",
  senzaTesserino: "Nessun tesserino",
  etichettaLezione: "Cosa mi ha insegnato",
  nota: "Da freelance il tesserino non te lo dà nessuno.",
  suggerimento: "continua a scorrere",
  // Come le prepara index.tsx: «a oggi» sulla piu' recente, calcolato sul dato
  // (che e' dal piu' recente), poi la lista girata per raccontarla dal 2023.
  entries: journey
    .map((e, index) => ({
      id: e.id,
      company: e.company,
      year: e.year,
      tesserino: e.tesserino,
      present: index === 0,
      role: `Ruolo ${e.id}`,
      body: `Corpo ${e.id}`,
      lezione: `Lezione ${e.id}`,
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
    const sezione = screen.getByRole("region", { name: props.title });
    const titolo = within(sezione).getByRole("heading", { level: 2, name: props.title });
    expect(sezione).toHaveAttribute("aria-labelledby", titolo.id);
    expect(titolo).toHaveClass("titolo-sezione");
  });
  it("presenta il percorso come lista ordinata dal 2023 a oggi", () => {
    render(<JourneyView {...props} />);
    // L'onda e' un <li> aria-hidden e non conta: la prima voce che si legge
    // e' la prima tappa. La prova dell'ordine sta sull'anno, perche' la prima
    // e l'ultima sono tutte e due da freelance.
    const voci = screen.getAllByRole("listitem");
    expect(voci[0]).toHaveTextContent("2023");
    expect(voci[journey.length - 1]).toHaveTextContent("2026");
  });

  it("«a oggi» sta sul 2026, non sulla prima tappa della lista", () => {
    const { container } = render(<JourneyView {...props} />);
    const occhielli = [...container.querySelectorAll("[data-journey-item] .eyebrow")];
    const conOggi = occhielli.filter((p) => p.textContent?.includes(props.present));
    expect(conOggi).toHaveLength(1);
    expect(conOggi[0]).toHaveTextContent("2026");
  });

  it("ogni tappa è un tesserino appuntato sul suo foglio", () => {
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelectorAll("[data-journey-badge]")).toHaveLength(journey.length);
    expect(container.querySelectorAll("[data-journey-sheet]")).toHaveLength(journey.length);
  });

  it("il tesserino che non esiste è dichiarato, e sono i due periodi da freelance", () => {
    // Da freelance il tesserino non te lo dà nessuno: al posto del nome
    // dell'azienda c'è quella riga, e il cartellino si disegna tratteggiato.
    // Il gancio sta sul <li> perché è di lì che pende la regola dello stile.
    const { container } = render(<JourneyView {...props} />);
    const senza = container.querySelectorAll('[data-journey-item][data-tesserino="no"]');
    expect(senza).toHaveLength(journey.filter((e) => !e.tesserino).length);
    expect(senza[0]).toHaveTextContent(props.senzaTesserino);
    expect(screen.queryByText("Freelance")).toBeNull();
  });

  it("ogni tappa dice cosa quel posto ha insegnato", () => {
    // È la cosa nuova della sezione: senza, tornano voci di curriculum.
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
    const voci = screen.getAllByRole("listitem");
    const ultima = voci[voci.length - 1];
    expect(ultima).toHaveAttribute("data-journey-arrivo");
    expect(ultima.querySelectorAll("dl dd")).toHaveLength(2);
    expect(ultima).toHaveTextContent(props.nota);
  });

  it("onda, anno grande e barra non si leggono: sono disegno", () => {
    const { container } = render(<JourneyView {...props} />);
    for (const sel of ["[data-journey-onda]", "[data-journey-anno]", "[data-journey-avanzamento]"]) {
      expect(container.querySelector(sel)).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("parte in colonna: la scena orizzontale la accende il componente, non il markup", () => {
    // Il server e il primo render non sanno se c'e' GSAP ne' quanto e' alto lo
    // schermo: la colonna si legge sempre, l'orizzontale va guadagnata.
    const { container } = render(<JourneyView {...props} />);
    expect(container.querySelector("[data-scena]")).toBeNull();
  });
});

/** Le regole del foglio di stile che riguardano il percorso, corpo compreso. */
const regoleDelPercorso = regole(/\[data-journey-/);

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
