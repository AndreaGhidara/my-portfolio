import { describe, it, expect } from "vitest";
import { NO_DOSSIER, dossierReducer, type Dossier, type DossierEvent } from "../dossier";

/** La cartella qui e' solo un nome: il reducer la porta e non la tocca. */
type P = Dossier<string>;

const step = (s: P, ...events: DossierEvent<string>[]) => events.reduce(dossierReducer, s);
const open = (i: number, motion: "four-beats" | "fade" = "four-beats"): DossierEvent<string> => ({
  type: "open",
  i,
  folder: `folder ${i}`,
  motion,
});

/** Un'apertura arrivata in fondo: cade, montata, tempi 3 e 4 finiti. */
const opened = (i = 0) => {
  const s = step(NO_DOSSIER, open(i));
  return step(s, { type: "fall", gen: s.gen }, { type: "mounted" }, { type: "opened", gen: s.gen });
};

describe("aprire la pratica", () => {
  it("il clic fa partire una pratica nuova, con una generazione nuova", () => {
    const s = step(NO_DOSSIER, open(2));
    expect(s.gen).toBe(1);
    expect(s.run).toMatchObject({ phase: "opening", i: 2, folder: "folder 2", fall: false, mounted: false, started: false });
  });

  it("i tempi 3 e 4 partono solo quando ci sono la caduta e il contenuto, in qualunque ordine", () => {
    const s = step(NO_DOSSIER, open(0));
    const fallen = step(s, { type: "fall", gen: s.gen });
    expect(fallen.run?.started).toBe(false);
    expect(step(fallen, { type: "mounted" }).run?.started).toBe(true);

    const mounted = step(s, { type: "mounted" });
    expect(mounted.run?.started).toBe(false);
    expect(step(mounted, { type: "fall", gen: s.gen }).run?.started).toBe(true);
  });

  it("finiti i tempi 3 e 4 la pratica e' aperta", () => {
    expect(opened().run?.phase).toBe("open");
  });

  it("un secondo clic durante l'apertura non si accavalla", () => {
    const s = step(NO_DOSSIER, open(0));
    expect(step(s, open(1))).toBe(s);
    const a = opened();
    expect(step(a, open(1))).toBe(a);
  });

  it("la dissolvenza passa dagli stessi stati: cambia solo il moto", () => {
    const s = step(NO_DOSSIER, open(0, "fade"));
    expect(s.run?.motion).toBe("fade");
    expect(step(s, { type: "fall", gen: s.gen }, { type: "mounted" }, { type: "opened", gen: s.gen }).run?.phase).toBe("open");
  });
});

describe("chiudere la pratica", () => {
  it("× a pratica aperta: si stringe, poi il close la fa risalire, poi e' ferma", () => {
    const a = opened();
    const closing = step(a, { type: "close" });
    expect(closing.run?.phase).toBe("closing");
    const rising = step(closing, { type: "closed" });
    expect(rising.run?.phase).toBe("rising");
    expect(step(rising, { type: "settled", gen: a.gen })).toEqual({ gen: a.gen, run: null });
  });

  it("× durante l'apertura non si perde: si chiude appena aperta", () => {
    const s = step(NO_DOSSIER, open(0));
    const after = step(s, { type: "fall", gen: s.gen }, { type: "mounted" }, { type: "close" });
    expect(after.run).toMatchObject({ phase: "opening", closeAfter: true });
    expect(step(after, { type: "opened", gen: s.gen }).run?.phase).toBe("closing");
  });

  it("Esc prima che il dialog esista vale come ×, ma solo durante l'apertura", () => {
    const s = step(NO_DOSSIER, open(0), { type: "esc" });
    expect(s.run?.closeAfter).toBe(true);
    const a = opened();
    expect(step(a, { type: "esc" })).toBe(a);
    expect(step(NO_DOSSIER, { type: "esc" })).toBe(NO_DOSSIER);
  });

  it("chiudere a meta' chiusura non rifa' niente", () => {
    const closing = step(opened(), { type: "close" });
    expect(step(closing, { type: "close" })).toBe(closing);
  });

  it("il close del browser a meta' apertura o a meta' chiusura passa alla risalita", () => {
    const s = step(NO_DOSSIER, open(0));
    const halfway = step(s, { type: "fall", gen: s.gen }, { type: "mounted" });
    const rising = step(halfway, { type: "closed" });
    expect(rising.run?.phase).toBe("rising");
    // L'apertura finisce dopo: non riapre niente.
    expect(step(rising, { type: "opened", gen: s.gen })).toBe(rising);

    expect(step(opened(), { type: "close" }, { type: "closed" }).run?.phase).toBe("rising");
  });

  it("un secondo close durante la risalita non la fa ripartire", () => {
    const rising = step(opened(), { type: "closed" });
    expect(step(rising, { type: "closed" })).toBe(rising);
  });

  it("senza pratica, chiudere e il close non fanno niente", () => {
    expect(step(NO_DOSSIER, { type: "close" }, { type: "closed" }, { type: "mounted" })).toBe(NO_DOSSIER);
  });
});

describe("il rientro", () => {
  it("un clic durante la risalita si ricorda, vince l'ultimo, e resta li' fino a cartella ferma", () => {
    const rising = step(opened(0), { type: "closed" });
    const after = step(rising, open(1), open(3, "fade"));
    expect(after.run).toMatchObject({ phase: "rising", openAfter: { i: 3, folder: "folder 3", motion: "fade" } });
  });

  it("ferma, la pratica dopo parte con una generazione nuova", () => {
    const a = opened(0);
    const settled = step(a, { type: "closed" }, { type: "settled", gen: a.gen });
    const again = step(settled, open(1));
    expect(again.gen).toBe(a.gen + 1);
    expect(again.run).toMatchObject({ phase: "opening", i: 1, openAfter: null });
  });
});

describe("le promesse in volo", () => {
  it("una caduta, un'apertura o una risalita di una pratica vecchia non toccano quella nuova", () => {
    const old = opened(0);
    const fresh = step(old, { type: "closed" }, { type: "settled", gen: old.gen }, open(1));
    expect(step(fresh, { type: "fall", gen: old.gen })).toBe(fresh);
    expect(step(fresh, { type: "opened", gen: old.gen })).toBe(fresh);
    const rising = step(fresh, { type: "fall", gen: fresh.gen }, { type: "mounted" }, { type: "closed" });
    expect(step(rising, { type: "settled", gen: old.gen })).toBe(rising);
  });

  it("smontata a meta', le promesse in volo non trovano piu' niente", () => {
    const s = step(NO_DOSSIER, open(0));
    const unmounted = step(s, { type: "unmount" });
    expect(unmounted.run).toBeNull();
    expect(step(unmounted, { type: "fall", gen: s.gen })).toBe(unmounted);
  });

  it("la caduta arriva una volta sola", () => {
    const s = step(NO_DOSSIER, open(0));
    const fallen = step(s, { type: "fall", gen: s.gen });
    expect(step(fallen, { type: "fall", gen: s.gen })).toBe(fallen);
  });
});
