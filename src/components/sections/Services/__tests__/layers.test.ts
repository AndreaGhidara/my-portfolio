import { describe, it, expect } from "vitest";
import { deskLayers } from "@/content/desk";
import { rules } from "@/test/css";
import it_ from "../../../../../messages/it.json";
import en_ from "../../../../../messages/en.json";
import {
  CAPTION_BEATS,
  LABEL,
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
  objectBox,
  objectExtent,
  objectFootprint,
  placeObject,
  type DeskDrawing,
} from "../layers";
import { SHAPES } from "../../../../../scripts/build-desk.mjs";

// In percentuale dell'ALTEZZA del mondo: 1,7 punti sono circa 10,7 px a 1440.
// Il tavolo ne tiene 1,99: un ritocco piccolo passa, una ritaratura vera no.
const CLEARANCE_FLOOR = 1.7;

// Fra anelli diversi conta un'altra cosa: che i quattro anelli si leggano come
// quattro. Sotto 3,0 punti (circa 19 px) l'occhio raggruppa per vicinanza.
const RING_FLOOR = 3.0;

type Rect = { x0: number; x1: number; y0: number; y1: number };

function overlap(a: Rect, b: Rect) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

// In percentuale dell'ALTEZZA: lo stacco orizzontale va riportato sull'altezza
// prima del confronto. Negativo vuol dire sovrapposti.
function clearance(a: Rect, b: Rect) {
  const ratio = WORLD.width / WORLD.height;
  const dx = Math.max(b.x0 - a.x1, a.x0 - b.x1) * ratio;
  const dy = Math.max(b.y0 - a.y1, a.y0 - b.y1);
  return Math.max(dx, dy);
}

function clearanceFromWorld(a: Rect) {
  const ratio = WORLD.width / WORLD.height;
  return Math.min(a.x0 * ratio, (100 - a.x1) * ratio, a.y0, 100 - a.y1);
}

function everyObject() {
  const out: { box: Rect; where: string }[] = [];
  for (let layer = 0; layer < deskLayers.length; layer++) {
    for (let i = 0; i < OBJECTS_PER_LAYER; i++) {
      out.push({
        box: objectBox(layer, i),
        where: `${deskLayers[layer].id}/${deskLayers[layer].objects[i].id}`,
      });
    }
  }
  return out;
}

