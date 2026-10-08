import { describe, it, expect } from "vitest";
import {
  FONTI,
  componi,
  indirizzi,
  leggi,
  raccogli,
  taglia,
  urlDi,
  type Chiedi,
  type FonteSpec,
} from "../collector";
import type { Notizia } from "../types";

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

const HN: FonteSpec = { tipo: "hn", parole: ["LLM", "Claude"], settimane: 1, punti: 60 };
const HF: FonteSpec = { tipo: "hf" };
const DEV: FonteSpec = { tipo: "dev", tag: "ai", quante: 6 };
const RILASCI: FonteSpec = {
  tipo: "rilasci",
  repos: [
    { repo: "vercel/next.js", nome: "Next.js" },
    { repo: "facebook/react", nome: "React" },
    { repo: "microsoft/TypeScript", nome: "TypeScript" },
  ],
  giorni: 14,
  quante: 2,
};
const ADESSO = new Date("2026-09-28T10:30:00Z");

const release = (tag: string, published_at: string, body = "") => ({
  tag_name: tag,
  html_url: `https://github.com/x/y/releases/tag/${tag}`,
  published_at,
  body,
});

const notizia = (url: string, titolo = url): Notizia => ({
  id: url,
  titolo,
  url,
  hostname: new URL(url).hostname,
  quando: "2026-09-27T10:00:00.000Z",
  fonte: { id: "hn" },
  timbro: "prima-pagina",
  dati: [],
});

