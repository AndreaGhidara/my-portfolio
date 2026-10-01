import { describe, it, expect } from "vitest";
import { NESSUNA_PRATICA, pratica, type Evento, type Pratica } from "../pratica";

/** La cartella qui e' solo un nome: il reducer la porta e non la tocca. */
type P = Pratica<string>;

const passa = (s: P, ...eventi: Evento<string>[]) => eventi.reduce(pratica, s);
const apri = (i: number, moto: "quattro-tempi" | "dissolvenza" = "quattro-tempi"): Evento<string> => ({
  tipo: "apri",
  i,
  cartella: `cartella ${i}`,
  moto,
});

/** Un'apertura arrivata in fondo: cade, montata, tempi 3 e 4 finiti. */
const aperta = (i = 0) => {
  const s = passa(NESSUNA_PRATICA, apri(i));
  return passa(s, { tipo: "cade", gen: s.gen }, { tipo: "montata" }, { tipo: "aperta", gen: s.gen });
};

describe("aprire la pratica", () => {
  it("il clic fa partire una pratica nuova, con una generazione nuova", () => {
    const s = passa(NESSUNA_PRATICA, apri(2));
    expect(s.gen).toBe(1);
    expect(s.corso).toMatchObject({ fase: "apre", i: 2, cartella: "cartella 2", caduta: false, montata: false, avviata: false });
  });

  it("i tempi 3 e 4 partono solo quando ci sono la caduta e il contenuto, in qualunque ordine", () => {
    const s = passa(NESSUNA_PRATICA, apri(0));
    const caduta = passa(s, { tipo: "cade", gen: s.gen });
    expect(caduta.corso?.avviata).toBe(false);
    expect(passa(caduta, { tipo: "montata" }).corso?.avviata).toBe(true);

    const montata = passa(s, { tipo: "montata" });
    expect(montata.corso?.avviata).toBe(false);
    expect(passa(montata, { tipo: "cade", gen: s.gen }).corso?.avviata).toBe(true);
  });

  it("finiti i tempi 3 e 4 la pratica e' aperta", () => {
    expect(aperta().corso?.fase).toBe("aperta");
  });

  it("un secondo clic durante l'apertura non si accavalla", () => {
    const s = passa(NESSUNA_PRATICA, apri(0));
    expect(passa(s, apri(1))).toBe(s);
    const a = aperta();
    expect(passa(a, apri(1))).toBe(a);
  });

  it("la dissolvenza passa dagli stessi stati: cambia solo il moto", () => {
    const s = passa(NESSUNA_PRATICA, apri(0, "dissolvenza"));
    expect(s.corso?.moto).toBe("dissolvenza");
    expect(passa(s, { tipo: "cade", gen: s.gen }, { tipo: "montata" }, { tipo: "aperta", gen: s.gen }).corso?.fase).toBe("aperta");
  });
});

