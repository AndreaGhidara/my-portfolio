import { describe, it, expect, afterEach, vi } from "vitest";
import { whenIdle } from "../whenIdle";

describe("whenIdle", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aspetta un momento libero, con un tetto di 800ms", () => {
    const request = vi.fn(() => 7);
    const cancel = vi.fn();
    vi.stubGlobal("requestIdleCallback", request);
    vi.stubGlobal("cancelIdleCallback", cancel);
    const fn = vi.fn();

    const stop = whenIdle(fn);
    expect(request).toHaveBeenCalledWith(expect.any(Function), { timeout: 800 });

    stop();
    expect(cancel).toHaveBeenCalledWith(7);
  });

  it("senza requestIdleCallback ripiega su un timer, e l'annullo lo ferma", () => {
    // Solo i timer: i fake timers di default porterebbero un loro requestIdleCallback.
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const fn = vi.fn();
    whenIdle(fn);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);

    const other = vi.fn();
    const stop = whenIdle(other);
    stop();
    vi.advanceTimersByTime(1000);
    expect(other).not.toHaveBeenCalled();
  });
});
