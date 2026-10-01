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
export function installaIntersectionObserver() {
  const vivi = new Set<Osservatore>();

  class Osservatore {
    readonly osservati = new Set<Element>();
    constructor(private readonly richiamo: IntersectionObserverCallback) {
      vivi.add(this);
    }
    observe(el: Element) {
      this.osservati.add(el);
    }
    unobserve(el: Element) {
      this.osservati.delete(el);
    }
    disconnect() {
      this.osservati.clear();
      vivi.delete(this);
    }
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    avvisa(dentro: boolean, el?: Element) {
      const bersagli = [...this.osservati].filter((o) => !el || o === el);
      if (!bersagli.length) return;
      const voci = bersagli.map(
        (target) => ({ target, isIntersecting: dentro, intersectionRatio: dentro ? 1 : 0 }) as IntersectionObserverEntry,
      );
      this.richiamo(voci, this as unknown as IntersectionObserver);
    }
  }

  vi.stubGlobal("IntersectionObserver", Osservatore);

  const avvisa = (dentro: boolean, el?: Element) =>
    act(() => {
      for (const o of [...vivi]) o.avvisa(dentro, el);
    });

  return {
    entra: (el?: Element) => avvisa(true, el),
    esce: (el?: Element) => avvisa(false, el),
    /** Quanti osservatori sono ancora attaccati: zero dopo lo smontaggio. */
    attivi: () => vivi.size,
  };
}

/** Il browser vecchio, o l'ambiente senza: IntersectionObserver non c'e'. */
export function togliIntersectionObserver() {
  vi.stubGlobal("IntersectionObserver", undefined);
}
