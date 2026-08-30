import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { DeskStage } from "../DeskStage";
import { cameraScale } from "../layers";

/**
 * jsdom risponde a matchMedia con il mock di vitest.setup.ts, che dice sempre
 * "movimento ridotto": qui serve poterlo cambiare query per query. Restituisce
 * la manopola per cambiare idea a pagina aperta — che e' quello che fa un utente
 * vero quando accende la riduzione del movimento o stringe la finestra.
 */
function mockMedia(matches: (q: string) => boolean) {
  const ascoltatori = new Set<() => void>();
  let risponde = matches;
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return risponde(query);
    },
    media: query,
    addEventListener: (_: string, h: () => void) => ascoltatori.add(h),
    removeEventListener: (_: string, h: () => void) => ascoltatori.delete(h),
  }));
  return (poi: (q: string) => boolean) => {
    risponde = poi;
    act(() => ascoltatori.forEach((h) => h()));
  };
}

const layers = [0, 1, 2, 3].map((i) => ({
  id: `l${i}`,
  title: `Strato ${i}`,
  lead: `Riga ${i}`,
  objects: Array.from({ length: 6 }, (_, j) => ({
    id: `l${i}-${j}`,
    shape: "sheet" as const,
    label: `oggetto ${j}`,
  })),
}));

const props = {
  eyebrow: "Il metodo",
  title: "Tutto quello che non si vede",
  lead: "Un sito finito.",
  centre: "il progetto",
  punch: "Il resto è il tavolo.",
  layers,
};

const palco = (container: HTMLElement) =>
  container.querySelector("[data-desk-stage]") as HTMLElement;

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => cleanup());

describe("il palco dichiara il livello", () => {
  it("lo scrive dove il CSS lo cerca: e' li' che si appende l'altezza del track", () => {
    mockMedia(() => false);
    const { container } = render(<DeskStage {...props} />);
    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion");
  });

  it("chi ha chiesto meno movimento non viene agganciato", () => {
    mockMedia((q) => q.includes("prefers-reduced-motion"));
    const { container } = render(<DeskStage {...props} />);
    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "none");
  });

  it("su touch il tavolo non si aggancia: reduced, non full", () => {
    // Schermo largo, ma puntatore non fine: e' un tablet, e il tavolo resta fermo.
    mockMedia((q) => q.includes("min-width"));
    const { container } = render(<DeskStage {...props} />);
    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "reduced");
  });
});

describe("il patto del fallback regge anche sul palco", () => {
  it("a movimento ridotto nessuno scrive --p: vale 1, e il tavolo si vede intero", () => {
    mockMedia((q) => q.includes("min-width"));
    const { container } = render(<DeskStage {...props} />);
    expect(palco(container).style.getPropertyValue("--p")).toBe("");
    expect(palco(container).style.getPropertyValue("--s")).toBe("");
  });
});

describe("la camera", () => {
  it("al fotogramma zero il piano e' ingrandito e il tavolo e' ancora vuoto", () => {
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = render(<DeskStage {...props} />);
    const stage = palco(container);
    expect(stage.style.getPropertyValue("--p")).toBe("0.0000");
    // La camera parte arretrata: --s e' la scala d'apertura, non 1.
    expect(Number(stage.style.getPropertyValue("--s"))).toBeGreaterThan(1);
  });

  it("scrive due property e non tocca un elemento: le opacita' le fa il CSS", () => {
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = render(<DeskStage {...props} />);
    // Il palco porta solo --p e --s. Se un giorno la camera cominciasse a
    // scrivere opacita' o transform, questo conto cambia — ed e' il punto.
    const scritte = [...palco(container).style].filter((p) => p.startsWith("--"));
    expect(scritte.sort()).toEqual(["--p", "--s"]);

    // Gli oggetti restano quelli che React ha reso: l'opacita' e' ancora la
    // formula col default 1, non un numero calcolato per fotogramma.
    for (const el of container.querySelectorAll("[data-desk-object]")) {
      expect((el as HTMLElement).style.opacity).toContain("var(--p, 1)");
    }
  });

  it("chi accende la riduzione del movimento a meta' strada ritrova il tavolo intero", () => {
    const cambiaIdea = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = render(<DeskStage {...props} />);
    expect(palco(container).style.getPropertyValue("--p")).not.toBe("");

    cambiaIdea((q) => q.includes("prefers-reduced-motion"));

    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "none");
    // Il CSS del movimento si spegne da solo, ma l'opacita' degli oggetti legge
    // --p SEMPRE: lasciarla appiccicata all'ultimo valore vorrebbe dire un
    // tavolo fermo e mezzo trasparente, che e' peggio di tutti e due gli stati.
    expect(palco(container).style.getPropertyValue("--p")).toBe("");
    expect(palco(container).style.getPropertyValue("--s")).toBe("");
  });

  it("smontando il palco le due property se ne vanno con lui", () => {
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container, unmount } = render(<DeskStage {...props} />);
    const stage = palco(container);
    expect(stage.style.getPropertyValue("--p")).not.toBe("");
    unmount();
    // Restassero appiccicate a --p = 0, il tavolo resterebbe vuoto per sempre.
    expect(stage.style.getPropertyValue("--p")).toBe("");
    expect(stage.style.getPropertyValue("--s")).toBe("");
  });
});

describe("cameraScale e' una camera, non una curva qualsiasi", () => {
  it("parte da dove le si dice e arriva a uno: il fotogramma finale e' il riposo", () => {
    expect(cameraScale(0, 4, 1)).toBeCloseTo(4, 6);
    expect(cameraScale(1, 4, 1)).toBeCloseTo(1, 6);
  });

  it("arretra sempre, senza mai tornare indietro", () => {
    let prima = cameraScale(0, 4, 1);
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      const ora = cameraScale(p, 4, 1);
      expect(ora).toBeLessThan(prima);
      prima = ora;
    }
  });
});
