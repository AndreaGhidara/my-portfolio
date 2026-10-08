import { describe, it, expect } from "vitest";
import { LEVELS, levelNumber } from "../levels";

describe("numeroLivello", () => {
  it("conta da uno, nell'ordine in cui si giocano", () => {
    expect(LEVELS.map(levelNumber)).toEqual([1, 2, 3, 4]);
    expect(levelNumber("notte")).toBe(4);
  });
});
