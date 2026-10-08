import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ReceiptPrinter } from "../ReceiptPrinter";
import { DROP_MS, FIGURE_MS } from "../receipt";
import { services } from "@/content/services";

/**
 * Qui il movimento e' acceso: la stampa a colpi gira con i timer finti. Negli
 * altri test il livello e' "none" (vitest.setup.ts) e lo scontrino esce intero.
 */
vi.mock("@/animations/motionPolicy", async (originale) => ({
  ...(await originale<typeof import("@/animations/motionPolicy")>()),
  useMotionLevel: () => "full",
}));

const servizi = services.map((s, i) => ({
  id: s.id,
  title: `Titolo ${i}`,
  text: `Testo ${i}`,
  pieces: s.pieces.map((p) => `pezzo ${p}`),
  drawing: `Schema ${i}`,
}));

const testi = {
  hint: "La stampante è pronta",
  keys: "Scegli il servizio da stampare",
  brand: "ANDREA GHIDARA · SERVIZI",
  name: "ANDREA GHIDARA",
  trade: "sviluppo web · full stack",
  number: "N.",
  total: "TOTALE",
  toDiscuss: "DA PARLARNE",
  letsTalk: "Parliamone",
  tear: "strappa ✂",
  plate: "TAV.",
  scale: "SCALA 1:1",
  signature: "A. GHIDARA",
};

const vero = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-receipt-paper]:not([data-ghost])");

describe("la figura sulla carta, con il movimento acceso", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Il telefono: la figura si vede (in jsdom nessuno ha un'altezza).
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return this.matches('[data-line="figure"]') ? 200 : 0;
      },
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight;
  });

  it("la stampa si ferma sulla figura anche se i colpi arrivano prima del render", () => {
    // Un telefono lento: molti colpi del timer prima che React ridisegni e
    // rilanci gli effetti. Il colpo dopo la figura non deve passare.
    const { container } = render(<ReceiptPrinter services={servizi} copy={testi} locale="it" />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 1/ }));
    act(() => vi.advanceTimersByTime(DROP_MS));
    act(() => vi.advanceTimersByTime(20000));
    expect(vero(container)?.querySelector('[data-line="figure"]')).not.toBeNull();
    expect(vero(container)?.querySelector('[data-line="item"]')).toBeNull();

    act(() => vi.advanceTimersByTime(FIGURE_MS - 10));
    expect(vero(container)?.querySelector('[data-line="item"]')).toBeNull();
    act(() => vi.advanceTimersByTime(20000));
    expect(vero(container)?.querySelectorAll('[data-line="item"]')).toHaveLength(servizi[1].pieces.length);
    expect(vero(container)).toHaveAttribute("data-finished");
  });
});
