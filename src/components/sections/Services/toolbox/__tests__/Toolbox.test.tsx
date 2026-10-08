import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TOOLS, GARMENTS } from "@/content/toolbox";
import { ToolboxView } from "../ToolboxView";
import { MAP_QUERY, toolboxReducer } from "../Toolbox";
import { copyFor } from "./fixture";
import { rules } from "@/test/css";

const t = copyFor("it");
const props = { eyebrow: "Gli attrezzi", title: "Tutto quello che so usare.", lead: "La mia cassetta.", copy: t };

const pannello = (c: HTMLElement) => c.querySelector("[data-cassetta-pannello]") as HTMLElement;
const editor = (c: HTMLElement) => c.querySelector("[data-cassetta-editor]") as HTMLElement;

describe("la cassetta: la testa", () => {
  it("ha il suo titolo e un solo paragrafo", () => {
    const { container } = render(<ToolboxView {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: props.title })).toBeInTheDocument();
    const testa = container.querySelector("[data-cassetta-testa]") as HTMLElement;
    const paragrafi = [...testa.querySelectorAll("p:not(.eyebrow)")].map((p) => p.textContent);
    expect(paragrafi).toEqual([props.lead]);
  });

  it("dice sotto «cuci per» che e' un punto di partenza", () => {
    render(<ToolboxView {...props} />);
    expect(screen.getByText(t.start)).toBeInTheDocument();
  });
});

describe("la cassetta: cuci per", () => {
  it("un bottone per capo e uno per la cassetta intera, che parte premuto", () => {
    render(<ToolboxView {...props} />);
    const gruppo = screen.getByRole("group", { name: t.sewFor });
    const bottoni = within(gruppo).getAllByRole("button");
    expect(bottoni.map((b) => b.textContent)).toEqual([...GARMENTS.map((c) => t.garments[c.id].name), t.whole]);
    expect(within(gruppo).getByRole("button", { name: t.whole })).toHaveAttribute("aria-pressed", "true");
  });

  it("scelto un capo, l'etichetta dice composizione (stima), fibre e cura", async () => {
    const { container } = render(<ToolboxView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.garments.ecommerce.name }));
    expect(screen.getByRole("button", { name: t.garments.ecommerce.name })).toHaveAttribute("aria-pressed", "true");
    const p = pannello(container);
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent(t.garments.ecommerce.name);
    expect(p).toHaveTextContent(`${t.label.composition} · ${t.label.estimate}`);
    const capo = GARMENTS.find((c) => c.id === "ecommerce")!;
    expect(p.querySelectorAll("[data-etichetta-comp] li")).toHaveLength(Object.keys(capo.weight).length);
    expect(p.querySelectorAll("[data-etichetta-chips] button")).toHaveLength(capo.uses.length);
    for (const { from: da } of capo.alt) expect(p).toHaveTextContent(t.garments.ecommerce.alt[da]);
    expect(p).toHaveTextContent(t.garments.ecommerce.size);
  });

  it("indietro riporta al passo prima, e dal capo al cartellino torna la cassetta intera", async () => {
    const { container } = render(<ToolboxView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.garments.vetrina.name }));
    const p = pannello(container);
    await userEvent.click(within(p).getByRole("button", { name: "GSAP" }));
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    await userEvent.click(within(p).getByRole("button", { name: /indietro/ }));
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent(t.garments.vetrina.name);
    await userEvent.click(within(p).getByRole("button", { name: /indietro/ }));
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent(t.root.name);
    expect(screen.getByRole("button", { name: t.whole })).toHaveAttribute("aria-pressed", "true");
    expect(within(p).queryByRole("button", { name: /indietro/ })).toBeNull();
  });

  it("l'etichetta di un attrezzo dice se e' stato usato nei lavori o solo conosciuto", async () => {
    const { container } = render(<ToolboxView {...props} />);
    const p = pannello(container);
    await userEvent.click(within(p).getByRole("button", { name: t.zones.back.junction }));
    await userEvent.click(within(p).getByRole("button", { name: t.zones.dati.junction }));
    await userEvent.click(within(p).getByRole("button", { name: "PostgreSQL" }));
    expect(p).toHaveTextContent(t.label.atWork);
    // Dall'attrezzo si torna al suo scomparto, e da li' agli altri.
    await userEvent.click(within(p).getByRole("button", { name: t.zones.dati.junction }));
    await userEvent.click(within(p).getByRole("button", { name: "MongoDB" }));
    expect(p).toHaveTextContent(t.label.known);
  });

  it("il pannello annuncia quello che cambia, senza rubare il fuoco", () => {
    const { container } = render(<ToolboxView {...props} />);
    expect(pannello(container)).toHaveAttribute("aria-live", "polite");
  });
});

describe("la cassetta: la mappa", () => {
  it("e' un disegno: nascosta agli screen reader, e fuori dal giro dei Tab", () => {
    const { container } = render(<ToolboxView {...props} />);
    const svg = container.querySelector("[data-cassetta-banco] svg") as SVGElement;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelectorAll("[tabindex], a, button")).toHaveLength(0);
  });

  it("ha un'etichetta cucita per ogni attrezzo, e i numeri di ogni scomparto", () => {
    const { container } = render(<ToolboxView {...props} />);
    expect(container.querySelectorAll('[data-nodo="attrezzo"]')).toHaveLength(TOOLS.length);
    expect(container.querySelectorAll("[data-pezza]")).toHaveLength(9);
  });
});

