import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";
import { renderWithMessages } from "@/test/renderWithMessages";
import { rules } from "@/test/css";
import { DeskStage } from "../DeskStage";
import { cameraScale } from "../layers";

// Il mock di vitest.setup.ts dice sempre "movimento ridotto". Restituisce la
// funzione per cambiare le risposte a pagina aperta.
function mockMedia(matches: (q: string) => boolean) {
  const listeners = new Set<() => void>();
  let answer = matches;
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return answer(query);
    },
    media: query,
    addEventListener: (_: string, h: () => void) => listeners.add(h),
    removeEventListener: (_: string, h: () => void) => listeners.delete(h),
  }));
  return (next: (q: string) => boolean) => {
    answer = next;
    act(() => listeners.forEach((h) => h()));
  };
}

const layers = [0, 1, 2, 3].map((i) => ({
  id: `l${i}`,
  title: `Strato ${i}`,
  lead: `Riga ${i}`,
  objects: Array.from({ length: 6 }, (_, j) => ({
    id: `l${i}-${j}`,
    shape: "sheet" as const,
    // Il post-it bianco: il palco gli appende un ascoltatore del fuoco.
    label: i === 3 && j === 3 ? null : `oggetto ${j}`,
  })),
}));

const props = {
  eyebrow: "Il metodo",
  title: "Tutto quello che non si vede",
  lead: "Un sito finito.",
  centre: "il progetto",
  blank: "E la tua, qual è?",
  note: "23.777 caffè",
  punch: "Il resto è il tavolo.",
  layers,
};

const stageOf = (container: HTMLElement) =>
  container.querySelector("[data-desk-stage]") as HTMLElement;

