import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { ThreadSegment } from "../ThreadSegment";
import { THREAD_ANCHORS, SECTION_ORDER, INTERRUZIONE } from "../anchors";

describe("ancoraggi del filo", () => {
  it("copre tutte le sezioni attraversate dal filo", () => {
    expect(Object.keys(THREAD_ANCHORS).sort()).toEqual([...SECTION_ORDER].sort());
  });

  it("il filo è continuo, tranne dove è dichiarato che si interrompe", () => {
    // Il tavolo non disegna il filo, e non e' una dimenticanza: e' una camera
    // alta 380vh col palco inchiodato, e una linea che la attraversa o taglia
    // la scena o resta coperta per tutta la corsa. L'interruzione e' quindi
    // DICHIARATA in anchors.ts, e questa prova pretende che sia esattamente
    // una e che sia quella: una seconda vuol dire che il filo si e' spezzato
    // per sbaglio da qualche altra parte.
    const rotture: string[] = [];
    for (let i = 0; i < SECTION_ORDER.length - 1; i++) {
      const da = SECTION_ORDER[i];
      const a = SECTION_ORDER[i + 1];
      if (THREAD_ANCHORS[a].in !== THREAD_ANCHORS[da].out) rotture.push(`${da}->${a}`);
    }
    expect(rotture, "il filo si spezza in un punto non dichiarato").toEqual([
      `${INTERRUZIONE[0]}->${INTERRUZIONE[1]}`,
    ]);
  });

  it("l'interruzione nomina due sezioni che esistono e sono consecutive", () => {
    const [da, a] = INTERRUZIONE;
    expect(SECTION_ORDER).toContain(da);
    expect(SECTION_ORDER).toContain(a);
    expect(SECTION_ORDER.indexOf(a)).toBe(SECTION_ORDER.indexOf(da) + 1);
  });

  it("ogni ancoraggio sta dentro la larghezza della pagina", () => {
    for (const anchor of Object.values(THREAD_ANCHORS)) {
      expect(anchor.in).toBeGreaterThanOrEqual(0);
      expect(anchor.in).toBeLessThanOrEqual(100);
      expect(anchor.out).toBeGreaterThanOrEqual(0);
      expect(anchor.out).toBeLessThanOrEqual(100);
    }
  });
});

describe("ThreadSegment", () => {
  it("è decorativo e non viene letto dagli screen reader", () => {
    const { container } = render(<ThreadSegment section="hero" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("disegna il tratto dall'ancoraggio di entrata a quello di uscita", () => {
    const { container } = render(<ThreadSegment section="works" />);
    const d = container.querySelector("path")?.getAttribute("d") ?? "";
    expect(d).toContain(`M${THREAD_ANCHORS.works.in} 0`);
    expect(d).toContain(`${THREAD_ANCHORS.works.out} 100`);
  });
});

describe("il filo si vede davvero", () => {
  it("usa il colore dedicato, non quello dei bordi", () => {
    const { container } = render(<ThreadSegment section="hero" />);
    expect(container.querySelector("path")).toHaveAttribute("stroke", "var(--filo)");
  });

  it("ha uno spessore che il browser riesce a dipingere", () => {
    // `vector-effect: non-scaling-stroke` rende lo strokeWidth pixel CSS, non
    // unita' del viewBox: 0.3 voleva dire 0.3 pixel, cioe' un tratto dipinto
    // al 29% dall'antialiasing. Misurato in pagina: 1.05:1 sulla carta, e
    // 1.09:1 sull'arancio dove si moltiplicava anche per opacity-40.
    const { container } = render(<ThreadSegment section="hero" />);
    const spessore = Number(container.querySelector("path")?.getAttribute("stroke-width"));
    expect(spessore).toBeGreaterThanOrEqual(1);
  });
});

describe("chi disegna il filo", () => {
  // Erano tre: <ThreadSegment>, i cavi del tavolo e la serpentina di «E in
  // pratica?». Adesso e' uno solo, perche' il tavolo non disegna piu' niente
  // (vedi la nota in anchors.ts) e con lui se ne sono andati gli altri due.
  // La prova resta perche' il difetto che chiude e' ancora possibile: un
  // tratto sotto il pixel esce dipinto al 29% dall'antialiasing, e --line e'
  // il colore dei bordi, che sull'arancio non si legge.
  const sorgenti = ["src/components/thread/ThreadSegment.tsx"];

  it("usa --filo, e non scende sotto il pixel", () => {
    for (const percorso of sorgenti) {
      const codice = readFileSync(path.resolve(__dirname, "../../../..", percorso), "utf8");
      expect(codice, `${percorso} disegna ancora il filo con --line`).not.toMatch(
        /stroke="var\(--line\)"/,
      );
      for (const [, valore] of codice.matchAll(/strokeWidth="([\d.]+)"/g)) {
        expect(Number(valore), `${percorso} ha un tratto di ${valore}px`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("nessun altro file disegna un tratto che somigli al filo", () => {
    // Il difetto che ha fatto tornare indietro due volte: tolto il filo dalla
    // sezione del tavolo restava la derivazione, un cavo dal laptop al
    // gestionale, con lo STESSO colore e lo STESSO spessore. Sulla pagina
    // nessuno puo' distinguerla dal filo, e infatti non e' stata distinta.
    for (const percorso of [
      "src/components/sections/Services/DeskTable.tsx",
      "src/components/sections/Services/Practice.tsx",
    ]) {
      const codice = readFileSync(path.resolve(__dirname, "../../../..", percorso), "utf8");
      expect(codice, `${percorso} ha ricominciato a disegnare col colore del filo`).not.toMatch(
        /stroke="var\(--filo\)"/,
      );
    }
  });

  it("nessuna sezione sbiadisce il filo con opacity", () => {
    // Le due sezioni arancioni lo montavano con `opacity-40`, moltiplicando
    // per 0,4 un tratto gia' dipinto al 29%: l'11% misurato in pagina. Erano
    // anche le due in cui il colore era gia' il piu' debole.
    for (const vista of ["Seeking/SeekingView", "Journey/JourneyView"]) {
      const codice = readFileSync(
        path.resolve(__dirname, "../../sections", `${vista}.tsx`),
        "utf8",
      );
      expect(codice, `${vista} sbiadisce il filo`).not.toMatch(/<ThreadSegment[^>]*opacity-/);
    }
  });
});
