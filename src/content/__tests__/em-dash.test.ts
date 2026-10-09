import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// Come escape, cosi' questo file non fa cadere se stesso.
const EM_DASH = "\u2014";

const root = path.resolve(__dirname, "../../..");

// docs/ e public/ restano fuori apposta.
const FOLDERS = ["src", "scripts", "messages"];
const AT_ROOT = /\.(ts|mjs|md)$/;
const BINARY = /\.(ico|woff2?|ttf|otf|png|jpe?g|gif|webp|avif|pdf)$/i;
const NEVER = new Set(["node_modules", ".next"]);

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return NEVER.has(entry.name) ? [] : filesUnder(filePath);
    return entry.isFile() && !BINARY.test(entry.name) ? [filePath] : [];
  });
}

function filesToCheck(): string[] {
  const atRoot = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && AT_ROOT.test(entry.name))
    .map((entry) => path.join(root, entry.name));
  return [...FOLDERS.flatMap((c) => filesUnder(path.join(root, c))), ...atRoot];
}

describe("il trattino lungo", () => {
  it("non compare in src/, scripts/, messages/ ne' nei file in radice", () => {
    const offenders: string[] = [];
    for (const filePath of filesToCheck()) {
      readFileSync(filePath, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (line.includes(EM_DASH)) {
            offenders.push(`${path.relative(root, filePath)}:${i + 1}`);
          }
        });
    }
    expect(offenders).toEqual([]);
  });

  it("legge davvero tutti i posti che dice di leggere", () => {
    // Una cartella sbagliata darebbe zero risultati anche col trattino dentro.
    const checked = filesToCheck().map((p) => path.relative(root, p));
    expect(checked).toContain("README.md");
    expect(checked).toContain("vitest.setup.ts");
    expect(checked).toContain(path.join("scripts", "build-desk.mjs"));
    expect(checked).toContain(path.join("messages", "it.json"));
    expect(checked).toContain(path.join("src", "styles", "tokens.css"));
  });
});