describe("il mondo del tavolo", () => {
  it("e' orizzontale: si disegna solo da desktop", () => {
    expect(WORLD.width).toBeGreaterThan(WORLD.height);
  });

  it("ogni strato ha almeno tanti oggetti quanti il tavolo ne mostra", () => {
    for (const layer of deskLayers) {
      expect(layer.objects.length).toBeGreaterThanOrEqual(OBJECTS_PER_LAYER);
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
    for (const [name, box] of Object.entries(SHAPE_BOX)) {
      const half = objectExtent(name as DeskDrawing, 0);
      const drawnWidth = (half.x * 2 * WORLD.width) / 100;
      const drawnHeight = (half.y * 2 * WORLD.height) / 100;
      expect(drawnWidth / drawnHeight, name).toBeCloseTo(box.w / box.h, 5);
    }
  });
});

describe("quanto e' grande un oggetto", () => {
  it("un oggetto e' la sagoma PIU' la sua etichetta: la striscia sta nell'ingombro", () => {
    const bare = objectFootprint("sheet", 0, false);
    const labelled = objectFootprint("sheet", 0, true);
    expect(labelled.y1).toBeGreaterThan(bare.y1);
    expect(labelled.y0).toBe(bare.y0);
  });

  it("inclinato occupa il rettangolo che il browser disegna, non uno isotropo", () => {
    // Il conto rifatto dall'altra parte: in pixel, ruotato, e di nuovo in
    // percentuale. Con la matrice isotropa il rettangolo verrebbe sbagliato.
    const { width, height } = WORLD;
    for (const rotate of [-7, -4.2, 3.5, 7]) {
      const upright = objectFootprint("phone", 0, true);
      const radians = (rotate * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      const corners = [
        [upright.x0, upright.y0],
        [upright.x1, upright.y0],
        [upright.x0, upright.y1],
        [upright.x1, upright.y1],
      ]
        .map(([x, y]) => [(x * width) / 100, (y * height) / 100])
        .map(([x, y]) => [x * cos - y * sin, x * sin + y * cos])
        .map(([x, y]) => [(x * 100) / width, (y * 100) / height]);
      const expected = {
        x0: Math.min(...corners.map((a) => a[0])),
        x1: Math.max(...corners.map((a) => a[0])),
        y0: Math.min(...corners.map((a) => a[1])),
        y1: Math.max(...corners.map((a) => a[1])),
      };
      const measured = objectFootprint("phone", rotate, true);
      for (const side of ["x0", "x1", "y0", "y1"] as const) {
        expect(measured[side], `${rotate}° ${side}`).toBeCloseTo(expected[side], 9);
      }
    }
  });

  it("il post-it bianco non ha etichetta e non ne occupa il posto", () => {
    const blank = deskLayers[3].objects.findIndex((o) => o.mute);
    expect(blank).toBeGreaterThanOrEqual(0);
    const labelled = objectFootprint("postit", 0, true);
    const bare = objectFootprint("postit", 0, false);
    expect(bare.y1).toBeLessThan(labelled.y1);
  });
});

describe("dove finiscono gli oggetti", () => {
  it("restano dentro il mondo con tutto quello che sono, etichetta compresa", () => {
    for (const { box, where } of everyObject()) {
      expect(box.x0, where).toBeGreaterThan(0);
      expect(box.x1, where).toBeLessThan(100);
      expect(box.y0, where).toBeGreaterThan(0);
      expect(box.y1, where).toBeLessThan(100);
    }
  });

  it("non coprono il laptop: nemmeno un angolo entra nel centro", () => {
    const centre = centreBox();
    for (const { box, where } of everyObject()) {
      expect(overlap(box, centre), `${where} copre il laptop`).toBe(false);
    }
  });

  it("gli strati si allontanano: piu' e' alto il numero, piu' e' lontano dal centro", () => {
    const distances = deskLayers.map((_, layer) => {
      const p = placeObject(layer, 0);
      return Math.hypot(p.x - 50, p.y - 50);
    });
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i], `strato ${i}`).toBeGreaterThan(distances[i - 1]);
    }
  });

  it("niente si sovrappone a niente, su tutto il tavolo: rettangoli veri, non centri", () => {
    // Rettangoli veri e non centri: le collisioni vere stavano fra strati diversi.
    const objects = everyObject();
    for (let a = 0; a < objects.length; a++) {
      for (let b = a + 1; b < objects.length; b++) {
        const where = `${objects[a].where} × ${objects[b].where}`;
        expect(overlap(objects[a].box, objects[b].box), where).toBe(false);
      }
    }
  });

  it("fra due cose qualsiasi resta aria vera, non un pelo", () => {
    const objects = everyObject();
    const centre = centreBox();
    let worst = Infinity;
    let where = "";
    const record = (air: number, pair: string) => {
      if (air < worst) {
        worst = air;
        where = pair;
      }
    };
    for (let a = 0; a < objects.length; a++) {
      for (let b = a + 1; b < objects.length; b++) {
        record(
          clearance(objects[a].box, objects[b].box),
          `${objects[a].where} × ${objects[b].where}`,
        );
      }
      record(clearance(objects[a].box, centre), `${objects[a].where} × il centro`);
      record(clearanceFromWorld(objects[a].box), `${objects[a].where} × il bordo`);
    }
    expect(worst, `il punto piu' stretto e' ${where}`).toBeGreaterThan(
      CLEARANCE_FLOOR,
    );
  });

  it("gli anelli restano quattro: fra uno e l'altro c'e' piu' aria che dentro", () => {
    const objects: { box: Rect; where: string; ring: number }[] = [];
    for (let layer = 0; layer < deskLayers.length; layer++) {
      for (let i = 0; i < OBJECTS_PER_LAYER; i++) {
        objects.push({
          box: objectBox(layer, i),
          where: `${deskLayers[layer].id}/${deskLayers[layer].objects[i].id}`,
          ring: layer,
        });
      }
    }
    let worst = Infinity;
    let where = "";
    for (let a = 0; a < objects.length; a++) {
      for (let b = a + 1; b < objects.length; b++) {
        if (objects[a].ring === objects[b].ring) continue;
        const air = clearance(objects[a].box, objects[b].box);
        if (air < worst) {
          worst = air;
          where = `${objects[a].where} × ${objects[b].where}`;
        }
      }
    }
    expect(worst, `i due anelli piu' vicini si toccano in ${where}`).toBeGreaterThan(
      RING_FLOOR,
    );
  });

  it("dentro uno strato non stanno a distanze uguali, ma non si ammucchiano", () => {
    // Le due prove sono una coppia: senza la seconda l'irregolarita' si
    // otterrebbe ammucchiando tutto da una parte.
    const count = OBJECTS_PER_LAYER;
    const step = 360 / count;
    const angleOf = (layer: number, i: number) => {
      const p = placeObject(layer, i);
      return (Math.atan2(p.y - 50, p.x - 50) * 180) / Math.PI;
    };
    for (let layer = 0; layer < deskLayers.length; layer++) {
      const gaps: number[] = [];
      for (let i = 0; i < count; i++) {
        let d = angleOf(layer, (i + 1) % count) - angleOf(layer, i);
        while (d <= 0) d += 360;
        expect(Number.isFinite(d), `strato ${layer} oggetto ${i}`).toBe(true);
        gaps.push(d);
      }
      expect(
        gaps.reduce((a, b) => a + b, 0),
        `strato ${layer}: gli oggetti girano una volta sola`,
      ).toBeCloseTo(360, 6);
      const irregularity = Math.max(...gaps.map((d) => Math.abs(d - step)));
      expect(irregularity, `strato ${layer} e' un quadrante`).toBeGreaterThan(step * 0.1);
      expect(Math.min(...gaps), `strato ${layer} si ammucchia`).toBeGreaterThan(
        step * 0.5,
      );
    }
  });

  it("li inclina un po', ma sempre allo stesso modo: il disegno non balla fra un render e l'altro", () => {
    const first = placeObject(2, 3);
    const second = placeObject(2, 3);
    expect(first).toEqual(second);
    expect(Math.abs(first.rotate)).toBeLessThanOrEqual(8);
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
      const previous = LAYER_BEATS[i - 1];
      const overlapSpan = previous.from + previous.span - LAYER_BEATS[i].from;
      const share = overlapSpan / previous.span;
      expect(share).toBeGreaterThan(0.2);
      expect(share).toBeLessThan(0.45);
    }
  });

  it("il titolo se ne va prima che entri il primo strato", () => {
    expect(TITLE_BEAT.from + TITLE_BEAT.span).toBeLessThanOrEqual(LAYER_BEATS[0].from);
  });

  it("la tesi arriva quando il tavolo e' completo", () => {
    const last = LAYER_BEATS[LAYER_BEATS.length - 1];
    expect(PUNCH_BEAT.from).toBeGreaterThanOrEqual(last.from + last.span);
    expect(PUNCH_BEAT.from + PUNCH_BEAT.span).toBeLessThanOrEqual(1);
  });

  it("dentro uno strato gli oggetti entrano sfalsati, ma finiscono tutti col loro strato", () => {
    const count = OBJECTS_PER_LAYER;
    const layerBeat = LAYER_BEATS[1];
    const first = objectBeat(1, 0, count);
    const last = objectBeat(1, count - 1, count);
    expect(last.from).toBeGreaterThan(first.from);
    expect(last.from + last.span).toBeLessThanOrEqual(layerBeat.from + layerBeat.span + 1e-9);
  });
});

