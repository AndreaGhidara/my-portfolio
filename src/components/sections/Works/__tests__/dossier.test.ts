import { describe, it, expect } from "vitest";
import { NO_DOSSIER, dossierReducer, type DossierEvent, type Dossier } from "../dossier";

/** La cartella qui e' solo un nome: il reducer la porta e non la tocca. */
type P = Dossier<string>;

const passa = (s: P, ...eventi: DossierEvent<string>[]) => eventi.reduce(dossierReducer, s);
const apri = (i: number, moto: "quattro-tempi" | "dissolvenza" = "quattro-tempi"): DossierEvent<string> => ({
  type: "apri",
  i,
  folder: `cartella ${i}`,
  motion: moto,
});

/** Un'apertura arrivata in fondo: cade, montata, tempi 3 e 4 finiti. */
const aperta = (i = 0) => {
  const s = passa(NO_DOSSIER, apri(i));
  return passa(s, { type: "cade", gen: s.gen }, { type: "montata" }, { type: "aperta", gen: s.gen });
};

describe("aprire la pratica", () => {
  it("il clic fa partire una pratica nuova, con una generazione nuova", () => {
    const s = passa(NO_DOSSIER, apri(2));
    expect(s.gen).toBe(1);
    expect(s.run).toMatchObject({ phase: "apre", i: 2, folder: "cartella 2", fall: false, mounted: false, started: false });
  });

  it("i tempi 3 e 4 partono solo quando ci sono la caduta e il contenuto, in qualunque ordine", () => {
    const s = passa(NO_DOSSIER, apri(0));
    const caduta = passa(s, { type: "cade", gen: s.gen });
    expect(caduta.run?.started).toBe(false);
    expect(passa(caduta, { type: "montata" }).run?.started).toBe(true);

    const montata = passa(s, { type: "montata" });
    expect(montata.run?.started).toBe(false);
    expect(passa(montata, { type: "cade", gen: s.gen }).run?.started).toBe(true);
  });

  it("finiti i tempi 3 e 4 la pratica e' aperta", () => {
    expect(aperta().run?.phase).toBe("aperta");
  });

  it("un secondo clic durante l'apertura non si accavalla", () => {
    const s = passa(NO_DOSSIER, apri(0));
    expect(passa(s, apri(1))).toBe(s);
    const a = aperta();
    expect(passa(a, apri(1))).toBe(a);
  });

  it("la dissolvenza passa dagli stessi stati: cambia solo il moto", () => {
    const s = passa(NO_DOSSIER, apri(0, "dissolvenza"));
    expect(s.run?.motion).toBe("dissolvenza");
    expect(passa(s, { type: "cade", gen: s.gen }, { type: "montata" }, { type: "aperta", gen: s.gen }).run?.phase).toBe("aperta");
  });
});

describe("chiudere la pratica", () => {
  it("× a pratica aperta: si stringe, poi il close la fa risalire, poi e' ferma", () => {
    const a = aperta();
    const chiude = passa(a, { type: "chiudi" });
    expect(chiude.run?.phase).toBe("chiude");
    const risale = passa(chiude, { type: "chiusa" });
    expect(risale.run?.phase).toBe("risale");
    expect(passa(risale, { type: "ferma", gen: a.gen })).toEqual({ gen: a.gen, run: null });
  });

  it("× durante l'apertura non si perde: si chiude appena aperta", () => {
    const s = passa(NO_DOSSIER, apri(0));
    const dopo = passa(s, { type: "cade", gen: s.gen }, { type: "montata" }, { type: "chiudi" });
    expect(dopo.run).toMatchObject({ phase: "apre", closeAfter: true });
    expect(passa(dopo, { type: "aperta", gen: s.gen }).run?.phase).toBe("chiude");
  });

  it("Esc prima che il dialog esista vale come ×, ma solo durante l'apertura", () => {
    const s = passa(NO_DOSSIER, apri(0), { type: "esc" });
    expect(s.run?.closeAfter).toBe(true);
    const a = aperta();
    expect(passa(a, { type: "esc" })).toBe(a);
    expect(passa(NO_DOSSIER, { type: "esc" })).toBe(NO_DOSSIER);
  });

  it("chiudere a meta' chiusura non rifa' niente", () => {
    const chiude = passa(aperta(), { type: "chiudi" });
    expect(passa(chiude, { type: "chiudi" })).toBe(chiude);
  });

  it("il close del browser a meta' apertura o a meta' chiusura passa alla risalita", () => {
    const s = passa(NO_DOSSIER, apri(0));
    const meta = passa(s, { type: "cade", gen: s.gen }, { type: "montata" });
    const risale = passa(meta, { type: "chiusa" });
    expect(risale.run?.phase).toBe("risale");
    // L'apertura finisce dopo: non riapre niente.
    expect(passa(risale, { type: "aperta", gen: s.gen })).toBe(risale);

    expect(passa(aperta(), { type: "chiudi" }, { type: "chiusa" }).run?.phase).toBe("risale");
  });

  it("un secondo close durante la risalita non la fa ripartire", () => {
    const risale = passa(aperta(), { type: "chiusa" });
    expect(passa(risale, { type: "chiusa" })).toBe(risale);
  });

  it("senza pratica, chiudere e il close non fanno niente", () => {
    expect(passa(NO_DOSSIER, { type: "chiudi" }, { type: "chiusa" }, { type: "montata" })).toBe(NO_DOSSIER);
  });
});

describe("il rientro", () => {
  it("un clic durante la risalita si ricorda, vince l'ultimo, e resta li' fino a cartella ferma", () => {
    const risale = passa(aperta(0), { type: "chiusa" });
    const dopo = passa(risale, apri(1), apri(3, "dissolvenza"));
    expect(dopo.run).toMatchObject({ phase: "risale", openAfter: { i: 3, folder: "cartella 3", motion: "dissolvenza" } });
  });

  it("ferma, la pratica dopo parte con una generazione nuova", () => {
    const a = aperta(0);
    const ferma = passa(a, { type: "chiusa" }, { type: "ferma", gen: a.gen });
    const di_nuovo = passa(ferma, apri(1));
    expect(di_nuovo.gen).toBe(a.gen + 1);
    expect(di_nuovo.run).toMatchObject({ phase: "apre", i: 1, openAfter: null });
  });
});

describe("le promesse in volo", () => {
  it("una caduta, un'apertura o una risalita di una pratica vecchia non toccano quella nuova", () => {
    const vecchia = aperta(0);
    const nuova = passa(vecchia, { type: "chiusa" }, { type: "ferma", gen: vecchia.gen }, apri(1));
    expect(passa(nuova, { type: "cade", gen: vecchia.gen })).toBe(nuova);
    expect(passa(nuova, { type: "aperta", gen: vecchia.gen })).toBe(nuova);
    const risale = passa(nuova, { type: "cade", gen: nuova.gen }, { type: "montata" }, { type: "chiusa" });
    expect(passa(risale, { type: "ferma", gen: vecchia.gen })).toBe(risale);
  });

  it("smontata a meta', le promesse in volo non trovano piu' niente", () => {
    const s = passa(NO_DOSSIER, apri(0));
    const smontata = passa(s, { type: "smonta" });
    expect(smontata.run).toBeNull();
    expect(passa(smontata, { type: "cade", gen: s.gen })).toBe(smontata);
  });

  it("la caduta arriva una volta sola", () => {
    const s = passa(NO_DOSSIER, apri(0));
    const caduta = passa(s, { type: "cade", gen: s.gen });
    expect(passa(caduta, { type: "cade", gen: s.gen })).toBe(caduta);
  });
});
