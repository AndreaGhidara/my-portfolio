import { describe, it, expect } from "vitest";
import { deskLayers } from "@/content/desk";
import {
  LAYER_BEATS,
  OBJECTS_PER_LAYER,
  PUNCH_BEAT,
  SHAPE_BOX,
  TITLE_BEAT,
  WORLD,
  cameraScale,
  centreBox,
  drawWidth,
  objectBeat,
  objectExtent,
  placeObject,
  type DeskDrawing,
  type DeskLayout,
} from "../layers";
import { SHAPES } from "../../../../../scripts/build-desk.mjs";

const LAYOUTS: DeskLayout[] = ["wide", "tall"];

/**
 * Il rettangolo che un oggetto occupa davvero: centro piu' le sue mezze
 * estensioni. Le sagome hanno proporzioni molto diverse (il telefono e' 74x148,
 * il piatto 118x54): un margine unico per tutti sarebbe un numero indovinato, e
 * un test che guarda il centro mentre il disegno esce dal bordo non protegge
 * niente.
 */
function boxOf(layout: DeskLayout, layer: number, index: number) {
  const { shape } = deskLayers[layer].objects[index];
  const { x, y, rotate } = placeObject(layout, layer, index);
  const half = objectExtent(layout, shape, rotate);
  return { x0: x - half.x, x1: x + half.x, y0: y - half.y, y1: y + half.y };
}

/** Due rettangoli che si toccano, anche solo per un angolo. */
function overlap(a: ReturnType<typeof boxOf>, b: ReturnType<typeof boxOf>) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

describe("il mondo del tavolo", () => {
  it("ha due formati: orizzontale per il desktop, verticale per il telefono", () => {
    expect(WORLD.wide.width).toBeGreaterThan(WORLD.wide.height);
    expect(WORLD.tall.height).toBeGreaterThan(WORLD.tall.width);
  });

  it("sul telefono mostra meno oggetti per strato: quattro invece di sei", () => {
    expect(OBJECTS_PER_LAYER.wide).toBe(6);
    expect(OBJECTS_PER_LAYER.tall).toBe(4);
  });

  it("ogni strato ha almeno tanti oggetti quanti il formato ne mostra", () => {
    for (const layer of deskLayers) {
      expect(layer.objects.length).toBeGreaterThanOrEqual(OBJECTS_PER_LAYER.wide);
    }
  });
});

describe("quanto sono grandi gli oggetti", () => {
  it("misurano quello che dice il generatore delle sagome: i due file non possono divergere", () => {
    for (const [name, spec] of Object.entries(SHAPES)) {
      expect(SHAPE_BOX[name as keyof typeof SHAPE_BOX], name).toEqual({ w: spec.w, h: spec.h });
    }
  });

  it("sul tavolo hanno le proporzioni del loro disegno: il telefono resta stretto e alto", () => {
    // La trappola: il mondo non e' quadrato, e una percentuale orizzontale e una
    // verticale non misurano lo stesso lato. Sbagliando, il telefono (74x148)
    // verrebbe alto un terzo del tavolo.
    for (const layout of LAYOUTS) {
      for (const [name, box] of Object.entries(SHAPE_BOX)) {
        const half = objectExtent(layout, name as DeskDrawing, 0);
        const larghezza = (half.x * 2 * WORLD[layout].width) / 100;
        const altezza = (half.y * 2 * WORLD[layout].height) / 100;
        expect(larghezza / altezza, `${layout}/${name}`).toBeCloseTo(box.w / box.h, 5);
      }
    }
  });

  it("nel mondo verticale si disegnano piu' piccoli: a misura naturale un foglio sarebbe un quinto della larghezza", () => {
    const naturale = (SHAPE_BOX.sheet.w * 100) / WORLD.tall.width;
    expect(naturale).toBeGreaterThan(20);
    expect(drawWidth("tall", "sheet")).toBeLessThan(naturale * 0.6);
  });
});

