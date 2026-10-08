import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ATTREZZI, CAPI } from "@/content/cassetta";
import { CassettaView } from "../CassettaView";
import { VISTA_MAPPA, riduci } from "../Cassetta";
import { testi } from "./fixture";
import { regole } from "@/test/css";

const t = testi("it");
const props = { eyebrow: "Gli attrezzi", title: "Tutto quello che so usare.", lead: "La mia cassetta.", testi: t };

const pannello = (c: HTMLElement) => c.querySelector("[data-cassetta-pannello]") as HTMLElement;
const editor = (c: HTMLElement) => c.querySelector("[data-cassetta-editor]") as HTMLElement;

describe("la cassetta: la testa", () => {
  it("ha il suo titolo e un solo paragrafo", () => {
    const { container } = render(<CassettaView {...props} />);
    expect(screen.getByRole("heading", { level: 2, name: props.title })).toBeInTheDocument();
    const testa = container.querySelector("[data-cassetta-testa]") as HTMLElement;
    const paragrafi = [...testa.querySelectorAll("p:not(.eyebrow)")].map((p) => p.textContent);
    expect(paragrafi).toEqual([props.lead]);
  });

  it("dice sotto «cuci per» che e' un punto di partenza", () => {
    render(<CassettaView {...props} />);
    expect(screen.getByText(t.partenza)).toBeInTheDocument();
  });
});

describe("la cassetta: cuci per", () => {
  it("un bottone per capo e uno per la cassetta intera, che parte premuto", () => {
    render(<CassettaView {...props} />);
    const gruppo = screen.getByRole("group", { name: t.cuciPer });
    const bottoni = within(gruppo).getAllByRole("button");
    expect(bottoni.map((b) => b.textContent)).toEqual([...CAPI.map((c) => t.capi[c.id].nome), t.tutta]);
    expect(within(gruppo).getByRole("button", { name: t.tutta })).toHaveAttribute("aria-pressed", "true");
  });

  it("scelto un capo, l'etichetta dice composizione (stima), fibre e cura", async () => {
    const { container } = render(<CassettaView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.capi.ecommerce.nome }));
    expect(screen.getByRole("button", { name: t.capi.ecommerce.nome })).toHaveAttribute("aria-pressed", "true");
    const p = pannello(container);
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent(t.capi.ecommerce.nome);
    expect(p).toHaveTextContent(`${t.etichetta.composizione} · ${t.etichetta.stima}`);
    const capo = CAPI.find((c) => c.id === "ecommerce")!;
    expect(p.querySelectorAll("[data-etichetta-comp] li")).toHaveLength(Object.keys(capo.peso).length);
    expect(p.querySelectorAll("[data-etichetta-chips] button")).toHaveLength(capo.usa.length);
    for (const { da } of capo.alt) expect(p).toHaveTextContent(t.capi.ecommerce.alt[da]);
    expect(p).toHaveTextContent(t.capi.ecommerce.taglia);
  });

  it("indietro riporta al passo prima, e dal capo al cartellino torna la cassetta intera", async () => {
    const { container } = render(<CassettaView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.capi.vetrina.nome }));
    const p = pannello(container);
    await userEvent.click(within(p).getByRole("button", { name: "GSAP" }));
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    await userEvent.click(within(p).getByRole("button", { name: /indietro/ }));
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent(t.capi.vetrina.nome);
    await userEvent.click(within(p).getByRole("button", { name: /indietro/ }));
    expect(within(p).getByRole("heading", { level: 3 })).toHaveTextContent(t.radice.nome);
    expect(screen.getByRole("button", { name: t.tutta })).toHaveAttribute("aria-pressed", "true");
    expect(within(p).queryByRole("button", { name: /indietro/ })).toBeNull();
  });

  it("l'etichetta di un attrezzo dice se e' stato usato nei lavori o solo conosciuto", async () => {
    const { container } = render(<CassettaView {...props} />);
    const p = pannello(container);
    await userEvent.click(within(p).getByRole("button", { name: t.zone.back.snodo }));
    await userEvent.click(within(p).getByRole("button", { name: t.zone.dati.snodo }));
    await userEvent.click(within(p).getByRole("button", { name: "PostgreSQL" }));
    expect(p).toHaveTextContent(t.etichetta.lavoro);
    // Dall'attrezzo si torna al suo scomparto, e da li' agli altri.
    await userEvent.click(within(p).getByRole("button", { name: t.zone.dati.snodo }));
    await userEvent.click(within(p).getByRole("button", { name: "MongoDB" }));
    expect(p).toHaveTextContent(t.etichetta.conosciuto);
  });

  it("il pannello annuncia quello che cambia, senza rubare il fuoco", () => {
    const { container } = render(<CassettaView {...props} />);
    expect(pannello(container)).toHaveAttribute("aria-live", "polite");
  });
});

