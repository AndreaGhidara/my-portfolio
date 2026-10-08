import { describe, it, expect } from "vitest";
import {
  SOURCES,
  collectNews,
  composeCategories,
  parseSource,
  sourceUrl,
  sourceUrls,
  truncate,
  type Fetcher,
  type SourceSpec,
} from "../collector";
import type { Story } from "../types";

/* Le risposte finte hanno la forma di quelle vere (Algolia, Hugging Face, DEV,
   GitHub), ridotta ai campi che la raccolta legge. Nessuna rete in queste prove. */
const hit = (n: number, extra: Record<string, unknown> = {}) => ({
  objectID: String(n),
  title: `Story ${n}`,
  url: `https://www.example${n}.com/a`,
  created_at: "2026-09-27T10:00:00.000Z",
  points: 100 + n,
  num_comments: n,
  ...extra,
});

const HN: SourceSpec = { kind: "hn", words: ["LLM", "Claude"], weeks: 1, points: 60 };
const HF: SourceSpec = { kind: "hf" };
const DEV: SourceSpec = { kind: "dev", tag: "ai", count: 6 };
const RELEASES: SourceSpec = {
  kind: "releases",
  repos: [
    { repo: "vercel/next.js", name: "Next.js" },
    { repo: "facebook/react", name: "React" },
    { repo: "microsoft/TypeScript", name: "TypeScript" },
  ],
  days: 14,
  limit: 2,
};
const NOW = new Date("2026-09-28T10:30:00Z");

const release = (tag: string, published_at: string, body = "") => ({
  tag_name: tag,
  html_url: `https://github.com/x/y/releases/tag/${tag}`,
  published_at,
  body,
});

const story = (url: string, title = url): Story => ({
  id: url,
  title,
  url,
  hostname: new URL(url).hostname,
  when: "2026-09-27T10:00:00.000Z",
  source: { id: "hn" },
  stamp: "prima-pagina",
  figures: [],
});

