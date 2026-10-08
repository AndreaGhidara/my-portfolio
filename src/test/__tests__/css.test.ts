import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { cssReader, rules, type Rule } from "../css";

/**
 * Un sito finto in una cartella temporanea: un ingresso che importa tailwind
 * (da saltare), un foglio vicino e uno in una sottocartella che ne importa un
 * altro a sua volta. I percorsi relativi si risolvono da chi importa.
 */
let dir: string;
let read: ReturnType<typeof cssReader>;

beforeAll(() => {
  dir = mkdtempSync(path.join(tmpdir(), "css-"));
  mkdirSync(path.join(dir, "parts"));
  writeFileSync(
    path.join(dir, "entry.css"),
    [
      '@import "tailwindcss";',
      '@import "./first.css";',
      '@import "./parts/second.css";',
      "body { margin: 0; }",
    ].join("\n"),
  );
  writeFileSync(
    path.join(dir, "first.css"),
    [
      "/* LA TESTA */",
      ":root { --sheet-paper: white; --sheet-paper: ivory; }",
      "[data-a],",
      "[data-b] > i { color: red; padding: 1rem  2rem; }",
      "@media (max-width: 599px) {",
      "  @media (hover: hover) {",
      "    [data-a] { color: blue; }",
      "  }",
      "}",
    ].join("\n"),
  );
  writeFileSync(
    path.join(dir, "parts", "second.css"),
    [
      '@import "../third.css";',
      "/* IL PIEDE */",
      "@media (max-width: 599px) { [data-c] { display: none; } }",
      "@supports (display: grid) { [data-c] { display: grid !important; } }",
      "@media (min-width: 600px) { [data-c] { display: block; } }",
    ].join("\n"),
  );
  writeFileSync(path.join(dir, "third.css"), "[data-d] { opacity: 0; }");
  read = cssReader(path.join(dir, "entry.css"));
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const fileOf = (rule: Rule | undefined) => rule && path.relative(dir, rule.file);

describe("il lettore del CSS", () => {
  it("legge i fogli nell'ordine degli import, risolti da chi importa, e salta tailwind", () => {
    expect(read().map((r) => [r.selector, fileOf(r)])).toEqual([
      [":root", "first.css"],
      ["[data-a], [data-b] > i", "first.css"],
      ["[data-a]", "first.css"],
      ["[data-d]", "third.css"],
      ["[data-c]", path.join("parts", "second.css")],
      ["[data-c]", path.join("parts", "second.css")],
      ["[data-c]", path.join("parts", "second.css")],
      ["body", "entry.css"],
    ]);
  });

  it("un selettore in una lista si trova da solo, una RegExp guarda la lista intera", () => {
    expect(read("[data-b] > i").map((r) => r.selectors)).toEqual([["[data-a]", "[data-b] > i"]]);
    expect(read("[data-a]")).toHaveLength(2);
    expect(read(/^\[data-a\]$/)).toHaveLength(1);
    expect(read(/i$/)).toHaveLength(1);
  });

  it("le media annidate restano tutte e due, dalla piu' esterna", () => {
    const [nested] = read("[data-a]", { media: "(hover: hover)" });
    expect(nested.inside).toEqual(["@media (max-width: 599px)", "@media (hover: hover)"]);
    expect(read("[data-a]", { media: "(max-width: 599px)" })).toEqual([nested]);
  });

  it("la stessa regola in due media diverse sono due regole, ognuna con la sua", () => {
    const [narrow] = read("[data-c]", { media: "(max-width: 599px)" });
    const [wide] = read("[data-c]", { media: "(min-width: 600px)" });
    expect(narrow.declarations.display).toBe("none");
    expect(wide.declarations.display).toBe("block");
    expect(read("[data-c]").map((r) => r.inside)).toEqual([
      ["@media (max-width: 599px)"],
      ["@supports (display: grid)"],
      ["@media (min-width: 600px)"],
    ]);
  });

  it("il corpo e' una dichiarazione per riga, e fra le dichiarazioni vince l'ultima", () => {
    const [root] = read(":root");
    expect(root.body).toBe("--sheet-paper: white;\n--sheet-paper: ivory;");
    expect(root.declarations).toEqual({ "--sheet-paper": "ivory" });
    expect(read("[data-c]")[1].body).toBe("display: grid !important;");
  });

  it("dopo un commento: le regole che vengono dopo, fino in fondo al sito", () => {
    expect(read(undefined, { after: "IL PIEDE" }).map((r) => r.selector)).toEqual([
      "[data-c]",
      "[data-c]",
      "[data-c]",
      "body",
    ]);
    expect(read(undefined, { after: "NON C'E'" })).toEqual([]);
  });

  it("senza ingresso legge il sito vero, da globals.css", () => {
    expect(rules().length).toBeGreaterThan(100);
    expect(rules(":root").some((r) => r.file.endsWith(path.join("src", "styles", "tokens.css")))).toBe(true);
  });
});
