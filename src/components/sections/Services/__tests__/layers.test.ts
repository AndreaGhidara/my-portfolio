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

/**
 * Il pavimento dell'aria fra due cose sul tavolo, in percentuale dell'ALTEZZA
 * del mondo. Non e' zero apposta: "non si sovrappongono" e' una prova cieca:
 * passa con mezzo pixel di stacco come con mezzo centimetro, e mezzo pixel non
 * sopravvive a un carattere di ripiego o a un altro motore di rendering.
 *
 * 1,7 punti sono circa 10,7 px a 1440. Il tavolo ne tiene 1,99 (12,6 px), cioe'
 * un sesto di margine sopra il pavimento: abbastanza perche' un ritocco piccolo
 * non faccia cadere la suite al primo carattere, poco abbastanza perche' una
 * ritaratura vera (un'etichetta piu' lunga, un settimo oggetto per strato)
 * la faccia cadere subito, che e' lo scopo.
 *
 * Era 1,2, e il tavolo ne teneva 1,395: la taratura che ha sciolto gli
 * scostamenti angolari strato per strato ha alzato ANCHE questo minimo, non
 * solo quello fra anelli. Il pavimento lo segue, o smetterebbe di essere una
 * prova e diventerebbe un ricordo.
 */
const CLEARANCE_FLOOR = 1.7;

/**
 * Il pavimento dell'aria fra due oggetti di ANELLI DIVERSI, nella stessa unita'.
 * E' una prova a se' e non un numero piu' alto di CLEARANCE_FLOOR, perche'
 * misura una cosa diversa: non "il tavolo non si accavalla" ma "i quattro
 * anelli si leggono come quattro".
 *
 * Serviva perche' il minimo globale e' cieco alla differenza. Con la taratura
 * che massimizzava solo lui, dentro un anello restavano da 6,8 a 21,5 punti di
 * aria e FRA anelli vicini 1,53: ogni oggetto aveva il suo vicino piu' prossimo
 * in un altro anello, da quattro a quattordici volte piu' vicino dei suoi
 * compagni, e i quattro anelli si leggevano come una nuvola sola. Nessuna prova
 * se ne accorgeva, perche' 1,53 sta sopra il pavimento globale.
 *
 * 3,0 punti sono circa 19 px a 1440. Non e' il massimo raggiungibile (il
 * mondo ne tiene 4,28), ma e' la soglia sotto la quale l'occhio ricomincia a
 * raggruppare per vicinanza invece che per anello.
 */
const RING_FLOOR = 3.0;

type Rect = { x0: number; x1: number; y0: number; y1: number };

/** Due rettangoli che si toccano, anche solo per un angolo. */
function overlap(a: Rect, b: Rect) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

/**
 * Quanta aria c'e' fra due rettangoli, in percentuale dell'ALTEZZA del mondo.
 * Le due coordinate non hanno la stessa unita': x e' una quota della larghezza,
 * y dell'altezza, quindi lo stacco orizzontale va riportato sull'altezza prima
 * di confrontarlo con quello verticale, o si sommano mele e pere. Negativo
 * vuol dire sovrapposti.
 */
function clearance(a: Rect, b: Rect) {
  const ratio = WORLD.width / WORLD.height;
  const dx = Math.max(b.x0 - a.x1, a.x0 - b.x1) * ratio;
  const dy = Math.max(b.y0 - a.y1, a.y0 - b.y1);
  return Math.max(dx, dy);
}

/** Quanto dista dal bordo del mondo, nella stessa unita'. */
function clearanceFromWorld(a: Rect) {
  const ratio = WORLD.width / WORLD.height;
  return Math.min(a.x0 * ratio, (100 - a.x1) * ratio, a.y0, 100 - a.y1);
}

