import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTranslator } from "next-intl";
import it_ from "../../../../../messages/it.json";
import en_ from "../../../../../messages/en.json";
import type { Notizia, Raccolta } from "@/lib/news/types";
import { NotizieView } from "../NewsView";
import { testiNotizie } from "../copy";
import { regole, type Opzioni } from "@/test/css";

/** I testi veri, costruiti come li costruisce il server. */
function testi(lingua: "it" | "en") {
  const t = createTranslator({ locale: lingua, messages: lingua === "it" ? it_ : en_, namespace: "notizie" });
  const traduci = Object.assign((k: string) => t(k as never), { raw: (k: string) => t.raw(k as never) });
  return testiNotizie(traduci);
}

const props = (lingua: "it" | "en" = "it") => {
  const m = lingua === "it" ? it_ : en_;
  return {
    eyebrow: m.notizie.eyebrow,
    title: m.notizie.title,
    intro: m.notizie.intro,
    locale: lingua,
    testi: testi(lingua),
  };
};

const ieri = new Date(Date.now() - 26 * 3600 * 1000).toISOString();

const notizia = (url: string, titolo: string, extra: Partial<Notizia> = {}): Notizia => ({
  id: url,
  titolo,
  url,
  hostname: new URL(url).hostname,
  quando: ieri,
  fonte: { id: "hn" },
  timbro: "prima-pagina",
  riassunto: "A short summary of the story.",
  dati: [
    { codice: "punti", valore: 1234 },
    { codice: "commenti", valore: 56 },
  ],
  ...extra,
});

const raccolta: Raccolta = {
  raccolteAlle: new Date().toISOString(),
  categorie: {
    ia: [notizia("https://example.com/ia-1", "Agents are here"), notizia("https://example.com/ia-2", "A second AI story")],
    design: [notizia("https://example.com/design-1", "Fonts again", { fonte: { id: "dev", tag: "design" }, timbro: "piu-letto" })],
    codice: [
      notizia("https://github.com/vercel/next.js/releases/tag/v15.5.0", "Next.js 15.5.0", {
        fonte: { id: "github", repo: "vercel/next.js" },
        timbro: "release",
        dati: [{ codice: "versione", valore: "v15.5.0" }],
      }),
    ],
  },
};

function rispondi(corpo: unknown = raccolta) {
  const f = vi.fn(async () => ({ ok: true, json: async () => corpo }) as Response);
  vi.stubGlobal("fetch", f);
  return f;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const it0 = testi("it");
const manopola = () => screen.getByRole("button", { name: it0.manopola });
const pulsante = (nome: string) => within(screen.getByRole("group", { name: it0.gruppo })).getByRole("button", { name: nome });

/** Aspetta che le notizie siano arrivate: la targa conta le palline. */
async function pronta(container: HTMLElement) {
  await waitFor(() => expect(container.querySelectorAll("[data-notizie-globo] > span").length).toBeGreaterThan(0));
}

describe("le notizie: la testa e i comandi", () => {
  it("e' una sezione col suo titolo, l'occhiello e l'invito", () => {
    rispondi();
    render(<NotizieView {...props()} />);
    const sezione = screen.getByRole("region", { name: props().title });
    expect(sezione).toHaveAttribute("id", "notizie");
    expect(within(sezione).getByRole("heading", { level: 2 })).toHaveClass("titolo-sezione");
    expect(sezione).toHaveTextContent(it_.notizie.eyebrow);
    expect(sezione).toHaveTextContent(it_.notizie.intro);
  });

  it("tre pulsanti in un gruppo, I.A. premuto; la manopola e' un bottone con la sua etichetta", () => {
    rispondi();
    render(<NotizieView {...props()} />);
    const gruppo = screen.getByRole("group", { name: it0.gruppo });
    const bottoni = within(gruppo).getAllByRole("button");
    expect(bottoni.map((b) => b.textContent)).toEqual(["I.A.", "Design", "Codice"]);
    expect(bottoni.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    expect(manopola()).toBeInTheDocument();
  });

  it("scegliere una categoria sposta aria-pressed e il colore del corpo", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await userEvent.click(pulsante("Design"));
    expect(pulsante("Design")).toHaveAttribute("aria-pressed", "true");
    expect(pulsante("I.A.")).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector("[data-notizie-macchina]")).toHaveAttribute("data-cat", "design");
  });

  it("nel markup del server il globo e' vuoto: le palline si dispongono a caso solo sul client", () => {
    const html = renderToString(<NotizieView {...props()} />);
    expect(html).toMatch(/<div data-notizie-globo="true" aria-hidden="true"><\/div>/);
  });
});

