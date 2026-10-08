import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTranslator } from "next-intl";
import it_ from "../../../../../messages/it.json";
import en_ from "../../../../../messages/en.json";
import type { NewsCollection, Story } from "@/lib/news/types";
import { NewsView } from "../NewsView";
import { newsCopy } from "../copy";
import { rules, type Options } from "@/test/css";

/** I testi veri, costruiti come li costruisce il server. */
function buildCopy(lang: "it" | "en") {
  const t = createTranslator({ locale: lang, messages: lang === "it" ? it_ : en_, namespace: "notizie" });
  const translate = Object.assign((k: string) => t(k as never), { raw: (k: string) => t.raw(k as never) });
  return newsCopy(translate);
}

const props = (lang: "it" | "en" = "it") => {
  const m = lang === "it" ? it_ : en_;
  return {
    eyebrow: m.notizie.eyebrow,
    title: m.notizie.title,
    intro: m.notizie.intro,
    locale: lang,
    copy: buildCopy(lang),
  };
};

const yesterday = new Date(Date.now() - 26 * 3600 * 1000).toISOString();

const story = (url: string, title: string, extra: Partial<Story> = {}): Story => ({
  id: url,
  title,
  url,
  hostname: new URL(url).hostname,
  when: yesterday,
  source: { id: "hn" },
  stamp: "prima-pagina",
  summary: "A short summary of the story.",
  figures: [
    { code: "punti", value: 1234 },
    { code: "commenti", value: 56 },
  ],
  ...extra,
});

const collection: NewsCollection = {
  collectedAt: new Date().toISOString(),
  categories: {
    ia: [story("https://example.com/ia-1", "Agents are here"), story("https://example.com/ia-2", "A second AI story")],
    design: [story("https://example.com/design-1", "Fonts again", { source: { id: "dev", tag: "design" }, stamp: "piu-letto" })],
    codice: [
      story("https://github.com/vercel/next.js/releases/tag/v15.5.0", "Next.js 15.5.0", {
        source: { id: "github", repo: "vercel/next.js" },
        stamp: "release",
        figures: [{ code: "versione", value: "v15.5.0" }],
      }),
    ],
  },
};

function respond(body: unknown = collection) {
  const f = vi.fn(async () => ({ ok: true, json: async () => body }) as Response);
  vi.stubGlobal("fetch", f);
  return f;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const it0 = buildCopy("it");
const knob = () => screen.getByRole("button", { name: it0.knob });
const categoryButton = (name: string) => within(screen.getByRole("group", { name: it0.group })).getByRole("button", { name });

/** Aspetta che le notizie siano arrivate: la targa conta le palline. */
async function ready(container: HTMLElement) {
  await waitFor(() => expect(container.querySelectorAll("[data-news-globe] > span").length).toBeGreaterThan(0));
}

describe("le notizie: la testa e i comandi", () => {
  it("e' una sezione col suo titolo, l'occhiello e l'invito", () => {
    respond();
    render(<NewsView {...props()} />);
    const section = screen.getByRole("region", { name: props().title });
    expect(section).toHaveAttribute("id", "notizie");
    expect(within(section).getByRole("heading", { level: 2 })).toHaveClass("section-title");
    expect(section).toHaveTextContent(it_.notizie.eyebrow);
    expect(section).toHaveTextContent(it_.notizie.intro);
  });

  it("tre pulsanti in un gruppo, I.A. premuto; la manopola e' un bottone con la sua etichetta", () => {
    respond();
    render(<NewsView {...props()} />);
    const group = screen.getByRole("group", { name: it0.group });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["I.A.", "Design", "Codice"]);
    expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"]);
    expect(knob()).toBeInTheDocument();
  });

  it("scegliere una categoria sposta aria-pressed e il colore del corpo", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await userEvent.click(categoryButton("Design"));
    expect(categoryButton("Design")).toHaveAttribute("aria-pressed", "true");
    expect(categoryButton("I.A.")).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelector("[data-news-machine]")).toHaveAttribute("data-cat", "design");
  });

  it("nel markup del server il globo e' vuoto: le palline si dispongono a caso solo sul client", () => {
    const html = renderToString(<NewsView {...props()} />);
    expect(html).toMatch(/<div data-news-globe="true" aria-hidden="true"><\/div>/);
  });
});

