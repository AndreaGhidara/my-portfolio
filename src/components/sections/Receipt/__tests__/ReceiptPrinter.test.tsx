import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ScontrinoStampante } from "../ReceiptPrinter";
import { CADUTA, FIGURA } from "../receipt";
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
  titolo: `Titolo ${i}`,
  testo: `Testo ${i}`,
  pezzi: s.pezzi.map((p) => `pezzo ${p}`),
  disegno: `Schema ${i}`,
}));

const testi = {
  hint: "La stampante è pronta",
  tasti: "Scegli il servizio da stampare",
  marca: "ANDREA GHIDARA · SERVIZI",
  nome: "ANDREA GHIDARA",
  mestiere: "sviluppo web · full stack",
  numero: "N.",
  totale: "TOTALE",
  daParlarne: "DA PARLARNE",
  parliamone: "Parliamone",
  strappa: "strappa ✂",
  tavola: "TAV.",
  scala: "SCALA 1:1",
  firma: "A. GHIDARA",
};

const vero = (container: HTMLElement) =>
  container.querySelector<HTMLElement>("[data-scontrino-carta]:not([data-fantasma])");

describe("la figura sulla carta, con il movimento acceso", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Il telefono: la figura si vede (in jsdom nessuno ha un'altezza).
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return this.matches('[data-riga="figura"]') ? 200 : 0;
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
    const { container } = render(<ScontrinoStampante servizi={servizi} testi={testi} locale="it" />);
    fireEvent.click(screen.getByRole("button", { name: /Titolo 1/ }));
    act(() => vi.advanceTimersByTime(CADUTA));
    act(() => vi.advanceTimersByTime(20000));
    expect(vero(container)?.querySelector('[data-riga="figura"]')).not.toBeNull();
    expect(vero(container)?.querySelector('[data-riga="voce"]')).toBeNull();

    act(() => vi.advanceTimersByTime(FIGURA - 10));
    expect(vero(container)?.querySelector('[data-riga="voce"]')).toBeNull();
    act(() => vi.advanceTimersByTime(20000));
    expect(vero(container)?.querySelectorAll('[data-riga="voce"]')).toHaveLength(servizi[1].pezzi.length);
    expect(vero(container)).toHaveAttribute("data-finito");
  });
});
