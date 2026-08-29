import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyView } from "../JourneyView";

const props = {
  eyebrow: "Percorso",
  title: "Dove ho imparato",
  present: "oggi",
  entries: [
    { id: "idt", company: "IDT spa", role: "React Developer", body: "Funzionalità complesse.", year: 2025 },
    { id: "eroi", company: "E.Roi srl", role: "Full Stack Developer", body: "Piattaforma B2B.", year: 2024 },
  ],
  stats: [
    { id: "years", value: "6", label: "anni di sviluppo web" },
    { id: "responseTime", value: "24h", label: "tempo di risposta" },
  ],
};

describe("JourneyView", () => {
  it("presenta il percorso come lista ordinata dal più recente", () => {
    render(<JourneyView {...props} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("IDT spa");
  });

  it("mostra ruolo e azienda di ogni tappa", () => {
    render(<JourneyView {...props} />);
    for (const entry of props.entries) {
      expect(screen.getByText(entry.company)).toBeVisible();
      expect(screen.getByText(entry.role)).toBeVisible();
    }
  });

  it("usa <time> per gli anni, così sono dati e non decorazione", () => {
    const { container } = render(<JourneyView {...props} />);
    const times = container.querySelectorAll("time");
    expect(times.length).toBeGreaterThanOrEqual(2);
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
});
