import { describe, it, expect } from "vitest";
import { due } from "../formato";

describe("due", () => {
  it("porta a due cifre i numeri da una", () => {
    expect(due(0)).toBe("00");
    expect(due(7)).toBe("07");
  });

  it("lascia stare quelli che ne hanno gia' due o piu'", () => {
    expect(due(12)).toBe("12");
    expect(due(123)).toBe("123");
  });
});
