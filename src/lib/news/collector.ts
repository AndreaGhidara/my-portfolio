import { CATEGORIES, type CategoryId, type StoryFigure, type StorySource, type Story, type NewsCollection, type StoryStamp } from "./types";

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
  | { kind: "rilasci"; repos: { repo: string; name: string }[]; days: number; quante: number };

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
      kind: "rilasci",
      repos: [
        { repo: "vercel/next.js", name: "Next.js" },
        { repo: "facebook/react", name: "React" },
        { repo: "microsoft/TypeScript", name: "TypeScript" },
        { repo: "tailwindlabs/tailwindcss", name: "Tailwind CSS" },
      ],
      // Le due settimane di Hacker News per Codice: sono le notizie della settimana.
      days: 14,
      quante: 2,
    },
    { kind: "dev", tag: "nextjs", count: 4 },
    { kind: "hn", words: ["React", "Next.js", "TypeScript", "Tailwind", "Vercel", "Node.js"], weeks: 2, points: 30 },
    { kind: "dev", tag: "react", count: 4 },
    { kind: "dev", tag: "typescript", count: 4 },
  ],
};

const PER_CATEGORIA = 8;
const PER_RICERCA_HN = 7;
const PAPER = 6;

/* Guerra, politica, cronaca: su Hacker News escono anche quelle, e con «AI» nel
   titolo. E i modelli spinti, che su Hugging Face e DEV non mancano. */
const FUORI =
  /\b(pentagon|missile|war|military|iran|israel|gaza|ukraine|russia|trump|biden|election|police|killed|death|lawsuit|feds|congress|senate|weapon)\b/i;
const SPINTO = /uncensored|nsfw|abliterat|erotic|porn|lewd|nude/i;

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
export function sourceUrl(f: Exclude<SourceSpec, { kind: "rilasci" }>, adesso: Date): string {
  switch (f.kind) {
    case "hn": {
      const giorno = Math.floor(adesso.getTime() / 86_400_000) * 86400;
      const da = giorno - f.weeks * 7 * 86400;
      const parole = encodeURIComponent(f.words.join(" "));
      return `https://hn.algolia.com/api/v1/search?query=${parole}&optionalWords=${parole}&tags=story&numericFilters=created_at_i%3E${da},points%3E${f.points}&hitsPerPage=20`;
    }
    case "hf":
      return "https://huggingface.co/api/daily_papers?limit=10";
    case "dev":
      return `https://dev.to/api/articles?tag=${f.tag}&top=7&per_page=${f.count}`;
  }
}

/** Gli indirizzi di una fonte: uno, o uno per progetto per le release. */
export function sourceUrls(f: SourceSpec, adesso: Date): string[] {
  if (f.kind === "rilasci") return f.repos.map((r) => `https://api.github.com/repos/${r.repo}/releases/latest`);
  return [sourceUrl(f, adesso)];
}

/** Spazi normalizzati, e tagliato sull'ultima parola intera che ci sta. */
export function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const spazio = t.lastIndexOf(" ", n);
  return t.slice(0, spazio > 0 ? spazio : n) + "…";
}

type Oggetto = Record<string, unknown>;
const oggetto = (v: unknown): Oggetto | null =>
  typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Oggetto) : null;
const testo = (v: unknown): string => (typeof v === "string" ? v : "");
const numero = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

