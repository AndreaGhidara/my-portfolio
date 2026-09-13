import { describe, it, expect } from "vitest";
import it_ from "../../../messages/it.json";
import en_ from "../../../messages/en.json";
import { services } from "../services";
import { works } from "../works";
import { journey } from "../journey";
import { metrics, metricById } from "../metrics";
import { site } from "../site";
import { deskLayers } from "../desk";
import { practiceBlocks, practiceScenes } from "../practice";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/** Elenco piatto di tutte le chiavi annidate, per confrontare due dizionari. */
function flatKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

/** Segue un percorso puntato dentro un oggetto annidato, senza `any`. */
function valueAt(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (acc, part) =>
      typeof acc === "object" && acc !== null
        ? (acc as Record<string, unknown>)[part]
        : undefined,
    obj,
  );
}

const itKeys = flatKeys(it_).sort();
const enKeys = flatKeys(en_).sort();

describe("parità fra le due lingue", () => {
  it("italiano e inglese hanno esattamente le stesse chiavi", () => {
    expect(enKeys).toEqual(itKeys);
  });

  it("nessuna stringa è vuota", () => {
    const empty = flatKeys(it_).filter((k) => {
      const value = valueAt(it_, k);
      return typeof value === "string" && value.trim() === "";
    });
    expect(empty).toEqual([]);
  });
});

describe("servizi", () => {
  it("sono quattro, nell'ordine deciso nella spec", () => {
    expect(services.map((s) => s.id)).toEqual(["sites", "ecommerce", "webapp", "ai"]);
  });

  it("ogni servizio ha titolo e descrizione in entrambe le lingue", () => {
    for (const service of services) {
      expect(itKeys).toContain(`services.list.${service.id}.title`);
      expect(itKeys).toContain(`services.list.${service.id}.description`);
    }
  });
});

