import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Il trattino lungo non si usa: ne' nei testi, ne' nei commenti, ne' nelle
 * traduzioni, ne' nel README. Scritto qui come escape, cosi' questo file non
 * fa cadere se stesso.
 */
const TRATTINO_LUNGO = "\u2014";

const radice = path.resolve(__dirname, "../../..");

/** Le cartelle lette per intero. docs/ e public/ restano fuori apposta. */
const CARTELLE = ["src", "scripts", "messages"];
/** In radice solo questi: config, setup dei test, README. */
const IN_RADICE = /\.(ts|mjs|md)$/;
/** Font, immagini e documenti: byte, non testo. */
const BINARI = /\.(ico|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|pdf)$/i;
const MAI = new Set(["node_modules", ".next"]);

function sotto(cartella: string): string[] {
  return readdirSync(cartella, { withFileTypes: true }).flatMap((voce) => {
    const percorso = path.join(cartella, voce.name);
    if (voce.isDirectory()) return MAI.has(voce.name) ? [] : sotto(percorso);
    return voce.isFile() && !BINARI.test(voce.name) ? [percorso] : [];
  });
}

function daControllare(): string[] {
  const inRadice = readdirSync(radice, { withFileTypes: true })
    .filter((voce) => voce.isFile() && IN_RADICE.test(voce.name))
    .map((voce) => path.join(radice, voce.name));
  return [...CARTELLE.flatMap((c) => sotto(path.join(radice, c))), ...inRadice];
}

describe("il trattino lungo", () => {
  it("non compare in src/, scripts/, messages/ ne' nei file in radice", () => {
    const colpevoli: string[] = [];
    for (const percorso of daControllare()) {
      readFileSync(percorso, "utf8")
        .split("\n")
        .forEach((riga, i) => {
          if (riga.includes(TRATTINO_LUNGO)) {
            colpevoli.push(`${path.relative(radice, percorso)}:${i + 1}`);
          }
        });
    }
    expect(colpevoli).toEqual([]);
  });

  it("legge davvero tutti i posti che dice di leggere", () => {
    // Una cartella sbagliata darebbe zero colpevoli anche col trattino dentro.
    const letti = daControllare().map((p) => path.relative(radice, p));
    expect(letti).toContain("README.md");
    expect(letti).toContain("vitest.setup.ts");
    expect(letti).toContain(path.join("scripts", "build-desk.mjs"));
    expect(letti).toContain(path.join("messages", "it.json"));
    expect(letti).toContain(path.join("src", "styles", "tokens.css"));
  });
});