function indirizzo(u: string): URL | null {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

type Bozza = {
  titolo: string;
  url: string;
  quando: string;
  riassunto?: string;
  dati: StoryFigure[];
};

/** Da una bozza a una notizia, o a niente se non passa i filtri. */
function notizia(b: Bozza, fonte: StorySource, timbro: StoryStamp): Story | null {
  const titolo = truncate(b.titolo, 200);
  const url = indirizzo(b.url);
  const quando = new Date(b.quando);
  if (!titolo || !url || Number.isNaN(quando.getTime())) return null;
  if (FUORI.test(titolo) || SPINTO.test(titolo) || SPINTO.test(b.riassunto ?? "")) return null;
  const riassunto = b.riassunto ? b.riassunto : undefined;
  return {
    id: url.href,
    title: titolo,
    url: url.href,
    hostname: url.hostname.replace(/^www\./, ""),
    when: quando.toISOString(),
    source: fonte,
    stamp: timbro,
    ...(riassunto ? { summary: riassunto } : {}),
    figures: b.dati,
  };
}

const solo = (l: (Story | null)[]): Story[] => l.filter((n): n is Story => n !== null);

/** Le note di rilascio sono markdown: restano le parole. */
function note(md: string): string {
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
export function parseSource(f: SourceSpec, corpo: unknown, adesso: Date = new Date()): Story[] {
  switch (f.kind) {
    case "hn": {
      const hits = oggetto(corpo)?.hits;
      if (!Array.isArray(hits)) return [];
      return solo(
        hits.map((v) => {
          const h = oggetto(v);
          if (!h) return null;
          const url = testo(h.url) || `https://news.ycombinator.com/item?id=${testo(h.objectID)}`;
          return notizia(
            {
              titolo: testo(h.title),
              url,
              quando: testo(h.created_at),
              dati: [
                { code: "punti", value: numero(h.points) },
                { code: "commenti", value: numero(h.num_comments) },
              ],
            },
            { id: "hn" },
            "prima-pagina",
          );
        }),
      ).slice(0, PER_RICERCA_HN);
    }
    case "hf": {
      if (!Array.isArray(corpo)) return [];
      return solo(
        corpo.slice(0, PAPER).map((v) => {
          const p = oggetto(v);
          const paper = oggetto(p?.paper);
          if (!p || !paper || !testo(paper.id)) return null;
          const autori = paper.authors;
          return notizia(
            {
              titolo: testo(p.title) || testo(paper.title),
              url: `https://huggingface.co/papers/${encodeURIComponent(testo(paper.id))}`,
              quando: testo(p.publishedAt) || testo(paper.publishedAt),
              riassunto: truncate(testo(p.summary) || testo(paper.summary), 380),
              dati: [
                { code: "voti", value: numero(paper.upvotes) },
                { code: "autori", value: Array.isArray(autori) ? autori.length : 0 },
              ],
            },
            { id: "hf" },
            "paper",
          );
        }),
      );
    }
    case "dev": {
      if (!Array.isArray(corpo)) return [];
      return solo(
        corpo.map((v) => {
          const a = oggetto(v);
          if (!a) return null;
          return notizia(
            {
              titolo: testo(a.title),
              url: testo(a.url),
              quando: testo(a.published_at),
              riassunto: truncate(testo(a.description), 300),
              dati: [
                { code: "reazioni", value: numero(a.positive_reactions_count) },
                { code: "lettura", value: numero(a.reading_time_minutes) },
              ],
            },
            { id: "dev", tag: f.tag },
            "piu-letto",
          );
        }),
      );
    }
    case "rilasci": {
      if (!Array.isArray(corpo)) return [];
      const da = adesso.getTime() - f.days * 86_400_000;
      return solo(
        f.repos.map(({ repo, name: nome }, k) => {
          const r = oggetto(corpo[k]);
          const versione = testo(r?.tag_name);
          if (!r || !versione) return null;
          return notizia(
            {
              titolo: `${nome} ${versione.replace(/^v/, "")}`,
              url: testo(r.html_url),
              quando: testo(r.published_at),
              riassunto: truncate(note(testo(r.body)), 320),
              dati: [{ code: "versione", value: versione }],
            },
            { id: "github", repo },
            "release",
          );
        }),
      )
        .filter((n) => Date.parse(n.when) >= da)
        .sort((a, b) => Date.parse(b.when) - Date.parse(a.when))
        .slice(0, f.quante);
    }
  }
}

/** Una per fonte a turno, finche' ce n'e': nessuna fonte si prende la macchina. */
function alterna(liste: Story[][]): Story[] {
  const fuori: Story[] = [];
  const lunga = Math.max(0, ...liste.map((l) => l.length));
  for (let i = 0; i < lunga; i++) for (const l of liste) if (l[i]) fuori.push(l[i]);
  return fuori;
}

const chiaveTitolo = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Le tre categorie dalle liste delle loro fonti. DEV rimanda lo stesso
 * articolo sotto tag diversi: una notizia sta in una categoria sola, la prima
 * che l'ha trovata, nell'ordine ia, design, codice.
 */
export function composeCategories(perCategoria: Record<CategoryId, Story[][]>): Record<CategoryId, Story[]> {
  const url = new Set<string>();
  const titoli = new Set<string>();
  const fuori = {} as Record<CategoryId, Story[]>;
  for (const c of CATEGORIES) {
    fuori[c] = [];
    for (const n of alterna(perCategoria[c])) {
      if (fuori[c].length >= PER_CATEGORIA) break;
      const t = chiaveTitolo(n.title);
      if (url.has(n.url) || titoli.has(t)) continue;
      url.add(n.url);
      titoli.add(t);
      fuori[c].push(n);
    }
  }
  return fuori;
}

/** Chi va in rete: restituisce il corpo JSON e l'intestazione Date della risposta. */
export type Fetcher = (url: string) => Promise<{ body: unknown; date: string | null }>;

/**
 * Chiede tutte le fonti insieme. Una fonte che cade (429 di DEV, 403 di GitHub,
 * tempo scaduto) resta fuori e non ferma le altre. `raccolteAlle` e' la Date
 * piu' vecchia fra le risposte arrivate: con la cache di un'ora per fonte e'
 * quella che dice da quanto le notizie sono ferme.
 */
export async function collectNews(chiedi: Fetcher, adesso: Date): Promise<NewsCollection> {
  const date: number[] = [];
  const perCategoria = {} as Record<CategoryId, Story[][]>;
  await Promise.all(
    CATEGORIES.map(async (c) => {
      const esiti = await Promise.allSettled(
        SOURCES[c].map(async (f) => {
          const risposte = await Promise.allSettled(sourceUrls(f, adesso).map((u) => chiedi(u)));
          if (risposte.every((r) => r.status === "rejected")) throw new Error("fonte giu'");
          const corpi = risposte.map((r) => {
            if (r.status === "rejected") return null;
            const t = r.value.date ? Date.parse(r.value.date) : NaN;
            if (!Number.isNaN(t)) date.push(t);
            return r.value.body;
          });
          return parseSource(f, f.kind === "rilasci" ? corpi : corpi[0], adesso);
        }),
      );
      perCategoria[c] = esiti.map((e) => (e.status === "fulfilled" ? e.value : []));
    }),
  );
  return {
    collectedAt: new Date(date.length ? Math.min(...date) : adesso.getTime()).toISOString(),
    categories: composeCategories(perCategoria),
  };
}
