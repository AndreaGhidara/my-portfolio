import { describe, it, expect } from "vitest";
import { cleanup } from "../presets";

describe("la ragnatela si disegna da capo a coda", () => {
  // gsap.set scrive le proprieta' su un oggetto qualunque, e jsdom non ha getTotalLength.
  function fakePath(length: number) {
    return {
      getTotalLength: () => length,
      strokeDasharray: 0,
      strokeDashoffset: 0,
    } as unknown as SVGPathElement & { strokeDasharray: number; strokeDashoffset: number };
  }

  it("parte nascosta e finisce disegnata per intero", async () => {
    const { weave } = await import("../presets");
    const path = fakePath(400);
    const tl = weave([path], { level: "full" });
    tl?.pause();
    tl?.progress(0);
    expect(path.strokeDasharray).toBe(400);
    expect(path.strokeDashoffset).toBeCloseTo(400, 0);
    tl?.progress(1);
    expect(path.strokeDashoffset).toBeCloseTo(0, 0);
  });

  it("a movimento spento non tocca niente", async () => {
    const { weave } = await import("../presets");
    expect(weave([fakePath(400)], { level: "none" })).toBeNull();
  });
});

describe("la pulizia di fine entrata", () => {
  function withStyles(transform: string, opacity: string) {
    const el = document.createElement("div");
    el.style.transform = transform;
    el.style.opacity = opacity;
    return el;
  }

  it("senza richiesta non aggiunge niente alle vars", () => {
    // Anche `clearProps: undefined` registra il plugin di GSAP, che poi lancia a ogni fotogramma.
    expect(cleanup(document.createElement("div"))).toEqual({});
    expect(cleanup(document.createElement("div"), false)).toEqual({});
  });

  it("a movimento finito toglie transform e opacita', e lascia il resto", () => {
    const el = withStyles("translate(0px, 0px)", "1");
    el.style.zIndex = "3";
    const vars = cleanup(el, true);
    (vars.onComplete as () => void)();
    expect(el.style.transform).toBe("");
    expect(el.style.opacity).toBe("");
    expect(el.style.zIndex, "ha ripulito anche cose che non erano sue").toBe("3");
  });

  it("con una stringa tocca solo quelle proprieta'", () => {
    // I pezzi del tavolo hanno un'opacita' scritta da React che non va tolta.
    const el = withStyles("rotate(3deg)", "0.5");
    const vars = cleanup(el, "transform");
    (vars.onComplete as () => void)();
    expect(el.style.transform).toBe("");
    expect(el.style.opacity).toBe("0.5");
  });

  it("ripulisce tutti i bersagli, non solo il primo", () => {
    const first = withStyles("translate(1px, 0px)", "1");
    const second = withStyles("translate(2px, 0px)", "1");
    const vars = cleanup([first, second], true);
    (vars.onComplete as () => void)();
    expect(first.style.transform).toBe("");
    expect(second.style.transform).toBe("");
  });
});