describe("lavori", () => {
  it("sono quattro", () => {
    expect(works).toHaveLength(4);
  });

  it("ogni caso ha sintomo, decisione ed esito in entrambe le lingue", () => {
    for (const work of works) {
      for (const field of ["name", "symptom", "decision", "outcome"]) {
        expect(itKeys).toContain(`works.list.${work.id}.${field}`);
      }
    }
  });

  it("ogni caso punta a metriche che esistono", () => {
    for (const work of works) {
      for (const id of work.metricIds) {
        expect(() => metricById(id)).not.toThrow();
      }
    }
  });

  it("ogni caso ha uno screenshot e un link", () => {
    for (const work of works) {
      expect(work.screenshot).toMatch(/^\/works\//);
      expect(work.url).toMatch(/^https:\/\//);
    }
  });
});

describe("metriche", () => {
  it("ogni metrica dichiara se è stimata", () => {
    for (const metric of metrics) {
      expect(typeof metric.estimated).toBe("boolean");
    }
  });

  it("ogni metrica stimata spiega come si verificherebbe", () => {
    for (const metric of metrics.filter((m) => m.estimated)) {
      expect(metric.howToVerify.length).toBeGreaterThan(15);
    }
  });

  it("ogni metrica ha un'etichetta tradotta", () => {
    for (const metric of metrics) {
      expect(itKeys).toContain(`metrics.${metric.id}`);
    }
  });
});

describe("percorso", () => {
  it("è ordinato dal più recente", () => {
    const years = journey.map((entry) => entry.year);
    expect([...years].sort((a, b) => b - a)).toEqual(years);
  });

  it("ogni tappa ha ruolo e descrizione in entrambe le lingue", () => {
    for (const entry of journey) {
      expect(itKeys).toContain(`journey.list.${entry.id}.role`);
      expect(itKeys).toContain(`journey.list.${entry.id}.body`);
    }
  });
});

describe("dati del sito", () => {
  it("il CV punta a un percorso pubblico", () => {
    expect(site.cvPath).toMatch(/^\/cv\//);
  });

  it("ha almeno LinkedIn e GitHub per l'uscita HR", () => {
    const ids = site.socials.map((s) => s.id);
    expect(ids).toContain("linkedin");
    expect(ids).toContain("github");
  });
});

describe("il tavolo", () => {
  it("ha quattro strati, dal piu' vicino al laptop al piu' lontano", () => {
    expect(deskLayers.map((l) => l.id)).toEqual(["site", "logic", "infra", "growth"]);
  });

  it("ogni strato porta sei oggetti", () => {
    for (const layer of deskLayers) {
      expect(layer.objects, layer.id).toHaveLength(6);
    }
  });

  it("ogni strato ha titolo e riga in entrambe le lingue", () => {
    for (const layer of deskLayers) {
      expect(itKeys).toContain(`services.layers.${layer.id}.title`);
      expect(itKeys).toContain(`services.layers.${layer.id}.lead`);
    }
  });

  it("ogni oggetto che parla ha la sua etichetta in entrambe le lingue", () => {
    for (const layer of deskLayers) {
      for (const object of layer.objects.filter((o) => !o.mute)) {
        expect(itKeys).toContain(`services.layers.${layer.id}.objects.${object.id}`);
      }
    }
  });

  it("c'e' un oggetto muto e uno solo: il post-it bianco", () => {
    const muti = deskLayers.flatMap((l) => l.objects.filter((o) => o.mute));
    expect(muti).toHaveLength(1);
    expect(muti[0].id).toBe("blank");
  });

  it("l'oggetto muto non ha un'etichetta appesa da nessuna parte", () => {
    expect(itKeys).not.toContain("services.layers.growth.objects.blank");
  });

  it("la sezione conserva i quattro testi lunghi: il tavolo non li sostituisce", () => {
    for (const id of ["sites", "ecommerce", "webapp", "ai"]) {
      expect(itKeys).toContain(`services.list.${id}.description`);
    }
  });
});

/**
 * Le illustrazioni di «E in pratica?» non sono disegni nuovi: sono gli oggetti
 * del tavolo, citati per id e ripresi da vicino. E' quella la ragione per cui
 * qui non si dichiarano ne' sagome ne' campioni: si dichiara un nome.
 */
describe("E in pratica", () => {
  it("risponde alle quattro voci, nel loro ordine", () => {
    expect(practiceBlocks.map((b) => b.service)).toEqual(services.map((s) => s.id));
  });

  it("ogni disegno e' un oggetto che sta davvero sul tavolo", () => {
    const sul = new Set(deskLayers.flatMap((l) => l.objects).map((o) => o.id));
    for (const block of practiceBlocks) {
      for (const shape of block.shapes) {
        expect(sul.has(shape.object), `«${shape.object}» non sta sul tavolo`).toBe(true);
      }
    }
  });

  it("ogni disegno porta il suo campione: a questa misura una sagoma nuda e' vuota", () => {
    // Sul tavolo un oggetto senza campione ci sta (hosting e il post-it bianco
    // ne sono senza, e con una ragione scritta). Qui no: il disegno e' largo
    // duecentocinquanta pixel, e a quella misura un contorno vuoto non e' un
    // oggetto, e' un buco.
    for (const scene of practiceScenes) {
      for (const drawing of scene.drawings) {
        expect(drawing.sample, `«${drawing.object}» non ha un campione`).toBeTruthy();
      }
    }
  });

  it("i lati si alternano: e' il vincolo da cui dipende tutto il resto", () => {
    // La freccia deve passare SOLO sopra i disegni, mai sopra il testo. Due
    // voci di fila con il disegno dallo stesso lato e la strada attraversa un
    // paragrafo.
    expect(practiceBlocks.map((b) => b.lato)).toEqual(["dx", "sx", "dx", "sx"]);
  });

  it("dentro una voce i disegni non stanno tutti sullo stesso piano", () => {
    // Si sovrappongono apposta: e' una pila sulla scrivania, non una fila.
    for (const block of practiceBlocks) {
      const piani = new Set(block.shapes.map((s) => s.layer));
      expect(piani.size).toBe(block.shapes.length);
    }
  });
});

describe("il dominio sta in un posto solo", () => {
  /**
   * Difetto vero, gia' successo: il sito era passato ad andreaghidara.dev e sei
   * file continuavano a cablare quello di Vercel. Il canonical diceva quindi a
   * Google che l'originale stava altrove, e tutto quello che il dominio nuovo
   * guadagnava lo regalava al vecchio. Non e' una cosa che si vede guardando il
   * sito: si vede solo leggendo l'HTML servito.
   */
  const APP = path.resolve(__dirname, "../../app");

  function file(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((voce) =>
      voce.isDirectory()
        ? file(path.join(dir, voce.name))
        : /\.tsx?$/.test(voce.name)
          ? [path.join(dir, voce.name)]
          : [],
    );
  }

  it("e' il dominio vero, in https e senza barra finale", () => {
    expect(site.url).toBe("https://www.andreaghidara.dev");
    expect(site.url.endsWith("/")).toBe(false);
  });

  it("nessuna pagina si scrive un dominio suo", () => {
    for (const percorso of file(APP)) {
      const codice = readFileSync(percorso, "utf8");
      const domini = [...codice.matchAll(/https?:\/\/[a-z0-9.-]+/gi)]
        .map((m) => m[0])
        // schema.org non e' il sito: e' il vocabolario dei dati strutturati.
        .filter((u) => !u.startsWith("https://schema.org"));
      expect(domini, `${path.basename(percorso)} caccia un dominio a mano`).toEqual([]);
    }
  });
});