describe("la camera", () => {
  it("parte lontana e arriva a riposo", () => {
    expect(cameraScale(0, 3.3, 1)).toBeCloseTo(3.3);
    expect(cameraScale(1, 3.3, 1)).toBeCloseTo(1);
  });

  it("arretra e basta: non torna mai indietro", () => {
    let previous = cameraScale(0, 3.3, 1);
    for (let p = 0.05; p <= 1; p += 0.05) {
      const current = cameraScale(p, 3.3, 1);
      expect(current).toBeLessThan(previous);
      previous = current;
    }
  });

  it("arretra a velocita' costante, non a distanza costante: e' come si muove un dolly vero", () => {
    const midway = cameraScale(0.5, 4, 1);
    expect(midway).toBeLessThan((4 + 1) / 2);
    expect(midway).toBeGreaterThan(1);
  });
});

// Contratto fra layers.ts e styles/sections/desk.css: un ingombro piu'
// piccolo del vero sfuggirebbe a ogni prova di sovrapposizione.
// Cercato come testo, "[data-desk-world]" troverebbe anche la regola della
// camera piu' in giu', e la prova punterebbe in silenzio su un'altra regola.
function ruleBody(selector: string): string {
  const [rule] = rules(selector);
  if (!rule) throw new Error(`il foglio di stile non ha piu' la regola ${selector}`);
  return rule.body;
}

