import { describe, it, expect } from "vitest";
import it_ from "../../../messages/it.json";
import en_ from "../../../messages/en.json";
import { TOOLS, GARMENTS, CROSSINGS, ROOT, BRANCHES, LOOSE, JUNCTIONS, ZONES } from "../toolbox";
import { garmentStops, pathTo } from "../../components/sections/Services/toolbox/graph";

type Albero = Record<string, unknown>;

/** La foglia a un percorso puntato, o undefined. Le chiavi degli attrezzi hanno trattini, non punti. */
function foglia(obj: unknown, percorso: string[]): unknown {
  return percorso.reduce<unknown>(
    (acc, parte) => (typeof acc === "object" && acc !== null ? (acc as Albero)[parte] : undefined),
    obj,
  );
}

const lingue = { it: it_, en: en_ } as const;

function testo(lingua: keyof typeof lingue, ...percorso: string[]): unknown {
  return foglia(lingue[lingua], ["cassetta", ...percorso]);
}

const idNodi = new Set<string>([ROOT.id, ...JUNCTIONS.map((s) => s.id), ...TOOLS.map((a) => a.id)]);

describe("la cassetta: i dati", () => {
  it("sono trentacinque attrezzi in nove scomparti, ognuno con uno snodo", () => {
    expect(TOOLS).toHaveLength(35);
    expect(ZONES).toHaveLength(9);
    expect(JUNCTIONS.map((s) => s.id).sort()).toEqual(ZONES.map((z) => z.id).sort());
    for (const z of ZONES) {
      expect(TOOLS.some((a) => a.zone === z.id), `${z.id} e' vuoto`).toBe(true);
    }
  });

  it("gli id sono slug senza punto, e unici", () => {
    // Un punto nell'id diventa un livello in piu' nelle chiavi di traduzione:
    // cassetta.attrezzi.next.js non e' la chiave di Next.js.
    const ids = [...idNodi];
    expect(new Set(ids).size).toBe(1 + JUNCTIONS.length + TOOLS.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("ogni attrezzo dichiara se e' stato usato nei lavori o solo conosciuto", () => {
    for (const a of TOOLS) expect(["lavoro", "conosciuto"], a.id).toContain(a.experience);
  });

  it("ogni attrezzo sta dentro la pezza del suo scomparto", () => {
    for (const a of TOOLS) {
      const [x, y, w, h] = ZONES.find((z) => z.id === a.zone)!.r;
      expect(a.x > x && a.x < x + w && a.y > y && a.y < y + h, a.id).toBe(true);
    }
  });

  it("rami e incroci uniscono solo nodi che esistono, e mai un nodo con se stesso", () => {
    for (const [a, b] of [...BRANCHES, ...CROSSINGS]) {
      expect(idNodi.has(a), a).toBe(true);
      expect(idNodi.has(b), b).toBe(true);
      expect(a).not.toBe(b);
    }
  });

  it("nessun nodo e' isolato dall'albero, tranne quelli dichiarati sciolti", () => {
    // Ogni nodo sale fino al cartellino, o a uno scomparto dichiarato sciolto.
    // Un nodo che non ci arriva e' un'etichetta cucita nel vuoto.
    const cime = new Set([ROOT.id, ...LOOSE]);
    for (const id of idNodi) {
      const s = pathTo(id);
      expect(cime.has(s[s.length - 1]), `${id} non arriva ne' al cartellino ne' a uno sciolto`).toBe(true);
    }
    // E gli sciolti si attaccano al resto almeno con un incrocio.
    for (const id of LOOSE) {
      expect(CROSSINGS.some(([a, b]) => a === id || b === id), id).toBe(true);
    }
  });
});

describe("la cassetta: i capi", () => {
  it("sono quattro, e usano solo attrezzi che esistono, senza doppioni", () => {
    expect(GARMENTS.map((c) => c.id)).toEqual(["vetrina", "ecommerce", "piattaforma", "assistente"]);
    for (const c of GARMENTS) {
      expect(new Set(c.uses).size, c.id).toBe(c.uses.length);
      for (const id of c.uses) expect(TOOLS.some((a) => a.id === id), `${c.id}: ${id}`).toBe(true);
    }
  });

  it("i pesi sommano a cento, e sono dichiarati come stima", () => {
    for (const c of GARMENTS) {
      expect(Object.values(c.weight).reduce((s, v) => s + (v ?? 0), 0), c.id).toBe(100);
      expect(c.estimated).toBe(true);
    }
  });

  it("ogni zona con un peso ha almeno un attrezzo nel capo, e viceversa", () => {
    for (const c of GARMENTS) {
      const zoneUsate = new Set(c.uses.map((id) => TOOLS.find((a) => a.id === id)!.zone));
      expect([...zoneUsate].sort(), c.id).toEqual(Object.keys(c.weight).sort());
    }
  });

  it("ogni alternativa sostituisce un attrezzo che e' nel capo con uno che non c'e'", () => {
    for (const c of GARMENTS) {
      for (const { from: da, to: a } of c.alt) {
        expect(c.uses, `${c.id}: ${da}`).toContain(da);
        expect(c.uses, `${c.id}: ${a}`).not.toContain(a);
        expect(TOOLS.some((x) => x.id === a), a).toBe(true);
      }
    }
  });

  it("l'ago parte dal cartellino e passa da ogni attrezzo una volta, dall'alto in basso", () => {
    for (const c of GARMENTS) {
      const t = garmentStops(c);
      expect(t[0]).toBe(ROOT.id);
      expect(t.slice(1).sort()).toEqual([...c.uses].sort());
      const ys = t.slice(1).map((id) => TOOLS.find((a) => a.id === id)!.y);
      expect(ys).toEqual([...ys].sort((a, b) => a - b));
    }
  });
});

describe("la cassetta: i testi", () => {
  for (const lingua of ["it", "en"] as const) {
    it(`in ${lingua} ogni scomparto ha nome, snodo, nome corto, chiave e descrizione`, () => {
      for (const z of ZONES) {
        for (const campo of ["nome", "snodo", "corto", "chiave", "cosa"]) {
          expect(testo(lingua, "zone", z.id, campo), `${z.id}.${campo}`).toEqual(expect.any(String));
        }
      }
    });

    it(`in ${lingua} ogni attrezzo ha la sua descrizione e quella breve`, () => {
      for (const a of TOOLS) {
        expect(testo(lingua, "attrezzi", a.id, "cosa"), a.id).toEqual(expect.any(String));
        expect(testo(lingua, "attrezzi", a.id, "breve"), a.id).toEqual(expect.any(String));
      }
      expect(Object.keys(testo(lingua, "attrezzi") as Albero).sort()).toEqual(TOOLS.map((a) => a.id).sort());
    });

    it(`in ${lingua} ogni capo ha nome, perche' e il testo di ogni alternativa`, () => {
      for (const c of GARMENTS) {
        expect(testo(lingua, "capi", c.id, "nome"), c.id).toEqual(expect.any(String));
        expect(testo(lingua, "capi", c.id, "perche"), c.id).toEqual(expect.any(String));
        // Lo slug finisce nel codice finto dell'editor: una stringa da identificatore.
        expect(testo(lingua, "capi", c.id, "slug"), c.id).toMatch(/^[a-z][a-z-]*$/);
        for (const { from: da } of c.alt) {
          expect(testo(lingua, "capi", c.id, "alt", da), `${c.id}.alt.${da}`).toEqual(expect.any(String));
        }
      }
    });

    it(`in ${lingua} la chiave di ogni scomparto e' un identificatore valido nel codice finto`, () => {
      for (const z of ZONES) expect(testo(lingua, "zone", z.id, "chiave")).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    });
  }

  it("la pagina dice che le ricette sono un punto di partenza, e che i pesi sono una stima", () => {
    expect(testo("it", "partenza")).toMatch(/punto di partenza, non una ricetta fissa/);
    expect(testo("it", "etichetta", "stima")).toBe("stima");
  });

  it("i testi della cassetta non usano il trattino lungo", () => {
    const lungo = String.fromCharCode(0x2014);
    expect(JSON.stringify(testo("it"))).not.toContain(lungo);
    expect(JSON.stringify(testo("en"))).not.toContain(lungo);
  });
});
