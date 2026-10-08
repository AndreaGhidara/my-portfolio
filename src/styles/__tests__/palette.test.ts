import { describe, it, expect } from "vitest";
import { palette } from "../palette";

describe("palette", () => {
  it("espone esattamente i nove token della spec", () => {
    // Qui l'ingresso di un colore nuovo si nota invece di passare inosservato.
    expect(Object.keys(palette).sort()).toEqual(
      ["bulb", "graph", "green", "greenDark", "ink", "muted", "mutedDark", "orange", "paper"],
    );
  });

  it("usa i valori esatti approvati nella spec", () => {
    expect(palette.paper).toBe("#F5F1E8");
    expect(palette.ink).toBe("#14120F");
    expect(palette.orange).toBe("#E4572E");
    expect(palette.graph).toBe("#D9D3C4");
    expect(palette.muted).toBe("#6E6759");
    expect(palette.mutedDark).toBe("#A79E8C");
    expect(palette.bulb).toBe("#FDEA7B");
    expect(palette.green).toBe("#2F6F4E");
    expect(palette.greenDark).toBe("#7FBF95");
  });
});