function readNumbers(text: string, declaration: RegExp, where: string): number[] {
  const match = text.match(declaration);
  if (!match) throw new Error(`${where}: non c'e' piu' ${declaration}`);
  return match.slice(1).map(Number);
}

const LABEL_RULE = ruleBody("[data-desk-object] [data-desk-label]");
const WORLD_RULE = ruleBody("[data-desk-world]");

const REM = 16;
const VIEWPORT = 1024;

describe("l'etichetta e' quella che il foglio di stile dichiara", () => {
  it("LABEL.height sono le due righe e il respiro scritti nel CSS", () => {
    const [lineHeight] = readNumbers(LABEL_RULE, /line-height:\s*([\d.]+)/, "etichetta");
    const [padding] = readNumbers(LABEL_RULE, /padding:\s*([\d.]+)em/, "etichetta");
    expect(LABEL.height).toBeCloseTo(2 * lineHeight + 2 * padding, 6);
  });

  it("LABEL.gap e' lo stacco di top, non un numero che somiglia", () => {
    const [top] = readNumbers(LABEL_RULE, /top:\s*([\d.]+)%/, "etichetta");
    expect(LABEL.gap).toBeCloseTo(top / 100 - 1, 6);
  });

  it("LABEL.width arriva inline: il foglio di stile non ne tiene una seconda copia", () => {
    expect(LABEL_RULE).not.toMatch(/max-width/);
  });

  it("LABEL.em e' il corpo dichiarato diviso il mondo piu' stretto che lo porta", () => {
    // Il caso peggiore e' il mondo piu' stretto: si stringe piu' del carattere.
    const [minRem, cqw, maxRem] = readNumbers(
      LABEL_RULE,
      /font-size:\s*clamp\(\s*([\d.]+)rem\s*,\s*([\d.]+)cqw\s*,\s*([\d.]+)rem\s*\)/,
      "etichetta",
    );
    const [vw, rem] = readNumbers(WORLD_RULE, /width:\s*min\(([\d.]+)vw,\s*([\d.]+)rem\)/, "mondo");
    const world = Math.min((VIEWPORT * vw) / 100, rem * REM);
    const fontSize = Math.min(Math.max((cqw * world) / 100, minRem * REM), maxRem * REM);
    const expected = (fontSize / world) * 100;
    expect(LABEL.em, "riserva meno di quanto disegna").toBeGreaterThanOrEqual(expected);
    expect(LABEL.em, "riserva troppo").toBeLessThan(expected + 0.05);
  });

  it("nessuna etichetta va a tre righe: LABEL.height ne conta due", () => {
    // Il rischio e' la frase che va a tre righe senza una sola parola lunga.
    const [padding] = readNumbers(LABEL_RULE, /padding:\s*[\d.]+em\s+([\d.]+)em/, "etichetta");
    // box-sizing: border-box (preflight): il max-width comprende il respiro.
    const available = LABEL.width - 2 * padding;
    // 0,6em e' l'avanzamento di JetBrains Mono, il piu' largo dei due caratteri
    // veri (Cascadia Code 0,586). La parola piu' lunga ci sta fino a 0,608em:
    // un ripiego piu' largo farebbe sbordare invece di andare a capo.
    const ADVANCE = 0.6;
    const lineCount = (text: string) => {
      let n = 1;
      let line = 0;
      for (const word of text.split(/\s+/)) {
        const wordWidth = word.length * ADVANCE;
        if (line === 0) line = wordWidth;
        else if (line + (1 + word.length) * ADVANCE <= available + 1e-9) {
          line += (1 + word.length) * ADVANCE;
        } else {
          n += 1;
          line = wordWidth;
        }
      }
      return n;
    };
    const labels = [it_, en_].flatMap((messages) =>
      Object.values(
        (messages as unknown as { services: { layers: Record<string, { objects?: Record<string, string> }> } })
          .services.layers,
      ).flatMap((layerBeat) => Object.values(layerBeat.objects ?? {})),
    );
    expect(labels.length).toBeGreaterThan(40);
    for (const label of labels) {
      for (const word of label.split(/\s+/)) {
        expect(word.length * ADVANCE, `"${word}" non ci sta`).toBeLessThanOrEqual(
          available,
        );
      }
      expect(lineCount(label), `"${label}" va a tre righe`).toBeLessThanOrEqual(2);
    }
  });
});

