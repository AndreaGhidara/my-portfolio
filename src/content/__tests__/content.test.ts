import { describe, it, expect } from "vitest";
import it_ from "../../../messages/it.json";
import en_ from "../../../messages/en.json";
import { services } from "../services";
import { works } from "../works";
import { journey } from "../journey";
import { metrics, metricById } from "../metrics";
import { site } from "../site";
import { deskLayers } from "../desk";

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