describe("la cassetta: la mappa", () => {
  it("e' un disegno: nascosta agli screen reader, e fuori dal giro dei Tab", () => {
    const { container } = render(<CassettaView {...props} />);
    const svg = container.querySelector("[data-cassetta-banco] svg") as SVGElement;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg.querySelectorAll("[tabindex], a, button")).toHaveLength(0);
  });

  it("ha un'etichetta cucita per ogni attrezzo, e i numeri di ogni scomparto", () => {
    const { container } = render(<CassettaView {...props} />);
    expect(container.querySelectorAll('[data-nodo="attrezzo"]')).toHaveLength(ATTREZZI.length);
    expect(container.querySelectorAll("[data-pezza]")).toHaveLength(9);
  });
});

describe("la cassetta: l'editor", () => {
  it("senza un lavoro il file del sito aspetta, con il suo nome", () => {
    const { container } = render(<CassettaView {...props} />);
    const ed = editor(container);
    expect(ed).toHaveTextContent(t.editor.vuoto);
    expect(within(ed).getByRole("button", { name: t.editor.file })).toHaveAttribute("aria-pressed", "true");
  });

  it("scelto un lavoro il file si riscrive con i suoi attrezzi, e la barra conta", async () => {
    const { container } = render(<CassettaView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.capi.assistente.nome }));
    const ed = editor(container);
    for (const id of CAPI.find((c) => c.id === "assistente")!.usa) {
      const nome = ATTREZZI.find((a) => a.id === id)!.nome;
      expect(within(ed).getByRole("button", { name: `"${nome}"` })).toBeInTheDocument();
    }
    expect(ed.querySelector("[data-editor-stato]")).toHaveTextContent(t.capi.assistente.stato);
  });

  it("il tipo del capo nel codice e' nella lingua della pagina", async () => {
    const en = testi("en");
    const { container } = render(<CassettaView {...props} testi={en} />);
    await userEvent.click(screen.getByRole("button", { name: en.capi.piattaforma.nome }));
    const ed = editor(container);
    expect(ed).toHaveTextContent(`"${en.capi.piattaforma.slug}"`);
    expect(ed).not.toHaveTextContent('"piattaforma"');
  });

  it("una cartella apre il file del suo scomparto", async () => {
    const { container } = render(<CassettaView {...props} />);
    const ed = editor(container);
    await userEvent.click(within(ed).getByRole("button", { name: t.zone.ai.corto }));
    expect(ed).toHaveTextContent(`${t.editor.cartella}/${t.zone.ai.corto}.ts`);
    expect(ed).toHaveTextContent(t.attrezzi.pgvector.breve);
  });

  it("un nome toccato apre l'etichetta nel foglio, con indietro e chiudi", async () => {
    const { container } = render(<CassettaView {...props} />);
    await userEvent.click(screen.getByRole("button", { name: t.capi.vetrina.nome }));
    const ed = editor(container);
    await userEvent.click(within(ed).getByRole("button", { name: '"GSAP"' }));
    const foglio = container.querySelector("[data-cassetta-foglio]") as HTMLDialogElement;
    expect(foglio.open).toBe(true);
    expect(document.documentElement).toHaveAttribute("data-dialog-open");
    expect(within(foglio).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    // Il primo passo del foglio non ha un indietro: indietro e' dentro il foglio.
    expect(within(foglio).queryByRole("button", { name: /indietro/ })).toBeNull();
    await userEvent.click(within(foglio).getByRole("button", { name: t.capi.vetrina.nome }));
    expect(within(foglio).getByRole("heading", { level: 3 })).toHaveTextContent(t.capi.vetrina.nome);
    await userEvent.click(within(foglio).getByRole("button", { name: /indietro/ }));
    expect(within(foglio).getByRole("heading", { level: 3 })).toHaveTextContent("GSAP");
    await userEvent.click(within(foglio).getByRole("button", { name: /chiudi/ }));
    expect(foglio.open).toBe(false);
    expect(document.documentElement).not.toHaveAttribute("data-dialog-open");
  });
});

