import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorksView } from "../WorksView";

const labels = {
  alternativa: "L'alternativa comoda",
  perche: "Perché no",
  fatto: "Cosa abbiamo fatto",
  visit: "Visita il sito",
  screenshotAlt: "{name}: schermata",
  riservato: "Coperto da accordo di riservatezza",
  open: "Apri il caso",
  close: "Chiudi",
};

const items = [
  {
    id: "bdroppy",
    name: "BDroppy",
    symptom: "La piattaforma era ferma su Next 14.",
    alternativa: "Riscriverla da zero.",
    perche: "Doveva continuare a vendere ogni giorno.",
    fatto: "Migrazione rotta per rotta, senza interruzioni.",
    url: "https://www.bdroppy.com",
    screenshot: "/works/bdroppy.png",
    screenshotAlt: "BDroppy: schermata",
    year: 2024,
    tech: ["Next.js", "TypeScript"],
    metrics: [{ id: "bdroppyComponents", value: "120", label: "componenti migrati" }],
  },
  {
    id: "aidify",
    name: "Aidify",
    symptom: "Assistenza sommersa dalle stesse dieci domande.",
    alternativa: "Un chatbot che indovina.",
    perche: "Sbaglia con la stessa sicurezza con cui azzecca.",
    fatto: "Legato agli ordini reali, e passa a una persona quando non sa.",
    url: "https://aidify.cx",
    screenshot: "/works/aidify.png",
    screenshotAlt: "Aidify: schermata",
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
  it("ogni cartella chiusa mostra il sintomo: è ciò che fa riconoscere il cliente, e da telefono non c'è hover che lo riveli", () => {
    render(<WorksView {...props} />);
    for (const item of items) {
      expect(screen.getByText(item.symptom)).toBeVisible();
    }
  });

  it("la linguetta porta nome e anno, così il sintomo resta il titolo", () => {
    render(<WorksView {...props} />);
    expect(screen.getByText("BDroppy · 2024")).toBeVisible();
  });

  it("all'inizio nessun dossier è aperto", () => {
    render(<WorksView {...props} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(items[0].alternativa)).not.toBeInTheDocument();
  });

  it("cliccando una cartella si apre il dossier con l'alternativa scartata", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeVisible();
    expect(screen.getByText(items[0].alternativa)).toBeVisible();
    expect(screen.getByText(items[0].fatto)).toBeVisible();
  });

  it("il dossier ha un nome accessibile: chi naviga a voce deve sapere di quale caso si tratta", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByRole("dialog", { name: /BDroppy/ })).toBeInTheDocument();
  });

  it("mentre il dossier è aperto la pagina sotto non scorre", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(document.documentElement).toHaveAttribute("data-dialog-open");
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

  it("il dossier mostra il caso della cartella cliccata, non sempre il primo", async () => {
    render(<WorksView {...props} />);
    await userEvent.click(screen.getAllByRole("button")[1]);
    expect(screen.getByText(items[1].alternativa)).toBeVisible();
    expect(screen.queryByText(items[0].alternativa)).not.toBeInTheDocument();
  });
});
