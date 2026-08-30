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
    // Il quarto dell'ultimo strato e' il post-it bianco: senza etichetta, e
    // quindi con il comando. Serve qui perche' il palco porta un ascoltatore
    // che vive solo per lui.
    label: i === 3 && j === 3 ? null : `oggetto ${j}`,
  })),
}));

const props = {
  eyebrow: "Il metodo",
  title: "Tutto quello che non si vede",
  lead: "Un sito finito.",
  centre: "il progetto",
  blank: "E la tua, qual è?",
  punch: "Il resto è il tavolo.",
  layers,
};

const palco = (container: HTMLElement) =>
  container.querySelector("[data-desk-stage]") as HTMLElement;

/**
 * Gli ascoltatori di `focusin` vivi sul palco, in un insieme che si svuota da
 * solo quando vengono staccati.
 *
 * E' una prova che guarda dentro, e non e' pigrizia: quello che l'ascoltatore FA
 * qui non si puo' provocare, perche' jsdom non implementa :focus-visible e
 * risponde false anche a un elemento che ha appena preso il fuoco. Quello che
 * conta comunque e' un'altra cosa — quanto vive — ed e' esattamente li' che il
 * difetto stava: attaccato dentro la build della camera, si staccava solo al
 * revert di gsap.context, che al cambio di livello non arriva mai.
 */
function ascoltatoriDelFuoco() {
  const vivi = new Set<unknown>();
  const suPalco = (el: HTMLElement, tipo: string) =>
    tipo === "focusin" && el.hasAttribute("data-desk-stage");
  const attacca = HTMLElement.prototype.addEventListener;
  const stacca = HTMLElement.prototype.removeEventListener;
  vi.spyOn(HTMLElement.prototype, "addEventListener").mockImplementation(function (
    this: HTMLElement,
    ...args: Parameters<HTMLElement["addEventListener"]>
  ) {
    if (suPalco(this, args[0])) vivi.add(args[1]);
    return attacca.apply(this, args);
  });
  vi.spyOn(HTMLElement.prototype, "removeEventListener").mockImplementation(function (
    this: HTMLElement,
    ...args: Parameters<HTMLElement["removeEventListener"]>
  ) {
    if (suPalco(this, args[0])) vivi.delete(args[1]);
    return stacca.apply(this, args);
  });
  return vivi;
}

beforeEach(() => vi.unstubAllGlobals());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

  it("chi esce dal movimento pieno non si porta dietro il salto al fuoco", () => {
    // Il salto al fotogramma di riposo esiste perche' sotto la camera l'oggetto
    // che prende il fuoco e' ingrandito e ritagliato via. Fuori da "full" la
    // camera non c'e', il track torna alto quanto il suo contenuto, e quello
    // stesso salto diventa una pagina che si muove senza che nessuno l'abbia
    // chiesto — nei due stati in cui questa sezione deve stare ferma, e sotto i
    // 1024px per una fermata del Tab che nemmeno si vede.
    const vivi = ascoltatoriDelFuoco();
    const cambiaIdea = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = render(<DeskStage {...props} />);
    expect(vivi.size).toBe(1);

    cambiaIdea((q) => q.includes("prefers-reduced-motion"));

    expect(container.querySelector("[data-desk]")).toHaveAttribute("data-motion", "none");
    expect(vivi.size).toBe(0);
  });

  it("il fuoco da tastiera sul post-it porta la pagina al fotogramma di riposo, e smette all'uscita da «full»", () => {
    // La prova di sopra misura quanti ascoltatori vivono; questa misura cosa
    // sente un utente. Servono tutte e due: la prima passerebbe anche con una
    // correzione sbagliata — l'ascoltatore lasciato dentro la build della camera
    // e un removeEventListener appiccicato a spegni() — e non guarda ne' la
    // guardia del :focus-visible ne' dove si va a finire.
    const salta = vi.fn();
    vi.stubGlobal("scrollTo", salta);
    const cambiaIdea = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = render(<DeskStage {...props} />);
    const postit = container.querySelector(
      '[data-desk-world][data-layout="wide"] [data-desk-blank]',
    ) as HTMLElement;

    postit.focus();
    // Che la guardia sia passata davvero, e non che l'evento non sia mai
    // arrivato: senza questa riga il verde qui sotto non direbbe niente.
    expect(postit.matches(":focus-visible")).toBe(true);
    expect(salta).toHaveBeenCalledTimes(1);

    cambiaIdea((q) => q.includes("prefers-reduced-motion"));

    // Fuori da "full" il track e' tornato alto quanto il suo contenuto: lo stesso
    // salto diventa una pagina che si muove senza che nessuno l'abbia chiesto.
    const arrivati: Event[] = [];
    palco(container).addEventListener("focusin", (e) => arrivati.push(e));
    postit.blur();
    postit.focus();
    // Il fuoco c'e' ancora e il focusin arriva ancora al palco: quello che manca
    // e' solo chi lo ascoltava.
    expect(arrivati).toHaveLength(1);
    expect(postit.matches(":focus-visible")).toBe(true);
    expect(salta).toHaveBeenCalledTimes(1);
  });

  // Le due che seguono non provano la correzione — erano gia' vere prima, perche'
  // lo smontaggio passa dal revert di gsap.context e a livello ridotto la build
  // non gira nemmeno. Sono guardie: tengono i due lati che la correzione avrebbe
  // potuto rompere spostando l'ascoltatore in un effetto suo.
  it("guardia: smontando il palco l'ascoltatore se ne va con lui", () => {
    const vivi = ascoltatoriDelFuoco();
    mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { unmount } = render(<DeskStage {...props} />);
    expect(vivi.size).toBe(1);
    unmount();
    expect(vivi.size).toBe(0);
  });

  it("guardia: a movimento ridotto non viene attaccato per niente", () => {
    const vivi = ascoltatoriDelFuoco();
    mockMedia((q) => q.includes("prefers-reduced-motion"));
    render(<DeskStage {...props} />);
    expect(vivi.size).toBe(0);
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
