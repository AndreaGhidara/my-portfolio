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

export interface Regola {
  /** I selettori della lista, uno per uno, con gli spazi ridotti a uno. */
  selettori: string[];
  /** La lista intera, separata da ", ". */
  selettore: string;
  /** Le dichiarazioni, una per riga: `proprieta: valore;`. Senza commenti. */
  corpo: string;
  /** Proprieta' e valore; se una proprieta' torna, vince l'ultima, come nel browser. */
  dichiarazioni: Record<string, string>;
  /** Le at-rule che la contengono, dalla piu' esterna: `@media (max-width: 599px)`. */
  dentro: string[];
  /** Il percorso assoluto del foglio da cui viene. */
  file: string;
}

export interface Opzioni {
  /** Solo le regole dentro questa media query, a qualunque profondita': `(max-width: 599px)`. */
  media?: string;
  /** Solo le regole che vengono dopo il primo commento che contiene questo testo. */
  dopo?: string;
}

type Voce = { regola: Regola } | { commento: string };

const spazi = (testo: string) => testo.replace(/\s+/g, " ").trim();

function leggiFoglio(file: string, dentro: string[], voci: Voce[]) {
  const visita = (nodi: ChildNode[], dentro: string[]) => {
    for (const nodo of nodi) {
      if (nodo.type === "comment") {
        voci.push({ commento: nodo.text });
      } else if (nodo.type === "rule") {
        const dichiarazioni: Record<string, string> = {};
        const righe: string[] = [];
        for (const figlio of nodo.nodes) {
          if (figlio.type !== "decl") continue;
          const valore = figlio.important ? `${figlio.value} !important` : figlio.value;
          dichiarazioni[figlio.prop] = valore;
          righe.push(`${figlio.prop}: ${valore};`);
        }
        const selettori = nodo.selectors.map(spazi);
        voci.push({
          regola: {
            selettori,
            selettore: selettori.join(", "),
            corpo: righe.join("\n"),
            dichiarazioni,
            dentro,
            file,
          },
        });
      } else if (nodo.type === "atrule" && nodo.name === "import") {
        // Solo i percorsi relativi sono fogli del sito: il resto e' un pacchetto.
        const dove = nodo.params.match(/^["']([^"']+)["']/)?.[1];
        if (dove?.startsWith(".")) leggiFoglio(path.resolve(path.dirname(file), dove), dentro, voci);
      } else if (nodo.type === "atrule" && nodo.nodes) {
        visita(nodo.nodes, [...dentro, spazi(`@${nodo.name} ${nodo.params}`)]);
      }
    }
  };
  visita(postcss.parse(readFileSync(file, "utf8"), { from: file }).nodes, dentro);
}

const letti = new Map<string, Voce[]>();

/** Il lettore di un CSS qualunque a partire dal suo ingresso. Il sito usa `regole`. */
export function lettoreCss(ingresso: string) {
  return (cerca?: string | RegExp, { media, dopo }: Opzioni = {}): Regola[] => {
    let voci = letti.get(ingresso);
    if (!voci) {
      voci = [];
      leggiFoglio(ingresso, [], voci);
      letti.set(ingresso, voci);
    }
    if (dopo !== undefined) {
      const da = voci.findIndex((v) => "commento" in v && v.commento.includes(dopo));
      voci = da < 0 ? [] : voci.slice(da + 1);
    }
    const cercato = typeof cerca === "string" ? spazi(cerca) : cerca;
    const query = media === undefined ? undefined : `@media ${spazi(media)}`;
    return voci.flatMap((v) => {
      if (!("regola" in v)) return [];
      const r = v.regola;
      if (typeof cercato === "string" && !r.selettori.includes(cercato)) return [];
      if (cercato instanceof RegExp && !cercato.test(r.selettore)) return [];
      if (query !== undefined && !r.dentro.includes(query)) return [];
      return [r];
    });
  };
}

/**
 * Le regole del sito, nell'ordine in cui il browser le legge. Una stringa
 * trova le regole che hanno quel selettore nella loro lista; una RegExp si
 * prova sulla lista intera (`selettore`). Senza niente, tutte.
 */
export const regole = lettoreCss(path.resolve(process.cwd(), "src/app/globals.css"));