// La domanda sta dentro la sagoma, e per la geometria l'oggetto e' muto:
// nessuna prova di LABEL la guarda, e [data-desk-ask] non ha overflow.
describe("la domanda sul post-it ci sta dentro il post-it", () => {
  const ASK_RULE = ruleBody("[data-desk-ask]");

  it("in tutte e due le lingue, e in tutte le finestre in cui si disegna", () => {
    const [inset] = readNumbers(ASK_RULE, /inset:\s*([\d.]+)%/, "domanda");
    const [lineHeight] = readNumbers(ASK_RULE, /line-height:\s*([\d.]+)/, "domanda");
    const [minRem, cqw, maxRem] = readNumbers(
      ASK_RULE,
      /font-size:\s*clamp\(\s*([\d.]+)rem\s*,\s*([\d.]+)cqw\s*,\s*([\d.]+)rem\s*\)/,
      "domanda",
    );
    const [vw, rem] = readNumbers(WORLD_RULE, /width:\s*min\(([\d.]+)vw,\s*([\d.]+)rem\)/, "mondo");
    const ADVANCE = 0.6;

    const asks = [it_, en_].map(
      (messages) => (messages as unknown as { services: { blank: string } }).services.blank,
    );
    expect(asks.every((t) => t.length > 0)).toBe(true);

    // La finestra piu' stretta che disegna il tavolo, e una oltre il suo massimo.
    for (const viewport of [VIEWPORT, 2560]) {
      const world = Math.min((viewport * vw) / 100, rem * REM);
      const fontSize = Math.min(Math.max((cqw * world) / 100, minRem * REM), maxRem * REM);
      // Il post-it e' quadrato: l'inset vale uguale sui due assi.
      expect(SHAPE_BOX.postit.w, "il post-it non e' piu' quadrato").toBe(SHAPE_BOX.postit.h);
      const side = (drawWidth("postit") / 100) * world;
      const inner = side * (1 - (2 * inset) / 100);
      const perLine = Math.floor(inner / (fontSize * ADVANCE));

      for (const text of asks) {
        let lineCount = 1;
        let line = 0;
        for (const word of text.split(/\s+/)) {
          expect(word.length, `"${word}" non ci sta su una riga a ${viewport}px`).toBeLessThanOrEqual(perLine);
          if (line === 0) line = word.length;
          else if (line + 1 + word.length <= perLine) line += 1 + word.length;
          else {
            lineCount += 1;
            line = word.length;
          }
        }
        expect(
          lineCount * lineHeight * fontSize,
          `"${text}" esce dal post-it a ${viewport}px (${lineCount} righe in ${inner.toFixed(1)}px)`,
        ).toBeLessThanOrEqual(inner);
      }
    }
  });
});