describe("le notizie: il giro", () => {
  it("chiede le notizie a /api/notizie, e la targa conta le palline della categoria", async () => {
    const f = respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    expect(f).toHaveBeenCalledWith("/api/notizie");
    expect(container.querySelectorAll("[data-news-globe] > span")).toHaveLength(4);
    expect(container.querySelector("[data-news-nameplate]")).toHaveTextContent("I.A. · 2 palline");
    await userEvent.click(categoryButton("Codice"));
    expect(container.querySelector("[data-news-nameplate]")).toHaveTextContent("Codice · 1 pallina");
  });

  it("un giro stampa la notizia sotto la testata della categoria, e annuncia solo testata e titolo", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    expect(container.querySelector("[data-sheet-head] b")).toHaveTextContent(it0.masthead);
    await userEvent.click(knob());
    const article = await screen.findByRole("article");
    expect(container.querySelector("[data-sheet-head] b")).toHaveTextContent("La Gazzetta dell'I.A.");
    expect(within(article).getByRole("heading", { level: 3 })).toHaveTextContent("Agents are here");
    expect(article).toHaveTextContent("Hacker News · ieri");
    expect(article).toHaveTextContent("in prima pagina");
    expect(article).toHaveTextContent(`${new Intl.NumberFormat("it").format(1234)} punti`);
    // L'articolo intero, riassunto e numeri compresi, non si legge da solo:
    // si annuncia la testata col titolo, e il resto lo si va a leggere.
    const live = container.querySelectorAll("[aria-live]");
    expect(live).toHaveLength(1);
    expect(live[0]).toHaveTextContent("La Gazzetta dell'I.A.: Agents are here");
    expect(live[0]).not.toContainElement(article);
    expect(article.closest("[aria-live]")).toBeNull();
    expect(container.querySelector('[data-news-globe] > [data-cat="ia"][data-gone]')).not.toBeNull();
    expect(container.querySelector("[data-news-nameplate]")).toHaveTextContent("I.A. · 1 pallina");
  });

  it("il link apre la fonte in un'altra scheda senza dire da dove si arriva; nessuna immagine", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    await userEvent.click(knob());
    const link = within(await screen.findByRole("article")).getByRole("link", { name: /Leggi su example\.com/ });
    expect(link).toHaveAttribute("href", "https://example.com/ia-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("il messaggio di stato c'e' sempre, vuoto: cosi' quando parla lo si sente", () => {
    respond();
    render(<NewsView {...props()} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("un tocco al centro della manopola gira, anche se il dito trema di due pixel", async () => {
    // Vicino al centro un pixel di tremito vale molti gradi: contati come
    // trascinamento, il clic che segue veniva buttato.
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    const m = knob();
    fireEvent.pointerDown(m, { clientX: 0, clientY: 0, pointerId: 1, button: 0 });
    fireEvent.pointerMove(m, { clientX: 2, clientY: 1, pointerId: 1 });
    fireEvent.pointerMove(m, { clientX: -1, clientY: 2, pointerId: 1 });
    fireEvent.pointerUp(m, { clientX: -1, clientY: 2, pointerId: 1 });
    fireEvent.click(m);
    expect(await screen.findByRole("article")).toHaveTextContent("Agents are here");
    expect(container.querySelector("[data-news-nameplate]")).toHaveTextContent("I.A. · 1 pallina");
  });

  it("senza riassunto il posto resta: il dominio in grande e una riga", async () => {
    respond({
      ...collection,
      categories: { ...collection.categories, ia: [story("https://example.com/s", "No summary", { summary: undefined })] },
    });
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    await userEvent.click(knob());
    const article = await screen.findByRole("article");
    expect(article.querySelector("[data-clipping-summary]")).toBeNull();
    const empty = article.querySelector("[data-clipping-body] [data-clipping-empty]");
    expect(empty).toHaveTextContent("example.com");
    expect(empty).toHaveTextContent(it0.noSummary);
  });

  it("la manopola gira anche da tastiera", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    knob().focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("article")).toHaveTextContent("Agents are here");
    await userEvent.keyboard(" ");
    await waitFor(() => expect(screen.getByRole("article")).toHaveTextContent("A second AI story"));
  });

  it("trascinata in tondo per un giro intero, esce una pallina; un pezzo di giro non basta", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    const m = knob();
    // Il centro della manopola, in jsdom, e' l'origine: si gira intorno a (0, 0).
    const point = (degrees: number) => ({
      clientX: Math.cos((degrees * Math.PI) / 180) * 30,
      clientY: Math.sin((degrees * Math.PI) / 180) * 30,
      pointerId: 1,
    });
    fireEvent.pointerDown(m, { ...point(0), button: 0 });
    for (let g = 30; g <= 180; g += 30) fireEvent.pointerMove(m, point(g));
    expect(screen.queryByRole("article")).toBeNull();
    for (let g = 210; g <= 390; g += 30) fireEvent.pointerMove(m, point(g));
    fireEvent.pointerUp(m, point(390));
    expect(await screen.findByRole("article")).toHaveTextContent("Agents are here");
  });

  it("una release dice che e' uscita, nella lingua della pagina", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    await userEvent.click(categoryButton("Codice"));
    await userEvent.click(knob());
    const article = await screen.findByRole("article");
    expect(container.querySelector("[data-sheet-head] b")).toHaveTextContent("Il Corriere del Codice");
    expect(within(article).getByRole("heading", { level: 3 })).toHaveTextContent("Next.js 15.5.0 è uscito");
    expect(article).toHaveTextContent("GitHub · vercel/next.js");
    expect(article).toHaveTextContent("nuova versione");
  });

  it("«Gia' uscite» mette in fila i titoli, l'ultima in cima, e cliccarne uno la riporta sulla pagina", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    const drawn = () => container.querySelector("[data-sheet-drawn]") as HTMLElement;
    expect(drawn()).toHaveTextContent(it0.noneDrawn);
    await userEvent.click(knob());
    await screen.findByRole("article");
    // Una sola e' gia' sulla pagina: la fila comincia dalla seconda.
    expect(drawn()).toHaveTextContent(it0.noneDrawn);
    await userEvent.click(knob());
    await waitFor(() => expect(screen.getByRole("article")).toHaveTextContent("A second AI story"));
    const items = within(drawn()).getAllByRole("button");
    expect(items.map((b) => b.textContent)).toEqual(["A second AI story", "Agents are here"]);
    expect(items.map((b) => b.getAttribute("aria-current"))).toEqual(["true", null]);
    await userEvent.click(items[1]);
    expect(within(screen.getByRole("article")).getByRole("heading", { level: 3 })).toHaveTextContent("Agents are here");
    expect(items[1]).toHaveAttribute("aria-current", "true");
    expect(items[0]).not.toHaveAttribute("aria-current");
  });

  it("finita una categoria lo dice al posto della notizia, e le gia' uscite restano", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    await userEvent.click(knob());
    await userEvent.click(categoryButton("Design"));
    await userEvent.click(knob());
    expect(await screen.findByRole("article")).toHaveTextContent("Fonts again");
    await userEvent.click(knob());
    const exhausted = "Le notizie Design di oggi sono finite: prova un altro pulsante, o torna domani.";
    expect(screen.getByRole("status")).toHaveTextContent(exhausted);
    // Il pannello sta nella stessa scatola della notizia.
    const box = container.querySelector("[data-sheet-story]") as HTMLElement;
    expect(box).toContainElement(screen.getByRole("status"));
    expect(screen.queryByRole("article")).toBeNull();
    const items = within(container.querySelector("[data-sheet-drawn]") as HTMLElement).getAllByRole("button");
    expect(items.map((b) => b.getAttribute("aria-label"))).toEqual(["Design: Fonts again", "I.A.: Agents are here"]);
    // Si torna a una notizia gia' uscita, e l'avviso tace.
    await userEvent.click(items[1]);
    expect(screen.getByRole("article")).toHaveTextContent("Agents are here");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("dice a che ora sono state raccolte, oggi", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    const time = new Intl.DateTimeFormat("it", { hour: "numeric", minute: "2-digit" }).format(
      new Date(collection.collectedAt),
    );
    expect(container.querySelector("[data-news-collected]")).toHaveTextContent(
      `Notizie raccolte alle ${time} di oggi: domani sono altre.`,
    );
  });
});