describe("le fonti, lette una per una", () => {
  it("Hacker News: link, dominio senza www, punti e commenti; senza link porta alla discussione", () => {
    const [a, b] = parseSource(HN, { hits: [hit(1), hit(2, { url: null })] });
    expect(a).toMatchObject({
      title: "Story 1",
      url: "https://www.example1.com/a",
      hostname: "example1.com",
      source: { id: "hn" },
      stamp: "prima-pagina",
      when: "2026-09-27T10:00:00.000Z",
      figures: [
        { code: "punti", value: 101 },
        { code: "commenti", value: 1 },
      ],
    });
    expect(b.url).toBe("https://news.ycombinator.com/item?id=2");
    expect(b.hostname).toBe("news.ycombinator.com");
  });

  it("Hacker News: al massimo sette per ricerca", () => {
    const hits = Array.from({ length: 20 }, (_, i) => hit(i));
    expect(parseSource(HN, { hits })).toHaveLength(7);
  });

  it("Hugging Face: il paper, il riassunto tagliato, i voti e gli autori", () => {
    const long = "parola ".repeat(200);
    const [p] = parseSource(HF, [
      {
        title: "A paper",
        publishedAt: "2026-09-26T08:00:00.000Z",
        summary: long,
        paper: { id: "2609.12345", upvotes: 42, authors: [{}, {}, {}] },
      },
    ]);
    expect(p.url).toBe("https://huggingface.co/papers/2609.12345");
    expect(p.stamp).toBe("paper");
    expect(p.summary!.length).toBeLessThanOrEqual(381);
    expect(p.summary!.endsWith("…")).toBe(true);
    expect(p.figures).toEqual([
      { code: "voti", value: 42 },
      { code: "autori", value: 3 },
    ]);
  });

  it("DEV: il tag, le reazioni, i minuti di lettura, e nessuna immagine", () => {
    const [d] = parseSource(DEV, [
      {
        title: "An article",
        url: "https://dev.to/x/an-article",
        published_at: "2026-09-25T08:00:00.000Z",
        description: "  Two   lines\n of text ",
        cover_image: "https://media.dev.to/cover.png",
        positive_reactions_count: 12,
        reading_time_minutes: 4,
      },
    ]);
    expect(d.source).toEqual({ id: "dev", tag: "ai" });
    expect(d.stamp).toBe("piu-letto");
    expect(d.summary).toBe("Two lines of text");
    expect(d.figures).toEqual([
      { code: "reazioni", value: 12 },
      { code: "lettura", value: 4 },
    ]);
    expect(JSON.stringify(d)).not.toMatch(/cover|immagine|media\.dev\.to/);
  });

  it("GitHub: il nome del progetto con la versione, e le note senza markdown ne' indirizzi", () => {
    const [r] = parseSource(
      RELEASES,
      [
        release(
          "v15.5.0",
          "2026-09-20T08:00:00.000Z",
          "## Core\n* **fix** something (https://github.com/x/y/pull/1) `code` <!-- nota -->",
        ),
      ],
      NOW,
    );
    expect(r.title).toBe("Next.js 15.5.0");
    expect(r.source).toEqual({ id: "github", repo: "vercel/next.js" });
    expect(r.stamp).toBe("release");
    expect(r.figures).toEqual([{ code: "versione", value: "v15.5.0" }]);
    expect(r.summary).toBe("Core fix something code");
  });

  it("una risposta con una forma inattesa non rompe niente: esce vuota", () => {
    expect(parseSource(HN, { nope: true })).toEqual([]);
    expect(parseSource(HF, null)).toEqual([]);
    expect(parseSource(DEV, "testo")).toEqual([]);
    expect(parseSource(RELEASES, {}, NOW)).toEqual([]);
    expect(parseSource(RELEASES, [null, {}, "x"], NOW)).toEqual([]);
  });

  it("GitHub: i progetti sono una fonte sola, dalla release piu' nuova, al massimo due e solo delle ultime due settimane", () => {
    // Quattro release di fila aprivano la categoria, e due avevano 39 e 74 giorni.
    const parsed = parseSource(
      RELEASES,
      [
        release("v16.0.0", "2026-09-20T08:00:00Z"),
        release("v19.1.0", "2026-09-26T08:00:00Z"),
        release("v6.0.0", "2026-08-20T08:00:00Z"),
      ],
      NOW,
    );
    expect(parsed.map((n) => n.title)).toEqual(["React 19.1.0", "Next.js 16.0.0"]);
    const three = parseSource(
      RELEASES,
      [
        release("v16.0.0", "2026-09-20T08:00:00Z"),
        release("v19.1.0", "2026-09-26T08:00:00Z"),
        release("v6.0.0", "2026-09-27T08:00:00Z"),
      ],
      NOW,
    );
    expect(three.map((n) => n.title)).toEqual(["TypeScript 6.0.0", "React 19.1.0"]);
  });
});

describe("i filtri", () => {
  it("fuori le notizie di guerra, politica e cronaca", () => {
    const parsed = parseSource(HN, {
      hits: [hit(1, { title: "Missile strike in Gaza" }), hit(2, { title: "Trump signs AI order" }), hit(3)],
    });
    expect(parsed.map((n) => n.title)).toEqual(["Story 3"]);
  });

  it("fuori i modelli e i titoli spinti, anche nel riassunto", () => {
    const parsed = parseSource(DEV, [
      { title: "Uncensored Llama finetune", url: "https://dev.to/a", published_at: "2026-09-25T08:00:00Z" },
      { title: "A model", description: "an nsfw generator", url: "https://dev.to/b", published_at: "2026-09-25T08:00:00Z" },
      { title: "Fine", url: "https://dev.to/c", published_at: "2026-09-25T08:00:00Z" },
    ]);
    expect(parsed.map((n) => n.title)).toEqual(["Fine"]);
  });

  it("solo indirizzi http e https", () => {
    const parsed = parseSource(DEV, [
      { title: "A", url: "javascript:alert(1)", published_at: "2026-09-25T08:00:00Z" },
      { title: "B", url: "data:text/html,x", published_at: "2026-09-25T08:00:00Z" },
      { title: "C", url: "not a url", published_at: "2026-09-25T08:00:00Z" },
      { title: "D", url: "http://example.com/d", published_at: "2026-09-25T08:00:00Z" },
    ]);
    expect(parsed.map((n) => n.title)).toEqual(["D"]);
  });

  it("senza titolo o senza data la notizia non entra", () => {
    const parsed = parseSource(DEV, [
      { title: "  ", url: "https://dev.to/a", published_at: "2026-09-25T08:00:00Z" },
      { title: "B", url: "https://dev.to/b", published_at: "ieri" },
    ]);
    expect(parsed).toEqual([]);
  });
});

