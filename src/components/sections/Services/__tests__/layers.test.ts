import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { deskLayers } from "@/content/desk";
import it_ from "../../../../../messages/it.json";
import en_ from "../../../../../messages/en.json";
import {
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
  type DeskLayout,
} from "../layers";
import { SHAPES } from "../../../../../scripts/build-desk.mjs";

const LAYOUTS: DeskLayout[] = ["wide", "tall"];

/**
 * Il pavimento dell'aria fra due cose sul tavolo, in percentuale dell'ALTEZZA
 * del mondo. Non e' zero apposta: "non si sovrappongono" e' una prova cieca —
 * passa con mezzo pixel di stacco come con mezzo centimetro — e mezzo pixel non
 * sopravvive a un carattere di ripiego o a un altro motore di rendering.
 */
const CLEARANCE_FLOOR = 0.5;

type Rect = { x0: number; x1: number; y0: number; y1: number };

/** Due rettangoli che si toccano, anche solo per un angolo. */
function overlap(a: Rect, b: Rect) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

/**
 * Quanta aria c'e' fra due rettangoli, in percentuale dell'ALTEZZA del mondo.
 * Le due coordinate non hanno la stessa unita' — x e' una quota della larghezza,
 * y dell'altezza — quindi lo stacco orizzontale va riportato sull'altezza prima
 * di confrontarlo con quello verticale, o si sommano mele e pere. Negativo
 * vuol dire sovrapposti.
 */
function clearance(a: Rect, b: Rect, layout: DeskLayout) {
  const ratio = WORLD[layout].width / WORLD[layout].height;
  const dx = Math.max(b.x0 - a.x1, a.x0 - b.x1) * ratio;
  const dy = Math.max(b.y0 - a.y1, a.y0 - b.y1);
  return Math.max(dx, dy);
}

/** Quanto dista dal bordo del mondo, nella stessa unita'. */
function clearanceFromWorld(a: Rect, layout: DeskLayout) {
  const ratio = WORLD[layout].width / WORLD[layout].height;
  return Math.min(a.x0 * ratio, (100 - a.x1) * ratio, a.y0, 100 - a.y1);
}

/**
 * Tutti gli oggetti disegnati in un formato, ognuno col suo rettangolo vero:
 * sagoma piu' striscia dell'etichetta, inclinazione compresa. E' l'unica lista
 * su cui abbia senso provare qualcosa — un tavolo non si controlla uno strato
 * per volta, perche' le collisioni che si vedono sono quelle FRA strati.
 */
