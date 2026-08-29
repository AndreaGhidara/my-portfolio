import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { brandAssets, letterFor } from "../brand-assets";

const publicPath = (src: string) => path.resolve(__dirname, "../../../public", src.replace(/^\//, ""));

describe("registro degli asset di marca", () => {
  it("espone una voce per ognuna delle cinque lettere", () => {
    expect(Object.keys(brandAssets.letters).sort()).toEqual(["a", "d", "e", "n", "r"]);
  });

  it("ogni asset punta a un file che esiste davvero", () => {
    const all = [
      ...Object.values(brandAssets.letters),
      brandAssets.quoteOpen, brandAssets.quoteClose,
      brandAssets.inkCircle, brandAssets.avatar, brandAssets.webCorner,
    ];
    for (const asset of all) {
      expect(existsSync(publicPath(asset.src)), `manca ${asset.src}`).toBe(true);
    }
  });

  it("ogni asset dichiara dimensioni positive, per evitare salti di layout", () => {
    for (const asset of Object.values(brandAssets.letters)) {
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
    }
  });

  it("le lettere sono decorative: alt vuoto", () => {
    for (const asset of Object.values(brandAssets.letters)) {
      expect(asset.alt).toBe("");
    }
  });

  it("l'avatar ha un alt descrittivo", () => {
    expect(brandAssets.avatar.alt.length).toBeGreaterThan(10);
  });
});

describe("letterFor", () => {
  it("risolve le lettere senza distinzione di maiuscole", () => {
    expect(letterFor("A")).toBe(brandAssets.letters.a);
    expect(letterFor("a")).toBe(brandAssets.letters.a);
  });

  it("solleva un errore su una lettera non disponibile, invece di rendere un'immagine rotta", () => {
    expect(() => letterFor("z")).toThrow(/z/);
  });
});