// Le finestre di titolo e tesi stanno in layers.ts e anche nel CSS, che non
// importa costanti: questa prova tiene le due copie uguali.
describe("il titolo e la tesi hanno gli stessi numeri nei due file", () => {
  const TITLE_RULE = ruleBody('[data-desk][data-motion="full"] [data-desk-title]');
  const PUNCH_RULE = ruleBody('[data-desk][data-motion="full"] [data-desk-punch]');
  const CAPTION_RULE = ruleBody('[data-desk][data-motion="full"] [data-desk-caption]');

  it("il titolo esce esattamente nella finestra di TITLE_BEAT", () => {
    const [from, span] = readNumbers(TITLE_RULE, /1 - \(var\(--p, 1\) - ([\d.]+)\) \/ ([\d.]+)/, "titolo");
    expect(from).toBeCloseTo(TITLE_BEAT.from, 6);
    expect(span).toBeCloseTo(TITLE_BEAT.span, 6);
  });

  it("la tesi entra esattamente nella finestra di PUNCH_BEAT", () => {
    const [from, span] = readNumbers(
      PUNCH_RULE,
      /clamp\(0,\s*\(var\(--p, 1\) - ([\d.]+)\)\s*\/\s*([\d.]+)/,
      "tesi",
    );
    expect(from).toBeCloseTo(PUNCH_BEAT.from, 6);
    expect(span).toBeCloseTo(PUNCH_BEAT.span, 6);
  });

  it("la didascalia e' un cartellino, non una lastra", () => {
    // Senza contorno e ombra la didascalia torna una lastra larga quanto la frase.
    expect(CAPTION_RULE).toMatch(/border:\s*1\.5px solid color-mix/);
    expect(CAPTION_RULE).toMatch(/box-shadow:\s*0 2px 0 color-mix/);
    expect(CAPTION_RULE).toMatch(/padding:\s*[\d.]+rem [\d.]+rem [\d.]+rem;/);
  });

  it("la didascalia legge i due estremi da CAPTION_BEATS e non da un numero suo", () => {
    expect(CAPTION_RULE).toContain("var(--from)");
    expect(CAPTION_RULE).toContain("var(--until)");
  });
});

// La camera e' cio' che del tavolo sta dentro la media query del movimento.
const CAMERA = (() => {
  const inside = rules(/\[data-desk/, { media: "(prefers-reduced-motion: no-preference)" });
  return { inside, outside: rules().filter((r) => !inside.includes(r)) };
})();

// Invarianti del foglio di stile: i 380vh dentro la media query, la chiave
// [data-motion="full"] su ogni regola di camera, il `, 1` a ogni lettura.
describe("il patto del fallback e' scritto in ogni riga che legge la camera", () => {
  it("nessuna lettura di --p o --s e' senza il suo default", () => {
    // Senza JavaScript --p e --s non esistono: un `, 1` dimenticato rende
    // l'opacita' invalida. Il --p del gioco e' un'altra cosa.
    const reads = rules(/\[data-desk/).flatMap((r) =>
      [...r.body.matchAll(/var\(\s*--[ps]\b[^)]*\)/g)].map((m) => m[0]),
    );
    // Se le letture sparissero, il ciclo qui sotto sarebbe vero per vuoto.
    expect(reads.length).toBeGreaterThanOrEqual(5);
    for (const read of reads) {
      expect(read, "una lettura della camera senza il suo default").toMatch(
        /^var\(\s*--[ps],\s*1\)$/,
      );
    }
  });
});

describe("il movimento ha una porta sola, e due chiavi per quella porta", () => {
  it("ogni selettore della camera porta la chiave [data-motion=\"full\"]", () => {
    // La media query non sa della finestra stretta ne' del puntatore grosso:
    // solo data-motion lo sa.
    const selectors = CAMERA.inside.flatMap((r) => r.selectors);
    expect(selectors.length).toBeGreaterThanOrEqual(9);
    for (const selector of selectors) {
      expect(selector, `${selector} entra senza chiave`).toContain(
        '[data-desk][data-motion="full"]',
      );
    }
  });

  it("l'altezza del track e lo sticky del palco esistono solo li' dentro", () => {
    const bodies = (where: typeof CAMERA.inside) => where.map((r) => r.body).join("\n");
    expect(bodies(CAMERA.inside)).toContain("380vh");
    expect(bodies(CAMERA.inside)).toContain("position: sticky");
    expect(bodies(CAMERA.outside)).not.toContain("380vh");

    // Lo sticky degli strati sotto i 1024px e' impaginato: qui conta il palco.
    for (const { selector, body } of CAMERA.outside) {
      if (!/position:\s*sticky/.test(body)) continue;
      expect(selector, `${selector} rende sticky il palco fuori dalla porta`)
        .not.toMatch(/data-desk-stage|data-desk-track/);
    }
  });
});

describe("le didascalie si danno il cambio", () => {
  it("ognuna entra con il suo strato", () => {
    expect(CAPTION_BEATS.map((c) => c.from)).toEqual(LAYER_BEATS.map((b) => b.from));
  });

  it("ognuna esce quando comincia la successiva: mai due nello stesso posto", () => {
    for (let i = 0; i < CAPTION_BEATS.length - 1; i++) {
      expect(CAPTION_BEATS[i].until).toBeCloseTo(CAPTION_BEATS[i + 1].from, 6);
    }
  });

  it("l'ultima resta finche' non arriva la tesi, che e' la frase che la sostituisce", () => {
    expect(CAPTION_BEATS[CAPTION_BEATS.length - 1].until).toBeCloseTo(PUNCH_BEAT.from, 6);
  });
});