describe("le notizie: quando non arrivano", () => {
  it("lo dice, e il giro dopo riprova", async () => {
    const f = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response);
    vi.stubGlobal("fetch", f);
    const { container } = render(<NewsView {...props()} />);
    expect(await screen.findByRole("status")).toHaveTextContent(it0.error);
    f.mockImplementation(async () => ({ ok: true, json: async () => collection }) as Response);
    await userEvent.click(knob());
    await ready(container);
    expect(f).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(container).toHaveTextContent(it0.empty);
  });

  it("tre categorie vuote valgono come notizie non arrivate", async () => {
    respond({ collectedAt: collection.collectedAt, categories: { ia: [], design: [], codice: [] } });
    render(<NewsView {...props()} />);
    expect(await screen.findByRole("status")).toHaveTextContent(it0.error);
  });
});

describe("le notizie in inglese", () => {
  it("la cornice e' in inglese, le notizie restano come sono", async () => {
    respond();
    const en = buildCopy("en");
    const { container } = render(<NewsView {...props("en")} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(en_.notizie.title);
    const group = screen.getByRole("group", { name: en.group });
    expect(within(group).getAllByRole("button").map((b) => b.textContent)).toEqual(["A.I.", "Design", "Code"]);
    await ready(container);
    expect(container.querySelector("[data-news-nameplate]")).toHaveTextContent("A.I. · 2 balls");
    await userEvent.click(screen.getByRole("button", { name: en.knob }));
    const article = await screen.findByRole("article");
    expect(container.querySelector("[data-sheet-head] b")).toHaveTextContent("The A.I. Gazette");
    expect(article).toHaveTextContent("Hacker News · yesterday");
    expect(article).toHaveTextContent("front page");
    expect(within(article).getByRole("link", { name: /Read on example\.com/ })).toBeInTheDocument();
  });
});

const clippingRules = rules(/\[data-news-clipping\]/);
const sheetRules = rules(/\[data-news-sheet\]/);
/** Il corpo della regola col selettore, fuori o dentro una media query (la prima che c'e'). */
const ruleBody = (selector: string, where?: Options) => rules(selector, where)[0]?.body ?? "";
const phone: Options = { media: "(max-width: 959px)" };

describe("i colori delle notizie", () => {
  it("il foglio e il ritaglio sono carta nei due temi: dentro mai i colori che seguono il tema", () => {
    expect(clippingRules.length).toBeGreaterThan(10);
    expect(sheetRules.length).toBeGreaterThan(8);
    const forbidden = /var\(--(fg|bg|fg-muted|line|accent-text|theme-green)\)/;
    expect(clippingRules.filter((r) => forbidden.test(r.body)).map((r) => r.selector)).toEqual([]);
    expect(sheetRules.filter((r) => forbidden.test(r.body)).map((r) => r.selector)).toEqual([]);
    const sheet = sheetRules.find((r) => r.selector === "[data-news-sheet]")?.body ?? "";
    expect(sheet).toMatch(/--sheet-paper:\s*var\(--paper\)/);
    expect(sheet).toMatch(/background:\s*var\(--sheet-paper\)/);
    const root = clippingRules.find((r) => r.selector === "[data-news-clipping]")?.body ?? "";
    expect(root).toMatch(/--sheet-paper:\s*var\(--paper\)/);
    expect(root).toMatch(/--sheet-ink:\s*var\(--ink\)/);
    expect(root).toMatch(/--sheet-orange:\s*var\(--accent-on-paper\)/);
  });

  it("le categorie sono fisse: il verde e' quello di carta, e nessun tema le ridefinisce", () => {
    const values = (prop: string) => rules().map((r) => r.declarations[prop]);
    expect(values("--news-codice")).toContain("#2F6F4E");
    expect(values("--on-news-ia")).toContain("var(--ink)");
    expect(values("--on-news-design")).toContain("var(--ink)");
    expect(values("--on-news-codice")).toContain("var(--paper)");
    const dark = rules(/\[data-theme="dark"\]/).map((r) => r.body).join("");
    expect(dark).not.toMatch(/--(on-)?news-/);
  });

  it("l'anello di fuoco dei pulsanti e della manopola e' il testo della categoria, non l'arancio", () => {
    const focus = rules("[data-news-buttons] button:focus-visible").find((r) =>
      r.selectors.includes("[data-news-knob]:focus-visible"),
    )?.body;
    expect(focus).toMatch(/outline:\s*3px solid var\(--on-theme\)/);
  });

  it("il giallo ha sempre il contorno d'inchiostro: palline, pulsante e corpo", () => {
    for (const selector of [
      '[data-news-globe] > [data-cat="design"]',
      '[data-news-buttons] [data-cat="design"] i',
      '[data-news-machine][data-cat="design"] [data-news-body]',
    ]) {
      expect(ruleBody(selector), selector).toMatch(/inset 0 0 0 [\d.]+px var\(--ink\)/);
    }
  });

  it("la rotella non si intercetta: la pagina scorre anche sopra la macchina", () => {
    const source = readFileSync("src/components/sections/News/NewsStand.tsx", "utf8");
    expect(source).not.toMatch(/onWheel|"wheel"/);
  });
});

/**
 * In jsdom l'impaginazione non si misura: si leggono le regole che la tengono
 * ferma. Le altezze misurate nel browser stanno nel prototipo e nel suo README.
 */
describe("il foglio non cambia misura da una notizia all'altra", () => {
  it("sul desktop il foglio ha un'altezza fissa, e la notizia la riempie", () => {
    expect(ruleBody("[data-news-sheet]")).toMatch(/(^|[^-])height:\s*\d+(\.\d+)?rem/);
    expect(ruleBody("[data-sheet-story]")).toMatch(/min-height:\s*0/);
    expect(ruleBody("[data-news-sheet] [data-news-clipping]")).toMatch(/height:\s*100%/);
  });

  it("titolo a tre righe, riassunto a un numero fisso di righe, il resto si taglia", () => {
    const title = ruleBody("[data-news-sheet] [data-news-clipping] h3");
    expect(title).toMatch(/-webkit-line-clamp:\s*3/);
    expect(title).toMatch(/overflow:\s*hidden/);
    const summary = ruleBody("[data-news-clipping] [data-clipping-summary]");
    expect(summary).toMatch(/-webkit-line-clamp:\s*\d+/);
    expect(summary).toMatch(/overflow:\s*hidden/);
    expect(ruleBody("[data-news-clipping] [data-clipping-body]")).toMatch(/overflow:\s*hidden/);
  });

  it("la fila delle gia' uscite scorre dentro, e ogni titolo sta in due righe", () => {
    expect(ruleBody("[data-sheet-drawn]")).toMatch(/overflow-y:\s*auto/);
    expect(ruleBody("[data-sheet-drawn] button span")).toMatch(/-webkit-line-clamp:\s*2/);
  });

  it("sul telefono la notizia e la fila hanno misure fisse, e la testata non va a capo", () => {
    expect(rules(undefined, phone).length, "la media del telefono non ha regole").toBeGreaterThan(0);
    expect(ruleBody("[data-sheet-story]", phone)).toMatch(/(^|[^-])height:\s*\d+(\.\d+)?rem/);
    expect(ruleBody("[data-sheet-drawn]", phone)).toMatch(/(^|[^-])height:\s*\d+(\.\d+)?rem/);
    expect(ruleBody("[data-sheet-head]", phone)).toMatch(/flex-direction:\s*column/);
    expect(ruleBody("[data-sheet-head] b")).toMatch(/white-space:\s*nowrap/);
  });

  it("i pallini gia' usciti non ci sono piu': c'e' la colonna coi titoli", async () => {
    respond();
    const { container } = render(<NewsView {...props()} />);
    await ready(container);
    expect(container.querySelector("[data-news-bundle]")).toBeNull();
    expect(container.querySelector("[data-sheet-column]")).toHaveTextContent(it0.alreadyDrawn);
  });
});
