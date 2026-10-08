import { CATEGORIE, type CategoriaId, type Dato, type Fonte, type Notizia, type Raccolta, type Timbro } from "./types";

/**
 * La raccolta delle notizie, senza rete: chi chiama le fonti e' la route
 * (/api/notizie), qui si decide cosa chiedere, come leggere quello che torna e
 * cosa tenere. Tutto quello che entra e' di terzi, quindi si legge come se
 * potesse avere qualunque forma, e una forma inattesa da' una lista vuota.
 */

export type FonteSpec =
  | { tipo: "hn"; parole: string[]; settimane: number; punti: number }
  | { tipo: "hf" }
  | { tipo: "dev"; tag: string; quante: number }
  /* Le ultime release di piu' progetti, come una fonte sola: prese una per
     una avrebbero aperto Codice con quattro release di fila, anche vecchie. */
  | { tipo: "rilasci"; repos: { repo: string; nome: string }[]; giorni: number; quante: number };

/** Le fonti del prototipo (docs/prototipi/2026-09-28-bancone-tre-pulsanti.html), pubbliche e senza chiave. */
export const FONTI: Record<CategoriaId, FonteSpec[]> = {
  ia: [
    { tipo: "hn", parole: ["LLM", "OpenAI", "Anthropic", "Claude", "Gemini", "agents"], settimane: 1, punti: 60 },
    { tipo: "hf" },
    { tipo: "dev", tag: "ai", quante: 6 },
  ],
  design: [
    { tipo: "hn", parole: ["design", "typography", "Figma", "UX", "CSS", "font"], settimane: 2, punti: 25 },
    { tipo: "dev", tag: "design", quante: 6 },
    { tipo: "dev", tag: "ux", quante: 6 },
    { tipo: "dev", tag: "css", quante: 4 },
  ],
  codice: [
    {
      tipo: "rilasci",
      repos: [
        { repo: "vercel/next.js", nome: "Next.js" },
        { repo: "facebook/react", nome: "React" },
        { repo: "microsoft/TypeScript", nome: "TypeScript" },
        { repo: "tailwindlabs/tailwindcss", nome: "Tailwind CSS" },
      ],
      // Le due settimane di Hacker News per Codice: sono le notizie della settimana.
      giorni: 14,
      quante: 2,
    },
    { tipo: "dev", tag: "nextjs", quante: 4 },
    { tipo: "hn", parole: ["React", "Next.js", "TypeScript", "Tailwind", "Vercel", "Node.js"], settimane: 2, punti: 30 },
    { tipo: "dev", tag: "react", quante: 4 },
    { tipo: "dev", tag: "typescript", quante: 4 },
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
export function urlDi(f: Exclude<FonteSpec, { tipo: "rilasci" }>, adesso: Date): string {
  switch (f.tipo) {
    case "hn": {
      const giorno = Math.floor(adesso.getTime() / 86_400_000) * 86400;
      const da = giorno - f.settimane * 7 * 86400;
      const parole = encodeURIComponent(f.parole.join(" "));
      return `https://hn.algolia.com/api/v1/search?query=${parole}&optionalWords=${parole}&tags=story&numericFilters=created_at_i%3E${da},points%3E${f.punti}&hitsPerPage=20`;
    }
    case "hf":
      return "https://huggingface.co/api/daily_papers?limit=10";
    case "dev":
      return `https://dev.to/api/articles?tag=${f.tag}&top=7&per_page=${f.quante}`;
  }
}

/** Gli indirizzi di una fonte: uno, o uno per progetto per le release. */
export function indirizzi(f: FonteSpec, adesso: Date): string[] {
  if (f.tipo === "rilasci") return f.repos.map((r) => `https://api.github.com/repos/${r.repo}/releases/latest`);
  return [urlDi(f, adesso)];
}

/** Spazi normalizzati, e tagliato sull'ultima parola intera che ci sta. */
export function taglia(s: string, n: number): string {
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
  dati: Dato[];
};

/** Da una bozza a una notizia, o a niente se non passa i filtri. */
function notizia(b: Bozza, fonte: Fonte, timbro: Timbro): Notizia | null {
  const titolo = taglia(b.titolo, 200);
  const url = indirizzo(b.url);
  const quando = new Date(b.quando);
  if (!titolo || !url || Number.isNaN(quando.getTime())) return null;
  if (FUORI.test(titolo) || SPINTO.test(titolo) || SPINTO.test(b.riassunto ?? "")) return null;
  const riassunto = b.riassunto ? b.riassunto : undefined;
  return {
    id: url.href,
    titolo,
    url: url.href,
    hostname: url.hostname.replace(/^www\./, ""),
    quando: quando.toISOString(),
    fonte,
    timbro,
    ...(riassunto ? { riassunto } : {}),
    dati: b.dati,
  };
}

const solo = (l: (Notizia | null)[]): Notizia[] => l.filter((n): n is Notizia => n !== null);

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
export function leggi(f: FonteSpec, corpo: unknown, adesso: Date = new Date()): Notizia[] {
  switch (f.tipo) {
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
                { codice: "punti", valore: numero(h.points) },
                { codice: "commenti", valore: numero(h.num_comments) },
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
              riassunto: taglia(testo(p.summary) || testo(paper.summary), 380),
              dati: [
                { codice: "voti", valore: numero(paper.upvotes) },
                { codice: "autori", valore: Array.isArray(autori) ? autori.length : 0 },
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
              riassunto: taglia(testo(a.description), 300),
              dati: [
                { codice: "reazioni", valore: numero(a.positive_reactions_count) },
                { codice: "lettura", valore: numero(a.reading_time_minutes) },
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
      const da = adesso.getTime() - f.giorni * 86_400_000;
      return solo(
        f.repos.map(({ repo, nome }, k) => {
          const r = oggetto(corpo[k]);
          const versione = testo(r?.tag_name);
          if (!r || !versione) return null;
          return notizia(
            {
              titolo: `${nome} ${versione.replace(/^v/, "")}`,
              url: testo(r.html_url),
              quando: testo(r.published_at),
              riassunto: taglia(note(testo(r.body)), 320),
              dati: [{ codice: "versione", valore: versione }],
            },
            { id: "github", repo },
            "release",
          );
        }),
      )
        .filter((n) => Date.parse(n.quando) >= da)
        .sort((a, b) => Date.parse(b.quando) - Date.parse(a.quando))
        .slice(0, f.quante);
    }
  }
}

/** Una per fonte a turno, finche' ce n'e': nessuna fonte si prende la macchina. */
function alterna(liste: Notizia[][]): Notizia[] {
  const fuori: Notizia[] = [];
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
export function componi(perCategoria: Record<CategoriaId, Notizia[][]>): Record<CategoriaId, Notizia[]> {
  const url = new Set<string>();
  const titoli = new Set<string>();
  const fuori = {} as Record<CategoriaId, Notizia[]>;
  for (const c of CATEGORIE) {
    fuori[c] = [];
    for (const n of alterna(perCategoria[c])) {
      if (fuori[c].length >= PER_CATEGORIA) break;
      const t = chiaveTitolo(n.titolo);
      if (url.has(n.url) || titoli.has(t)) continue;
      url.add(n.url);
      titoli.add(t);
      fuori[c].push(n);
    }
  }
  return fuori;
}

/** Chi va in rete: restituisce il corpo JSON e l'intestazione Date della risposta. */
export type Chiedi = (url: string) => Promise<{ corpo: unknown; data: string | null }>;

/**
 * Chiede tutte le fonti insieme. Una fonte che cade (429 di DEV, 403 di GitHub,
 * tempo scaduto) resta fuori e non ferma le altre. `raccolteAlle` e' la Date
 * piu' vecchia fra le risposte arrivate: con la cache di un'ora per fonte e'
 * quella che dice da quanto le notizie sono ferme.
 */
export async function raccogli(chiedi: Chiedi, adesso: Date): Promise<Raccolta> {
  const date: number[] = [];
  const perCategoria = {} as Record<CategoriaId, Notizia[][]>;
  await Promise.all(
    CATEGORIE.map(async (c) => {
      const esiti = await Promise.allSettled(
        FONTI[c].map(async (f) => {
          const risposte = await Promise.allSettled(indirizzi(f, adesso).map((u) => chiedi(u)));
          if (risposte.every((r) => r.status === "rejected")) throw new Error("fonte giu'");
          const corpi = risposte.map((r) => {
            if (r.status === "rejected") return null;
            const t = r.value.data ? Date.parse(r.value.data) : NaN;
            if (!Number.isNaN(t)) date.push(t);
            return r.value.corpo;
          });
          return leggi(f, f.tipo === "rilasci" ? corpi : corpi[0], adesso);
        }),
      );
      perCategoria[c] = esiti.map((e) => (e.status === "fulfilled" ? e.value : []));
    }),
  );
  return {
    raccolteAlle: new Date(date.length ? Math.min(...date) : adesso.getTime()).toISOString(),
    categorie: componi(perCategoria),
  };
}
