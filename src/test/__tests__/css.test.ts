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
let cartella: string;
let leggi: ReturnType<typeof cssReader>;

beforeAll(() => {
  cartella = mkdtempSync(path.join(tmpdir(), "css-"));
  mkdirSync(path.join(cartella, "parti"));
  writeFileSync(
    path.join(cartella, "ingresso.css"),
    [
      '@import "tailwindcss";',
      '@import "./primo.css";',
      '@import "./parti/secondo.css";',
      "body { margin: 0; }",
    ].join("\n"),
  );
  writeFileSync(
    path.join(cartella, "primo.css"),
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
    path.join(cartella, "parti", "secondo.css"),
    [
      '@import "../terzo.css";',
      "/* IL PIEDE */",
      "@media (max-width: 599px) { [data-c] { display: none; } }",
      "@supports (display: grid) { [data-c] { display: grid !important; } }",
      "@media (min-width: 600px) { [data-c] { display: block; } }",
    ].join("\n"),
  );
  writeFileSync(path.join(cartella, "terzo.css"), "[data-d] { opacity: 0; }");
  leggi = cssReader(path.join(cartella, "ingresso.css"));
});

afterAll(() => rmSync(cartella, { recursive: true, force: true }));

const da = (regola: Rule | undefined) => regola && path.relative(cartella, regola.file);

describe("il lettore del CSS", () => {
  it("legge i fogli nell'ordine degli import, risolti da chi importa, e salta tailwind", () => {
    expect(leggi().map((r) => [r.selector, da(r)])).toEqual([
      [":root", "primo.css"],
      ["[data-a], [data-b] > i", "primo.css"],
      ["[data-a]", "primo.css"],
      ["[data-d]", "terzo.css"],
      ["[data-c]", path.join("parti", "secondo.css")],
      ["[data-c]", path.join("parti", "secondo.css")],
      ["[data-c]", path.join("parti", "secondo.css")],
      ["body", "ingresso.css"],
    ]);
  });

  it("un selettore in una lista si trova da solo, una RegExp guarda la lista intera", () => {
    expect(leggi("[data-b] > i").map((r) => r.selectors)).toEqual([["[data-a]", "[data-b] > i"]]);
    expect(leggi("[data-a]")).toHaveLength(2);
    expect(leggi(/^\[data-a\]$/)).toHaveLength(1);
    expect(leggi(/i$/)).toHaveLength(1);
  });

  it("le media annidate restano tutte e due, dalla piu' esterna", () => {
    const [annidata] = leggi("[data-a]", { media: "(hover: hover)" });
    expect(annidata.inside).toEqual(["@media (max-width: 599px)", "@media (hover: hover)"]);
    expect(leggi("[data-a]", { media: "(max-width: 599px)" })).toEqual([annidata]);
  });

  it("la stessa regola in due media diverse sono due regole, ognuna con la sua", () => {
    const [stretta] = leggi("[data-c]", { media: "(max-width: 599px)" });
    const [larga] = leggi("[data-c]", { media: "(min-width: 600px)" });
    expect(stretta.declarations.display).toBe("none");
    expect(larga.declarations.display).toBe("block");
    expect(leggi("[data-c]").map((r) => r.inside)).toEqual([
      ["@media (max-width: 599px)"],
      ["@supports (display: grid)"],
      ["@media (min-width: 600px)"],
    ]);
  });

  it("il corpo e' una dichiarazione per riga, e fra le dichiarazioni vince l'ultima", () => {
    const [radice] = leggi(":root");
    expect(radice.body).toBe("--sheet-paper: white;\n--sheet-paper: ivory;");
    expect(radice.declarations).toEqual({ "--sheet-paper": "ivory" });
    expect(leggi("[data-c]")[1].body).toBe("display: grid !important;");
  });

  it("dopo un commento: le regole che vengono dopo, fino in fondo al sito", () => {
    expect(leggi(undefined, { after: "IL PIEDE" }).map((r) => r.selector)).toEqual([
      "[data-c]",
      "[data-c]",
      "[data-c]",
      "body",
    ]);
    expect(leggi(undefined, { after: "NON C'E'" })).toEqual([]);
  });

  it("senza ingresso legge il sito vero, da globals.css", () => {
    expect(rules().length).toBeGreaterThan(100);
    expect(rules(":root").some((r) => r.file.endsWith(path.join("src", "styles", "tokens.css")))).toBe(true);
  });
});