/**
 * Tutti gli oggetti disegnati, ognuno col suo rettangolo vero:
 * sagoma piu' striscia dell'etichetta, inclinazione compresa. E' l'unica lista
 * su cui abbia senso provare qualcosa: un tavolo non si controlla uno strato
 * per volta, perche' le collisioni che si vedono sono quelle FRA strati.
 */
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
    // La trappola: il mondo non e' quadrato, e una percentuale orizzontale e una
    // verticale non misurano lo stesso lato. Sbagliando, il telefono (74x148)
    // verrebbe alto un terzo del tavolo.
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
    // Senza questa, la prova successiva misurerebbe meta' oggetto: le
    // sovrapposizioni che si vedono a occhio sono quasi tutte fra una parola e
    // il disegno di qualcun altro.
    const bare = objectFootprint("sheet", 0, false);
    const labelled = objectFootprint("sheet", 0, true);
    expect(labelled.y1).toBeGreaterThan(bare.y1);
    expect(labelled.y0).toBe(bare.y0);
  });

  it("inclinato occupa il rettangolo che il browser disegna, non uno isotropo", () => {
    // La trappola: x e' una quota della larghezza del mondo, y dell'altezza, e
    // il CSS ruota in PIXEL. Ruotare quella coppia mista con [cos -sin; sin cos]
    // misura un rettangolo che non esiste: in questo mondo tiene troppo
    // largo e troppo poco alto, e l'errore cresce con l'inclinazione.
    // Qui il conto si rifa' dall'altra parte: si va in pixel, si ruota li', e si
    // torna. Due strade diverse per lo stesso rettangolo.
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
        // in pixel
        .map(([x, y]) => [(x * width) / 100, (y * height) / 100])
        // si ruota dove ruota il CSS
        .map(([x, y]) => [x * cos - y * sin, x * sin + y * cos])
        // e si torna in percentuale
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
    // La prova che c'era prima misurava la distanza fra i CENTRI di due oggetti
    // dello stesso strato: due fogli a 8 e 8 di distanza passavano con 11,3
    // mentre i loro disegni si accavallavano su tutti e due i lati. E le
    // collisioni vere stavano fra strati diversi, dove non guardava nessuno.
    const objects = everyObject();
    for (let a = 0; a < objects.length; a++) {
      for (let b = a + 1; b < objects.length; b++) {
        const where = `${objects[a].where} × ${objects[b].where}`;
        expect(overlap(objects[a].box, objects[b].box), where).toBe(false);
      }
    }
  });

  it("fra due cose qualsiasi resta aria vera, non un pelo", () => {
    // "Non si sovrappongono" passa identico con mezzo pixel di stacco e con
    // mezzo centimetro: e' cieco proprio dove il disegno e' fragile. Un tavolo
    // che deve reggere un carattere di ripiego, l'arrotondamento ai subpixel e
    // un motore di rendering diverso ha bisogno di aria misurata, e dichiarata.
    // Il pavimento e' in percentuale dell'altezza del mondo, che e' l'unita' in
    // cui e' scritta tutta la geometria: a 1440 vale circa 6,3 pixel per punto.
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
    // La prova qui sopra guarda il tavolo intero e non sa distinguere due fogli
    // dello stesso anello da due anelli che si toccano. Questa guarda solo le
    // coppie che stanno su anelli diversi: e' quella distanza che decide se si
    // vedono quattro corone o una nuvola.
    //
    // Non e' il raggio a garantirla: gli anelli non sono omotetici apposta, e
    // due raggi lontani possono comunque incrociarsi sull'asse dove uno e' alto
    // e l'altro largo. Si misura dove si vede: fra i rettangoli veri.
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
    // Sei oggetti ogni sessanta gradi si leggono come il quadrante di un
    // orologio. Lo scostamento angolare e' quello che li rimette su un tavolo:
    // ed e' anche l'unica cosa che fa spazio: a passo regolare il minimo
    // raggiungibile a 1440 e' 0,64 punti, sotto il pavimento qui sopra.
    // Le due prove sono una coppia: senza la seconda "irregolare" si otterrebbe
    // benissimo ammucchiando tutto da una parte.
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
      // e nessun grappolo: mai meno di meta' passo fra due consecutivi
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
    // A meta' corsa una scala esponenziale sta sotto la media aritmetica.
    const midway = cameraScale(0.5, 4, 1);
    expect(midway).toBeLessThan((4 + 1) / 2);
    expect(midway).toBeGreaterThan(1);
  });
});

