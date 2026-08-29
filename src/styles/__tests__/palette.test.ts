import { describe, it, expect } from "vitest";
import { palette } from "../palette";

describe("palette", () => {
  it("espone esattamente i sette token della spec", () => {
    expect(Object.keys(palette).sort()).toEqual(
      ["graph", "ink", "lineDark", "muted", "mutedDark", "orange", "paper"],
    );
  });

  it("usa i valori esatti approvati nella spec", () => {
    expect(palette.paper).toBe("#F5F1E8");
    expect(palette.ink).toBe("#14120F");
    expect(palette.orange).toBe("#E4572E");
    expect(palette.graph).toBe("#D9D3C4");
    expect(palette.muted).toBe("#6E6759");
    expect(palette.mutedDark).toBe("#A79E8C");
    expect(palette.lineDark).toBe("#3A342A");
  });
});
