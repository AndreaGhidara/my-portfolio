import { describe, it, expect } from "vitest";
import { pad2 } from "../format";

describe("pad2", () => {
  it("porta a due cifre i numeri da una", () => {
    expect(pad2(0)).toBe("00");
    expect(pad2(7)).toBe("07");
  });

  it("lascia stare quelli che ne hanno gia' due o piu'", () => {
    expect(pad2(12)).toBe("12");
    expect(pad2(123)).toBe("123");
  });
});