/**
 * L'etichetta e' un contratto fra due file che non si parlano: layers.ts tiene
 * il posto, sections/desk.css lo disegna. Cambiare interlinea, respiro o stacco nel
 * foglio di stile senza dirlo a LABEL fa misurare alla geometria un rettangolo
 * piu' piccolo di quello vero, e nessuna prova di sovrapposizione se ne
 * accorge, perche' una prova di collisione e' cieca per costruzione a un
 * ingombro che si restringe. Leggere il CSS come testo e' brutto: e' anche
 * l'unica cosa in questo repository che possa cogliere quella modifica.
 */
/**
 * Il selettore si cerca INTERO, non come pezzo di testo.
 * "[data-desk-world]" e' contenuto per intero dentro
 * "[data-desk][data-motion='full'] [data-desk-world]", che sta piu' in giu':
 * cercato come testo, la regola giusta si troverebbe solo perche' l'originale
 * viene prima, e la prima regola discendente scritta piu' in alto ripunterebbe
 * in silenzio la rete di sicurezza della geometria su un margin-bottom.
 */
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

/** Il rem del sito, e la finestra piu' stretta in cui il mondo si disegna. */
const REM = 16;
const VIEWPORT = 1024;

describe("l'etichetta e' quella che il foglio di stile dichiara", () => {
  it("LABEL.height sono le due righe e il respiro scritti nel CSS", () => {
    const [lineHeight] = readNumbers(LABEL_RULE, /line-height:\s*([\d.]+)/, "etichetta");
    const [padding] = readNumbers(LABEL_RULE, /padding:\s*([\d.]+)em/, "etichetta");
    // Due righe: e' l'assunto di tutto il modello, ed e' la prova qui sotto a
    // tenerlo in piedi.
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
    // 1em in percentuale della LARGHEZZA del mondo. Il caso peggiore (quello da
    // riservare) e' il mondo piu' stretto: il carattere li' e' al minimo, ma il
    // mondo si stringe di piu' di lui.
    const [minRem, cqw, maxRem] = readNumbers(
      LABEL_RULE,
      /font-size:\s*clamp\(\s*([\d.]+)rem\s*,\s*([\d.]+)cqw\s*,\s*([\d.]+)rem\s*\)/,
      "etichetta",
    );
    const [vw, rem] = readNumbers(WORLD_RULE, /width:\s*min\(([\d.]+)vw,\s*([\d.]+)rem\)/, "mondo");
    const world = Math.min((VIEWPORT * vw) / 100, rem * REM);
    const fontSize = Math.min(Math.max((cqw * world) / 100, minRem * REM), maxRem * REM);
    const expected = (fontSize / world) * 100;
    // Riservare in eccesso va bene, in difetto no: la disuguaglianza ha un verso.
    expect(LABEL.em, "riserva meno di quanto disegna").toBeGreaterThanOrEqual(expected);
    expect(LABEL.em, "riserva troppo").toBeLessThan(expected + 0.05);
  });

  it("nessuna etichetta va a tre righe: LABEL.height ne conta due", () => {
    // Il rischio vero non e' la parola lunga (il max-width la manda a capo) ma
    // la frase che di righe ne fa tre senza avere una sola parola lunga
    // ("Il tuo gestionale online"). Qui ogni etichetta vera, in tutte e due le
    // lingue, viene impaginata contro la larghezza che le e' riservata.
    const [padding] = readNumbers(LABEL_RULE, /padding:\s*[\d.]+em\s+([\d.]+)em/, "etichetta");
    // box-sizing: border-box (preflight): il max-width comprende il respiro.
    const available = LABEL.width - 2 * padding;
    // Avanzamento in em per carattere. E' l'ultimo numero preso a mano di questo
    // file, e resta preso a mano: i due caratteri del tavolo arrivano da
    // next/font (JetBrains Mono sotto i 1024px, Cascadia Code sopra) e leggerne
    // la tabella hmtx dentro un .woff2 in un test costa piu' di quanto valga.
    // I valori veri: JetBrains Mono avanza esattamente 0,600em, Cascadia Code
    // 0,586em (1200 unita' su 2048); i ripieghi generici stanno sotto o poco
    // sopra: Menlo e DejaVu Sans Mono 0,602, Courier New 0,600, Consolas 0,550.
    // Si tiene il piu' largo dei due caratteri veri. Il margine e' dichiarato,
    // non sperato: la prova qui sotto verifica che la parola piu' lunga ci stia,
    // e ci sta finche' l'avanzamento non supera 0,608em (7,3em diviso dodici
    // caratteri). Un carattere di ripiego piu' largo di cosi' non e' comune, ma
    // se dovesse capitare la parola sborda invece di andare a capo.
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
        // Una parola sola non va a capo: se non ci sta, sborda dal posto tenuto.
        expect(word.length * ADVANCE, `"${word}" non ci sta`).toBeLessThanOrEqual(
          available,
        );
      }
      expect(lineCount(label), `"${label}" va a tre righe`).toBeLessThanOrEqual(2);
    }
  });
});

