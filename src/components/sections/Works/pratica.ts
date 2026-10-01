import type { Moto } from "./scivola";

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
export type Fase = "apre" | "aperta" | "chiude" | "risale";

export type Corso<C> = {
  fase: Fase;
  /** Quale cartella, nell'ordine dell'archivio. */
  i: number;
  cartella: C;
  moto: Moto;
  /** Tempo 1 partito: la cartella e' davanti, in vista, e cade. */
  caduta: boolean;
  /** Il contenuto e' nel DOM (l'effetto dopo il commit e' passato). */
  montata: boolean;
  /** I tempi 3 e 4 sono partiti. */
  avviata: boolean;
  /** Esc o × durante l'apertura: si chiude appena aperta. */
  chiudiDopo: boolean;
  /** Un clic durante la risalita: QUALE cartella, da aprire appena ferma. */
  apriDopo: { i: number; cartella: C; moto: Moto } | null;
};

/**
 * `gen` cambia a ogni pratica che parte e allo smontaggio: le promesse in volo
 * (lo scroll prima della caduta, l'apertura, la risalita) portano la
 * generazione in cui sono nate, e se non e' piu' quella non fanno niente.
 */
export type Pratica<C> = { gen: number; corso: Corso<C> | null };

export type Evento<C> =
  /** Il clic sulla cartella. */
  | { tipo: "apri"; i: number; cartella: C; moto: Moto }
  /** La cartella e' davanti e in vista: cade. */
  | { tipo: "cade"; gen: number }
  /** Il contenuto della pratica e' nel DOM. */
  | { tipo: "montata" }
  /** I tempi 3 e 4 sono finiti. */
  | { tipo: "aperta"; gen: number }
  /** ×, Esc sul dialog, clic sul velo. */
  | { tipo: "chiudi" }
  /** Esc prima che il dialog esista: niente cancel, ma non si perde. */
  | { tipo: "esc" }
  /** Il close del dialog, da qualunque parte arrivi. */
  | { tipo: "chiusa" }
  /** La cartella e' risalita. */
  | { tipo: "ferma"; gen: number }
  /** Il componente se ne va a meta'. */
  | { tipo: "smonta" };

export const NESSUNA_PRATICA: Pratica<never> = { gen: 0, corso: null };

/* Tempi 3 e 4: partono quando ci sono tutti e due, la cartella che cade e il
   contenuto nel DOM. */
const avvia = <C>(c: Corso<C>): Corso<C> => (c.caduta && c.montata && !c.avviata ? { ...c, avviata: true } : c);

export function pratica<C>(s: Pratica<C>, e: Evento<C>): Pratica<C> {
  const c = s.corso;
  switch (e.tipo) {
    case "apri":
      if (!c) {
        return {
          gen: s.gen + 1,
          corso: {
            fase: "apre",
            i: e.i,
            cartella: e.cartella,
            moto: e.moto,
            caduta: false,
            montata: false,
            avviata: false,
            chiudiDopo: false,
            apriDopo: null,
          },
        };
      }
      // Durante l'apertura o la chiusura il clic non si accavalla; durante
      // la risalita si ricorda, e vince l'ultimo.
      if (c.fase !== "risale") return s;
      return { ...s, corso: { ...c, apriDopo: { i: e.i, cartella: e.cartella, moto: e.moto } } };

    case "cade":
      if (e.gen !== s.gen || c?.fase !== "apre" || c.caduta) return s;
      return { ...s, corso: avvia({ ...c, caduta: true }) };

    case "montata":
      if (c?.fase !== "apre" || c.montata) return s;
      return { ...s, corso: avvia({ ...c, montata: true }) };

    case "aperta":
      if (e.gen !== s.gen || c?.fase !== "apre") return s;
      return { ...s, corso: { ...c, fase: c.chiudiDopo ? "chiude" : "aperta" } };

    case "chiudi":
      if (c?.fase === "apre") return c.chiudiDopo ? s : { ...s, corso: { ...c, chiudiDopo: true } };
      if (c?.fase !== "aperta" || !c.caduta) return s;
      return { ...s, corso: { ...c, fase: "chiude" } };

    case "esc":
      if (c?.fase !== "apre" || c.chiudiDopo) return s;
      return { ...s, corso: { ...c, chiudiDopo: true } };

    case "chiusa":
      if (!c || c.fase === "risale") return s;
      return { ...s, corso: { ...c, fase: "risale" } };

    case "ferma":
      if (e.gen !== s.gen || c?.fase !== "risale") return s;
      return { ...s, corso: null };

    case "smonta":
      return c ? { gen: s.gen + 1, corso: null } : s;
  }
}
