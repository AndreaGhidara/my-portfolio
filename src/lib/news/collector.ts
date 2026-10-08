import { CATEGORIES, type CategoryId, type NewsCollection, type Story, type StoryFigure, type StorySource, type StoryStamp } from "./types";

/**
 * La raccolta delle notizie, senza rete: chi chiama le fonti e' la route
 * (/api/notizie), qui si decide cosa chiedere, come leggere quello che torna e
 * cosa tenere. Tutto quello che entra e' di terzi, quindi si legge come se
 * potesse avere qualunque forma, e una forma inattesa da' una lista vuota.
 */

export type SourceSpec =
  | { kind: "hn"; words: string[]; weeks: number; points: number }
  | { kind: "hf" }
  | { kind: "dev"; tag: string; count: number }
  /* Le ultime release di piu' progetti, come una fonte sola: prese una per
     una avrebbero aperto Codice con quattro release di fila, anche vecchie. */
  | { kind: "releases"; repos: { repo: string; name: string }[]; days: number; limit: number };

/** Le fonti del prototipo (docs/prototipi/2026-09-28-bancone-tre-pulsanti.html), pubbliche e senza chiave. */
export const SOURCES: Record<CategoryId, SourceSpec[]> = {
  ia: [
    { kind: "hn", words: ["LLM", "OpenAI", "Anthropic", "Claude", "Gemini", "agents"], weeks: 1, points: 60 },
    { kind: "hf" },
    { kind: "dev", tag: "ai", count: 6 },
  ],
  design: [
    { kind: "hn", words: ["design", "typography", "Figma", "UX", "CSS", "font"], weeks: 2, points: 25 },
    { kind: "dev", tag: "design", count: 6 },
    { kind: "dev", tag: "ux", count: 6 },
    { kind: "dev", tag: "css", count: 4 },
  ],
  codice: [
    {
      kind: "releases",
      repos: [
        { repo: "vercel/next.js", name: "Next.js" },
        { repo: "facebook/react", name: "React" },
        { repo: "microsoft/TypeScript", name: "TypeScript" },
        { repo: "tailwindlabs/tailwindcss", name: "Tailwind CSS" },
      ],
      // Le due settimane di Hacker News per Codice: sono le notizie della settimana.
      days: 14,
      limit: 2,
    },
    { kind: "dev", tag: "nextjs", count: 4 },
    { kind: "hn", words: ["React", "Next.js", "TypeScript", "Tailwind", "Vercel", "Node.js"], weeks: 2, points: 30 },
    { kind: "dev", tag: "react", count: 4 },
    { kind: "dev", tag: "typescript", count: 4 },
  ],
};

const PER_CATEGORY = 8;
const PER_HN_SEARCH = 7;
const MAX_PAPERS = 6;

/* Guerra, politica, cronaca: su Hacker News escono anche quelle, e con «AI» nel
   titolo. E i modelli spinti, che su Hugging Face e DEV non mancano. */
const OFF_TOPIC =
  /\b(pentagon|missile|war|military|iran|israel|gaza|ukraine|russia|trump|biden|election|police|killed|death|lawsuit|feds|congress|senate|weapon)\b/i;
const EXPLICIT = /uncensored|nsfw|abliterat|erotic|porn|lewd|nude/i;

/**
 * L'indirizzo di una fonte. La finestra di Hacker News parte dalla mezzanotte
 * UTC e non dal secondo: l'indirizzo e' la chiave della cache, e con i secondi
 * dentro ogni richiesta sarebbe una chiave nuova; con l'ora, tre chiavi nuove
 * ogni ora nella cache su disco. La freschezza la da' il revalidate di un'ora.
 *
 * Algolia non conosce OR: «LLM OR Claude» cerca anche la parola «or» e
 * trovava cinque storie in una settimana. Le parole date anche come
 * `optionalWords` bastano una alla volta, che e' l'OR voluto.
 */