describe("la cassetta: l'editor", () => {
  it("senza un lavoro il file del sito aspetta, con il suo nome", () => {
    const { container } = render(<ToolboxView {...props} />);
    const ed = editor(container);
    expect(ed).toHaveTextContent(t.editor.empty);
    expect(within(ed).getByRole("button", { name: t.editor.file })).toHaveAttribute("aria-pressed", "true");
  });

  it("scelto un lavoro il file si riscrive con i suoi attrezzi, e la barra conta", async () => {
    const { container } = render(<ToolboxView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.garments.assistente.name }));
    const ed = editor(container);
    for (const id of GARMENTS.find((c) => c.id === "assistente")!.uses) {
      const nome = TOOLS.find((a) => a.id === id)!.name;
      expect(within(ed).getByRole("button", { name: `"${nome}"` })).toBeInTheDocument();
    }
    expect(ed.querySelector("[data-editor-stato]")).toHaveTextContent(t.garments.assistente.status);
  });

  it("il tipo del capo nel codice e' nella lingua della pagina", async () => {
    const en = copyFor("en");
    const { container } = render(<ToolboxView {...props} copy={en} />);
    await userEvent.click(screen.getByRole("button", { name: en.garments.piattaforma.name }));
    const ed = editor(container);
    expect(ed).toHaveTextContent(`"${en.garments.piattaforma.slug}"`);
    expect(ed).not.toHaveTextContent('"piattaforma"');
  });

  it("una cartella apre il file del suo scomparto", async () => {
    const { container } = render(<ToolboxView {...props} />);
    const ed = editor(container);
    await userEvent.click(within(ed).getByRole("button", { name: t.zones.ai.short }));
    expect(ed).toHaveTextContent(`${t.editor.folder}/${t.zones.ai.short}.ts`);
    expect(ed).toHaveTextContent(t.tools.pgvector.brief);
  });

  it("un nome toccato apre l'etichetta nel foglio, con indietro e chiudi", async () => {
    const { container } = render(<ToolboxView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.garments.vetrina.name }));
    const ed = editor(container);
    await userEvent.click(within(ed).getByRole("button", { name: '"GSAP"' }));
    const foglio = container.querySelector("[data-cassetta-foglio]") as HTMLDialogElement;
    expect(foglio.open).toBe(true);
    expect(document.documentElement).toHaveAttribute("data-dialog-open");
    expect(within(foglio).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    // Il primo passo del foglio non ha un indietro: indietro e' dentro il foglio.
    expect(within(foglio).queryByRole("button", { name: /indietro/ })).toBeNull();
    await userEvent.click(within(foglio).getByRole("button", { name: t.garments.vetrina.name }));
    expect(within(foglio).getByRole("heading", { level: 3 })).toHaveTextContent(t.garments.vetrina.name);
    await userEvent.click(within(foglio).getByRole("button", { name: /indietro/ }));
    expect(within(foglio).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    await userEvent.click(within(foglio).getByRole("button", { name: /chiudi/ }));
    expect(foglio.open).toBe(false);
    expect(document.documentElement).not.toHaveAttribute("data-dialog-open");
  });
});

describe("la cassetta: senza JavaScript e per chi legge", () => {
  it("l'elenco per scomparti ha ogni attrezzo, con quello che fa e se e' stato usato", () => {
    const { container } = render(<ToolboxView {...props} />);
    const elenco = container.querySelector("[data-cassetta-elenco]") as HTMLElement;
    expect(within(elenco).getAllByRole("heading", { level: 4 })).toHaveLength(9);
    expect(elenco.querySelectorAll("li")).toHaveLength(TOOLS.length);
    expect(elenco).toHaveTextContent(t.tools.drizzle.what);
  });

  it("gli scomparti dell'elenco non sono landmark: nove regioni affollerebbero la mappa della pagina", () => {
    const { container } = render(<ToolboxView {...props} />);
    const elenco = container.querySelector("[data-cassetta-elenco]") as HTMLElement;
    expect(within(elenco).queryAllByRole("region")).toHaveLength(0);
    expect(elenco.querySelector("section")).toBeNull();
  });

  it("il CSS mostra l'elenco quando lo scripting manca, e nasconde la scena", () => {
    const senza = { media: "(scripting: none)" };
    expect(rules(/\[data-cassetta-scena\]/, senza).some((r) => /display:\s*none/.test(r.body))).toBe(true);
    expect(rules(/\[data-cassetta-elenco\]/, senza).length).toBeGreaterThan(0);
  });

  it("mappa ed editor li sceglie il CSS con la stessa condizione del codice", () => {
    expect(rules(undefined, { media: MAP_QUERY }).length).toBeGreaterThan(0);
  });
});

describe("la cronologia", () => {
  const inizio = { history: [{ kind: "nodo" as const, id: "sito" }], garment: null, sheet: null };

  it("non raddoppia un passo uguale a quello in cima", () => {
    const s = toolboxReducer(toolboxReducer(inizio, { type: "nodo", id: "redis" }), { type: "nodo", id: "redis" });
    expect(s.history).toHaveLength(2);
  });

  it("dal cartellino non si torna indietro", () => {
    expect(toolboxReducer(inizio, { type: "indietro" })).toBe(inizio);
  });

  it("nel foglio, indietro si ferma al passo che l'ha aperto", () => {
    let s = toolboxReducer(inizio, { type: "nodo", id: "redis" });
    s = toolboxReducer(s, { type: "apri", id: "gsap" });
    expect(toolboxReducer(s, { type: "indietro" })).toBe(s);
  });

  it("tornando su un capo lo si ricuce", () => {
    let s = toolboxReducer(inizio, { type: "capo", id: "vetrina" });
    s = toolboxReducer(s, { type: "capo", id: "ecommerce" });
    s = toolboxReducer(s, { type: "indietro" });
    expect(s.garment).toBe("vetrina");
  });
});