describe("taglia", () => {
  it("toglie gli spazi doppi e taglia sull'ultima parola intera", () => {
    expect(truncate("  uno   due\n tre ", 100)).toBe("uno due tre");
    expect(truncate("uno due tre quattro", 9)).toBe("uno due…");
  });
});

describe("componi: le tre categorie", () => {
  it("alterna le fonti: una per fonte, finche' ce n'e'", () => {
    const a = ["https://a.com/1", "https://a.com/2", "https://a.com/3"].map((u) => story(u));
    const b = ["https://b.com/1"].map((u) => story(u));
    const c = ["https://c.com/1", "https://c.com/2"].map((u) => story(u));
    const { ia } = composeCategories({ ia: [a, b, c], design: [], codice: [] });
    expect(ia.map((n) => n.url)).toEqual([
      "https://a.com/1",
      "https://b.com/1",
      "https://c.com/1",
      "https://a.com/2",
      "https://c.com/2",
      "https://a.com/3",
    ]);
  });

  it("al massimo otto per categoria", () => {
    const many = Array.from({ length: 20 }, (_, i) => story(`https://x.com/${i}`));
    expect(composeCategories({ ia: [many], design: [], codice: [] }).ia).toHaveLength(8);
  });

  it("niente doppioni nella stessa categoria: stesso indirizzo o stesso titolo", () => {
    const { design } = composeCategories({
      ia: [],
      design: [
        [story("https://a.com/1", "Same title")],
        [story("https://a.com/1", "Other"), story("https://b.com/2", "same  TITLE")],
      ],
      codice: [],
    });
    expect(design.map((n) => n.url)).toEqual(["https://a.com/1"]);
  });

  it("una notizia sta nella prima categoria che l'ha trovata", () => {
    const duplicate = story("https://dev.to/react-and-ai", "React and AI");
    const { ia, design, codice } = composeCategories({
      ia: [[duplicate]],
      design: [[story("https://d.com/1")]],
      codice: [[{ ...duplicate, source: { id: "dev", tag: "react" } }, story("https://c.com/1")]],
    });
    expect(ia.map((n) => n.url)).toEqual(["https://dev.to/react-and-ai"]);
    expect(design).toHaveLength(1);
    expect(codice.map((n) => n.url)).toEqual(["https://c.com/1"]);
  });
});

describe("gli indirizzi delle fonti", () => {
  it("Hacker News: la finestra parte dalla mezzanotte UTC, cosi' l'indirizzo cambia una volta al giorno", () => {
    // L'indirizzo e' la chiave della cache: fermato all'ora faceva tre chiavi
    // nuove ogni ora, per sempre, nella cache su disco.
    const u1 = sourceUrl(HN, new Date("2026-09-28T00:00:00Z"));
    const u2 = sourceUrl(HN, new Date("2026-09-28T23:59:59Z"));
    const u3 = sourceUrl(HN, new Date("2026-09-29T00:00:01Z"));
    expect(u1).toBe(u2);
    expect(u1).not.toBe(u3);
    const day = Date.UTC(2026, 8, 28) / 1000;
    expect(u1).toContain(`created_at_i%3E${day - 7 * 86400}`);
    expect(u1).toContain("points%3E60");
    // Algolia mette in AND le parole: date anche come facoltative, ne basta una.
    expect(u1).toContain(`query=${encodeURIComponent("LLM Claude")}&optionalWords=${encodeURIComponent("LLM Claude")}`);
  });

  it("DEV, Hugging Face e GitHub", () => {
    const now = new Date();
    expect(sourceUrl(DEV, now)).toBe("https://dev.to/api/articles?tag=ai&top=7&per_page=6");
    expect(sourceUrl(HF, now)).toBe("https://huggingface.co/api/daily_papers?limit=10");
    expect(sourceUrls(DEV, now)).toEqual([sourceUrl(DEV, now)]);
    expect(sourceUrls(RELEASES, now)).toEqual([
      "https://api.github.com/repos/vercel/next.js/releases/latest",
      "https://api.github.com/repos/facebook/react/releases/latest",
      "https://api.github.com/repos/microsoft/TypeScript/releases/latest",
    ]);
  });

  it("ogni categoria ha le sue fonti, come nel prototipo", () => {
    expect(SOURCES.ia.map((f) => f.kind)).toEqual(["hn", "hf", "dev"]);
    expect(SOURCES.design.map((f) => f.kind)).toEqual(["hn", "dev", "dev", "dev"]);
    expect(SOURCES.codice.map((f) => f.kind)).toEqual(["releases", "dev", "hn", "dev", "dev"]);
    const releases = SOURCES.codice[0];
    expect(releases.kind === "releases" && releases.repos.map((r) => r.repo)).toEqual([
      "vercel/next.js",
      "facebook/react",
      "microsoft/TypeScript",
      "tailwindlabs/tailwindcss",
    ]);
  });
});

