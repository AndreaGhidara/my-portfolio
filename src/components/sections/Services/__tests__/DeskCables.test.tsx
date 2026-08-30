import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { ScrollTrigger } from "@/animations/gsap";
import { DeskCables } from "../DeskCables";
import { THREAD_ANCHORS } from "@/components/thread/anchors";

/**
 * Niente stub di matchMedia: quello di vitest.setup.ts risponde "movimento
 * ridotto", il livello risolto e' "none" e `weave` non parte. E' quello che
 * serve — jsdom non sa dire quanto e' lungo un path, e un cavo che si tesse
 * davvero qui dentro esploderebbe su getTotalLength senza provare niente.
 * E' anche la scelta di ThreadSegment.test.tsx, che prova la stessa cosa.
 */
describe("i cavi", () => {
  it("sono decorativi: il filo non si legge, si vede", () => {
    const { container } = render(<DeskCables />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("entrano dove il filo entra nella sezione e escono dove esce", () => {
    const { container } = render(<DeskCables />);
    const ds = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "");
    const entrata = THREAD_ANCHORS.services.in;
    const uscita = THREAD_ANCHORS.services.out;
    expect(ds.some((d) => d.startsWith(`M${entrata} `))).toBe(true);
    expect(ds.some((d) => d.trimEnd().endsWith(` ${uscita} 100`))).toBe(true);
  });

  it("passano dal centro: e' dal laptop che escono", () => {
    const { container } = render(<DeskCables />);
    const ds = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d") ?? "");
    expect(ds.some((d) => d.includes("50 50"))).toBe(true);
  });

  it("i capi stanno nella scatola della finestra, la derivazione in quella del piano", () => {
    // Non e' un vezzo che siano due SVG: il 14% e l'88% sono percentuali della
    // pagina — e' li' che escono e entrano le sezioni vicine — mentre il rack in
    // cui finisce la derivazione e' una percentuale del piano. Rimettere i tre
    // tratti in una scatola sola riapre il gradino da 170px alla giunzione,
    // oppure fa scivolare la derivazione fuori dal tavolo.
    const { container } = render(<DeskCables />);
    const di = (sel: string) =>
      [...container.querySelectorAll(`${sel} path`)].map((p) => p.getAttribute("d") ?? "");

    const capi = di("[data-desk-cables-ends]");
    const derivazione = di("[data-desk-cables-branch]");

    expect(capi).toHaveLength(2);
    expect(capi.some((d) => d.startsWith(`M${THREAD_ANCHORS.services.in} `))).toBe(true);
    expect(capi.some((d) => d.trimEnd().endsWith(` ${THREAD_ANCHORS.services.out} 100`))).toBe(true);

    expect(derivazione).toHaveLength(1);
    // Tutti e tre partono dallo stesso punto: le due scatole sono concentriche
    // e il loro (50 / 50) e' il laptop.
    expect(derivazione[0].startsWith("M50 50")).toBe(true);
  });

  it("usano il colore della linea, non l'arancio: sono un filo, non un accento", () => {
    const { container } = render(<DeskCables />);
    for (const path of container.querySelectorAll("path")) {
      expect(path.getAttribute("stroke")).toBe("var(--line)");
    }
  });
});

/**
 * jsdom risponde a matchMedia con il mock di vitest.setup.ts, che dice sempre
 * "movimento ridotto": qui serve poterlo cambiare query per query, e a pagina
 * aperta. E' la stessa manopola di DeskStage.test.tsx, e prova la stessa cosa —
 * cosa succede a chi cambia idea mentre la sezione e' gia' sullo schermo.
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

/**
 * I cavi vivono dentro il piano, che vive dentro il track della camera: e' a
 * quello che si agganciano, ed e' li' che vanno contati.
 */
function suUnTrack() {
  const { container } = render(
    <div data-desk-track>
      <DeskCables />
    </div>,
  );
  const track = container.querySelector("[data-desk-track]") as HTMLElement;
  return {
    container,
    track,
    agganciati: () => ScrollTrigger.getAll().filter((t) => t.trigger === track),
  };
}

/**
 * Quanti agganci allo scorrimento restano vivi, e non cosa disegnano: in jsdom
 * un path e' lungo zero (vedi vitest.setup.ts) e il tratteggio non prova
 * niente. Quello che conta e' comunque un'altra cosa — quanto vive l'aggancio —
 * ed e' esattamente li' che stava il difetto: `weave` restituisce una timeline
 * che nessuno teneva, e useGSAP con delle dipendenze rimanda il revert allo
 * smontaggio, non al cambio di livello. Il vecchio scrub restava appeso al
 * track e continuava a riscrivere lo strokeDashoffset a ogni giro di rotellina,
 * addosso a chi aveva appena chiesto di non muovere niente.
 */
describe("i cavi lasciano andare lo scorrimento quando il livello cambia", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("chi accende la riduzione del movimento a meta' strada non si porta dietro lo scrub", () => {
    const cambiaIdea = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { agganciati } = suUnTrack();
    expect(agganciati()).toHaveLength(1);

    cambiaIdea((q) => q.includes("prefers-reduced-motion"));

    // A "none" `weave` non parte nemmeno: se il vecchio non se ne va da solo,
    // non se ne va piu' nessuno fino allo smontaggio.
    expect(agganciati()).toHaveLength(0);
  });

  it("e non lascia il cavo a meta': il tratteggio scritto inline se ne va con lo scrub", () => {
    // `weave` scrive dasharray e dashoffset inline al momento della build, PRIMA
    // che si scorra di un pixel, tutti e due pari alla lunghezza del tratto:
    // cavo invisibile. A "none" `weave` non riparte, quindi se lo scrub muore e
    // quelle due restano, i tre tratti spariscono per sempre — e il fotogramma a
    // riposo, il cui patto e' «il filo e' continuo», diventa un filo tagliato.
    // Uccidere e basta e' peggio di non uccidere: il vecchio scrub, almeno, il
    // cavo lo disegnava.
    //
    // Quello che questa prova NON dimostra: che il cavo si veda. In jsdom un
    // path e' lungo zero (vedi vitest.setup.ts) e gsap scrive due zeri, quindi
    // qui si guarda che le DICHIARAZIONI se ne vadano, non che disegnino. Come
    // si tesse un filo si guarda in un browser.
    const cambiaIdea = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { container } = suUnTrack();
    const tratti = [...container.querySelectorAll("path")];
    expect(tratti).toHaveLength(3);
    for (const tratto of tratti) {
      expect(tratto.style.getPropertyValue("stroke-dasharray")).not.toBe("");
      expect(tratto.style.getPropertyValue("stroke-dashoffset")).not.toBe("");
    }

    cambiaIdea((q) => q.includes("prefers-reduced-motion"));

    for (const tratto of tratti) {
      expect(tratto.style.getPropertyValue("stroke-dasharray"), "tratteggio appiccicato").toBe("");
      expect(tratto.style.getPropertyValue("stroke-dashoffset"), "tratteggio appiccicato").toBe("");
    }
  });

  it("chi stringe la finestra sotto i 1024 non si ritrova due cavi sullo stesso track", () => {
    // Uscita da "full" senza arrivare a "none": la build rigira a "reduced" e
    // ne crea uno nuovo. Contarli e' l'unico modo di accorgersi del vecchio.
    const cambiaIdea = mockMedia((q) => !q.includes("prefers-reduced-motion"));
    const { agganciati } = suUnTrack();
    expect(agganciati()).toHaveLength(1);

    // Puntatore fine ma schermo stretto: e' "reduced", non "none".
    cambiaIdea((q) => q.includes("pointer"));

    expect(agganciati()).toHaveLength(1);
  });
});
