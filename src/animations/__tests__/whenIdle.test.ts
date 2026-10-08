import { describe, it, expect, afterEach, vi } from "vitest";
import { whenIdle } from "../whenIdle";

describe("quandoLibero", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aspetta un momento libero, con un tetto di 800ms", () => {
    const richiedi = vi.fn(() => 7);
    const annulla = vi.fn();
    vi.stubGlobal("requestIdleCallback", richiedi);
    vi.stubGlobal("cancelIdleCallback", annulla);
    const fn = vi.fn();

    const ferma = whenIdle(fn);
    expect(richiedi).toHaveBeenCalledWith(expect.any(Function), { timeout: 800 });

    ferma();
    expect(annulla).toHaveBeenCalledWith(7);
  });

  it("senza requestIdleCallback ripiega su un timer, e l'annullo lo ferma", () => {
    // Safari non ce l'ha: il lavoro deve partire lo stesso, solo un po' dopo.
    // Solo i timer: i fake timers di default porterebbero anche un loro
    // requestIdleCallback, e jsdom non ne ha uno.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const fn = vi.fn();
    whenIdle(fn);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);

    const altra = vi.fn();
    const ferma = whenIdle(altra);
    ferma();
    vi.advanceTimersByTime(1000);
    expect(altra).not.toHaveBeenCalled();
  });
});
