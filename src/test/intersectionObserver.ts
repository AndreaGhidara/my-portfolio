import { act } from "@testing-library/react";
import { vi } from "vitest";

/**
 * jsdom non ha IntersectionObserver. Questo lo sostituisce con uno che non
 * osserva niente da solo: e' la prova a dire quando un elemento entra o esce,
 * con `entra(el)` ed `esce(el)`. Senza argomento vale per tutti quelli
 * osservati.
 *
 * Si toglie con vi.unstubAllGlobals(), come ogni altro stub globale.
 */
export function installIntersectionObserver() {
  const live = new Set<FakeObserver>();

  class FakeObserver {
    readonly observed = new Set<Element>();
    constructor(private readonly callback: IntersectionObserverCallback) {
      live.add(this);
    }
    observe(el: Element) {
      this.observed.add(el);
    }
    unobserve(el: Element) {
      this.observed.delete(el);
    }
    disconnect() {
      this.observed.clear();
      live.delete(this);
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    notify(intersecting: boolean, el?: Element) {
      const targets = [...this.observed].filter((o) => !el || o === el);
      if (!targets.length) return;
      const entries = targets.map(
        (target) => ({ target, isIntersecting: intersecting, intersectionRatio: intersecting ? 1 : 0 }) as IntersectionObserverEntry,
      );
      this.callback(entries, this as unknown as IntersectionObserver);
    }
  }

  vi.stubGlobal("IntersectionObserver", FakeObserver);

  const notify = (intersecting: boolean, el?: Element) =>
    act(() => {
      for (const o of [...live]) o.notify(intersecting, el);
    });

  return {
    enter: (el?: Element) => notify(true, el),
    exit: (el?: Element) => notify(false, el),
    /** Quanti osservatori sono ancora attaccati: zero dopo lo smontaggio. */
    active: () => live.size,
  };
}

/** Il browser vecchio, o l'ambiente senza: IntersectionObserver non c'e'. */
export function removeIntersectionObserver() {
  vi.stubGlobal("IntersectionObserver", undefined);
}
