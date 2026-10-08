import { readFileSync } from "node:fs";
import path from "node:path";
import postcss, { type ChildNode } from "postcss";

/**
 * Il CSS del sito come lo vede il browser, per i test che in jsdom non possono
 * misurare niente e allora leggono le regole che tengono ferma una cosa.
 *
 * Si parte da globals.css e si seguono gli @import locali nell'ordine in cui
 * stanno, come fa la build: le prove cercano una regola nel sito, non in un
 * file, e spostare un blocco da un foglio all'altro non deve romperne nessuna.
 * `@import "tailwindcss"` si salta: e' il framework, non il sito.
 */

export interface Rule {
  /** I selettori della lista, uno per uno, con gli spazi ridotti a uno. */
  selectors: string[];
  /** La lista intera, separata da ", ". */
  selector: string;
  /** Le dichiarazioni, una per riga: `proprieta: valore;`. Senza commenti. */
  body: string;
  /** Proprieta' e valore; se una proprieta' torna, vince l'ultima, come nel browser. */
  declarations: Record<string, string>;
  /** Le at-rule che la contengono, dalla piu' esterna: `@media (max-width: 599px)`. */
  inside: string[];
  /** Il percorso assoluto del foglio da cui viene. */
  file: string;
}

export interface Options {
  /** Solo le regole dentro questa media query, a qualunque profondita': `(max-width: 599px)`. */
  media?: string;
  /** Solo le regole che vengono dopo il primo commento che contiene questo testo. */
  after?: string;
}

type Entry = { rule: Rule } | { comment: string };

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

function readSheet(file: string, inside: string[], entries: Entry[]) {
  const visit = (nodes: ChildNode[], inside: string[]) => {
    for (const node of nodes) {
      if (node.type === "comment") {
        entries.push({ comment: node.text });
      } else if (node.type === "rule") {
        const declarations: Record<string, string> = {};
        const lines: string[] = [];
        for (const child of node.nodes) {
          if (child.type !== "decl") continue;
          const value = child.important ? `${child.value} !important` : child.value;
          declarations[child.prop] = value;
          lines.push(`${child.prop}: ${value};`);
        }
        const selectors = node.selectors.map(squash);
        entries.push({
          rule: {
            selectors,
            selector: selectors.join(", "),
            body: lines.join("\n"),
            declarations,
            inside,
            file,
          },
        });
      } else if (node.type === "atrule" && node.name === "import") {
        // Solo i percorsi relativi sono fogli del sito: il resto e' un pacchetto.
        const href = node.params.match(/^["']([^"']+)["']/)?.[1];
        if (href?.startsWith(".")) readSheet(path.resolve(path.dirname(file), href), inside, entries);
      } else if (node.type === "atrule" && node.nodes) {
        visit(node.nodes, [...inside, squash(`@${node.name} ${node.params}`)]);
      }
    }
  };
  visit(postcss.parse(readFileSync(file, "utf8"), { from: file }).nodes, inside);
}

const cache = new Map<string, Entry[]>();

/** Il lettore di un CSS qualunque a partire dal suo ingresso. Il sito usa `regole`. */
export function cssReader(entryFile: string) {
  return (match?: string | RegExp, { media, after }: Options = {}): Rule[] => {
    let entries = cache.get(entryFile);
    if (!entries) {
      entries = [];
      readSheet(entryFile, [], entries);
      cache.set(entryFile, entries);
    }
    if (after !== undefined) {
      const start = entries.findIndex((v) => "comment" in v && v.comment.includes(after));
      entries = start < 0 ? [] : entries.slice(start + 1);
    }
    const wanted = typeof match === "string" ? squash(match) : match;
    const query = media === undefined ? undefined : `@media ${squash(media)}`;
    return entries.flatMap((v) => {
      if (!("rule" in v)) return [];
      const r = v.rule;
      if (typeof wanted === "string" && !r.selectors.includes(wanted)) return [];
      if (wanted instanceof RegExp && !wanted.test(r.selector)) return [];
      if (query !== undefined && !r.inside.includes(query)) return [];
      return [r];
    });
  };
}

/**
 * Le regole del sito, nell'ordine in cui il browser le legge. Una stringa
 * trova le regole che hanno quel selettore nella loro lista; una RegExp si
 * prova sulla lista intera (`selettore`). Senza niente, tutte.
 */
export const rules = cssReader(path.resolve(process.cwd(), "src/app/globals.css"));