describe("le notizie: il giro", () => {
  it("chiede le notizie a /api/notizie, e la targa conta le palline della categoria", async () => {
    const f = rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    expect(f).toHaveBeenCalledWith("/api/notizie");
    expect(container.querySelectorAll("[data-notizie-globo] > span")).toHaveLength(4);
    expect(container.querySelector("[data-notizie-targa]")).toHaveTextContent("I.A. · 2 palline");
    await userEvent.click(pulsante("Codice"));
    expect(container.querySelector("[data-notizie-targa]")).toHaveTextContent("Codice · 1 pallina");
  });

  it("un giro stampa la notizia sotto la testata della categoria, e annuncia solo testata e titolo", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    expect(container.querySelector("[data-foglio-testa] b")).toHaveTextContent(it0.testata);
    await userEvent.click(manopola());
    const articolo = await screen.findByRole("article");
    expect(container.querySelector("[data-foglio-testa] b")).toHaveTextContent("La Gazzetta dell'I.A.");
    expect(within(articolo).getByRole("heading", { level: 3 })).toHaveTextContent("Agents are here");
    expect(articolo).toHaveTextContent("Hacker News · ieri");
    expect(articolo).toHaveTextContent("in prima pagina");
    expect(articolo).toHaveTextContent(`${new Intl.NumberFormat("it").format(1234)} punti`);
    // L'articolo intero, riassunto e numeri compresi, non si legge da solo:
    // si annuncia la testata col titolo, e il resto lo si va a leggere.
    const vivi = container.querySelectorAll("[aria-live]");
    expect(vivi).toHaveLength(1);
    expect(vivi[0]).toHaveTextContent("La Gazzetta dell'I.A.: Agents are here");
    expect(vivi[0]).not.toContainElement(articolo);
    expect(articolo.closest("[aria-live]")).toBeNull();
    expect(container.querySelector('[data-notizie-globo] > [data-cat="ia"][data-via]')).not.toBeNull();
    expect(container.querySelector("[data-notizie-targa]")).toHaveTextContent("I.A. · 1 pallina");
  });

  it("il link apre la fonte in un'altra scheda senza dire da dove si arriva; nessuna immagine", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    await userEvent.click(manopola());
    const link = within(await screen.findByRole("article")).getByRole("link", { name: /Leggi su example\.com/ });
    expect(link).toHaveAttribute("href", "https://example.com/ia-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("il messaggio di stato c'e' sempre, vuoto: cosi' quando parla lo si sente", () => {
    rispondi();
    render(<NotizieView {...props()} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("un tocco al centro della manopola gira, anche se il dito trema di due pixel", async () => {
    // Vicino al centro un pixel di tremito vale molti gradi: contati come
    // trascinamento, il clic che segue veniva buttato.
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    const m = manopola();
    fireEvent.pointerDown(m, { clientX: 0, clientY: 0, pointerId: 1, button: 0 });
    fireEvent.pointerMove(m, { clientX: 2, clientY: 1, pointerId: 1 });
    fireEvent.pointerMove(m, { clientX: -1, clientY: 2, pointerId: 1 });
    fireEvent.pointerUp(m, { clientX: -1, clientY: 2, pointerId: 1 });
    fireEvent.click(m);
    expect(await screen.findByRole("article")).toHaveTextContent("Agents are here");
    expect(container.querySelector("[data-notizie-targa]")).toHaveTextContent("I.A. · 1 pallina");
  });

  it("senza riassunto il posto resta: il dominio in grande e una riga", async () => {
    rispondi({
      ...raccolta,
      categorie: { ...raccolta.categorie, ia: [notizia("https://example.com/s", "No summary", { riassunto: undefined })] },
    });
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    await userEvent.click(manopola());
    const articolo = await screen.findByRole("article");
    expect(articolo.querySelector("[data-ritaglio-riassunto]")).toBeNull();
    const vuoto = articolo.querySelector("[data-ritaglio-corpo] [data-ritaglio-vuoto]");
    expect(vuoto).toHaveTextContent("example.com");
    expect(vuoto).toHaveTextContent(it0.senzaRiassunto);
  });

  it("la manopola gira anche da tastiera", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    manopola().focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("article")).toHaveTextContent("Agents are here");
    await userEvent.keyboard(" ");
    await waitFor(() => expect(screen.getByRole("article")).toHaveTextContent("A second AI story"));
  });

  it("trascinata in tondo per un giro intero, esce una pallina; un pezzo di giro non basta", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    const m = manopola();
    // Il centro della manopola, in jsdom, e' l'origine: si gira intorno a (0, 0).
    const punto = (gradi: number) => ({
      clientX: Math.cos((gradi * Math.PI) / 180) * 30,
      clientY: Math.sin((gradi * Math.PI) / 180) * 30,
      pointerId: 1,
    });
    fireEvent.pointerDown(m, { ...punto(0), button: 0 });
    for (let g = 30; g <= 180; g += 30) fireEvent.pointerMove(m, punto(g));
    expect(screen.queryByRole("article")).toBeNull();
    for (let g = 210; g <= 390; g += 30) fireEvent.pointerMove(m, punto(g));
    fireEvent.pointerUp(m, punto(390));
    expect(await screen.findByRole("article")).toHaveTextContent("Agents are here");
  });

  it("una release dice che e' uscita, nella lingua della pagina", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    await userEvent.click(pulsante("Codice"));
    await userEvent.click(manopola());
    const articolo = await screen.findByRole("article");
    expect(container.querySelector("[data-foglio-testa] b")).toHaveTextContent("Il Corriere del Codice");
    expect(within(articolo).getByRole("heading", { level: 3 })).toHaveTextContent("Next.js 15.5.0 è uscito");
    expect(articolo).toHaveTextContent("GitHub · vercel/next.js");
    expect(articolo).toHaveTextContent("nuova versione");
  });

  it("«Gia' uscite» mette in fila i titoli, l'ultima in cima, e cliccarne uno la riporta sulla pagina", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    const uscite = () => container.querySelector("[data-foglio-uscite]") as HTMLElement;
    expect(uscite()).toHaveTextContent(it0.nessunaUscita);
    await userEvent.click(manopola());
    await screen.findByRole("article");
    // Una sola e' gia' sulla pagina: la fila comincia dalla seconda.
    expect(uscite()).toHaveTextContent(it0.nessunaUscita);
    await userEvent.click(manopola());
    await waitFor(() => expect(screen.getByRole("article")).toHaveTextContent("A second AI story"));
    const voci = within(uscite()).getAllByRole("button");
    expect(voci.map((b) => b.textContent)).toEqual(["A second AI story", "Agents are here"]);
    expect(voci.map((b) => b.getAttribute("aria-current"))).toEqual(["true", null]);
    await userEvent.click(voci[1]);
    expect(within(screen.getByRole("article")).getByRole("heading", { level: 3 })).toHaveTextContent("Agents are here");
    expect(voci[1]).toHaveAttribute("aria-current", "true");
    expect(voci[0]).not.toHaveAttribute("aria-current");
  });

  it("finita una categoria lo dice al posto della notizia, e le gia' uscite restano", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    await userEvent.click(manopola());
    await userEvent.click(pulsante("Design"));
    await userEvent.click(manopola());
    expect(await screen.findByRole("article")).toHaveTextContent("Fonts again");
    await userEvent.click(manopola());
    const finite = "Le notizie Design di oggi sono finite: prova un altro pulsante, o torna domani.";
    expect(screen.getByRole("status")).toHaveTextContent(finite);
    // Il pannello sta nella stessa scatola della notizia.
    const scatola = container.querySelector("[data-foglio-notizia]") as HTMLElement;
    expect(scatola).toContainElement(screen.getByRole("status"));
    expect(screen.queryByRole("article")).toBeNull();
    const voci = within(container.querySelector("[data-foglio-uscite]") as HTMLElement).getAllByRole("button");
    expect(voci.map((b) => b.getAttribute("aria-label"))).toEqual(["Design: Fonts again", "I.A.: Agents are here"]);
    // Si torna a una notizia gia' uscita, e l'avviso tace.
    await userEvent.click(voci[1]);
    expect(screen.getByRole("article")).toHaveTextContent("Agents are here");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("dice a che ora sono state raccolte, oggi", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    const ora = new Intl.DateTimeFormat("it", { hour: "numeric", minute: "2-digit" }).format(
      new Date(raccolta.raccolteAlle),
    );
    expect(container.querySelector("[data-notizie-raccolte]")).toHaveTextContent(
      `Notizie raccolte alle ${ora} di oggi: domani sono altre.`,
    );
  });
});