describe("chiudere la pratica", () => {
  it("× a pratica aperta: si stringe, poi il close la fa risalire, poi e' ferma", () => {
    const a = aperta();
    const chiude = passa(a, { tipo: "chiudi" });
    expect(chiude.corso?.fase).toBe("chiude");
    const risale = passa(chiude, { tipo: "chiusa" });
    expect(risale.corso?.fase).toBe("risale");
    expect(passa(risale, { tipo: "ferma", gen: a.gen })).toEqual({ gen: a.gen, corso: null });
  });

  it("× durante l'apertura non si perde: si chiude appena aperta", () => {
    const s = passa(NESSUNA_PRATICA, apri(0));
    const dopo = passa(s, { tipo: "cade", gen: s.gen }, { tipo: "montata" }, { tipo: "chiudi" });
    expect(dopo.corso).toMatchObject({ fase: "apre", chiudiDopo: true });
    expect(passa(dopo, { tipo: "aperta", gen: s.gen }).corso?.fase).toBe("chiude");
  });

  it("Esc prima che il dialog esista vale come ×, ma solo durante l'apertura", () => {
    const s = passa(NESSUNA_PRATICA, apri(0), { tipo: "esc" });
    expect(s.corso?.chiudiDopo).toBe(true);
    const a = aperta();
    expect(passa(a, { tipo: "esc" })).toBe(a);
    expect(passa(NESSUNA_PRATICA, { tipo: "esc" })).toBe(NESSUNA_PRATICA);
  });

  it("chiudere a meta' chiusura non rifa' niente", () => {
    const chiude = passa(aperta(), { tipo: "chiudi" });
    expect(passa(chiude, { tipo: "chiudi" })).toBe(chiude);
  });

  it("il close del browser a meta' apertura o a meta' chiusura passa alla risalita", () => {
    const s = passa(NESSUNA_PRATICA, apri(0));
    const meta = passa(s, { tipo: "cade", gen: s.gen }, { tipo: "montata" });
    const risale = passa(meta, { tipo: "chiusa" });
    expect(risale.corso?.fase).toBe("risale");
    // L'apertura finisce dopo: non riapre niente.
    expect(passa(risale, { tipo: "aperta", gen: s.gen })).toBe(risale);

    expect(passa(aperta(), { tipo: "chiudi" }, { tipo: "chiusa" }).corso?.fase).toBe("risale");
  });

  it("un secondo close durante la risalita non la fa ripartire", () => {
    const risale = passa(aperta(), { tipo: "chiusa" });
    expect(passa(risale, { tipo: "chiusa" })).toBe(risale);
  });

  it("senza pratica, chiudere e il close non fanno niente", () => {
    expect(passa(NESSUNA_PRATICA, { tipo: "chiudi" }, { tipo: "chiusa" }, { tipo: "montata" })).toBe(NESSUNA_PRATICA);
  });
});

describe("il rientro", () => {
  it("un clic durante la risalita si ricorda, vince l'ultimo, e resta li' fino a cartella ferma", () => {
    const risale = passa(aperta(0), { tipo: "chiusa" });
    const dopo = passa(risale, apri(1), apri(3, "dissolvenza"));
    expect(dopo.corso).toMatchObject({ fase: "risale", apriDopo: { i: 3, cartella: "cartella 3", moto: "dissolvenza" } });
  });

  it("ferma, la pratica dopo parte con una generazione nuova", () => {
    const a = aperta(0);
    const ferma = passa(a, { tipo: "chiusa" }, { tipo: "ferma", gen: a.gen });
    const di_nuovo = passa(ferma, apri(1));
    expect(di_nuovo.gen).toBe(a.gen + 1);
    expect(di_nuovo.corso).toMatchObject({ fase: "apre", i: 1, apriDopo: null });
  });
});

describe("le promesse in volo", () => {
  it("una caduta, un'apertura o una risalita di una pratica vecchia non toccano quella nuova", () => {
    const vecchia = aperta(0);
    const nuova = passa(vecchia, { tipo: "chiusa" }, { tipo: "ferma", gen: vecchia.gen }, apri(1));
    expect(passa(nuova, { tipo: "cade", gen: vecchia.gen })).toBe(nuova);
    expect(passa(nuova, { tipo: "aperta", gen: vecchia.gen })).toBe(nuova);
    const risale = passa(nuova, { tipo: "cade", gen: nuova.gen }, { tipo: "montata" }, { tipo: "chiusa" });
    expect(passa(risale, { tipo: "ferma", gen: vecchia.gen })).toBe(risale);
  });

  it("smontata a meta', le promesse in volo non trovano piu' niente", () => {
    const s = passa(NESSUNA_PRATICA, apri(0));
    const smontata = passa(s, { tipo: "smonta" });
    expect(smontata.corso).toBeNull();
    expect(passa(smontata, { tipo: "cade", gen: s.gen })).toBe(smontata);
  });

  it("la caduta arriva una volta sola", () => {
    const s = passa(NESSUNA_PRATICA, apri(0));
    const caduta = passa(s, { tipo: "cade", gen: s.gen });
    expect(passa(caduta, { tipo: "cade", gen: s.gen })).toBe(caduta);
  });
});