describe("dove finiscono gli oggetti", () => {
  it("restano dentro il mondo col disegno intero, non solo col centro", () => {
    for (const layout of LAYOUTS) {
      for (let layer = 0; layer < deskLayers.length; layer++) {
        for (let i = 0; i < OBJECTS_PER_LAYER[layout]; i++) {
          const box = boxOf(layout, layer, i);
          const dove = `${layout} strato ${layer} oggetto ${i}`;
          expect(box.x0, dove).toBeGreaterThan(0);
          expect(box.x1, dove).toBeLessThan(100);
          expect(box.y0, dove).toBeGreaterThan(0);
          expect(box.y1, dove).toBeLessThan(100);
        }
      }
    }
  });

  it("non coprono il laptop: nemmeno un angolo entra nel centro", () => {
    for (const layout of LAYOUTS) {
      const centro = centreBox(layout);
      for (let layer = 0; layer < deskLayers.length; layer++) {
        for (let i = 0; i < OBJECTS_PER_LAYER[layout]; i++) {
          const dove = `${layout} strato ${layer} oggetto ${i} copre il laptop`;
          expect(overlap(boxOf(layout, layer, i), centro), dove).toBe(false);
        }
      }
    }
  });

  it("gli strati si allontanano: piu' e' alto il numero, piu' e' lontano dal centro", () => {
    for (const layout of LAYOUTS) {
      const distanze = deskLayers.map((_, layer) => {
        const p = placeObject(layout, layer, 0);
        return Math.hypot(p.x - 50, p.y - 50);
      });
      for (let i = 1; i < distanze.length; i++) {
        expect(distanze[i], `${layout} strato ${i}`).toBeGreaterThan(distanze[i - 1]);
      }
    }
  });

  it("nessun oggetto si sovrappone a un altro dello stesso strato", () => {
    for (const layout of LAYOUTS) {
      for (let layer = 0; layer < deskLayers.length; layer++) {
        const punti = Array.from({ length: OBJECTS_PER_LAYER[layout] }, (_, i) =>
          placeObject(layout, layer, i),
        );
        for (let a = 0; a < punti.length; a++) {
          for (let b = a + 1; b < punti.length; b++) {
            const d = Math.hypot(punti[a].x - punti[b].x, punti[a].y - punti[b].y);
            expect(d, `${layout} strato ${layer}: ${a} e ${b} si toccano`).toBeGreaterThan(11);
          }
        }
      }
    }
  });

  it("li inclina un po', ma sempre allo stesso modo: il disegno non balla fra un render e l'altro", () => {
    const primo = placeObject("wide", 2, 3);
    const secondo = placeObject("wide", 2, 3);
    expect(primo).toEqual(secondo);
    expect(Math.abs(primo.rotate)).toBeLessThanOrEqual(8);
  });
});

describe("quando entrano", () => {
  it("i quattro strati stanno dentro lo scroll, in ordine", () => {
    expect(LAYER_BEATS).toHaveLength(4);
    for (const w of LAYER_BEATS) {
      expect(w.from).toBeGreaterThanOrEqual(0);
      expect(w.from + w.span).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < LAYER_BEATS.length; i++) {
      expect(LAYER_BEATS[i].from).toBeGreaterThan(LAYER_BEATS[i - 1].from);
    }
  });

  it("si sovrappongono di circa un terzo: e' cosi' che 380vh reggono l'arco di 560", () => {
    for (let i = 1; i < LAYER_BEATS.length; i++) {
      const precedente = LAYER_BEATS[i - 1];
      const sovrapposizione = precedente.from + precedente.span - LAYER_BEATS[i].from;
      const quota = sovrapposizione / precedente.span;
      expect(quota).toBeGreaterThan(0.2);
      expect(quota).toBeLessThan(0.45);
    }
  });

  it("il titolo se ne va prima che entri il primo strato", () => {
    expect(TITLE_BEAT.from + TITLE_BEAT.span).toBeLessThanOrEqual(LAYER_BEATS[0].from);
  });

  it("la tesi arriva quando il tavolo e' completo", () => {
    const ultimo = LAYER_BEATS[LAYER_BEATS.length - 1];
    expect(PUNCH_BEAT.from).toBeGreaterThanOrEqual(ultimo.from + ultimo.span);
    expect(PUNCH_BEAT.from + PUNCH_BEAT.span).toBeLessThanOrEqual(1);
  });

  it("dentro uno strato gli oggetti entrano sfalsati, ma finiscono tutti col loro strato", () => {
    const count = OBJECTS_PER_LAYER.wide;
    const strato = LAYER_BEATS[1];
    const primo = objectBeat(1, 0, count);
    const ultimo = objectBeat(1, count - 1, count);
    expect(ultimo.from).toBeGreaterThan(primo.from);
    expect(ultimo.from + ultimo.span).toBeLessThanOrEqual(strato.from + strato.span + 1e-9);
  });
});

describe("la camera", () => {
  it("parte lontana e arriva a riposo", () => {
    expect(cameraScale(0, 3.3, 1)).toBeCloseTo(3.3);
    expect(cameraScale(1, 3.3, 1)).toBeCloseTo(1);
  });

  it("arretra e basta: non torna mai indietro", () => {
    let precedente = cameraScale(0, 3.3, 1);
    for (let p = 0.05; p <= 1; p += 0.05) {
      const attuale = cameraScale(p, 3.3, 1);
      expect(attuale).toBeLessThan(precedente);
      precedente = attuale;
    }
  });

  it("arretra a velocita' costante, non a distanza costante: e' come si muove un dolly vero", () => {
    // A meta' corsa una scala esponenziale sta sotto la media aritmetica.
    const meta = cameraScale(0.5, 4, 1);
    expect(meta).toBeLessThan((4 + 1) / 2);
    expect(meta).toBeGreaterThan(1);
  });
});