function everyObject(layout: DeskLayout) {
  const out: { box: Rect; dove: string }[] = [];
  for (let layer = 0; layer < deskLayers.length; layer++) {
    for (let i = 0; i < OBJECTS_PER_LAYER[layout]; i++) {
      out.push({
        box: objectBox(layout, layer, i),
        dove: `${layout} ${deskLayers[layer].id}/${deskLayers[layer].objects[i].id}`,
      });
    }
  }
  return out;
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

describe("quanto e' grande un oggetto", () => {
  it("un oggetto e' la sagoma PIU' la sua etichetta: la striscia sta nell'ingombro", () => {
    // Senza questa, la prova successiva misurerebbe meta' oggetto: le
    // sovrapposizioni che si vedono a occhio sono quasi tutte fra una parola e
    // il disegno di qualcun altro.
    for (const layout of LAYOUTS) {
      const muto = objectFootprint(layout, "sheet", 0, false);
      const parlante = objectFootprint(layout, "sheet", 0, true);
      expect(parlante.y1, layout).toBeGreaterThan(muto.y1);
      expect(parlante.y0, layout).toBe(muto.y0);
    }
  });

  it("inclinato occupa il rettangolo che il browser disegna, non uno isotropo", () => {
    // La trappola: x e' una quota della larghezza del mondo, y dell'altezza, e
    // il CSS ruota in PIXEL. Ruotare quella coppia mista con [cos -sin; sin cos]
    // misura un rettangolo che non esiste — nel mondo orizzontale tiene troppo
    // largo e troppo poco alto, e l'errore cresce con l'inclinazione.
    // Qui il conto si rifa' dall'altra parte: si va in pixel, si ruota li', e si
    // torna. Due strade diverse per lo stesso rettangolo.
    for (const layout of LAYOUTS) {
      const { width, height } = WORLD[layout];
      for (const rotate of [-7, -4.2, 3.5, 7]) {
        const fermo = objectFootprint(layout, "phone", 0, true);
        const radianti = (rotate * Math.PI) / 180;
        const cos = Math.cos(radianti);
        const sin = Math.sin(radianti);
        const angoli = [
          [fermo.x0, fermo.y0],
          [fermo.x1, fermo.y0],
          [fermo.x0, fermo.y1],
          [fermo.x1, fermo.y1],
        ]
          // in pixel
          .map(([x, y]) => [(x * width) / 100, (y * height) / 100])
          // si ruota dove ruota il CSS
          .map(([x, y]) => [x * cos - y * sin, x * sin + y * cos])
          // e si torna in percentuale
          .map(([x, y]) => [(x * 100) / width, (y * 100) / height]);
        const atteso = {
          x0: Math.min(...angoli.map((a) => a[0])),
          x1: Math.max(...angoli.map((a) => a[0])),
          y0: Math.min(...angoli.map((a) => a[1])),
          y1: Math.max(...angoli.map((a) => a[1])),
        };
        const misurato = objectFootprint(layout, "phone", rotate, true);
        for (const lato of ["x0", "x1", "y0", "y1"] as const) {
          expect(misurato[lato], `${layout} ${rotate}° ${lato}`).toBeCloseTo(atteso[lato], 9);
        }
      }
    }
  });

  it("il post-it bianco non ha etichetta e non ne occupa il posto", () => {
    const blank = deskLayers[3].objects.findIndex((o) => o.mute);
    expect(blank).toBeGreaterThanOrEqual(0);
    const parlante = objectFootprint("wide", "postit", 0, true);
    const muto = objectFootprint("wide", "postit", 0, false);
    expect(muto.y1).toBeLessThan(parlante.y1);
  });
});

describe("dove finiscono gli oggetti", () => {
  it("restano dentro il mondo con tutto quello che sono, etichetta compresa", () => {
    for (const layout of LAYOUTS) {
      for (const { box, dove } of everyObject(layout)) {
        expect(box.x0, dove).toBeGreaterThan(0);
        expect(box.x1, dove).toBeLessThan(100);
        expect(box.y0, dove).toBeGreaterThan(0);
        expect(box.y1, dove).toBeLessThan(100);
      }
    }
  });

  it("non coprono il laptop: nemmeno un angolo entra nel centro", () => {
    for (const layout of LAYOUTS) {
      const centro = centreBox(layout);
      for (const { box, dove } of everyObject(layout)) {
        expect(overlap(box, centro), `${dove} copre il laptop`).toBe(false);
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

  it("niente si sovrappone a niente, su tutto il tavolo: rettangoli veri, non centri", () => {
    // La prova che c'era prima misurava la distanza fra i CENTRI di due oggetti
    // dello stesso strato: due fogli a 8 e 8 di distanza passavano con 11,3
    // mentre i loro disegni si accavallavano su tutti e due i lati. E le
    // collisioni vere stavano fra strati diversi, dove non guardava nessuno.
    for (const layout of LAYOUTS) {
      const oggetti = everyObject(layout);
      for (let a = 0; a < oggetti.length; a++) {
        for (let b = a + 1; b < oggetti.length; b++) {
          const dove = `${oggetti[a].dove} × ${oggetti[b].dove}`;
          expect(overlap(oggetti[a].box, oggetti[b].box), dove).toBe(false);
        }
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
    for (const layout of LAYOUTS) {
      const oggetti = everyObject(layout);
      const centro = centreBox(layout);
      let peggiore = Infinity;
      let dove = "";
      const segna = (aria: number, chi: string) => {
        if (aria < peggiore) {
          peggiore = aria;
          dove = chi;
        }
      };
      for (let a = 0; a < oggetti.length; a++) {
        for (let b = a + 1; b < oggetti.length; b++) {
          segna(
            clearance(oggetti[a].box, oggetti[b].box, layout),
            `${oggetti[a].dove} × ${oggetti[b].dove}`,
          );
        }
        segna(clearance(oggetti[a].box, centro, layout), `${oggetti[a].dove} × il centro`);
        segna(clearanceFromWorld(oggetti[a].box, layout), `${oggetti[a].dove} × il bordo`);
      }
      expect(peggiore, `${layout}: il punto piu' stretto e' ${dove}`).toBeGreaterThan(
        CLEARANCE_FLOOR,
      );
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

/**
 * L'etichetta e' un contratto fra due file che non si parlano: layers.ts tiene
 * il posto, tokens.css lo disegna. Cambiare interlinea, respiro o stacco nel
 * foglio di stile senza dirlo a LABEL fa misurare alla geometria un rettangolo
 * piu' piccolo di quello vero — e nessuna prova di sovrapposizione se ne
 * accorge, perche' una prova di collisione e' cieca per costruzione a un
 * ingombro che si restringe. Leggere il CSS come testo e' brutto: e' anche
 * l'unica cosa in questo repository che possa cogliere quella modifica.
 */
const TOKENS = readFileSync(resolve(process.cwd(), "src/styles/tokens.css"), "utf8")
  // Via i commenti: qui si legge quello che il browser applica, non quello che
  // il foglio di stile racconta di se'.
  .replace(/\/\*[\s\S]*?\*\//g, "");

function blocco(selettore: string, ultimo = false): string {
  const i = ultimo ? TOKENS.lastIndexOf(selettore) : TOKENS.indexOf(selettore);
  if (i < 0) throw new Error(`tokens.css non ha piu' la regola ${selettore}`);
  const apre = TOKENS.indexOf("{", i);
  return TOKENS.slice(apre + 1, TOKENS.indexOf("}", apre));
}

function misura(testo: string, dichiarazione: RegExp, dove: string): number[] {
  const trovato = testo.match(dichiarazione);
  if (!trovato) throw new Error(`${dove}: non c'e' piu' ${dichiarazione}`);
  return trovato.slice(1).map(Number);
}

const ETICHETTA = blocco("[data-desk-object] [data-desk-label] {");
const MONDO = blocco("[data-desk-world] {");
const MONDO_STRETTO = blocco('[data-desk-world][data-layout="tall"] {', true);

/** Il rem del sito, e le due finestre piu' strette in cui ogni mondo si disegna. */
const REM = 16;
const FINESTRA = { wide: 1024, tall: 320 };

describe("l'etichetta e' quella che il foglio di stile dichiara", () => {
  it("LABEL.height sono le due righe e il respiro scritti nel CSS", () => {
    const [interlinea] = misura(ETICHETTA, /line-height:\s*([\d.]+)/, "etichetta");
    const [respiro] = misura(ETICHETTA, /padding:\s*([\d.]+)em/, "etichetta");
    // Due righe: e' l'assunto di tutto il modello, ed e' la prova qui sotto a
    // tenerlo in piedi.
    expect(LABEL.height).toBeCloseTo(2 * interlinea + 2 * respiro, 6);
  });

  it("LABEL.gap e' lo stacco di top, non un numero che somiglia", () => {
    const [top] = misura(ETICHETTA, /top:\s*([\d.]+)%/, "etichetta");
    expect(LABEL.gap).toBeCloseTo(top / 100 - 1, 6);
  });

  it("LABEL.width arriva inline: il foglio di stile non ne tiene una seconda copia", () => {
    expect(ETICHETTA).not.toMatch(/max-width/);
  });

  it("LABEL.em e' il corpo dichiarato diviso il mondo piu' stretto che lo porta", () => {
    // 1em in percentuale della LARGHEZZA del mondo. Il caso peggiore — quello da
    // riservare — e' il mondo piu' stretto: il carattere li' e' al minimo, ma il
    // mondo si stringe di piu' di lui.
    const [minimo, cqw, massimo] = misura(
      ETICHETTA,
      /font-size:\s*clamp\(\s*([\d.]+)rem\s*,\s*([\d.]+)cqw\s*,\s*([\d.]+)rem\s*\)/,
      "etichetta",
    );
    const larghezze: Record<DeskLayout, number[]> = {
      wide: misura(MONDO, /width:\s*min\(([\d.]+)vw,\s*([\d.]+)rem\)/, "mondo"),
      tall: misura(MONDO_STRETTO, /width:\s*min\(([\d.]+)vw,\s*([\d.]+)rem\)/, "mondo stretto"),
    };
    for (const layout of LAYOUTS) {
      const [vw, rem] = larghezze[layout];
      const mondo = Math.min((FINESTRA[layout] * vw) / 100, rem * REM);
      const corpo = Math.min(Math.max((cqw * mondo) / 100, minimo * REM), massimo * REM);
      const atteso = (corpo / mondo) * 100;
      // Riservare in eccesso va bene, in difetto no: la disuguaglianza ha un verso.
      expect(LABEL.em[layout], `${layout} riserva meno di quanto disegna`).toBeGreaterThanOrEqual(
        atteso,
      );
      expect(LABEL.em[layout], `${layout} riserva troppo`).toBeLessThan(atteso + 0.05);
    }
  });

  it("nessuna etichetta va a tre righe: LABEL.height ne conta due", () => {
    // Il rischio vero non e' la parola lunga — il max-width la manda a capo — ma
    // la frase che di righe ne fa tre senza avere una sola parola lunga
    // ("Il tuo gestionale online"). Qui ogni etichetta vera, in tutte e due le
    // lingue, viene impaginata contro la larghezza che le e' riservata.
    const [respiro] = misura(ETICHETTA, /padding:\s*[\d.]+em\s+([\d.]+)em/, "etichetta");
    // box-sizing: border-box (preflight): il max-width comprende il respiro.
    const disponibile = LABEL.width - 2 * respiro;
    // Avanzamento di una monospaziata, in em per carattere: misurato nel browser
    // sul carattere del tavolo (dodici caratteri = 7,2em).
    const AVANZAMENTO = 0.6;
    const righe = (testo: string) => {
      let n = 1;
      let riga = 0;
      for (const parola of testo.split(/\s+/)) {
        const larga = parola.length * AVANZAMENTO;
        if (riga === 0) riga = larga;
        else if (riga + (1 + parola.length) * AVANZAMENTO <= disponibile + 1e-9) {
          riga += (1 + parola.length) * AVANZAMENTO;
        } else {
          n += 1;
          riga = larga;
        }
      }
      return n;
    };
    const tutte = [it_, en_].flatMap((messaggi) =>
      Object.values(
        (messaggi as unknown as { services: { layers: Record<string, { objects?: Record<string, string> }> } })
          .services.layers,
      ).flatMap((strato) => Object.values(strato.objects ?? {})),
    );
    expect(tutte.length).toBeGreaterThan(40);
    for (const etichetta of tutte) {
      for (const parola of etichetta.split(/\s+/)) {
        // Una parola sola non va a capo: se non ci sta, sborda dal posto tenuto.
        expect(parola.length * AVANZAMENTO, `"${parola}" non ci sta`).toBeLessThanOrEqual(
          disponibile,
        );
      }
      expect(righe(etichetta), `"${etichetta}" va a tre righe`).toBeLessThanOrEqual(2);
    }
  });
});
