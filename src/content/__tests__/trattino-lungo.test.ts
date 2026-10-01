import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Il trattino lungo non si usa: ne' nei testi, ne' nei commenti, ne' nelle
 * traduzioni. Scritto qui come escape, cosi' questo file non fa cadere se
 * stesso.
 */
const TRATTINO_LUNGO = "\u2014";

const radice = path.resolve(__dirname, "../../..");
const TESTO = /\.(ts|tsx|css|json|js|mjs|md)$/;

function file(cartella: string): string[] {
  return readdirSync(cartella, { withFileTypes: true, recursive: true })
    .filter((voce) => voce.isFile() && TESTO.test(voce.name))
    .map((voce) => path.join(voce.parentPath, voce.name));
}

describe("il trattino lungo", () => {
  it("non compare in nessun file sotto src/ ne' in messages/", () => {
    const colpevoli: string[] = [];
    for (const percorso of [...file(path.join(radice, "src")), ...file(path.join(radice, "messages"))]) {
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
});
