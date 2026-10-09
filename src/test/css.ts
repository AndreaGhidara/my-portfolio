import { readFileSync } from "node:fs";
import path from "node:path";
import postcss, { type ChildNode } from "postcss";

// Da globals.css seguendo gli @import locali in ordine, come la build: le prove
// cercano una regola nel sito, non in un file, e spostare un blocco da un foglio
// all'altro non deve romperne nessuna. `@import "tailwindcss"` si salta.

export interface Rule {
  // Uno per uno, con gli spazi ridotti a uno.
  selectors: string[];
  // La lista intera, separata da ", ".
  selector: string;
  // Una dichiarazione per riga, senza commenti.
  body: string;
  // Se una proprieta' torna vince l'ultima, come nel browser.
  declarations: Record<string, string>;
  // Le at-rule che la contengono, dalla piu' esterna.
  inside: string[];
  file: string;
}

export interface Options {
  // A qualunque profondita'.
  media?: string;
  // Le regole dopo il primo commento che contiene questo testo.
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

// Una stringa cerca un selettore nella lista, una RegExp prova la lista intera
// (`selector`). Senza niente, tutte.
export const rules = cssReader(path.resolve(process.cwd(), "src/app/globals.css"));
