import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorksView } from "../WorksView";

const labels = {
  symptom: "Il sintomo",
  decision: "La decisione",
  outcome: "L'esito",
  visit: "Visita il sito",
  open: "Apri il caso",
  close: "Chiudi",
};

const items = [
  {
    id: "bdroppy",
    name: "BDroppy",
    symptom: "La piattaforma era ferma su React 14.",
    decision: "Migrazione incrementale, rotta per rotta.",
    outcome: "Oggi su Next.js, senza interruzioni.",
    url: "https://www.bdroppy.com",
    screenshot: "/works/bdroppy.png",
    year: 2024,
    tech: ["Next.js", "TypeScript"],
    metrics: [{ id: "bdroppyComponents", value: "120", label: "componenti migrati" }],
  },
  {
    id: "aidify",
    name: "Aidify",
    symptom: "Assistenza sommersa dalle stesse dieci domande.",
    decision: "Un assistente legato agli ordini reali.",
    outcome: "Integrato su piu' e-commerce.",
    url: "https://aidify.cx",
    screenshot: "/works/aidify.png",
    year: 2024,
    tech: ["Next.js", "Supabase"],
    metrics: [],
  },
];

const props = {
  eyebrow: "Lavori",
  title: "Quattro problemi, e come li ho risolti",
  intro: "Non trovi loghi e slogan.",
  labels,
  items,
};

describe("WorksView", () => {
  it("l'indice mostra il sintomo, non il nome del prodotto: è ciò che fa riconoscere il cliente", () => {
    render(<WorksView {...props} />);
    expect(screen.getByText(items[0].symptom)).toBeVisible();
  });

  it("ogni caso è chiuso all'inizio, per non annegare chi scorre", () => {
    render(<WorksView {...props} />);
    const toggles = screen.getAllByRole("button", { expanded: false });
    expect(toggles).toHaveLength(2);
  });

  it("aprendo un caso compaiono decisione ed esito", async () => {
    render(<WorksView {...props} />);
    const toggle = screen.getAllByRole("button")[0];

    expect(screen.queryByText(items[0].decision)).not.toBeInTheDocument();
    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(items[0].decision)).toBeVisible();
    expect(screen.getByText(items[0].outcome)).toBeVisible();
  });

  it("il link al sito si apre in una scheda nuova, in sicurezza", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    const link = screen.getByRole("link", { name: new RegExp(labels.visit) });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("mostra le metriche del caso quando ce ne sono", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("120")).toBeVisible();
    expect(screen.getByText("componenti migrati")).toBeVisible();
  });
});
