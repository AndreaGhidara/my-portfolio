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

const panel = (c: HTMLElement) => c.querySelector("[data-toolbox-panel]") as HTMLElement;
const editor = (c: HTMLElement) => c.querySelector("[data-toolbox-editor]") as HTMLElement;

describe("la cassetta: la testa", () => {
  it("ha il suo titolo e un solo paragrafo", () => {
    const { container } = render(<ToolboxView {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: props.title })).toBeInTheDocument();
    const head = container.querySelector("[data-toolbox-head]") as HTMLElement;
    const paragraphs = [...head.querySelectorAll("p:not(.eyebrow)")].map((p) => p.textContent);
    expect(paragraphs).toEqual([props.lead]);
  });

  it("dice sotto «cuci per» che e' un punto di partenza", () => {
    render(<ToolboxView {...props} />);
    expect(screen.getByText(t.start)).toBeInTheDocument();
  });
});

describe("la cassetta: cuci per", () => {
  it("un bottone per capo e uno per la cassetta intera, che parte premuto", () => {
    render(<ToolboxView {...props} />);
    const group = screen.getByRole("group", { name: t.sewFor });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([...GARMENTS.map((c) => t.garments[c.id].name), t.whole]);
    expect(within(group).getByRole("button", { name: t.whole })).toHaveAttribute("aria-pressed", "true");
  });

  it("scelto un capo, l'etichetta dice composizione (stima), fibre e cura", async () => {
    const { container } = render(<ToolboxView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.garments.ecommerce.name }));
    expect(screen.getByRole("button", { name: t.garments.ecommerce.name })).toHaveAttribute("aria-pressed", "true");
    const p = panel(container);
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent(t.garments.ecommerce.name);
    expect(p).toHaveTextContent(`${t.label.composition} · ${t.label.estimate}`);
    const garment = GARMENTS.find((c) => c.id === "ecommerce")!;
    expect(p.querySelectorAll("[data-label-comp] li")).toHaveLength(Object.keys(garment.weight).length);
    expect(p.querySelectorAll("[data-label-chips] button")).toHaveLength(garment.uses.length);
    for (const { from } of garment.alt) expect(p).toHaveTextContent(t.garments.ecommerce.alt[from]);
    expect(p).toHaveTextContent(t.garments.ecommerce.size);
  });

  it("indietro riporta al passo prima, e dal capo al cartellino torna la cassetta intera", async () => {
    const { container } = render(<ToolboxView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.garments.vetrina.name }));
    const p = panel(container);
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
    const p = panel(container);
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
    expect(panel(container)).toHaveAttribute("aria-live", "polite");
  });
});

describe("la cassetta: la mappa", () => {
  it("e' un disegno: nascosta agli screen reader, e fuori dal giro dei Tab", () => {
    const { container } = render(<ToolboxView {...props} />);
    const svg = container.querySelector("[data-toolbox-bench] svg") as SVGElement;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelectorAll("[tabindex], a, button")).toHaveLength(0);
  });

  it("ha un'etichetta cucita per ogni attrezzo, e i numeri di ogni scomparto", () => {
    const { container } = render(<ToolboxView {...props} />);
    expect(container.querySelectorAll('[data-node="tool"]')).toHaveLength(TOOLS.length);
    expect(container.querySelectorAll("[data-patch]")).toHaveLength(9);
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
      const name = TOOLS.find((a) => a.id === id)!.name;
      expect(within(ed).getByRole("button", { name: `"${name}"` })).toBeInTheDocument();
    }
    expect(ed.querySelector("[data-editor-state]")).toHaveTextContent(t.garments.assistente.status);
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
    const sheet = container.querySelector("[data-toolbox-sheet]") as HTMLDialogElement;
    expect(sheet.open).toBe(true);
    expect(document.documentElement).toHaveAttribute("data-dialog-open");
    expect(within(sheet).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    // Il primo passo del foglio non ha un indietro: indietro e' dentro il foglio.
    expect(within(sheet).queryByRole("button", { name: /indietro/ })).toBeNull();
    await userEvent.click(within(sheet).getByRole("button", { name: t.garments.vetrina.name }));
    expect(within(sheet).getByRole("heading", { level: 3 })).toHaveTextContent(t.garments.vetrina.name);
    await userEvent.click(within(sheet).getByRole("button", { name: /indietro/ }));
    expect(within(sheet).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    await userEvent.click(within(sheet).getByRole("button", { name: /chiudi/ }));
    expect(sheet.open).toBe(false);
    expect(document.documentElement).not.toHaveAttribute("data-dialog-open");
  });
});

describe("la cassetta: senza JavaScript e per chi legge", () => {
  it("l'elenco per scomparti ha ogni attrezzo, con quello che fa e se e' stato usato", () => {
    const { container } = render(<ToolboxView {...props} />);
    const list = container.querySelector("[data-toolbox-list]") as HTMLElement;
    expect(within(list).getAllByRole("heading", { level: 4 })).toHaveLength(9);
    expect(list.querySelectorAll("li")).toHaveLength(TOOLS.length);
    expect(list).toHaveTextContent(t.tools.drizzle.what);
  });

  it("gli scomparti dell'elenco non sono landmark: nove regioni affollerebbero la mappa della pagina", () => {
    const { container } = render(<ToolboxView {...props} />);
    const list = container.querySelector("[data-toolbox-list]") as HTMLElement;
    expect(within(list).queryAllByRole("region")).toHaveLength(0);
    expect(list.querySelector("section")).toBeNull();
  });

  it("il CSS mostra l'elenco quando lo scripting manca, e nasconde la scena", () => {
    const noScripting = { media: "(scripting: none)" };
    expect(rules(/\[data-toolbox-scene\]/, noScripting).some((r) => /display:\s*none/.test(r.body))).toBe(true);
    expect(rules(/\[data-toolbox-list\]/, noScripting).length).toBeGreaterThan(0);
  });

  it("mappa ed editor li sceglie il CSS con la stessa condizione del codice", () => {
    expect(rules(undefined, { media: MAP_QUERY }).length).toBeGreaterThan(0);
  });
});

describe("la cronologia", () => {
  const start = { history: [{ kind: "node" as const, id: "sito" }], garment: null, sheet: null };

  it("non raddoppia un passo uguale a quello in cima", () => {
    const s = toolboxReducer(toolboxReducer(start, { type: "node", id: "redis" }), { type: "node", id: "redis" });
    expect(s.history).toHaveLength(2);
  });

  it("dal cartellino non si torna indietro", () => {
    expect(toolboxReducer(start, { type: "back" })).toBe(start);
  });

  it("nel foglio, indietro si ferma al passo che l'ha aperto", () => {
    let s = toolboxReducer(start, { type: "node", id: "redis" });
    s = toolboxReducer(s, { type: "open", id: "gsap" });
    expect(toolboxReducer(s, { type: "back" })).toBe(s);
  });

  it("tornando su un capo lo si ricuce", () => {
    let s = toolboxReducer(start, { type: "garment", id: "vetrina" });
    s = toolboxReducer(s, { type: "garment", id: "ecommerce" });
    s = toolboxReducer(s, { type: "back" });
    expect(s.garment).toBe("vetrina");
  });
});