describe("la cassetta: senza JavaScript e per chi legge", () => {
  it("l'elenco per scomparti ha ogni attrezzo, con quello che fa e se e' stato usato", () => {
    const { container } = render(<CassettaView {...props} />);
    const elenco = container.querySelector("[data-cassetta-elenco]") as HTMLElement;
    expect(within(elenco).getAllByRole("heading", { level: 4 })).toHaveLength(9);
    expect(elenco.querySelectorAll("li")).toHaveLength(ATTREZZI.length);
    expect(elenco).toHaveTextContent(t.attrezzi.drizzle.cosa);
  });

  it("gli scomparti dell'elenco non sono landmark: nove regioni affollerebbero la mappa della pagina", () => {
    const { container } = render(<CassettaView {...props} />);
    const elenco = container.querySelector("[data-cassetta-elenco]") as HTMLElement;
    expect(within(elenco).queryAllByRole("region")).toHaveLength(0);
    expect(elenco.querySelector("section")).toBeNull();
  });

  it("il CSS mostra l'elenco quando lo scripting manca, e nasconde la scena", () => {
    const senza = { media: "(scripting: none)" };
    expect(regole(/\[data-cassetta-scena\]/, senza).some((r) => /display:\s*none/.test(r.corpo))).toBe(true);
    expect(regole(/\[data-cassetta-elenco\]/, senza).length).toBeGreaterThan(0);
  });

  it("mappa ed editor li sceglie il CSS con la stessa condizione del codice", () => {
    expect(regole(undefined, { media: VISTA_MAPPA }).length).toBeGreaterThan(0);
  });
});

describe("la cronologia", () => {
  const inizio = { storia: [{ tipo: "nodo" as const, id: "sito" }], capo: null, foglio: null };

  it("non raddoppia un passo uguale a quello in cima", () => {
    const s = riduci(riduci(inizio, { tipo: "nodo", id: "redis" }), { tipo: "nodo", id: "redis" });
    expect(s.storia).toHaveLength(2);
  });

  it("dal cartellino non si torna indietro", () => {
    expect(riduci(inizio, { tipo: "indietro" })).toBe(inizio);
  });

  it("nel foglio, indietro si ferma al passo che l'ha aperto", () => {
    let s = riduci(inizio, { tipo: "nodo", id: "redis" });
    s = riduci(s, { tipo: "apri", id: "gsap" });
    expect(riduci(s, { tipo: "indietro" })).toBe(s);
  });

  it("tornando su un capo lo si ricuce", () => {
    let s = riduci(inizio, { tipo: "capo", id: "vetrina" });
    s = riduci(s, { tipo: "capo", id: "ecommerce" });
    s = riduci(s, { tipo: "indietro" });
    expect(s.capo).toBe("vetrina");
  });
});
