import { describe, it, expect } from "vitest";
import { LIVELLI, numeroLivello } from "../levels";

describe("numeroLivello", () => {
  it("conta da uno, nell'ordine in cui si giocano", () => {
    expect(LIVELLI.map(numeroLivello)).toEqual([1, 2, 3, 4]);
    expect(numeroLivello("notte")).toBe(4);
  });
});