/**
 * La domanda sul post-it bianco non e' un'etichetta: sta DENTRO la sagoma, e
 * per la geometria quell'oggetto e' muto: objectBox lo misura senza striscia.
 * Vuol dire che nessuna delle quattro prove di LABEL la guarda, e che se un
 * giorno una traduzione la allunga, il testo esce dal post-it e non se ne
 * accorge nessuno: [data-desk-ask] non ha overflow, e l'ingombro dichiarato non
 * cambia di un punto. E' esattamente il buco che il contratto delle etichette
 * esiste per chiudere, quindi qui si chiude anche per lei.
 *
 * Il conto e' tutto letto: la scatola dal viewBox della sagoma e dall'inset del
 * foglio di stile, il corpo dal suo clamp, la larghezza del mondo dalla regola
 * che la dichiara. L'unico numero a mano e' l'avanzamento del carattere mono,
 * lo stesso 0,6em della prova delle etichette e per le stesse ragioni.
 */
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

    // Il post-it si disegna solo nel mondo del tavolo, che vive dai 1024px in
    // su: sotto c'e' il gioco. Le due finestre sono gli estremi: la piu' stretta che lo disegna e una in cui il
    // mondo ha gia' toccato il suo massimo.
    for (const viewport of [VIEWPORT, 2560]) {
      const world = Math.min((viewport * vw) / 100, rem * REM);
      const fontSize = Math.min(Math.max((cqw * world) / 100, minRem * REM), maxRem * REM);
      // Il post-it e' quadrato, quindi l'inset vale uguale sui due lati e il
      // budget orizzontale e' anche quello verticale. Se un giorno il viewBox
      // smettesse di esserlo, questo conto misurerebbe l'asse sbagliato in
      // silenzio: meglio che cada qui.
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

/**
 * L'altra copia dichiarata. Le finestre del titolo e della tesi vivono in
 * layers.ts, ma chi le applica e' il foglio di stile, e il CSS una costante di
 * TypeScript non la sa importare: i numeri stanno in due posti. Rileggerli da
 * qui e' l'unico modo perche' cambiarne uno solo non passi liscio, e passare
 * liscio vorrebbe dire un titolo che se ne va mentre entra il primo foglio,
 * cioe' i due testi da leggere insieme.
 */
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
    // Il fondo serve davvero: finche' la camera e' arretrata il piano
    // ingrandito le passa dietro. Ma da solo era una lastra larga quanto la
    // frase, quindi di forma diversa per ognuna delle quattro, e col padding
    // sinistro a zero cominciava esattamente sul primo carattere. Adesso e' un
    // oggetto posato sul tavolo, con il vocabolario dei tesserini di «Dove ho
    // imparato»: se qualcuno toglie contorno e ombra, torna la lastra.
    expect(CAPTION_RULE).toMatch(/border:\s*1\.5px solid color-mix/);
    expect(CAPTION_RULE).toMatch(/box-shadow:\s*0 2px 0 color-mix/);
    // Tre valori e nessuno zero: il padding vecchio ne aveva quattro e finiva
    // con lo zero che appiccicava il fondo al primo carattere.
    expect(CAPTION_RULE).toMatch(/padding:\s*[\d.]+rem [\d.]+rem [\d.]+rem;/);
  });

  it("la didascalia legge i due estremi da CAPTION_BEATS e non da un numero suo", () => {
    // Se il CSS smettesse di leggere --until, le quattro didascalie si
    // accatasterebbero nello stesso posto senza che niente lo dica.
    expect(CAPTION_RULE).toContain("var(--from)");
    expect(CAPTION_RULE).toContain("var(--until)");
  });
});