// Gli ascoltatori di focusin vivi sul palco. Misura quanto vive l'ascoltatore:
// attaccato nella build della camera si staccava solo al revert di gsap.context,
// che al cambio di livello non arriva.
function focusListeners() {
  const live = new Set<unknown>();
  const onStage = (el: HTMLElement, type: string) =>
    type === "focusin" && el.hasAttribute("data-desk-stage");
  const attach = HTMLElement.prototype.addEventListener;
  const detach = HTMLElement.prototype.removeEventListener;
  vi.spyOn(HTMLElement.prototype, "addEventListener").mockImplementation(function (
    this: HTMLElement,
    ...args: Parameters<HTMLElement["addEventListener"]>
  ) {
    if (onStage(this, args[0])) live.add(args[1]);
    return attach.apply(this, args);
  });
  vi.spyOn(HTMLElement.prototype, "removeEventListener").mockImplementation(function (
    this: HTMLElement,
    ...args: Parameters<HTMLElement["removeEventListener"]>
  ) {
    if (onStage(this, args[0])) live.delete(args[1]);
    return detach.apply(this, args);
  });
  return live;
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("sotto i 1024px la sezione e' il gioco", () => {
  it("il gioco sta nel palco al posto del gemello verticale, e il tavolo largo resta", () => {
    mockMedia(() => false);
    const { container } = renderWithMessages(<DeskStage {...props} />);
    const stage = stageOf(container);
    expect(stage.querySelector("[data-game]")).not.toBeNull();
    expect(stage.querySelector('[data-desk-world][data-layout="tall"]')).toBeNull();
    expect(stage.querySelectorAll("[data-desk-world]")).toHaveLength(1);
    expect(stage.querySelector('[data-desk-world][data-layout="wide"]')).not.toBeNull();
  });

  it("viene dopo la testata e prima della tesi: e' li' che il gemello stava", () => {
    mockMedia(() => false);
    const { container } = renderWithMessages(<DeskStage {...props} />);
    const children = [...stageOf(container).children];
    const game = children.findIndex((el) => el.hasAttribute("data-game"));
    expect(game).toBeGreaterThan(children.findIndex((el) => el.hasAttribute("data-desk-title")));
    expect(game).toBeLessThan(children.findIndex((el) => el.hasAttribute("data-desk-punch")));
  });
});

describe("il palco dichiara il livello", () => {
  it("lo scrive dove il CSS lo cerca: e' li' che si appende l'altezza del track", () => {
    mockMedia(() => false);
    const { container } = renderWithMessages(<DeskStage {...props} />);
    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion");
  });

  it("chi ha chiesto meno movimento non viene agganciato", () => {
    mockMedia((q) => q.includes("prefers-reduced-motion"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "none");
  });

  it("su touch il tavolo non si aggancia: reduced, non full", () => {
    // Schermo largo ma puntatore non fine: un tablet.
    mockMedia((q) => q.includes("min-width"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "reduced");
  });
});

describe("il patto del fallback regge anche sul palco", () => {
  it("a movimento ridotto nessuno scrive --p: vale 1, e il tavolo si vede intero", () => {
    mockMedia((q) => q.includes("min-width"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    expect(stageOf(container).style.getPropertyValue("--p")).toBe("");
    expect(stageOf(container).style.getPropertyValue("--s")).toBe("");
  });
});

describe("la camera", () => {
  it("al fotogramma zero il piano e' ingrandito e il tavolo e' ancora vuoto", async () => {
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    const stage = stageOf(container);
    // GSAP si carica dopo la prima pittura (useSectionAnimation): si aspetta.
    await waitFor(() => expect(stage.style.getPropertyValue("--p")).toBe("0.0000"));
    expect(Number(stage.style.getPropertyValue("--s"))).toBeGreaterThan(1);
  });

  it("scrive due property e non tocca un elemento: le opacita' le fa il CSS", async () => {
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    // GSAP si carica dopo la prima pittura (useSectionAnimation): si aspetta.
    await waitFor(() => {
      const written = [...stageOf(container).style].filter((p) => p.startsWith("--"));
      expect(written.sort()).toEqual(["--p", "--s"]);
    });

    for (const el of container.querySelectorAll("[data-desk-object]")) {
      expect((el as HTMLElement).style.opacity).toContain("var(--p, 1)");
    }
  });

  it("chi accende la riduzione del movimento a meta' strada ritrova il tavolo intero", async () => {
    const changeMind = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    // GSAP si carica dopo la prima pittura (useSectionAnimation): si aspetta.
    await waitFor(() => expect(stageOf(container).style.getPropertyValue("--p")).not.toBe(""));

    changeMind((q) => q.includes("prefers-reduced-motion"));

    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "none");
    expect(stageOf(container).style.getPropertyValue("--p")).toBe("");
    expect(stageOf(container).style.getPropertyValue("--s")).toBe("");
  });

  it("chi esce dal movimento pieno non si porta dietro il salto al fuoco", () => {
    // Fuori da "full" il salto al fuoco muoverebbe una pagina che deve stare ferma.
    const live = focusListeners();
    const changeMind = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    expect(live.size).toBe(1);

    changeMind((q) => q.includes("prefers-reduced-motion"));

    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "none");
    expect(live.size).toBe(0);
  });

  it("il fuoco da tastiera sul post-it porta la pagina al fotogramma di riposo, e smette all'uscita da «full»", () => {
    const jump = vi.fn();
    vi.stubGlobal("scrollTo", jump);
    const changeMind = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = renderWithMessages(<DeskStage {...props} />);
    const postit = container.querySelector(
      '[data-desk-world][data-layout="wide"] [data-desk-blank]',
    ) as HTMLElement;

    postit.focus();
    // Senza questa riga il verde qui sotto non direbbe niente.
    expect(postit.matches(":focus-visible")).toBe(true);
    expect(jump).toHaveBeenCalledTimes(1);

    changeMind((q) => q.includes("prefers-reduced-motion"));

    const arrived: Event[] = [];
    stageOf(container).addEventListener("focusin", (e) => arrived.push(e));
    postit.blur();
    postit.focus();
    expect(arrived).toHaveLength(1);
    expect(postit.matches(":focus-visible")).toBe(true);
    expect(jump).toHaveBeenCalledTimes(1);
  });

  // Guardie: erano gia' vere prima della correzione, e la correzione poteva romperle.
  it("guardia: smontando il palco l'ascoltatore se ne va con lui", () => {
    const live = focusListeners();
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { unmount } = renderWithMessages(<DeskStage {...props} />);
    expect(live.size).toBe(1);
    unmount();
    expect(live.size).toBe(0);
  });

  it("guardia: a movimento ridotto non viene attaccato per niente", () => {
    const live = focusListeners();
    mockMedia((q) => q.includes("prefers-reduced-motion"));
    renderWithMessages(<DeskStage {...props} />);
    expect(live.size).toBe(0);
  });

  it("smontando il palco le due property se ne vanno con lui", async () => {
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container, unmount } = renderWithMessages(<DeskStage {...props} />);
    const stage = stageOf(container);
    // GSAP si carica dopo la prima pittura (useSectionAnimation): si aspetta.
    await waitFor(() => expect(stage.style.getPropertyValue("--p")).not.toBe(""));
    unmount();
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
    let previous = cameraScale(0, 4, 1);
    for (let p = 0.05; p <= 1.0001; p += 0.05) {
      const current = cameraScale(p, 4, 1);
      expect(current).toBeLessThan(previous);
      previous = current;
    }
  });
});

describe("il post-it dice una cosa sola per volta", () => {
  it("a tavolo fermo la nota si toglie, come si toglie al passaggio del mouse", () => {
    // A tavolo fermo l'hover non arriva mai: senza questa regola nota e domanda
    // si leggono una sopra l'altra.
    const still = rules(/\[data-desk\]:not\(\[data-motion="full"\]\)/).find((r) =>
      /\[data-desk-note\]/.test(r.selector),
    );
    expect(still, "manca la regola che spegne la nota a tavolo fermo").toBeDefined();
    expect(still!.body).toMatch(/opacity:\s*0/);
  });
});