describe("le notizie: quando non arrivano", () => {
  it("lo dice, e il giro dopo riprova", async () => {
    const f = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response);
    vi.stubGlobal("fetch", f);
    const { container } = render(<NotizieView {...props()} />);
    expect(await screen.findByRole("status")).toHaveTextContent(it0.errore);
    f.mockImplementation(async () => ({ ok: true, json: async () => raccolta }) as Response);
    await userEvent.click(manopola());
    await pronta(container);
    expect(f).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(container).toHaveTextContent(it0.vuota);
  });

  it("tre categorie vuote valgono come notizie non arrivate", async () => {
    rispondi({ raccolteAlle: raccolta.raccolteAlle, categorie: { ia: [], design: [], codice: [] } });
    render(<NotizieView {...props()} />);
    expect(await screen.findByRole("status")).toHaveTextContent(it0.errore);
  });
});

describe("le notizie in inglese", () => {
  it("la cornice e' in inglese, le notizie restano come sono", async () => {
    rispondi();
    const en = testi("en");
    const { container } = render(<NotizieView {...props("en")} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(en_.notizie.title);
    const gruppo = screen.getByRole("group", { name: en.gruppo });
    expect(within(gruppo).getAllByRole("button").map((b) => b.textContent)).toEqual(["A.I.", "Design", "Code"]);
    await pronta(container);
    expect(container.querySelector("[data-notizie-targa]")).toHaveTextContent("A.I. · 2 balls");
    await userEvent.click(screen.getByRole("button", { name: en.manopola }));
    const articolo = await screen.findByRole("article");
    expect(container.querySelector("[data-foglio-testa] b")).toHaveTextContent("The A.I. Gazette");
    expect(articolo).toHaveTextContent("Hacker News · yesterday");
    expect(articolo).toHaveTextContent("front page");
    expect(within(articolo).getByRole("link", { name: /Read on example\.com/ })).toBeInTheDocument();
  });
});

const regoleDelRitaglio = regole(/\[data-notizie-ritaglio\]/);
const regoleDelFoglio = regole(/\[data-notizie-foglio\]/);
/** Il corpo della regola col selettore, fuori o dentro una media query (la prima che c'e'). */
const regola = (selettore: string, dove?: Opzioni) => regole(selettore, dove)[0]?.corpo ?? "";
const telefono: Opzioni = { media: "(max-width: 959px)" };

describe("i colori delle notizie", () => {
  it("il foglio e il ritaglio sono carta nei due temi: dentro mai i colori che seguono il tema", () => {
    expect(regoleDelRitaglio.length).toBeGreaterThan(10);
    expect(regoleDelFoglio.length).toBeGreaterThan(8);
    const vietati = /var\(--(fg|bg|fg-muted|line|accento-testo|verde)\)/;
    expect(regoleDelRitaglio.filter((r) => vietati.test(r.corpo)).map((r) => r.selettore)).toEqual([]);
    expect(regoleDelFoglio.filter((r) => vietati.test(r.corpo)).map((r) => r.selettore)).toEqual([]);
    const foglio = regoleDelFoglio.find((r) => r.selettore === "[data-notizie-foglio]")?.corpo ?? "";
    expect(foglio).toMatch(/--carta:\s*var\(--paper\)/);
    expect(foglio).toMatch(/background:\s*var\(--carta\)/);
    const radice = regoleDelRitaglio.find((r) => r.selettore === "[data-notizie-ritaglio]")?.corpo ?? "";
    expect(radice).toMatch(/--carta:\s*var\(--paper\)/);
    expect(radice).toMatch(/--inchiostro:\s*var\(--ink\)/);
    expect(radice).toMatch(/--arancio:\s*var\(--accento-su-carta\)/);
  });

  it("le categorie sono fisse: il verde e' quello di carta, e nessun tema le ridefinisce", () => {
    const valori = (proprieta: string) => regole().map((r) => r.dichiarazioni[proprieta]);
    expect(valori("--notizie-codice")).toContain("#2F6F4E");
    expect(valori("--on-notizie-ia")).toContain("var(--ink)");
    expect(valori("--on-notizie-design")).toContain("var(--ink)");
    expect(valori("--on-notizie-codice")).toContain("var(--paper)");
    const scuro = regole(/\[data-theme="dark"\]/).map((r) => r.corpo).join("");
    expect(scuro).not.toMatch(/--(on-)?notizie-/);
  });

  it("l'anello di fuoco dei pulsanti e della manopola e' il testo della categoria, non l'arancio", () => {
    const fuoco = regole("[data-notizie-pulsanti] button:focus-visible").find((r) =>
      r.selettori.includes("[data-notizie-manopola]:focus-visible"),
    )?.corpo;
    expect(fuoco).toMatch(/outline:\s*3px solid var\(--su-tema\)/);
  });

  it("il giallo ha sempre il contorno d'inchiostro: palline, pulsante e corpo", () => {
    for (const selettore of [
      '[data-notizie-globo] > [data-cat="design"]',
      '[data-notizie-pulsanti] [data-cat="design"] i',
      '[data-notizie-macchina][data-cat="design"] [data-notizie-corpo]',
    ]) {
      expect(regola(selettore), selettore).toMatch(/inset 0 0 0 [\d.]+px var\(--ink\)/);
    }
  });

  it("la rotella non si intercetta: la pagina scorre anche sopra la macchina", () => {
    const bancone = readFileSync("src/components/sections/News/NewsStand.tsx", "utf8");
    expect(bancone).not.toMatch(/onWheel|"wheel"/);
  });
});

/**
 * In jsdom l'impaginazione non si misura: si leggono le regole che la tengono
 * ferma. Le altezze misurate nel browser stanno nel prototipo e nel suo README.
 */
describe("il foglio non cambia misura da una notizia all'altra", () => {
  it("sul desktop il foglio ha un'altezza fissa, e la notizia la riempie", () => {
    expect(regola("[data-notizie-foglio]")).toMatch(/(^|[^-])height:\s*\d+(\.\d+)?rem/);
    expect(regola("[data-foglio-notizia]")).toMatch(/min-height:\s*0/);
    expect(regola("[data-notizie-foglio] [data-notizie-ritaglio]")).toMatch(/height:\s*100%/);
  });

  it("titolo a tre righe, riassunto a un numero fisso di righe, il resto si taglia", () => {
    const titolo = regola("[data-notizie-foglio] [data-notizie-ritaglio] h3");
    expect(titolo).toMatch(/-webkit-line-clamp:\s*3/);
    expect(titolo).toMatch(/overflow:\s*hidden/);
    const riassunto = regola("[data-notizie-ritaglio] [data-ritaglio-riassunto]");
    expect(riassunto).toMatch(/-webkit-line-clamp:\s*\d+/);
    expect(riassunto).toMatch(/overflow:\s*hidden/);
    expect(regola("[data-notizie-ritaglio] [data-ritaglio-corpo]")).toMatch(/overflow:\s*hidden/);
  });

  it("la fila delle gia' uscite scorre dentro, e ogni titolo sta in due righe", () => {
    expect(regola("[data-foglio-uscite]")).toMatch(/overflow-y:\s*auto/);
    expect(regola("[data-foglio-uscite] button span")).toMatch(/-webkit-line-clamp:\s*2/);
  });

  it("sul telefono la notizia e la fila hanno misure fisse, e la testata non va a capo", () => {
    expect(regole(undefined, telefono).length, "la media del telefono non ha regole").toBeGreaterThan(0);
    expect(regola("[data-foglio-notizia]", telefono)).toMatch(/(^|[^-])height:\s*\d+(\.\d+)?rem/);
    expect(regola("[data-foglio-uscite]", telefono)).toMatch(/(^|[^-])height:\s*\d+(\.\d+)?rem/);
    expect(regola("[data-foglio-testa]", telefono)).toMatch(/flex-direction:\s*column/);
    expect(regola("[data-foglio-testa] b")).toMatch(/white-space:\s*nowrap/);
  });

  it("i pallini gia' usciti non ci sono piu': c'e' la colonna coi titoli", async () => {
    rispondi();
    const { container } = render(<NotizieView {...props()} />);
    await pronta(container);
    expect(container.querySelector("[data-notizie-mazzetta]")).toBeNull();
    expect(container.querySelector("[data-foglio-colonna]")).toHaveTextContent(it0.giaUscite);
  });
});