export function sourceUrl(f: Exclude<SourceSpec, { kind: "releases" }>, now: Date): string {
  switch (f.kind) {
    case "hn": {
      const day = Math.floor(now.getTime() / 86_400_000) * 86400;
      const since = day - f.weeks * 7 * 86400;
      const words = encodeURIComponent(f.words.join(" "));
      return `https://hn.algolia.com/api/v1/search?query=${words}&optionalWords=${words}&tags=story&numericFilters=created_at_i%3E${since},points%3E${f.points}&hitsPerPage=20`;
    }
    case "hf":
      return "https://huggingface.co/api/daily_papers?limit=10";
    case "dev":
      return `https://dev.to/api/articles?tag=${f.tag}&top=7&per_page=${f.count}`;
  }
}

/** Gli indirizzi di una fonte: uno, o uno per progetto per le release. */
export function sourceUrls(f: SourceSpec, now: Date): string[] {
  if (f.kind === "releases") return f.repos.map((r) => `https://api.github.com/repos/${r.repo}/releases/latest`);
  return [sourceUrl(f, now)];
}

/** Spazi normalizzati, e tagliato sull'ultima parola intera che ci sta. */
export function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const space = t.lastIndexOf(" ", n);
  return t.slice(0, space > 0 ? space : n) + "…";
}

type Obj = Record<string, unknown>;
const asObject = (v: unknown): Obj | null =>
  typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Obj) : null;