/**
 * Le regole della camera, e tutto il resto del foglio di stile. La camera e'
 * quello che del tavolo sta dentro la media query del movimento: le altre
 * sezioni ne hanno una loro, con le loro chiavi, e non sono la camera.
 */
const CAMERA = (() => {
  const inside = rules(/\[data-desk/, { media: "(prefers-reduced-motion: no-preference)" });
  return { inside, outside: rules().filter((r) => !inside.includes(r)) };
})();

/**
 * I due patti su cui poggia tutto il resto, e gli unici che nessuna prova
 * guardava. Sono invarianti del FOGLIO DI STILE, non del modello: una modifica
 * che porti i 380vh fuori dalla media query, o che scriva una regola di camera
 * senza la chiave [data-motion="full"], o che tolga un `, 1` a una lettura di
 * --p, lascia verdi tutte le altre prove di questo file, e rompe la sezione
 * per chi ha chiesto di non muovere niente, o per chi il JavaScript non ce l'ha.
 * Fin qui l'unica prova era un curl fatto a mano una volta, che nel repository
 * non c'e'.
 */
describe("il patto del fallback e' scritto in ogni riga che legge la camera", () => {
  it("nessuna lettura di --p o --s e' senza il suo default", () => {
    // Senza JavaScript nessuno le scrive: --p vale 1 e --s vale 1, il tavolo si
    // vede intero e il fotogramma a riposo e' anche quello finale. Basta un
    // `, 1` dimenticato perche' l'opacita' diventi invalida e mezzo tavolo
    // sparisca per chi non ha il JavaScript, e nient'altro se ne accorgerebbe.
    // Le letture del tavolo: il gioco del metodo ha un --p suo, la lunghezza
    // di una barra, che con la camera non c'entra.
    const reads = rules(/\[data-desk/).flatMap((r) =>
      [...r.body.matchAll(/var\(\s*--[ps]\b[^)]*\)/g)].map((m) => m[0]),
    );
    // Se un giorno le letture sparissero tutte, il ciclo qui sotto sarebbe vero
    // per vuoto: il conto dice che ce ne sono ancora.
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
    // La media query da sola non basta: dice solo che l'utente non ha chiesto
    // meno movimento, e non sa niente della finestra stretta ne' del puntatore
    // grosso. Quelli li sa solo resolveMotionLevel, che li scrive in
    // data-motion. Una regola scritta qui dentro senza la chiave si
    // applicherebbe anche a un tablet, dove il palco non aggancia niente: piano
    // sticky, track alto 380vh e nessuno che scriva --p.
    const selectors = CAMERA.inside.flatMap((r) => r.selectors);
    expect(selectors.length).toBeGreaterThanOrEqual(9);
    for (const selector of selectors) {
      expect(selector, `${selector} entra senza chiave`).toContain(
        '[data-desk][data-motion="full"]',
      );
    }
  });

  it("l'altezza del track e lo sticky del palco esistono solo li' dentro", () => {
    // Sono le due righe che trasformano la sezione in una camera: 380vh di
    // corsa e un palco che sta fermo mentre passano. Fuori da quella porta
    // vorrebbero dire tre schermi di vuoto da scorrere a mano, con il tavolo
    // gia' finito e fermo, che e' il modo peggiore di rompere il fallback.
    const bodies = (where: typeof CAMERA.inside) => where.map((r) => r.body).join("\n");
    expect(bodies(CAMERA.inside)).toContain("380vh");
    expect(bodies(CAMERA.inside)).toContain("position: sticky");
    expect(bodies(CAMERA.outside)).not.toContain("380vh");

    // Non la PAROLA sticky: il PALCO. Sotto i 1024px gli oggetti di uno strato
    // si appiccicano in alto mentre si legge la loro frase, ed e' un
    // impaginato, non una camera: nessun binario, nessuna altezza di schermo,
    // niente da agganciare. Quello che non deve uscire di qui e' il palco che
    // sta fermo con i suoi 380vh dietro, e sono questi due selettori.
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
