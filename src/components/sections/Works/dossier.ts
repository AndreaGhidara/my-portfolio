import type { FolderMotion } from "./slide";

/**
 * La pratica in corso, dal clic a quando la cartella e' di nuovo ferma, come
 * stato puro: niente DOM, niente timer. Quello che si muove davvero (il
 * dialog, gli attributi sulla pagina, la cartella che cade) lo fa usePratica
 * guardando come cambia lo stato.
 *
 * `apre`: la cartella cade e la pratica si allarga; `aperta`; `chiude`: la
 * pratica si stringe; `risale`: il dialog e' chiuso e la cartella torna su.
 *
 * `C` e' la cartella: qui si porta e basta, non si tocca.
 */
export type DossierPhase = "apre" | "aperta" | "chiude" | "risale";

export type DossierRun<C> = {
  phase: DossierPhase;
  /** Quale cartella, nell'ordine dell'archivio. */
  i: number;
  folder: C;
  motion: FolderMotion;
  /** Tempo 1 partito: la cartella e' davanti, in vista, e cade. */
  fall: boolean;
  /** Il contenuto e' nel DOM (l'effetto dopo il commit e' passato). */
  mounted: boolean;
  /** I tempi 3 e 4 sono partiti. */
  started: boolean;
  /** Esc o × durante l'apertura: si chiude appena aperta. */
  closeAfter: boolean;
  /** Un clic durante la risalita: QUALE cartella, da aprire appena ferma. */
  openAfter: { i: number; folder: C; motion: FolderMotion } | null;
};

/**
 * `gen` cambia a ogni pratica che parte e allo smontaggio: le promesse in volo
 * (lo scroll prima della caduta, l'apertura, la risalita) portano la
 * generazione in cui sono nate, e se non e' piu' quella non fanno niente.
 */
export type Dossier<C> = { gen: number; run: DossierRun<C> | null };

export type DossierEvent<C> =
  /** Il clic sulla cartella. */
  | { type: "apri"; i: number; folder: C; motion: FolderMotion }
  /** La cartella e' davanti e in vista: cade. */
  | { type: "cade"; gen: number }
  /** Il contenuto della pratica e' nel DOM. */
  | { type: "montata" }
  /** I tempi 3 e 4 sono finiti. */
  | { type: "aperta"; gen: number }
  /** ×, Esc sul dialog, clic sul velo. */
  | { type: "chiudi" }
  /** Esc prima che il dialog esista: niente cancel, ma non si perde. */
  | { type: "esc" }
  /** Il close del dialog, da qualunque parte arrivi. */
  | { type: "chiusa" }
  /** La cartella e' risalita. */
  | { type: "ferma"; gen: number }
  /** Il componente se ne va a meta'. */
  | { type: "smonta" };

export const NO_DOSSIER: Dossier<never> = { gen: 0, run: null };

/* Tempi 3 e 4: partono quando ci sono tutti e due, la cartella che cade e il
   contenuto nel DOM. */
const avvia = <C>(c: DossierRun<C>): DossierRun<C> => (c.fall && c.mounted && !c.started ? { ...c, started: true } : c);

export function dossierReducer<C>(s: Dossier<C>, e: DossierEvent<C>): Dossier<C> {
  const c = s.run;
  switch (e.type) {
    case "apri":
      if (!c) {
        return {
          gen: s.gen + 1,
          run: {
            phase: "apre",
            i: e.i,
            folder: e.folder,
            motion: e.motion,
            fall: false,
            mounted: false,
            started: false,
            closeAfter: false,
            openAfter: null,
          },
        };
      }
      // Durante l'apertura o la chiusura il clic non si accavalla; durante
      // la risalita si ricorda, e vince l'ultimo.
      if (c.phase !== "risale") return s;
      return { ...s, run: { ...c, openAfter: { i: e.i, folder: e.folder, motion: e.motion } } };

    case "cade":
      if (e.gen !== s.gen || c?.phase !== "apre" || c.fall) return s;
      return { ...s, run: avvia({ ...c, fall: true }) };

    case "montata":
      if (c?.phase !== "apre" || c.mounted) return s;
      return { ...s, run: avvia({ ...c, mounted: true }) };

    case "aperta":
      if (e.gen !== s.gen || c?.phase !== "apre") return s;
      return { ...s, run: { ...c, phase: c.closeAfter ? "chiude" : "aperta" } };

    case "chiudi":
      if (c?.phase === "apre") return c.closeAfter ? s : { ...s, run: { ...c, closeAfter: true } };
      if (c?.phase !== "aperta" || !c.fall) return s;
      return { ...s, run: { ...c, phase: "chiude" } };

    case "esc":
      if (c?.phase !== "apre" || c.closeAfter) return s;
      return { ...s, run: { ...c, closeAfter: true } };

    case "chiusa":
      if (!c || c.phase === "risale") return s;
      return { ...s, run: { ...c, phase: "risale" } };

    case "ferma":
      if (e.gen !== s.gen || c?.phase !== "risale") return s;
      return { ...s, run: null };

    case "smonta":
      return c ? { gen: s.gen + 1, run: null } : s;
  }
}