const asText = (v: unknown): string => (typeof v === "string" ? v : "");
const asNumber = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function parseUrl(u: string): URL | null {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

type Draft = {
  title: string;
  url: string;
  when: string;
  summary?: string;
  figures: StoryFigure[];
};

/** Da una bozza a una notizia, o a niente se non passa i filtri. */
function toStory(b: Draft, source: StorySource, stamp: StoryStamp): Story | null {
  const title = truncate(b.title, 200);
  const url = parseUrl(b.url);
  const when = new Date(b.when);
  if (!title || !url || Number.isNaN(when.getTime())) return null;
  if (OFF_TOPIC.test(title) || EXPLICIT.test(title) || EXPLICIT.test(b.summary ?? "")) return null;
  const summary = b.summary ? b.summary : undefined;
  return {
    id: url.href,
    title,
    url: url.href,
    hostname: url.hostname.replace(/^www\./, ""),
    when: when.toISOString(),
    source,
    stamp,
    ...(summary ? { summary } : {}),
    figures: b.figures,
  };
}

const present = (l: (Story | null)[]): Story[] => l.filter((n): n is Story => n !== null);

/** Le note di rilascio sono markdown: restano le parole. */
function releaseNotes(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\S+/g, " ")
    .replace(/[#*`>[\]()_~|]/g, " ");
}

/**
 * Legge la risposta di una fonte. Per le release `corpo` e' la lista delle
 * risposte, una per progetto nell'ordine di `repos` (null per chi non ha
 * risposto), e `adesso` serve a lasciare fuori quelle vecchie.
 */
export function parseSource(f: SourceSpec, body: unknown, now: Date = new Date()): Story[] {
  switch (f.kind) {
    case "hn": {
      const hits = asObject(body)?.hits;
      if (!Array.isArray(hits)) return [];
      return present(
        hits.map((v) => {
          const h = asObject(v);
          if (!h) return null;
          const url = asText(h.url) || `https://news.ycombinator.com/item?id=${asText(h.objectID)}`;
          return toStory(
            {
              title: asText(h.title),
              url,
              when: asText(h.created_at),
              figures: [
                { code: "punti", value: asNumber(h.points) },
                { code: "commenti", value: asNumber(h.num_comments) },
              ],
            },
            { id: "hn" },
            "prima-pagina",
          );
        }),
      ).slice(0, PER_HN_SEARCH);
    }
    case "hf": {
      if (!Array.isArray(body)) return [];
      return present(
        body.slice(0, MAX_PAPERS).map((v) => {
          const p = asObject(v);
          const paper = asObject(p?.paper);
          if (!p || !paper || !asText(paper.id)) return null;
          const authors = paper.authors;
          return toStory(
            {
              title: asText(p.title) || asText(paper.title),
              url: `https://huggingface.co/papers/${encodeURIComponent(asText(paper.id))}`,
              when: asText(p.publishedAt) || asText(paper.publishedAt),
              summary: truncate(asText(p.summary) || asText(paper.summary), 380),
              figures: [
                { code: "voti", value: asNumber(paper.upvotes) },
                { code: "autori", value: Array.isArray(authors) ? authors.length : 0 },
              ],
            },
            { id: "hf" },
            "paper",
          );
        }),
      );
    }
    case "dev": {
      if (!Array.isArray(body)) return [];
      return present(
        body.map((v) => {
          const a = asObject(v);
          if (!a) return null;
          return toStory(
            {
              title: asText(a.title),
              url: asText(a.url),
              when: asText(a.published_at),
              summary: truncate(asText(a.description), 300),
              figures: [
                { code: "reazioni", value: asNumber(a.positive_reactions_count) },
                { code: "lettura", value: asNumber(a.reading_time_minutes) },
              ],
            },
            { id: "dev", tag: f.tag },
            "piu-letto",
          );
        }),
      );
    }
    case "releases": {
      if (!Array.isArray(body)) return [];
      const since = now.getTime() - f.days * 86_400_000;
      return present(
        f.repos.map(({ repo, name }, k) => {
          const r = asObject(body[k]);
          const version = asText(r?.tag_name);
          if (!r || !version) return null;
          return toStory(
            {
              title: `${name} ${version.replace(/^v/, "")}`,
              url: asText(r.html_url),
              when: asText(r.published_at),
              summary: truncate(releaseNotes(asText(r.body)), 320),
              figures: [{ code: "versione", value: version }],
            },
            { id: "github", repo },
            "release",
          );
        }),
      )
        .filter((n) => Date.parse(n.when) >= since)
        .sort((a, b) => Date.parse(b.when) - Date.parse(a.when))
        .slice(0, f.limit);
    }
  }
}

/** Una per fonte a turno, finche' ce n'e': nessuna fonte si prende la macchina. */
function interleave(lists: Story[][]): Story[] {
  const out: Story[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

const titleKey = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Le tre categorie dalle liste delle loro fonti. DEV rimanda lo stesso
 * articolo sotto tag diversi: una notizia sta in una categoria sola, la prima
 * che l'ha trovata, nell'ordine ia, design, codice.
 */
export function composeCategories(perCategory: Record<CategoryId, Story[][]>): Record<CategoryId, Story[]> {
  const url = new Set<string>();
  const titles = new Set<string>();
  const out = {} as Record<CategoryId, Story[]>;
  for (const c of CATEGORIES) {
    out[c] = [];
    for (const n of interleave(perCategory[c])) {
      if (out[c].length >= PER_CATEGORY) break;
      const t = titleKey(n.title);
      if (url.has(n.url) || titles.has(t)) continue;
      url.add(n.url);
      titles.add(t);
      out[c].push(n);
    }
  }
  return out;
}

/** Chi va in rete: restituisce il corpo JSON e l'intestazione Date della risposta. */
export type Fetcher = (url: string) => Promise<{ body: unknown; date: string | null }>;

/**
 * Chiede tutte le fonti insieme. Una fonte che cade (429 di DEV, 403 di GitHub,
 * tempo scaduto) resta fuori e non ferma le altre. `raccolteAlle` e' la Date
 * piu' vecchia fra le risposte arrivate: con la cache di un'ora per fonte e'
 * quella che dice da quanto le notizie sono ferme.
 */
export async function collectNews(fetcher: Fetcher, now: Date): Promise<NewsCollection> {
  const dates: number[] = [];
  const perCategory = {} as Record<CategoryId, Story[][]>;
  await Promise.all(
    CATEGORIES.map(async (c) => {
      const outcomes = await Promise.allSettled(
        SOURCES[c].map(async (f) => {
          const responses = await Promise.allSettled(sourceUrls(f, now).map((u) => fetcher(u)));
          if (responses.every((r) => r.status === "rejected")) throw new Error("source down");
          const bodies = responses.map((r) => {
            if (r.status === "rejected") return null;
            const t = r.value.date ? Date.parse(r.value.date) : NaN;
            if (!Number.isNaN(t)) dates.push(t);
            return r.value.body;
          });
          return parseSource(f, f.kind === "releases" ? bodies : bodies[0], now);
        }),
      );
      perCategory[c] = outcomes.map((e) => (e.status === "fulfilled" ? e.value : []));
    }),
  );
  return {
    collectedAt: new Date(dates.length ? Math.min(...dates) : now.getTime()).toISOString(),
    categories: composeCategories(perCategory),
  };
}
