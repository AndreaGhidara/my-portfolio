import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThreadSegment } from "../ThreadSegment";
import { THREAD_ANCHORS, SECTION_ORDER } from "../anchors";

describe("ancoraggi del filo", () => {
  it("copre tutte le sezioni attraversate dal filo", () => {
    expect(Object.keys(THREAD_ANCHORS).sort()).toEqual([...SECTION_ORDER].sort());
  });

  it("il filo è continuo: dove una sezione esce, la successiva entra", () => {
    for (let i = 0; i < SECTION_ORDER.length - 1; i++) {
      const current = THREAD_ANCHORS[SECTION_ORDER[i]];
      const next = THREAD_ANCHORS[SECTION_ORDER[i + 1]];
      expect(
        next.in,
        `il filo si spezza fra ${SECTION_ORDER[i]} e ${SECTION_ORDER[i + 1]}`,
      ).toBe(current.out);
    }
  });

  it("ogni ancoraggio sta dentro la larghezza della pagina", () => {
    for (const anchor of Object.values(THREAD_ANCHORS)) {
      expect(anchor.in).toBeGreaterThanOrEqual(0);
      expect(anchor.in).toBeLessThanOrEqual(100);
      expect(anchor.out).toBeGreaterThanOrEqual(0);
      expect(anchor.out).toBeLessThanOrEqual(100);
    }
  });
});

describe("ThreadSegment", () => {
  it("è decorativo e non viene letto dagli screen reader", () => {
    const { container } = render(<ThreadSegment section="hero" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("disegna il tratto dall'ancoraggio di entrata a quello di uscita", () => {
    const { container } = render(<ThreadSegment section="services" />);
    const d = container.querySelector("path")?.getAttribute("d") ?? "";
    expect(d).toContain(`M${THREAD_ANCHORS.services.in} 0`);
    expect(d).toContain(`${THREAD_ANCHORS.services.out} 100`);
  });
});