describe("raccogli", () => {
  const now = NOW;

  /** Risponde a ogni indirizzo con la risposta finta della sua fonte. */
  const sources: Fetcher = async (url) => {
    const date = url.includes("dev.to") ? "Mon, 28 Sep 2026 09:40:00 GMT" : "Mon, 28 Sep 2026 10:10:00 GMT";
    if (url.includes("algolia")) return { body: { hits: [hit(Number(url.length))] }, date };
    if (url.includes("huggingface")) return { body: [], date };
    if (url.includes("github")) {
      return {
        body: { tag_name: "v1.0.0", html_url: url.replace("api.", ""), published_at: "2026-09-20T08:00:00Z" },
        date,
      };
    }
    const tag = new URL(url).searchParams.get("tag");
    return {
      body: [{ title: `On ${tag}`, url: `https://dev.to/${tag}`, published_at: "2026-09-25T08:00:00Z" }],
      date,
    };
  };

  it("mette insieme le tre categorie, e dice quando le fonti hanno risposto: la piu' vecchia", async () => {
    const r = await collectNews(sources, now);
    expect(r.collectedAt).toBe("2026-09-28T09:40:00.000Z");
    expect(r.categories.ia.length).toBeGreaterThan(0);
    expect(r.categories.design.length).toBeGreaterThan(0);
    expect(r.categories.codice.some((n) => n.stamp === "release")).toBe(true);
  });

  it("Codice alterna le fonti: una release, poi le altre; mai piu' di due release", async () => {
    const { codice } = (await collectNews(sources, now)).categories;
    expect(codice[0].stamp).toBe("release");
    expect(codice[1].stamp).not.toBe("release");
    expect(codice.filter((n) => n.stamp === "release")).toHaveLength(2);
  });

  it("se un progetto non risponde, le release degli altri arrivano lo stesso", async () => {
    const { codice } = (await collectNews(async (url) => {
      if (url.includes("facebook")) throw new Error("403");
      return sources(url);
    }, now)).categories;
    expect(codice.filter((n) => n.stamp === "release").map((n) => n.source)).not.toContainEqual({
      id: "github",
      repo: "facebook/react",
    });
    expect(codice.some((n) => n.stamp === "release")).toBe(true);
  });

  it("una fonte che cade non ferma le altre", async () => {
    const r = await collectNews(async (url) => {
      if (url.includes("dev.to")) throw new Error("429");
      return sources(url);
    }, now);
    expect(r.categories.ia.length).toBeGreaterThan(0);
    for (const c of Object.values(r.categories)) {
      expect(c.every((n) => n.source.id !== "dev")).toBe(true);
    }
  });

  it("se cadono tutte le categorie sono vuote, e l'ora e' quella della richiesta", async () => {
    const r = await collectNews(async () => {
      throw new Error("giu'");
    }, now);
    expect(r).toEqual({
      collectedAt: now.toISOString(),
      categories: { ia: [], design: [], codice: [] },
    });
  });
});
