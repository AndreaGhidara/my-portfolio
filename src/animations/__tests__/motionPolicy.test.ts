import { describe, it, expect } from "vitest";
import { resolveMotionLevel } from "../motionPolicy";

/** Finto matchMedia: risponde true solo alle query elencate. */
const matcher = (...trueQueries: string[]) => (query: string) =>
  trueQueries.includes(query);

const REDUCED = "(prefers-reduced-motion: reduce)";
const FINE = "(pointer: fine)";
const WIDE = "(min-width: 1024px)";

describe("resolveMotionLevel", () => {
  it("dà 'none' quando l'utente chiede meno movimento, qualunque sia il dispositivo", () => {
    expect(resolveMotionLevel(matcher(REDUCED))).toBe("none");
    expect(resolveMotionLevel(matcher(REDUCED, FINE, WIDE))).toBe("none");
  });

  it("dà 'full' solo su schermo largo con puntatore fine", () => {
    expect(resolveMotionLevel(matcher(FINE, WIDE))).toBe("full");
  });

  it("dà 'reduced' su touch, anche se lo schermo è largo", () => {
    expect(resolveMotionLevel(matcher(WIDE))).toBe("reduced");
  });

  it("dà 'reduced' su schermo stretto, anche col mouse", () => {
    expect(resolveMotionLevel(matcher(FINE))).toBe("reduced");
  });

  it("dà 'reduced' quando non sa niente: il default sicuro non è mai il pieno", () => {
    expect(resolveMotionLevel(matcher())).toBe("reduced");
  });
});