describe("le fonti, lette una per una", () => {
  it("Hacker News: link, dominio senza www, punti e commenti; senza link porta alla discussione", () => {
    const [a, b] = leggi(HN, { hits: [hit(1), hit(2, { url: null })] });
    expect(a).toMatchObject({
      titolo: "Story 1",
      url: "https://www.example1.com/a",
      hostname: "example1.com",
      fonte: { id: "hn" },
      timbro: "prima-pagina",
      quando: "2026-09-27T10:00:00.000Z",
      dati: [
        { codice: "punti", valore: 101 },
        { codice: "commenti", valore: 1 },
      ],
    });
    expect(b.url).toBe("https://news.ycombinator.com/item?id=2");
    expect(b.hostname).toBe("news.ycombinator.com");
  });

  it("Hacker News: al massimo sette per ricerca", () => {
    const hits = Array.from({ length: 20 }, (_, i) => hit(i));
    expect(leggi(HN, { hits })).toHaveLength(7);
  });

  it("Hugging Face: il paper, il riassunto tagliato, i voti e gli autori", () => {
    const lungo = "parola ".repeat(200);
    const [p] = leggi(HF, [
      {
        title: "A paper",
        publishedAt: "2026-09-26T08:00:00.000Z",
        summary: lungo,
        paper: { id: "2609.12345", upvotes: 42, authors: [{}, {}, {}] },
      },
    ]);
    expect(p.url).toBe("https://huggingface.co/papers/2609.12345");
    expect(p.timbro).toBe("paper");
    expect(p.riassunto!.length).toBeLessThanOrEqual(381);
    expect(p.riassunto!.endsWith("…")).toBe(true);
    expect(p.dati).toEqual([
      { codice: "voti", valore: 42 },
      { codice: "autori", valore: 3 },
    ]);
  });

  it("DEV: il tag, le reazioni, i minuti di lettura, e nessuna immagine", () => {
    const [d] = leggi(DEV, [
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
    expect(d.fonte).toEqual({ id: "dev", tag: "ai" });
    expect(d.timbro).toBe("piu-letto");
    expect(d.riassunto).toBe("Two lines of text");
    expect(d.dati).toEqual([
      { codice: "reazioni", valore: 12 },
      { codice: "lettura", valore: 4 },
    ]);
    expect(JSON.stringify(d)).not.toMatch(/cover|immagine|media\.dev\.to/);
  });

  it("GitHub: il nome del progetto con la versione, e le note senza markdown ne' indirizzi", () => {
    const [r] = leggi(
      RILASCI,
      [
        release(
          "v15.5.0",
          "2026-09-20T08:00:00.000Z",
          "## Core\n* **fix** something (https://github.com/x/y/pull/1) `code` <!-- nota -->",
        ),
      ],
      ADESSO,
    );
    expect(r.titolo).toBe("Next.js 15.5.0");
    expect(r.fonte).toEqual({ id: "github", repo: "vercel/next.js" });
    expect(r.timbro).toBe("release");
    expect(r.dati).toEqual([{ codice: "versione", valore: "v15.5.0" }]);
    expect(r.riassunto).toBe("Core fix something code");
  });

  it("una risposta con una forma inattesa non rompe niente: esce vuota", () => {
    expect(leggi(HN, { nope: true })).toEqual([]);
    expect(leggi(HF, null)).toEqual([]);
    expect(leggi(DEV, "testo")).toEqual([]);
    expect(leggi(RILASCI, {}, ADESSO)).toEqual([]);
    expect(leggi(RILASCI, [null, {}, "x"], ADESSO)).toEqual([]);
  });

  it("GitHub: i progetti sono una fonte sola, dalla release piu' nuova, al massimo due e solo delle ultime due settimane", () => {
    // Quattro release di fila aprivano la categoria, e due avevano 39 e 74 giorni.
    const lette = leggi(
      RILASCI,
      [
        release("v16.0.0", "2026-09-20T08:00:00Z"),
        release("v19.1.0", "2026-09-26T08:00:00Z"),
        release("v6.0.0", "2026-08-20T08:00:00Z"),
      ],
      ADESSO,
    );
    expect(lette.map((n) => n.titolo)).toEqual(["React 19.1.0", "Next.js 16.0.0"]);
    const tre = leggi(
      RILASCI,
      [
        release("v16.0.0", "2026-09-20T08:00:00Z"),
        release("v19.1.0", "2026-09-26T08:00:00Z"),
        release("v6.0.0", "2026-09-27T08:00:00Z"),
      ],
      ADESSO,
    );
    expect(tre.map((n) => n.titolo)).toEqual(["TypeScript 6.0.0", "React 19.1.0"]);
  });
});

describe("i filtri", () => {
  it("fuori le notizie di guerra, politica e cronaca", () => {
    const lette = leggi(HN, {
      hits: [hit(1, { title: "Missile strike in Gaza" }), hit(2, { title: "Trump signs AI order" }), hit(3)],
    });
    expect(lette.map((n) => n.titolo)).toEqual(["Story 3"]);
  });

  it("fuori i modelli e i titoli spinti, anche nel riassunto", () => {
    const lette = leggi(DEV, [
      { title: "Uncensored Llama finetune", url: "https://dev.to/a", published_at: "2026-09-25T08:00:00Z" },
      { title: "A model", description: "an nsfw generator", url: "https://dev.to/b", published_at: "2026-09-25T08:00:00Z" },
      { title: "Fine", url: "https://dev.to/c", published_at: "2026-09-25T08:00:00Z" },
    ]);
    expect(lette.map((n) => n.titolo)).toEqual(["Fine"]);
  });

  it("solo indirizzi http e https", () => {
    const lette = leggi(DEV, [
      { title: "A", url: "javascript:alert(1)", published_at: "2026-09-25T08:00:00Z" },
      { title: "B", url: "data:text/html,x", published_at: "2026-09-25T08:00:00Z" },
      { title: "C", url: "not a url", published_at: "2026-09-25T08:00:00Z" },
      { title: "D", url: "http://example.com/d", published_at: "2026-09-25T08:00:00Z" },
    ]);
    expect(lette.map((n) => n.titolo)).toEqual(["D"]);
  });

  it("senza titolo o senza data la notizia non entra", () => {
    const lette = leggi(DEV, [
      { title: "  ", url: "https://dev.to/a", published_at: "2026-09-25T08:00:00Z" },
      { title: "B", url: "https://dev.to/b", published_at: "ieri" },
    ]);
    expect(lette).toEqual([]);
  });
});

describe("taglia", () => {
  it("toglie gli spazi doppi e taglia sull'ultima parola intera", () => {
    expect(taglia("  uno   due\n tre ", 100)).toBe("uno due tre");
    expect(taglia("uno due tre quattro", 9)).toBe("uno due…");
  });
});

describe("componi: le tre categorie", () => {
  it("alterna le fonti: una per fonte, finche' ce n'e'", () => {
    const a = ["https://a.com/1", "https://a.com/2", "https://a.com/3"].map((u) => notizia(u));
    const b = ["https://b.com/1"].map((u) => notizia(u));
    const c = ["https://c.com/1", "https://c.com/2"].map((u) => notizia(u));
    const { ia } = componi({ ia: [a, b, c], design: [], codice: [] });
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
    const tante = Array.from({ length: 20 }, (_, i) => notizia(`https://x.com/${i}`));
    expect(componi({ ia: [tante], design: [], codice: [] }).ia).toHaveLength(8);
  });

  it("niente doppioni nella stessa categoria: stesso indirizzo o stesso titolo", () => {
    const { design } = componi({
      ia: [],
      design: [
        [notizia("https://a.com/1", "Same title")],
        [notizia("https://a.com/1", "Other"), notizia("https://b.com/2", "same  TITLE")],
      ],
      codice: [],
    });
    expect(design.map((n) => n.url)).toEqual(["https://a.com/1"]);
  });

  it("una notizia sta nella prima categoria che l'ha trovata", () => {
    const doppia = notizia("https://dev.to/react-and-ai", "React and AI");
    const { ia, design, codice } = componi({
      ia: [[doppia]],
      design: [[notizia("https://d.com/1")]],
      codice: [[{ ...doppia, fonte: { id: "dev", tag: "react" } }, notizia("https://c.com/1")]],
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
    const u1 = urlDi(HN, new Date("2026-09-28T00:00:00Z"));
    const u2 = urlDi(HN, new Date("2026-09-28T23:59:59Z"));
    const u3 = urlDi(HN, new Date("2026-09-29T00:00:01Z"));
    expect(u1).toBe(u2);
    expect(u1).not.toBe(u3);
    const giorno = Date.UTC(2026, 8, 28) / 1000;
    expect(u1).toContain(`created_at_i%3E${giorno - 7 * 86400}`);
    expect(u1).toContain("points%3E60");
    // Algolia mette in AND le parole: date anche come facoltative, ne basta una.
    expect(u1).toContain(`query=${encodeURIComponent("LLM Claude")}&optionalWords=${encodeURIComponent("LLM Claude")}`);
  });

  it("DEV, Hugging Face e GitHub", () => {
    const adesso = new Date();
    expect(urlDi(DEV, adesso)).toBe("https://dev.to/api/articles?tag=ai&top=7&per_page=6");
    expect(urlDi(HF, adesso)).toBe("https://huggingface.co/api/daily_papers?limit=10");
    expect(indirizzi(DEV, adesso)).toEqual([urlDi(DEV, adesso)]);
    expect(indirizzi(RILASCI, adesso)).toEqual([
      "https://api.github.com/repos/vercel/next.js/releases/latest",
      "https://api.github.com/repos/facebook/react/releases/latest",
      "https://api.github.com/repos/microsoft/TypeScript/releases/latest",
    ]);
  });

  it("ogni categoria ha le sue fonti, come nel prototipo", () => {
    expect(FONTI.ia.map((f) => f.tipo)).toEqual(["hn", "hf", "dev"]);
    expect(FONTI.design.map((f) => f.tipo)).toEqual(["hn", "dev", "dev", "dev"]);
    expect(FONTI.codice.map((f) => f.tipo)).toEqual(["rilasci", "dev", "hn", "dev", "dev"]);
    const rilasci = FONTI.codice[0];
    expect(rilasci.tipo === "rilasci" && rilasci.repos.map((r) => r.repo)).toEqual([
      "vercel/next.js",
      "facebook/react",
      "microsoft/TypeScript",
      "tailwindlabs/tailwindcss",
    ]);
  });
});

describe("raccogli", () => {
  const adesso = ADESSO;

  /** Risponde a ogni indirizzo con la risposta finta della sua fonte. */
  const fonti: Chiedi = async (url) => {
    const data = url.includes("dev.to") ? "Mon, 28 Sep 2026 09:40:00 GMT" : "Mon, 28 Sep 2026 10:10:00 GMT";
    if (url.includes("algolia")) return { corpo: { hits: [hit(Number(url.length))] }, data };
    if (url.includes("huggingface")) return { corpo: [], data };
    if (url.includes("github")) {
      return {
        corpo: { tag_name: "v1.0.0", html_url: url.replace("api.", ""), published_at: "2026-09-20T08:00:00Z" },
        data,
      };
    }
    const tag = new URL(url).searchParams.get("tag");
    return {
      corpo: [{ title: `On ${tag}`, url: `https://dev.to/${tag}`, published_at: "2026-09-25T08:00:00Z" }],
      data,
    };
  };

  it("mette insieme le tre categorie, e dice quando le fonti hanno risposto: la piu' vecchia", async () => {
    const r = await raccogli(fonti, adesso);
    expect(r.raccolteAlle).toBe("2026-09-28T09:40:00.000Z");
    expect(r.categorie.ia.length).toBeGreaterThan(0);
    expect(r.categorie.design.length).toBeGreaterThan(0);
    expect(r.categorie.codice.some((n) => n.timbro === "release")).toBe(true);
  });

  it("Codice alterna le fonti: una release, poi le altre; mai piu' di due release", async () => {
    const { codice } = (await raccogli(fonti, adesso)).categorie;
    expect(codice[0].timbro).toBe("release");
    expect(codice[1].timbro).not.toBe("release");
    expect(codice.filter((n) => n.timbro === "release")).toHaveLength(2);
  });

  it("se un progetto non risponde, le release degli altri arrivano lo stesso", async () => {
    const { codice } = (await raccogli(async (url) => {
      if (url.includes("facebook")) throw new Error("403");
      return fonti(url);
    }, adesso)).categorie;
    expect(codice.filter((n) => n.timbro === "release").map((n) => n.fonte)).not.toContainEqual({
      id: "github",
      repo: "facebook/react",
    });
    expect(codice.some((n) => n.timbro === "release")).toBe(true);
  });

  it("una fonte che cade non ferma le altre", async () => {
    const r = await raccogli(async (url) => {
      if (url.includes("dev.to")) throw new Error("429");
      return fonti(url);
    }, adesso);
    expect(r.categorie.ia.length).toBeGreaterThan(0);
    for (const c of Object.values(r.categorie)) {
      expect(c.every((n) => n.fonte.id !== "dev")).toBe(true);
    }
  });

  it("se cadono tutte le categorie sono vuote, e l'ora e' quella della richiesta", async () => {
    const r = await raccogli(async () => {
      throw new Error("giu'");
    }, adesso);
    expect(r).toEqual({
      raccolteAlle: adesso.toISOString(),
      categorie: { ia: [], design: [], codice: [] },
    });
  });
});
